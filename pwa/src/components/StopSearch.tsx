'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Stop } from '@/lib/types';

type Props = {
  onSelect: (stop: Stop) => void;
};

export default function StopSearch({ onSelect }: Props) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<Stop[]>([]);
  const [loading, setLoading]   = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('gtfs_stops')
        .select('stop_id, stop_name, stop_lat, stop_lon, commune')
        .ilike('stop_name', `%${query}%`)
        .limit(10);
      setLoading(false);
      if (!error && data) setResults(data as Stop[]);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, supabase]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un arrêt (ex : Angré, Riviera 2)…"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-babimob-blue transition"
      />
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          …
        </div>
      )}
      {results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-80 overflow-y-auto z-[1000]">
          {results.map((s) => (
            <li
              key={s.stop_id}
              className="px-4 py-2.5 hover:bg-babimob-paper cursor-pointer border-b border-gray-50 last:border-0"
              onClick={() => {
                onSelect(s);
                setQuery(s.stop_name);
                setResults([]);
              }}
            >
              <div className="font-medium text-sm">{s.stop_name}</div>
              {s.commune && (
                <div className="text-xs text-gray-500">{s.commune}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
