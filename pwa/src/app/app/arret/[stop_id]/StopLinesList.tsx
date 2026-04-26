'use client';

import { useState } from 'react';
import Link from 'next/link';

type Line = {
  route_id: string;
  route_long_name: string;
  agency_id: string;
  trip_headsign?: string;
  direction_id?: number;
};

type Props = {
  lines: Line[];
  preferredModes: string[];
};

export default function StopLinesList({ lines, preferredModes }: Props) {
  const [filter, setFilter] = useState('Tout');

  const filteredLines = lines.filter(l => {
    if (filter === 'Tout') return true;
    const agency = (l.agency_id || '').toLowerCase();
    if (filter === 'SOTRA') return agency.includes('sotra');
    if (filter === 'Gbaka') return agency.includes('gbaka');
    if (filter === 'Woro-woro') return agency.includes('woro');
    return true;
  });

  const activeModes = preferredModes.map(m => m.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-2">
        {['Tout', 'SOTRA', 'Gbaka', 'Woro-woro'].map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
              filter === m 
                ? 'bg-abidjan-orange border-abidjan-orange text-white shadow-abidjan-orange/20' 
                : 'bg-white border-beige-200 text-beige-muted hover:border-abidjan-orange/30'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {filteredLines.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-beige-50 flex items-center justify-center text-3xl">🚌</div>
          <div className="text-sm text-beige-muted font-bold uppercase tracking-widest">Aucune ligne "{filter}" trouvée ici.</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredLines.map((l) => {
            const agency = (l.agency_id || '').toLowerCase();
            const isBanned = ['gbaka', 'woro-woro', 'taxi', 'saloni'].some(m => agency.includes(m) && !activeModes.includes(m));

            return (
              <li key={`${l.route_id}-${l.direction_id ?? 0}`} className={isBanned ? 'opacity-50 grayscale' : ''}>
                <Link
                  href={`/app/ligne/${encodeURIComponent(l.route_id)}${l.direction_id === 1 ? '?dir=1' : ''}`}
                  className="bg-white rounded-[2rem] border-2 border-beige-200 hover:border-abidjan-orange/30 shadow-sm hover:shadow-lg transition-all p-5 flex items-center justify-between gap-4 relative overflow-hidden"
                >
                  <div className="min-w-0 z-10">
                    <div className="font-black text-base text-beige-text truncate">
                      {l.route_long_name}
                    </div>
                    <div className="text-xs font-bold text-beige-muted mt-1 uppercase tracking-wide">
                      {l.agency_id}
                      {l.trip_headsign && (
                        <span className="ml-1 opacity-60">· {l.trip_headsign}</span>
                      )}
                    </div>
                    {isBanned && (
                      <div className="text-[9px] font-black uppercase text-red-500 tracking-widest mt-2 bg-red-50 inline-block px-2 py-0.5 rounded-md border border-red-100">
                        Incompatible avec vos préférences
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 z-10">
                    <div className="bg-abidjan-orange/10 text-abidjan-orange text-[10px] font-black px-2.5 py-1 rounded-lg border border-abidjan-orange/20 uppercase tracking-widest">
                      Ligne
                    </div>
                    <svg className="w-5 h-5 text-beige-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
