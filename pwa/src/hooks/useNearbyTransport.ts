'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ArretProche } from '@/lib/types';

export type VehicleKind = 'gbaka' | 'woro' | 'taxi' | 'saloni';

export type TransportCard = {
  kind: VehicleKind;
  label: string;
  color: string;
  stop: ArretProche | null;
  routeName: string | null;
  routeId: string | null;
  available: boolean;
};

const META: Record<VehicleKind, { label: string; color: string }> = {
  gbaka:  { label: 'Gbaka',     color: 'var(--orange)' },
  woro:   { label: 'Wôrô-wôrô', color: 'var(--green)'  },
  taxi:   { label: 'Taxi',      color: 'var(--gold)'   },
  saloni: { label: 'Saloni',    color: 'var(--blue)'   },
};

const KINDS: VehicleKind[] = ['gbaka', 'woro', 'taxi', 'saloni'];

function detectKind(agencyId: string): VehicleKind | null {
  const a = agencyId.toLowerCase();
  if (a.includes('gbaka'))  return 'gbaka';
  if (a.includes('woro'))   return 'woro';
  if (a.includes('taxi'))   return 'taxi';
  if (a.includes('saloni')) return 'saloni';
  return null;
}

const PLACEHOLDER: TransportCard[] = KINDS.map(kind => ({
  kind, ...META[kind], stop: null, routeName: null, available: false,
}));

type LigneRow = { route_id: string; route_long_name: string; agency_id: string };

export function useNearbyTransport(nearbyStops: ArretProche[]): TransportCard[] {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const prevKeyRef = useRef('');

  const [cards, setCards] = useState<TransportCard[]>(PLACEHOLDER);

  useEffect(() => {
    const top = nearbyStops.slice(0, 6);
    const key = top.map(s => s.stop_id).join(',');
    if (!key || key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    let cancelled = false;

    async function load() {
      const results = await Promise.all(
        top.map(stop =>
          supabase
            .rpc('lignes_par_arret', { p_stop_id: stop.stop_id })
            .then(({ data }) => ({ stop, lines: (data ?? []) as LigneRow[] }))
        )
      );

      if (cancelled) return;

      const found: Partial<Record<VehicleKind, { stop: ArretProche; routeName: string; routeId: string }>> = {};

      for (const { stop, lines } of results) {
        for (const line of lines) {
          const kind = detectKind(line.agency_id ?? '');
          if (kind && kind !== 'saloni' && !found[kind]) {
            found[kind] = { stop, routeName: line.route_long_name, routeId: line.route_id };
          }
        }
      }

      setCards(KINDS.map(kind => ({
        kind,
        ...META[kind],
        stop: kind === 'saloni' ? null : (found[kind]?.stop ?? null),
        routeName: kind === 'saloni' ? null : (found[kind]?.routeName ?? null),
        routeId: kind === 'saloni' ? null : (found[kind]?.routeId ?? null),
        available: kind !== 'saloni' && !!found[kind],
      })));
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyStops]);

  return cards;
}
