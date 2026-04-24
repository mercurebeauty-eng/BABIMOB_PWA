import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import RouteMapWrapper from './RouteMapWrapper';
import BeigeMapBackground from '@/components/BeigeMapBackground';

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
    <div className="flex-1 flex flex-col overflow-y-auto bg-beige-50 text-beige-text font-sans relative">
      <BeigeMapBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50 px-4 py-3 flex items-center gap-3">
        <Link
          href="/app"
          className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors"
          aria-label="Retour à la carte"
        >
          <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-beige-text truncate uppercase tracking-tight">{route.route_long_name}</div>
          <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest">{typeEmoji} {typeLabel}</div>
        </div>
      </div>

      {/* Map Section */}
      <div className="overflow-hidden border-b border-beige-200 shadow-inner">
        <RouteMapWrapper
          shape={(shapePoints ?? []) as { shape_pt_lat: number; shape_pt_lon: number }[]}
          stops={orderedStops}
          routeColor={routeColor}
        />
      </div>

      <div className="max-w-2xl mx-auto w-full px-5 py-8 space-y-6 relative z-10">
        {/* Route info card */}
        <div className="bg-white rounded-3xl border-2 border-beige-200 shadow-xl shadow-black/5 p-6 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner"
            style={{ background: `${colorHex}15`, border: `1px solid ${colorHex}30` }}
          >
            {typeEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mb-1">{route.agency_id}</div>
            <div className="text-base font-black text-beige-text">{orderedStops.length} arrêts sur ce trajet</div>
          </div>
          <div
            className="text-[10px] font-black px-3 py-1.5 rounded-xl flex-shrink-0 border uppercase tracking-[0.2em]"
            style={{ background: `${colorHex}10`, color: colorHex, borderColor: `${colorHex}30` }}
          >
            Ligne
          </div>
        </div>

        {/* Direction tabs */}
        {dirMap.size > 1 && (
          <div className="flex gap-2 p-1 bg-beige-200/50 rounded-2xl border border-beige-200/30">
            {[...dirMap.entries()].map(([dirId, info]) => (
              <Link
                key={dirId}
                href={`/app/ligne/${encodeURIComponent(routeId)}?dir=${dirId}`}
                className={`flex-1 text-center text-xs font-black py-3 px-4 rounded-xl transition-all uppercase tracking-tight truncate ${
                  activeDir === dirId
                    ? 'bg-white text-abidjan-orange shadow-md'
                    : 'text-beige-muted hover:text-beige-text'
                }`}
              >
                {dirId === 0 ? '→' : '←'} {info.trip_headsign ?? `Dir. ${dirId}`}
              </Link>
            ))}
          </div>
        )}

        {/* Stops list */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-4 px-2">
            Itinéraire ({orderedStops.length} arrêts)
          </div>

          <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 overflow-hidden">
            {orderedStops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === orderedStops.length - 1;
              return (
                <Link
                  key={`${stop.stop_id}-${stop.stop_sequence}`}
                  href={`/app/arret/${encodeURIComponent(stop.stop_id)}`}
                  className={`flex items-stretch gap-4 px-6 hover:bg-beige-50 transition-colors group ${
                    !isLast ? 'border-b border-beige-100' : ''
                  }`}
                >
                  {/* Timeline column */}
                  <div className="flex flex-col items-center flex-shrink-0 w-6 py-1">
                    <div className={`w-1 flex-1 ${isFirst ? 'bg-transparent' : 'bg-beige-100'}`} />
                    <div
                      className={`rounded-full flex-shrink-0 transition-transform group-hover:scale-125 ${
                        isFirst || isLast
                          ? 'w-5 h-5'
                          : 'w-3 h-3'
                      }`}
                      style={
                        isFirst || isLast
                          ? { background: colorHex, boxShadow: `0 0 0 4px ${colorHex}20` }
                          : { background: '#D9C8AC' }
                      }
                    />
                    <div className={`w-1 flex-1 ${isLast ? 'bg-transparent' : 'bg-beige-100'}`} />
                  </div>

                  {/* Stop info */}
                  <div className="flex-1 min-w-0 py-5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className={`text-sm truncate ${
                          isFirst || isLast ? 'font-black text-beige-text' : 'font-bold text-beige-muted group-hover:text-beige-text'
                        }`}
                      >
                        {stop.stop_name}
                      </div>
                      {stop.commune && (
                        <div className="text-[10px] text-beige-200 font-bold uppercase tracking-widest mt-1 group-hover:text-beige-muted transition-colors">{stop.commune}</div>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-beige-100 group-hover:text-abidjan-orange transition-colors flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
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
