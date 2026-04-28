'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type SearchResult = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  commune: string | null;
  type: 'stop';
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
      const orFilter = words
        .map((w) => `stop_name.ilike.%${w}%,commune.ilike.%${w}%`)
        .join(',');
      const { data } = await supabase
        .from('gtfs_stops')
        .select('stop_id, stop_name, stop_lat, stop_lon, commune')
        .or(orFilter)
        .limit(12);
      setSearching(false);
      setResults((data ?? []).map((s) => ({ ...s, type: 'stop' as const })));
    }, 250);
  }, [supabase]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQueryState('');
    setResults([]);
  }, []);

  return { query, setQuery, results, searching, clear };
}
