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
  const routeColor = route.route_color ? `#${route.route_color}` : 'var(--orange)';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* HERO */}
      <div style={{ background: 'var(--ink)', color: 'var(--cream)', position: 'relative', overflow: 'hidden', paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 20, paddingLeft: 16, paddingRight: 16 }}>
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.12, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)', background: 'rgba(255,255,255,0.1)', textDecoration: 'none', flexShrink: 0 }}>
              <Ic.Back s={20} />
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>LIGNE {typeLabel}</div>
              <div className="font-display" style={{ fontSize: 20, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{route.route_long_name}</div>
            </div>
            <Vehicle kind={typeKind} size={44} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {currentTrip.trip_headsign && <Pill color="var(--green)">{direction === 0 ? '→' : '←'} {currentTrip.trip_headsign}</Pill>}
            {route.route_short_name && <Pill color="var(--orange)">Ligne {route.route_short_name}</Pill>}
            <Pill color="var(--blue)">{orderedStops.length} arrêts</Pill>
            {currentTrip.wheelchair === 1 && <Pill color="var(--muted)">♿ Accessible</Pill>}
          </div>
        </div>
      </div>

      <WaxStrip color="var(--orange)" height={6} />

      {/* MAP */}
      <div style={{ height: 200, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <RouteMapWrapper
          shape={(shapePoints ?? []) as { shape_pt_lat: number; shape_pt_lon: number }[]}
          stops={orderedStops}
          routeColor={route.route_color ?? '1565c0'}
        />
      </div>

      {/* CONTENT */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {/* Direction switch */}
        {dirMap.size > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: 4, background: 'var(--cream-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
            {[...dirMap.entries()].map(([dirId, info]) => (
              <Link key={dirId} href={`/app/ligne/${encodeURIComponent(routeId)}?dir=${dirId}`} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: activeDir === dirId ? 'var(--cream)' : 'transparent', color: activeDir === dirId ? 'var(--orange)' : 'var(--muted)', fontWeight: 800, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.3, transition: 'all 0.2s', boxShadow: activeDir === dirId ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>
                {dirId === 0 ? '→' : '←'} {info.trip_headsign ?? `Dir. ${dirId}`}
              </Link>
            ))}
          </div>
        )}

        {route.route_desc && (
          <div style={{ padding: 14, borderRadius: 14, background: 'var(--cream-2)', border: '1px solid var(--line)', marginBottom: 16, fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
            "{route.route_desc}"
          </div>
        )}

        {/* STOP TIMELINE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
            Itinéraire · {orderedStops.length} arrêts
          </div>
          {fromStop && (
            <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--green)', background: 'color-mix(in oklab, var(--green) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--green) 25%, transparent)', borderRadius: 99, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Votre arrêt mis en évidence
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          {orderedStops.map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === orderedStops.length - 1;
            const isTerminus = isFirst || isLast;
            const isCurrent = fromStop === stop.stop_id;
            return (
              <Link key={`${stop.stop_id}-${stop.stop_sequence}`} href={`/app/arret/${encodeURIComponent(stop.stop_id)}`} style={{ display: 'flex', alignItems: 'stretch', gap: 16, textDecoration: 'none', minHeight: isTerminus ? 64 : 52, background: isCurrent ? 'color-mix(in oklab, var(--green) 8%, transparent)' : 'transparent', borderRadius: isCurrent ? 12 : 0, margin: isCurrent ? '0 -8px' : 0, padding: isCurrent ? '0 8px' : 0 }}>
                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                  <div style={{ flex: 1, width: 2, background: isFirst ? 'transparent' : isCurrent ? 'var(--green)' : 'var(--line)' }} />
                  <div style={{
                    width: isCurrent ? 20 : isTerminus ? 20 : 12,
                    height: isCurrent ? 20 : isTerminus ? 20 : 12,
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--green)' : isTerminus ? routeColor : 'var(--line)',
                    flexShrink: 0,
                    boxShadow: isCurrent
                      ? '0 0 0 4px color-mix(in oklab, var(--green) 20%, transparent)'
                      : isTerminus ? `0 0 0 4px color-mix(in oklab, ${routeColor} 20%, transparent)` : 'none',
                  }} />
                  <div style={{ flex: 1, width: 2, background: isLast ? 'transparent' : isCurrent ? 'var(--green)' : 'var(--line)' }} />
                </div>

                {/* Stop info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderBottom: !isLast ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: isCurrent || isTerminus ? 15 : 13, fontWeight: isCurrent || isTerminus ? 800 : 600, color: isCurrent ? 'var(--green)' : isTerminus ? 'var(--ink)' : 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stop.stop_name}
                      </div>
                      {isCurrent && (
                        <span style={{ fontSize: 8, fontWeight: 900, color: 'var(--green)', background: 'color-mix(in oklab, var(--green) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--green) 25%, transparent)', borderRadius: 99, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>
                          Votre arrêt
                        </span>
                      )}
                    </div>
                    {stop.commune && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>{stop.commune}</div>
                    )}
                  </div>
                  <div style={{ color: 'var(--line)', flexShrink: 0 }}>
                    <Ic.Arrow s={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
