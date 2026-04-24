import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RouteMapWrapperWrapper from './RouteMapWrapperWrapper';

type Props = {
  params: Promise<{ route_id: string }>;
  searchParams: Promise<{ dir?: string }>;
};

type StopRow = {
  stop_id: string;
  stop_name: string;
  commune: string | null;
  stop_lat: number;
  stop_lon: number;
  stop_sequence: number;
};

const TYPE_MAP: Record<string, { label: string; emoji: string }> = {
  gbaka:  { label: 'Gbaka',              emoji: '🚐' },
  woro:   { label: 'Woro-woro',          emoji: '🚖' },
  taxi:   { label: 'Taxi intercommunal', emoji: '🚕' },
  saloni: { label: 'Saloni',             emoji: '🛺' },
};

function detectType(name: string) {
  const n = name.toLowerCase();
  for (const [key, val] of Object.entries(TYPE_MAP)) {
    if (n.startsWith(key)) return val;
  }
  return { label: 'Transport', emoji: '🚌' };
}

export default async function LignePage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const { route_id } = await params;
  const { dir } = await searchParams;
  const direction = dir === '1' ? 1 : 0;
  const routeId = decodeURIComponent(route_id);

  const [{ data: route }, { data: trips }] = await Promise.all([
    supabase.from('gtfs_routes').select('*').eq('route_id', routeId).maybeSingle(),
    supabase
      .from('gtfs_trips')
      .select('trip_id, direction_id, trip_headsign, shape_id')
      .eq('route_id', routeId),
  ]);

  if (!route || !trips || trips.length === 0) notFound();

  // One representative trip per direction
  const dirMap = new Map<number, { trip_id: string; trip_headsign: string | null; shape_id: string | null }>();
  for (const t of trips) {
    const d = t.direction_id ?? 0;
    if (!dirMap.has(d)) dirMap.set(d, { trip_id: t.trip_id, trip_headsign: t.trip_headsign, shape_id: t.shape_id });
  }

  const currentTrip = dirMap.get(direction) ?? [...dirMap.values()][0];
  const activeDir = dirMap.has(direction) ? direction : [...dirMap.keys()][0];

  const [{ data: stopTimes }, { data: shapePoints }] = await Promise.all([
    supabase
      .from('gtfs_stop_times')
      .select('stop_id, stop_sequence')
      .eq('trip_id', currentTrip.trip_id)
      .order('stop_sequence'),
    currentTrip.shape_id
      ? supabase
          .from('gtfs_shapes')
          .select('shape_pt_lat, shape_pt_lon, shape_pt_sequence')
          .eq('shape_id', currentTrip.shape_id)
          .order('shape_pt_sequence')
      : (Promise.resolve({ data: [] }) as Promise<{ data: { shape_pt_lat: number; shape_pt_lon: number; shape_pt_sequence: number }[] | null }>),
  ]);

  const stopIds = (stopTimes ?? []).map((st) => st.stop_id);
  const { data: stopsData } = stopIds.length
    ? await supabase
        .from('gtfs_stops')
        .select('stop_id, stop_name, commune, stop_lat, stop_lon')
        .in('stop_id', stopIds)
    : { data: [] };

  const stopsMap = new Map((stopsData ?? []).map((s) => [s.stop_id, s]));
  const orderedStops: StopRow[] = (stopTimes ?? [])
    .map((st) => {
      const s = stopsMap.get(st.stop_id);
      if (!s) return null;
      return { ...s, stop_sequence: st.stop_sequence };
    })
    .filter(Boolean) as StopRow[];

  const { label: typeLabel, emoji: typeEmoji } = detectType(route.route_long_name ?? '');
  const routeColor = route.route_color ?? '1565c0';
  const colorHex = `#${routeColor}`;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/app"
          className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 transition"
          aria-label="Retour à la carte"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{route.route_long_name}</div>
          <div className="text-xs text-gray-400">{typeEmoji} {typeLabel}</div>
        </div>
      </div>

      {/* Map */}
      <div className="overflow-hidden bg-gray-100">
        <RouteMapWrapper
          shape={(shapePoints ?? []) as { shape_pt_lat: number; shape_pt_lon: number }[]}
          stops={orderedStops}
          routeColor={routeColor}
        />
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-3">
        {/* Route info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${colorHex}22` }}
          >
            {typeEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 truncate">{route.agency_id}</div>
            <div className="text-sm font-semibold text-gray-900">{orderedStops.length} arrêts</div>
          </div>
          <div
            className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
            style={{ background: `${colorHex}22`, color: colorHex }}
          >
            #{routeId.slice(-6)}
          </div>
        </div>

        {/* Direction tabs */}
        {dirMap.size > 1 && (
          <div className="flex gap-2">
            {[...dirMap.entries()].map(([dirId, info]) => (
              <Link
                key={dirId}
                href={`/app/ligne/${encodeURIComponent(routeId)}?dir=${dirId}`}
                className={`flex-1 text-center text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors truncate ${
                  activeDir === dirId
                    ? 'bg-bm-amber text-black'
                    : 'bg-white border border-gray-100 text-gray-600 hover:border-bm-amber/40'
                }`}
              >
                {dirId === 0 ? '→' : '←'} {info.trip_headsign ?? `Dir. ${dirId}`}
              </Link>
            ))}
          </div>
        )}

        {/* Stops list */}
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2 px-1">
            Arrêts ({orderedStops.length})
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {orderedStops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === orderedStops.length - 1;
              return (
                <Link
                  key={`${stop.stop_id}-${stop.stop_sequence}`}
                  href={`/app/arret/${encodeURIComponent(stop.stop_id)}`}
                  className={`flex items-stretch gap-3 px-4 hover:bg-gray-50 transition-colors ${
                    !isLast ? 'border-b border-gray-50' : ''
                  }`}
                >
                  {/* Timeline column */}
                  <div className="flex flex-col items-center flex-shrink-0 w-5 py-1">
                    <div className={`w-0.5 flex-1 ${isFirst ? 'bg-transparent' : 'bg-gray-200'}`} />
                    <div
                      className={`rounded-full flex-shrink-0 ${
                        isFirst || isLast
                          ? 'w-4 h-4'
                          : 'w-2.5 h-2.5'
                      }`}
                      style={
                        isFirst || isLast
                          ? { background: colorHex, boxShadow: `0 0 0 3px ${colorHex}22` }
                          : { background: '#d1d5db' }
                      }
                    />
                    <div className={`w-0.5 flex-1 ${isLast ? 'bg-transparent' : 'bg-gray-200'}`} />
                  </div>

                  {/* Stop info */}
                  <div className="flex-1 min-w-0 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div
                        className={`text-sm truncate ${
                          isFirst || isLast ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                        }`}
                      >
                        {stop.stop_name}
                      </div>
                      {stop.commune && (
                        <div className="text-xs text-gray-400 mt-0.5">{stop.commune}</div>
                      )}
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-300 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
