'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Stop } from '@/lib/types';

type Props = {
  label: string;
  placeholder: string;
  icon: string;
  value: string;
  onChange: (val: string, stop?: Stop) => void;
  colorClass?: string;
};

export default function LocationInput({ label, placeholder, icon, value, onChange, colorClass = 'text-beige-muted' }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Stop[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const handleSearch = (q: string) => {
    setQuery(q);
    onChange(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('gtfs_stops')
        .select('stop_id, stop_name, stop_lat, stop_lon, commune')
        .ilike('stop_name', `%${q}%`)
        .limit(5);
      setLoading(false);
      if (data) {
        setResults(data as Stop[]);
        setOpen(true);
      }
    }, 300);
  };

  return (
    <div className="relative">
      <div className={`absolute left-5 top-5 ${colorClass}`}>{icon}</div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        className="w-full pl-12 pr-5 py-5 rounded-2xl border-2 border-beige-100 bg-beige-50/50 focus:outline-none focus:border-beige-300 focus:bg-white transition-all text-sm font-bold text-beige-text placeholder-beige-200"
      />
      
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-white rounded-2xl border-2 border-beige-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {results.map((s) => (
            <button
              key={s.stop_id}
              onClick={() => {
                setQuery(s.stop_name);
                onChange(s.stop_name, s);
                setOpen(false);
              }}
              className="w-full text-left px-5 py-4 border-b border-beige-50 hover:bg-beige-50 transition-colors flex items-center gap-3"
            >
              <span className="text-lg flex-shrink-0">📍</span>
              <div className="min-w-0">
                <div className="text-sm font-black text-beige-text truncate">{s.stop_name}</div>
                {s.commune && <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest">{s.commune}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
