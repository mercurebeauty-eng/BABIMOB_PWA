'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type SearchResult = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  commune: string | null;
  type: 'stop' | 'place';
  logo?: string;
};

export function useStopSearch() {
  const supabase = createClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const words = q.trim().split(/\s+/).filter((w) => w.length >= 2);
      const stopFilter = words
        .map((w) => `stop_name.ilike.%${w}%,commune.ilike.%${w}%`)
        .join(',');
      const placeFilter = words
        .map((w) => `name.ilike.%${w}%,commune.ilike.%${w}%`)
        .join(',');

      // Parallell search
      const [stopsReq, placesReq] = await Promise.all([
        supabase
          .from('gtfs_stops')
          .select('stop_id, stop_name, stop_lat, stop_lon, commune')
          .or(stopFilter)
          .limit(8),
        supabase
          .from('places')
          .select('id, name, lat, lon, commune, logo_emoji')
          .or(placeFilter)
          .limit(8)
      ]);

      const stops: SearchResult[] = (stopsReq.data ?? []).map((s) => ({
        id: s.stop_id,
        name: s.stop_name,
        lat: s.stop_lat,
        lon: s.stop_lon,
        commune: s.commune,
        type: 'stop'
      }));

      const places: SearchResult[] = (placesReq.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lon: p.lon,
        commune: p.commune,
        type: 'place',
        logo: p.logo_emoji
      }));

      setSearching(false);
      setResults([...stops, ...places]);
    }, 250);
  }, [supabase]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQueryState('');
    setResults([]);
  }, []);

  return { query, setQuery, results, searching, clear };
}
