import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RouteMapWrapper from './RouteMapWrapper';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import Vehicle from '@/components/ui/Vehicle';

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
          key={`${routeId}-${activeDir}`}
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

        {/* TIMELINE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
            ITINÉRAIRE · {orderedStops.length} ARRÊTS
          </div>
          {fromStop && (
            <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--green)', background: 'color-mix(in oklab, var(--green) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--green) 25%, transparent)', borderRadius: 99, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Votre arrêt mis en évidence
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          {orderedStops.map((s, i) => {
            const isFirst = i === 0;
            const isLast = i === orderedStops.length - 1;
            const isNow = fromStop === s.stop_id;
            const isPast = !fromStop ? false : orderedStops.findIndex(x => x.stop_id === fromStop) > i;
            const isFuture = !fromStop ? true : orderedStops.findIndex(x => x.stop_id === fromStop) < i;
            const isTerminus = isFirst || isLast;

            // Couleurs de la ligne de connexion (hardcodées pour éviter les variables manquantes)
            const lineColor = isPast ? '#e53935' : '#2e7d32'; // rouge / vert

            // Point : rouge pour passé, vert pour futur, orange pour l'actuel, couleur route pour terminus
            let dotColor = '#2e7d32'; // futur par défaut
            if (isNow) dotColor = 'var(--orange)';
            else if (isPast) dotColor = '#e53935';
            else if (isTerminus && !isNow) dotColor = routeColor;

            return (
              <div key={i} style={{ display: 'flex', gap: 16, position: 'relative', minHeight: isNow ? 110 : (isTerminus ? 64 : 52) }}>
                {/* Ligne verticale de connexion */}
                {i < orderedStops.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: 19,
                    top: isNow ? 40 : 24,
                    bottom: -8,
                    width: 2,
                    background: lineColor,
                  }} />
                )}

                {/* Point */}
                <div style={{ position: 'relative', flexShrink: 0, paddingTop: isNow ? 22 : 18 }}>
                  {isNow && (
                    <div className="pulse-ring" style={{
                      position: 'absolute', left: 4, top: 18, width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--orange)', opacity: 0.4
                    }} />
                  )}
                  <div style={{
                    width: isNow ? 40 : (isTerminus ? 20 : 12),
                    height: isNow ? 40 : (isTerminus ? 20 : 12),
                    borderRadius: '50%',
                    background: dotColor,
                    border: isNow ? '4px solid var(--cream)' : 'none',
                    boxShadow: isNow
                      ? '0 0 0 2px var(--orange), 0 4px 12px rgba(242,108,26,0.4)'
                      : isTerminus ? `0 0 0 4px color-mix(in oklab, ${routeColor} 20%, transparent)` : 'none',
                    marginLeft: isNow ? -12 : 0,
                    marginTop: isNow ? -4 : 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isNow && <Vehicle kind={typeKind} size={22} color="#fff" />}
                  </div>
                </div>

                {/* Texte & encart */}
                <div style={{ flex: 1, paddingTop: isNow ? 18 : 14, paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div className={isNow ? 'font-display' : ''} style={{
                      fontSize: isNow ? 20 : 15,
                      fontWeight: isNow ? 900 : 600,
                      color: isPast ? 'var(--ink-2)' : 'var(--ink)',
                    }}>
                      {s.stop_name}
                      {isNow && (
                        <span style={{
                          fontSize: 8,
                          fontWeight: 900,
                          color: 'var(--green)',
                          background: 'color-mix(in oklab, var(--green) 15%, transparent)',
                          border: '1px solid color-mix(in oklab, var(--green) 25%, transparent)',
                          borderRadius: 99,
                          padding: '2px 6px',
                          textTransform: 'uppercase',
                          letterSpacing: 0.4,
                          marginLeft: 8,
                          verticalAlign: 'middle'
                        }}>
                          VOTRE ARRÊT
                        </span>
                      )}
                    </div>
                    {s.commune && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.commune}</div>
                    )}
                  </div>

                  {/* Encart "Tu es ici" */}
                  {isNow && (
                    <div className="slide-up" style={{ marginTop: 8, padding: 12, borderRadius: 14, background: 'var(--cream-2)', border: '1.5px solid var(--orange)', boxShadow: '0 4px 12px rgba(242,108,26,0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.5 }}>TU ES ICI</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>Descends pour : {s.commune}, Marché vivrier, Pharmacie.</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/app/arret/${encodeURIComponent(s.stop_id)}`} style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'var(--orange)', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>Détail arrêt</Link>
                        <button className="press" style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--cream)', fontSize: 12, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer' }}>Je descends</button>
                      </div>
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
