import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import Vehicle from '@/components/ui/Vehicle';
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
  const routeId = decodeURIComponent(route_id);

  const [{ data: route }, { data: trips }] = await Promise.all([
    supabase.from('gtfs_routes').select('*, route_desc').eq('route_id', routeId).maybeSingle(),
    supabase.from('gtfs_trips').select('trip_id, direction_id, trip_headsign, shape_id, wheelchair_accessible').eq('route_id', routeId),
  ]);

  if (!route || !trips || trips.length === 0) notFound();

  // Organisation des deux sens
  const directions = [0, 1];
  const tripPerDirMap = new Map();
  directions.forEach(d => {
    // On cherche un trip pour la direction d. Si absent, on ne met rien (pas de fallback automatique)
    const trip = trips.find(t => t.direction_id === d);
    if (trip) tripPerDirMap.set(d, trip);
  });

  const { label: typeLabel, kind: typeKind } = detectType(route.route_long_name ?? '');
  const routeColorRaw = route.route_color ?? 'F26C1A';
  const routeColor = `#${routeColorRaw}`;

  // Récupérer les sens disponibles
  const availableDirs = Array.from(tripPerDirMap.keys()).sort();
  
  // Sens actif : si dir est spécifié et disponible, on l'utilise, sinon on prend le premier dispo
  let activeDirection = (dir !== undefined && tripPerDirMap.has(parseInt(dir))) ? parseInt(dir) : availableDirs[0];
  const currentTrip = tripPerDirMap.get(activeDirection);

  if (!currentTrip) notFound();

  const [{ data: stopTimes }, { data: shapePoints }] = await Promise.all([
    supabase.from('gtfs_stop_times').select('stop_id, stop_sequence').eq('trip_id', currentTrip.trip_id).order('stop_sequence'),
    currentTrip.shape_id
      ? supabase.from('gtfs_shapes').select('shape_pt_lat, shape_pt_lon, shape_pt_sequence').eq('shape_id', currentTrip.shape_id).order('shape_pt_sequence')
      : Promise.resolve({ data: [] }),
  ]);

  const stopIds = (stopTimes ?? []).map(st => st.stop_id);
  const { data: stopsData } = stopIds.length
    ? await supabase.from('gtfs_stops').select('stop_id, stop_name, commune, stop_lat, stop_lon').in('stop_id', stopIds)
    : { data: [] };

  const stopsMap = new Map((stopsData ?? []).map(s => [s.stop_id, s]));
  const orderedStops: StopRow[] = (stopTimes ?? [])
    .map(st => { const s = stopsMap.get(st.stop_id); return s ? { ...s, stop_sequence: st.stop_sequence } : null; })
    .filter(Boolean) as StopRow[];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'var(--cream)', position: 'relative', overflow: 'hidden',
        paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: 16, paddingLeft: 16, paddingRight: 16,
        borderBottom: '1px solid var(--line)',
      }}>
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

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {currentTrip.wheelchair_accessible === 1 && <Pill color="var(--muted)">♿ Accessible</Pill>}
            {route.route_desc && <Pill color="var(--muted)">{route.route_desc}</Pill>}
          </div>
        </div>
      </div>

      <WaxStrip color="var(--orange)" height={4} />

      {/* ── Interactive: map + timeline ── */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        <RouteInteractive
          orderedStops={orderedStops}
          shapePoints={(shapePoints ?? []) as { shape_pt_lat: number; shape_pt_lon: number }[]}
          routeColor={routeColor}
          routeColorRaw={routeColorRaw}
          fromStop={fromStop}
          typeKind={typeKind}
          tripHeadsign={currentTrip.trip_headsign}
          activeDirection={activeDirection}
          tripPerDir={availableDirs.map(d => ({id: d, headsign: tripPerDirMap.get(d).trip_headsign}))}
          routeId={routeId}
        />
      </div>
    </div>
  );
}
