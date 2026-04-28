import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import Vehicle from '@/components/ui/Vehicle';
import Link from 'next/link';
import BackButton from './BackButton';
import RouteInteractive from './RouteInteractive';

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
  const routeColorRaw = route.route_color ?? 'F26C1A';
  const routeColor = `#${routeColorRaw}`;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'var(--cream)', position: 'relative', overflow: 'hidden',
        paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: 16, paddingLeft: 16, paddingRight: 16,
        borderBottom: '1px solid var(--line)',
      }}>
        {/* Wax pattern — subtil sur cream */}
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.07, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <BackButton />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>
                LIGNE {typeLabel.toUpperCase()}{route.route_short_name ? ` · ${route.route_short_name}` : ''}
              </div>
              <div className="font-display" style={{ fontSize: 20, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {route.route_long_name}
              </div>
            </div>
            <Vehicle kind={typeKind} size={44} />
          </div>

          {/* Static pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {currentTrip.wheelchair === 1 && <Pill color="var(--muted)">♿ Accessible</Pill>}
            {route.route_desc && <Pill color="var(--muted)">{route.route_desc}</Pill>}
          </div>
        </div>
      </div>

      <WaxStrip color="var(--orange)" height={4} />

      {/* ── Direction switch ── */}
      {dirMap.size > 1 && (
        <div style={{ display: 'flex', gap: 8, margin: '10px 16px 0', padding: 4, background: 'var(--cream-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
          {[...dirMap.entries()].map(([dirId, info]) => (
            <Link
              key={dirId}
              href={`/app/ligne/${encodeURIComponent(routeId)}?dir=${dirId}${fromStop ? `&from=${fromStop}` : ''}`}
              style={{
                flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10,
                background: activeDir === dirId ? 'var(--cream)' : 'transparent',
                color: activeDir === dirId ? 'var(--orange)' : 'var(--muted)',
                fontWeight: 800, fontSize: 12, textDecoration: 'none',
                textTransform: 'uppercase', letterSpacing: 0.3,
                boxShadow: activeDir === dirId ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {dirId === 0 ? '→' : '←'} {info.trip_headsign ?? `Dir. ${dirId}`}
            </Link>
          ))}
        </div>
      )}

      {/* ── Interactive: map + info pills + timeline ── */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        <RouteInteractive
          orderedStops={orderedStops}
          shapePoints={(shapePoints ?? []) as { shape_pt_lat: number; shape_pt_lon: number }[]}
          routeColor={routeColor}
          routeColorRaw={routeColorRaw}
          fromStop={fromStop}
          typeKind={typeKind}
          tripHeadsign={currentTrip.trip_headsign}
        />
      </div>
    </div>
  );
}
