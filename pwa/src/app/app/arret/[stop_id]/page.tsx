export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ArretClientPage from './ArretClientPage';

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
      ? supabase.from('user_favorites').select('id').eq('user_id', user.id).eq('stop_id', stopId).eq('kind', 'stop').limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('profiles').select('preferred_transit_modes, display_name').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isFavorited = !!favRow;

  return (
    <ArretClientPage
      stop={stop}
      lignes={lignes || []}
      user={user}
      profile={profile}
      isFavorited={isFavorited}
    />
  );
}
