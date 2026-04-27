'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';

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
  stopId?: string;
};

const FILTERS = ['Tout', 'SOTRA', 'Gbaka', 'Woro-woro'];

export default function StopLinesList({ lines, preferredModes, stopId }: Props) {
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

  function buildHref(l: Line) {
    const base = `/app/ligne/${encodeURIComponent(l.route_id)}`;
    const params = new URLSearchParams();
    if (l.direction_id === 1) params.set('dir', '1');
    if (stopId) params.set('from', stopId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filters */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {FILTERS.map(m => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: 99,
              border: filter === m ? 'none' : '1.5px solid var(--line)',
              background: filter === m ? 'var(--orange)' : 'transparent',
              color: filter === m ? 'white' : 'var(--muted)',
              fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5,
              cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {filteredLines.length === 0 ? (
        <div style={{ padding: 32, borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🚌</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Aucune ligne &quot;{filter}&quot; ici
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredLines.map(l => {
            const agency = (l.agency_id || '').toLowerCase();
            const isBanned = ['gbaka', 'woro-woro', 'taxi', 'saloni'].some(
              m => agency.includes(m) && !activeModes.includes(m)
            );

            return (
              <Link
                key={`${l.route_id}-${l.direction_id ?? 0}`}
                href={buildHref(l)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 16,
                  background: 'var(--cream-2)', border: '1px solid var(--line)',
                  textDecoration: 'none', opacity: isBanned ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'color-mix(in oklab, var(--orange) 12%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--orange)',
                }}>
                  <Ic.Route s={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.route_long_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
                    {l.agency_id}{l.trip_headsign ? ` · ${l.trip_headsign}` : ''}
                  </div>
                  {isBanned && (
                    <div style={{ fontSize: 9, fontWeight: 900, color: '#e53935', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 }}>
                      Incompatible avec vos préférences
                    </div>
                  )}
                </div>
                <div style={{ color: 'var(--line)', flexShrink: 0 }}>
                  <Ic.Arrow s={16} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
