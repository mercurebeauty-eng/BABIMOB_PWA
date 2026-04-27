import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RouteMapWrapper from './RouteMapWrapper';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import { Vehicle } from '@/components/ui/Vehicle';

type Props = {
  params: Promise<{ route_id: string }>;
  searchParams: Promise<{ dir?: string; from?: string }>;
};

type StopRow = {
  stop_id: string;
  stop_name: string;
  commune: string | null;
  stop_lat: number;
  stop_lon: number;
  stop_sequence: number;
};

const TYPE_MAP: Record<string, { label: string; kind: 'gbaka' | 'woro' | 'taxi' | 'saloni' }> = {
  gbaka:  { label: 'Gbaka',              kind: 'gbaka' },
  woro:   { label: 'Woro-woro',          kind: 'woro' },
  taxi:   { label: 'Taxi intercommunal', kind: 'taxi' },
  saloni: { label: 'Saloni',             kind: 'saloni' },
};

function detectType(name: string): { label: string; kind: 'gbaka' | 'woro' | 'taxi' | 'saloni' } {
  const n = name.toLowerCase();
  for (const [key, val] of Object.entries(TYPE_MAP)) {
    if (n.startsWith(key)) return val;
  }
  return { label: 'Transport', kind: 'gbaka' };
}

export default async function LignePage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const { route_id } = await params;
  const { dir, from: fromStop } = await searchParams;
  const direction = dir === '1' ? 1 : 0;
  const routeId = decodeURIComponent(route_id);

  const [{ data: route }, { data: trips }] = await Promise.all([
    supabase.from('gtfs_routes').select('*, route_desc').eq('route_id', routeId).maybeSingle(),
    supabase.from('gtfs_trips').select('trip_id, direction_id, trip_headsign, shape_id, wheelchair_accessible').eq('route_id', routeId),
  ]);

  if (!route || !trips || trips.length === 0) notFound();

  const dirMap = new Map<number, { trip_id: string; trip_headsign: string | null; shape_id: string | null; wheelchair: number | null }>();
  for (const t of trips) {
    const d = t.direction_id ?? 0;
    if (!dirMap.has(d)) dirMap.set(d, { trip_id: t.trip_id, trip_headsign: t.trip_headsign, shape_id: t.shape_id, wheelchair: t.wheelchair_accessible });
  }

  const currentTrip = dirMap.get(direction) ?? [...dirMap.values()][0];
  const activeDir = dirMap.has(direction) ? direction : [...dirMap.keys()][0];

  const [{ data: stopTimes }, { data: shapePoints }] = await Promise.all([
    supabase.from('gtfs_stop_times').select('stop_id, stop_sequence').eq('trip_id', currentTrip.trip_id).order('stop_sequence'),
    currentTrip.shape_id
      ? supabase.from('gtfs_shapes').select('shape_pt_lat, shape_pt_lon, shape_pt_sequence').eq('shape_id', currentTrip.shape_id).order('shape_pt_sequence')
      : (Promise.resolve({ data: [] }) as Promise<{ data: { shape_pt_lat: number; shape_pt_lon: number; shape_pt_sequence: number }[] | null }>),
  ]);

  const stopIds = (stopTimes ?? []).map(st => st.stop_id);
  const { data: stopsData } = stopIds.length
    ? await supabase.from('gtfs_stops').select('stop_id, stop_name, commune, stop_lat, stop_lon').in('stop_id', stopIds)
    : { data: [] };

  const stopsMap = new Map((stopsData ?? []).map(s => [s.stop_id, s]));
  const orderedStops: StopRow[] = (stopTimes ?? [])
    .map(st => { const s = stopsMap.get(st.stop_id); return s ? { ...s, stop_sequence: st.stop_sequence } : null; })
    .filter(Boolean) as StopRow[];

  const { label: typeLabel, kind: typeKind } = detectType(route.route_long_name ?? '');

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ paddingTop: 56, padding: '56px 16px 16px', borderBottom: '1px solid var(--line)', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <Ic.Back s={20} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.5 }}>LIGNE {typeLabel.toUpperCase()} · {route.route_short_name}</div>
            <div className="font-display" style={{ fontSize: 20 }}>{route.route_long_name}</div>
          </div>
          <Vehicle kind={typeKind} size={44} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Pill color="var(--green)">{direction === 0 ? '→' : '←'} {currentTrip.trip_headsign}</Pill>
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
        <div style={{ position: 'relative' }}>
          {orderedStops.map((s, i) => {
            const isNow = fromStop === s.stop_id;
            const isPast = !fromStop ? false : orderedStops.findIndex(x => x.stop_id === fromStop) > i;
            const isFuture = !fromStop ? true : orderedStops.findIndex(x => x.stop_id === fromStop) < i;
            const dotColor = isNow ? 'var(--orange)' : isPast ? 'var(--muted)' : 'var(--line)';
            
            return (
              <div key={i} style={{ display: 'flex', gap: 16, position: 'relative', minHeight: isNow ? 110 : 64 }}>
                {i < orderedStops.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 19, top: isNow ? 32 : 24, bottom: -8, width: 2,
                    background: isPast ? 'var(--muted)' : 'var(--line)',
                    backgroundImage: isFuture ? 'repeating-linear-gradient(180deg, var(--line) 0 4px, transparent 4px 8px)' : 'none',
                    backgroundColor: isPast ? 'var(--muted)' : 'transparent',
                    opacity: 1
                  }} />
                )}
                <div style={{ position: 'relative', flexShrink: 0, paddingTop: isNow ? 22 : 18 }}>
                  {isNow && (
                    <div className="pulse-ring" style={{
                      position: 'absolute', left: 4, top: 18, width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--orange)', opacity: 0.4
                    }} />
                  )}
                  <div style={{
                    width: isNow ? 40 : 16, height: isNow ? 40 : 16, borderRadius: '50%',
                    background: dotColor,
                    border: isNow ? '4px solid var(--cream)' : 'none',
                    boxShadow: isNow ? '0 0 0 2px var(--orange), 0 4px 12px rgba(242,108,26,0.4)' : 'none',
                    marginLeft: isNow ? -12 : 0,
                    marginTop: isNow ? -4 : 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isNow && <Vehicle kind={typeKind} size={22} color="#fff" />}
                  </div>
                </div>
                <div style={{ flex: 1, paddingTop: isNow ? 18 : 14, paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div className={isNow ? 'font-display' : ''} style={{
                      fontSize: isNow ? 20 : 15,
                      fontWeight: isNow ? 900 : isPast ? 500 : 600,
                      color: isFuture ? 'var(--muted)' : 'var(--ink)',
                      textDecoration: isPast ? 'line-through' : 'none',
                      opacity: isPast ? 0.6 : 1
                    }}>{s.stop_name}</div>
                  </div>
                  {isNow && (
                    <div style={{ marginTop: 8, padding: 12, borderRadius: 14, background: 'var(--cream-2)', border: '1.5px solid var(--orange)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.5 }}>TU ES ICI</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>{s.commune}</div>
                      <Link href={`/app/arret/${s.stop_id}`} style={{ display: 'block', padding: '8px', borderRadius: 10, background: 'var(--orange)', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>Détail arrêt</Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
