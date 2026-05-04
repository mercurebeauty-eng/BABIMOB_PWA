export const dynamic = 'force-dynamic';

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

export type Sense = {
  stops: StopRow[];
  shape: { shape_pt_lat: number; shape_pt_lon: number }[];
  headsign: string | null;
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

/** Charge les arrêts ordonnés + shape d'un trip. Retourne des tableaux vides si pas de trip. */
async function loadSense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trip: { trip_id: string; trip_headsign: string | null; shape_id: string | null } | undefined
): Promise<Sense> {
  if (!trip) return { stops: [], shape: [], headsign: null };

  const [{ data: stopTimes }, { data: shapePoints }] = await Promise.all([
    supabase
      .from('gtfs_stop_times')
      .select('stop_id, stop_sequence')
      .eq('trip_id', trip.trip_id)
      .order('stop_sequence'),
    trip.shape_id
      ? supabase
          .from('gtfs_shapes')
          .select('shape_pt_lat, shape_pt_lon, shape_pt_sequence')
          .eq('shape_id', trip.shape_id)
          .order('shape_pt_sequence')
      : Promise.resolve({ data: [] as { shape_pt_lat: number; shape_pt_lon: number; shape_pt_sequence: number }[] }),
  ]);

  const stopIds = (stopTimes ?? []).map((st) => st.stop_id as string);
  const { data: stopsData } = stopIds.length > 0
    ? await supabase
        .from('gtfs_stops')
        .select('stop_id, stop_name, commune, stop_lat, stop_lon')
        .in('stop_id', stopIds)
    : { data: [] as StopRow[] };

  const stopsMap = new Map((stopsData ?? []).map((s) => [s.stop_id, s]));
  const stops: StopRow[] = (stopTimes ?? [])
    .map((st) => {
      const s = stopsMap.get(st.stop_id);
      return s ? { ...s, stop_sequence: st.stop_sequence } : null;
    })
    .filter(Boolean) as StopRow[];

  return { stops, shape: shapePoints ?? [], headsign: trip.trip_headsign };
}

export default async function LignePage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const { route_id } = await params;
  const { dir, from: fromStop } = await searchParams;
  const routeId = decodeURIComponent(route_id);

  const [{ data: route }, { data: trips }] = await Promise.all([
    supabase.from('gtfs_routes').select('*, route_desc').eq('route_id', routeId).maybeSingle(),
    supabase
      .from('gtfs_trips')
      .select('trip_id, direction_id, trip_headsign, shape_id, wheelchair_accessible')
      .eq('route_id', routeId),
  ]);

  if (!route || !trips || trips.length === 0) notFound();

  // Un trip par direction (0 et 1)
  const trip0 = trips.find((t) => t.direction_id === 0);
  const trip1 = trips.find((t) => t.direction_id === 1);

  const availableDirs: number[] = [
    ...(trip0 ? [0] : []),
    ...(trip1 ? [1] : []),
  ];

  if (availableDirs.length === 0) notFound();

  // Sens actif initial depuis le paramètre URL
  const initialActiveDirection = dir !== undefined && availableDirs.includes(parseInt(dir))
    ? parseInt(dir)
    : availableDirs[0];

  // ── Chargement des deux sens en parallèle ──────────────────────────
  const [sense0, sense1] = await Promise.all([
    loadSense(supabase, trip0),
    loadSense(supabase, trip1),
  ]);

  const senses: Sense[] = [sense0, sense1];

  // Vérification que le sens actif a bien des données
  const currentTrip = initialActiveDirection === 0 ? trip0 : trip1;
  if (!currentTrip) notFound();

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

      {/* ── Composant interactif (carte + timeline) ── */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        <RouteInteractive
          senses={senses}
          availableDirs={availableDirs}
          routeColor={routeColor}
          routeColorRaw={routeColorRaw}
          fromStop={fromStop}
          typeKind={typeKind}
          initialActiveDirection={initialActiveDirection}
          routeId={routeId}
        />
      </div>
    </div>
  );
}
