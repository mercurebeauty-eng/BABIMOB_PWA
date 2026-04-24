import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CheckInButton from './CheckInButton';
import FavoriteButton from './FavoriteButton';

type Props = { params: Promise<{ stop_id: string }> };

export default async function ArretPage({ params }: Props) {
  const supabase = await createClient();
  const { stop_id } = await params;
  const stopId = decodeURIComponent(stop_id);

  const { data: stop, error: stopErr } = await supabase
    .from('gtfs_stops')
    .select('stop_id, stop_name, stop_lat, stop_lon, commune')
    .eq('stop_id', stopId)
    .maybeSingle();

  if (stopErr || !stop) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: lignes }, { data: favRow }] = await Promise.all([
    supabase.rpc('lignes_par_arret', { p_stop_id: stopId }),
    user
      ? supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('stop_id', stopId)
          .eq('kind', 'stop')
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const isFavorited = !!favRow;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
      {/* Top nav */}
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
        <span className="text-sm font-medium text-gray-600">Carte</span>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        {/* Stop header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-bm-amber/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-bm-amber" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-bm-amber font-semibold mb-0.5">
                Arrêt
              </div>
              <h1 className="text-xl font-bold text-gray-900">{stop.stop_name}</h1>
              {stop.commune && (
                <div className="text-sm text-gray-500 mt-0.5">{stop.commune}</div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex-1">
            <CheckInButton stopId={stop.stop_id} stopName={stop.stop_name} commune={stop.commune ?? null} />
          </div>
          <FavoriteButton
            stopId={stop.stop_id}
            stopName={stop.stop_name}
            commune={stop.commune ?? null}
            lat={stop.stop_lat}
            lon={stop.stop_lon}
            initialFavorited={isFavorited}
            userId={user?.id ?? null}
          />
        </div>

        {/* Lines section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Lignes desservant cet arrêt</h2>
          {lignes && (
            <span className="text-sm text-gray-400">{lignes.length} ligne{lignes.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {(!lignes || lignes.length === 0) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" />
            </svg>
            <div className="text-sm text-gray-400 text-center">Aucune ligne trouvée pour cet arrêt.</div>
          </div>
        )}

        <ul className="space-y-2">
          {lignes?.map((l: any) => (
            <li key={`${l.route_id}-${l.direction_id ?? 0}`}>
              <Link
                href={`/app/ligne/${encodeURIComponent(l.route_id)}${l.direction_id === 1 ? '?dir=1' : ''}`}
                className="bg-white rounded-2xl border border-gray-100 hover:border-bm-amber/40 hover:shadow-sm transition p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">
                    {l.route_long_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {l.agency_id}
                    {l.trip_headsign && (
                      <span className="ml-1">· Direction : {l.trip_headsign}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-bm-amber/10 text-bm-amber text-xs font-bold px-2.5 py-1 rounded-lg">
                    {l.route_id}
                  </div>
                  <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
