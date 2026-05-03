import { createClient } from '@/lib/supabase/server';
import GbairaiClient, { type FeedCheckin } from './GbairaiClient';

export default async function GbairaiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: feed } = await supabase
    .from('checkins')
    .select('id, place_name, commune, created_at, display_name, avatar_emoji')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(30);

  const checkins = (feed ?? []) as FeedCheckin[];

  return <GbairaiClient checkins={checkins} isLoggedIn={!!user} />;
}
