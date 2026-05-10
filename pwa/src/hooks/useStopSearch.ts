'use client';

import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { createClient } from '@/lib/supabase/client';
import {
  searchRenderedFeatures,
  searchNominatim,
  osmCategoryEmoji,
} from '@/lib/searchOSM';

export type SearchResultSource = 'stop' | 'place' | 'osm-map' | 'osm-nominatim';

export type SearchResult = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  commune: string | null;
  /** Type de résultat (legacy: 'stop' | 'place'). On garde pour compat. */
  type: 'stop' | 'place';
  /** Source détaillée pour différencier OSM rendu vs Nominatim. */
  source: SearchResultSource;
  logo?: string;
  /** Sous-titre additionnel (ex: « restaurant », « hôpital », ou adresse complète). */
  subtitle?: string;
};

type Options = {
  /** Référence à l'instance MapLibre, pour interroger les tuiles vectorielles. */
  mapRef?: MutableRefObject<MapLibreMap | null>;
};

const SUPABASE_DEBOUNCE = 250;
const NOMINATIM_DEBOUNCE = 450;

export function useStopSearch(options: Options = {}) {
  const { mapRef } = options;
  const supabase = createClient();
  const supabaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nominatimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nominatimAbortRef = useRef<AbortController | null>(null);

  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);

    if (supabaseTimerRef.current) clearTimeout(supabaseTimerRef.current);
    if (nominatimTimerRef.current) clearTimeout(nominatimTimerRef.current);
    nominatimAbortRef.current?.abort();

    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    // 1) Résultats instantanés depuis les tuiles MapLibre déjà rendues.
    const renderedHits = searchRenderedFeatures(mapRef?.current ?? null, trimmed, 10);
    const renderedResults: SearchResult[] = renderedHits.map((h) => ({
      id: h.id,
      name: h.name,
      lat: h.lat,
      lon: h.lon,
      commune: null,
      type: 'place',
      source: 'osm-map',
      logo: osmCategoryEmoji(h.category, h.subcategory),
      subtitle: h.subcategory ?? h.category ?? undefined,
    }));
    if (renderedResults.length > 0) {
      setResults(renderedResults);
    }

    setSearching(true);

    // 2) Recherche Supabase (stops + places) avec léger debounce.
    supabaseTimerRef.current = setTimeout(async () => {
      const sanitize = (w: string) => w.replace(/[(),%*]/g, '').trim();
      const words = trimmed
        .split(/\s+/)
        .map(sanitize)
        .filter((w) => w.length >= 2);

      if (words.length === 0) return;

      const stopFilter = words
        .map((w) => `stop_name.ilike.%${w}%,commune.ilike.%${w}%`)
        .join(',');
      const placeFilter = words
        .map((w) => `name.ilike.%${w}%,commune.ilike.%${w}%`)
        .join(',');

      const [stopsReq, placesReq] = await Promise.all([
        supabase
          .from('gtfs_stops')
          .select('stop_id, stop_name, stop_lat, stop_lon, commune')
          .or(stopFilter)
          .limit(15),
        supabase
          .from('places')
          .select('id, name, lat, lon, commune, logo_emoji')
          .or(placeFilter)
          .limit(15),
      ]);

      const stops: SearchResult[] = (stopsReq.data ?? []).map((s) => ({
        id: s.stop_id,
        name: s.stop_name,
        lat: s.stop_lat,
        lon: s.stop_lon,
        commune: s.commune,
        type: 'stop',
        source: 'stop',
      }));

      const places: SearchResult[] = (placesReq.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lon: p.lon,
        commune: p.commune,
        type: 'place',
        source: 'place',
        logo: p.logo_emoji,
      }));

      // Merge: places métier > stops > OSM-map > OSM-nominatim (ajouté plus tard)
      setResults((prev) => {
        const nominatim = prev.filter((r) => r.source === 'osm-nominatim');
        return mergeUnique([...places, ...stops, ...renderedResults, ...nominatim], trimmed);
      });
    }, SUPABASE_DEBOUNCE);

    // 3) Nominatim en fond, debounce plus long pour respecter rate-limit.
    if (trimmed.length >= 3) {
      const controller = new AbortController();
      nominatimAbortRef.current = controller;
      nominatimTimerRef.current = setTimeout(async () => {
        const hits = await searchNominatim(trimmed, controller.signal, 10);
        const nominatimResults: SearchResult[] = hits.map((h) => ({
          id: h.id,
          name: h.name,
          lat: h.lat,
          lon: h.lon,
          commune: h.commune,
          type: 'place',
          source: 'osm-nominatim',
          logo: osmCategoryEmoji(h.category, h.subcategory),
          subtitle: h.fullName ?? h.subcategory ?? h.category ?? undefined,
        }));
        setResults((prev) => mergeUnique([...prev, ...nominatimResults], trimmed));
        setSearching(false);
      }, NOMINATIM_DEBOUNCE);
    } else {
      // Sans Nominatim, on lève le spinner après le debounce Supabase.
      setTimeout(() => setSearching(false), SUPABASE_DEBOUNCE + 50);
    }
  }, [mapRef, supabase]);

  const clear = useCallback(() => {
    if (supabaseTimerRef.current) clearTimeout(supabaseTimerRef.current);
    if (nominatimTimerRef.current) clearTimeout(nominatimTimerRef.current);
    nominatimAbortRef.current?.abort();
    setQueryState('');
    setResults([]);
    setSearching(false);
  }, []);

  return { query, setQuery, results, searching, clear };
}

/** 
 * Dédupe par (source, id) et score les résultats selon la pertinence par rapport à la query.
 * Priorités : Exact Match > Starts With > Contains > Commune Match.
 */
function mergeUnique(list: SearchResult[], query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  
  const scored = list.map(r => {
    let score = 0;
    const name = r.name.toLowerCase();
    const commune = (r.commune || '').toLowerCase();
    
    // 1. Nom : Match exact, début, ou inclusion
    if (name === q) score += 100;
    else if (name.startsWith(q)) score += 80;
    else if (name.includes(q)) score += 60;

    // 2. Commune : Bonus si la recherche match la commune
    if (commune) {
      if (commune === q) score += 40;
      else if (commune.startsWith(q)) score += 20;
    }

    // 3. Source : Léger avantage aux données métier Babimob
    if (r.source === 'place') score += 10;
    if (r.source === 'stop') score += 5;

    return { ...r, score };
  });

  // Tri par score décroissant
  scored.sort((a, b) => (b.score || 0) - (a.score || 0));

  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of scored) {
    const key = `${r.source}:${r.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

