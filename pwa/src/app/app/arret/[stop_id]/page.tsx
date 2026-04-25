import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FavoriteButton from './FavoriteButton';
import StopLinesList from './StopLinesList';
import BeigeMapBackground from '@/components/BeigeMapBackground';

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

  const [{ data: lignes }, { data: favRow }, { data: profile }] = await Promise.all([
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
    user
      ? supabase.from('profiles').select('preferred_transit_modes').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const isFavorited = !!favRow;
  const prefs = profile?.preferred_transit_modes || ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-beige-50 text-beige-text font-sans relative">
      <BeigeMapBackground />

      {/* Top nav */}
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
        <span className="text-sm font-bold uppercase tracking-widest text-beige-muted">Détails de l&apos;arrêt</span>
      </div>

      <div className="max-w-2xl mx-auto w-full px-5 py-8 relative z-10">
        {/* Stop header card */}
        <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-abidjan-orange/10 flex items-center justify-center flex-shrink-0 text-3xl shadow-inner">
              📍
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-abidjan-orange font-black mb-1">
                Arrêt de transport
              </div>
              <h1 className="text-2xl font-black text-beige-text leading-tight">{stop.stop_name}</h1>
              {stop.commune && (
                <div className="text-sm text-beige-muted font-bold mt-1 uppercase tracking-wide">{stop.commune}</div>
              )}
            </div>
          </div>
        </div>

        {/* Actions - Favoris uniquement */}
        <div className="mb-8 max-w-sm mx-auto">
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

        {/* Lines section header */}
        <div className="flex flex-col gap-4 mb-4 px-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-xl uppercase tracking-tight">Lignes passantes</h2>
            {lignes && (
              <span className="text-xs font-black text-beige-muted uppercase tracking-widest">{lignes.length} ligne{lignes.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        <StopLinesList lines={lignes || []} preferredModes={prefs} />
      </div>
    </div>
  );
}
