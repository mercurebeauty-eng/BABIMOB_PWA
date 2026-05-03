import { createClient } from '@/lib/supabase/server';
import GbairaiClient, { type FeedCheckin, type StoryItem, type TopSpot, type UserProfile } from './GbairaiClient';

export default async function GbairaiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [feedResult, storiesResult, topSpotsResult, profileResult] = await Promise.all([
    supabase
      .from('checkins')
      .select('id, place_name, commune, created_at, display_name, avatar_emoji')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(30),

    supabase
      .from('stories')
      .select('id, display_name, avatar_emoji, text_content, media_url, commune, user_level, created_at, expires_at')
      .gt('expires_at', new Date().toISOString())
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase.rpc('gbairai_top_spots', { p_limit: 10 }),

    user
      ? supabase
          .from('profiles')
          .select('id, display_name, avatar_emoji, total_points')
          .eq('id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const checkins = (feedResult.data ?? []) as FeedCheckin[];
  const stories = (storiesResult.data ?? []) as StoryItem[];
  const topSpots = (topSpotsResult.data ?? []) as TopSpot[];
  const userProfile = profileResult.data as UserProfile | null;

  return (
    <GbairaiClient
      checkins={checkins}
      stories={stories}
      topSpots={topSpots}
      userProfile={userProfile}
      isLoggedIn={!!user}
    />
  );
}
