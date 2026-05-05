'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { POI } from '@/lib/poi';
import type { ReachSource } from './useReachTracking';

type RawLiveCheckin = {
  place_id: string;
  place_name: string;
  profile: { id: string | null; display_name: string | null; is_public_visits: boolean } | null;
};

export type LiveCheckin = RawLiveCheckin & { display_name: string };

type Options = {
  logReach: (userId: string, source: ReachSource) => void;
};

export function useMapPois({ logReach }: Options) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const mapRef = useRef<MapLibreMap | null>(null);
  const moveListenerRef = useRef<(() => void) | null>(null);

  const [pois, setPois] = useState<POI[]>([]);
  const [poiCheckins, setPoiCheckins] = useState<Record<string, number>>({});
  const [livePois, setLivePois] = useState<string[]>([]);
  const [liveTickerFeed, setLiveTickerFeed] = useState<LiveCheckin[]>([]);

  const logReachRef = useRef(logReach);
  // Keep logReachRef current without adding it to handleMapReady deps
  useCallback(() => { logReachRef.current = logReach; }, [logReach])();

  const handleMapReady = useCallback((map: MapLibreMap) => {
    mapRef.current = map;

    // Remove any previously attached listener before re-attaching
    if (moveListenerRef.current) {
      map.off('moveend', moveListenerRef.current);
    }

    const loadPois = async () => {
      const b = map.getBounds();
      const mod = await import('@/lib/poi');
      
      try {
        const fetchedPois = await mod.fetchNearbyPOIs(
          b.getSouth(), b.getNorth(), b.getWest(), b.getEast()
        );
        
        // Si on n'a rien trouvé du tout, on garde les anciens POIs pour éviter le vide
        // Sauf si on est vraiment dans un désert (mais peu probable à Abidjan)
        if (fetchedPois.length > 0) {
          setPois(fetchedPois);
        }

        const placeIds = fetchedPois.length > 0 ? fetchedPois.map((p) => p.id) : pois.map(p => p.id);
        if (placeIds.length === 0) return;

        const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: checkinsData } = await supabase
          .from('checkins')
          .select('place_id')
          .in('place_id', placeIds)
          .gte('created_at', since7d);

        if (checkinsData) {
          const counts: Record<string, number> = {};
          checkinsData.forEach((c: { place_id: string }) => {
            counts[c.place_id] = (counts[c.place_id] ?? 0) + 1;
          });
          setPoiCheckins(counts);
        }

        const since3h = new Date(Date.now() - 3 * 3600000).toISOString();
        const { data: liveData } = await supabase
          .from('checkins')
          .select('place_id, place_name, profile:profiles(id, display_name, is_public_visits)')
          .in('place_id', placeIds)
          .gte('created_at', since3h)
          .order('created_at', { ascending: false });

        if (liveData) {
          const raw = liveData as unknown as RawLiveCheckin[];
          setLivePois(Array.from(new Set(raw.map((d) => d.place_id))));

          const filteredTicker: LiveCheckin[] = raw.map((d) => ({
            ...d,
            display_name: d.profile?.is_public_visits
              ? (d.profile.display_name ?? 'Un explorateur')
              : 'Un explorateur',
          })).slice(0, 5);

          setLiveTickerFeed(filteredTicker);
          filteredTicker.forEach((d) => {
            const uid = d.profile?.id;
            if (uid) logReachRef.current(uid, 'ticker');
          });
        }
      } catch (err) {
        console.error("Failed to load POIs:", err);
        // On ne fait rien, on garde les anciens POIs
      }
    };

    moveListenerRef.current = loadPois;
    map.on('moveend', loadPois);
    loadPois();
  // stable — all mutable values accessed via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pois, poiCheckins, livePois, liveTickerFeed, handleMapReady, mapRef };
}
