import { createClient } from '@/lib/supabase/server';
import GbairaiClient from './GbairaiClient';

export type Story = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
  content: string | null;
  created_at: string;
  expires_at: string;
};

export type GbairaiPost = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  post_type: 'vibe' | 'tarif' | 'alerte' | 'bouffe' | 'evenement' | 'bon_plan';
  content: string;
  hashtags: string[];
  commune: string | null;
  place_name: string | null;
  lat: number | null;
  lon: number | null;
  metadata: Record<string, any>;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

export type HotSpot = {
  place_id: string;
  place_name: string;
  commune: string | null;
  logo_emoji: string;
  cover_color: string;
  checkin_count: number;
};

export type CommunePulse = {
  commune: string;
  report_count: number;
  checkin_count: number;
  status: 'vert' | 'orange' | 'rouge';
};

export default async function GbairaiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch profile for level gating
  let profile: any = null;
  if (user) {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = data;
  }

  // 1. Feed posts (derniers 30)
  const { data: posts } = await supabase
    .from('gbairai_posts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(30);

  // 2. Posts likés par l'utilisateur courant
  let myLikes: string[] = [];
  if (user) {
    const { data: likes } = await supabase
      .from('gbairai_likes')
      .select('post_id')
      .eq('user_id', user.id);
    myLikes = (likes ?? []).map(l => l.post_id);
  }

  // 3. Spots chauds (lieux avec le plus de checkins ces 7 derniers jours)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentCheckins } = await supabase
    .from('checkins')
    .select('place_id, place_name, commune')
    .gte('created_at', oneWeekAgo)
    .eq('is_public', true);

  // Agréger les spots
  const spotMap = new Map<string, { place_name: string; commune: string | null; count: number }>();
  (recentCheckins ?? []).forEach(c => {
    const key = c.place_id;
    const existing = spotMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      spotMap.set(key, { place_name: c.place_name, commune: c.commune, count: 1 });
    }
  });
  const hotSpots: HotSpot[] = Array.from(spotMap.entries())
    .map(([place_id, v]) => ({
      place_id,
      place_name: v.place_name,
      commune: v.commune,
      logo_emoji: '📍',
      cover_color: '#F26C1A',
      checkin_count: v.count,
    }))
    .sort((a, b) => b.checkin_count - a.checkin_count)
    .slice(0, 5);

  // 4. Pulse de la ville — basé sur stop_reports récents par commune
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: reportsRaw } = await supabase
    .from('stop_reports')
    .select('stop_id, category')
    .gte('created_at', oneDayAgo);

  // Agréger les checkins par commune pour le pulse
  const communeCheckins = new Map<string, number>();
  (recentCheckins ?? []).forEach(c => {
    if (c.commune) communeCheckins.set(c.commune, (communeCheckins.get(c.commune) ?? 0) + 1);
  });

  const MAIN_COMMUNES = ['Cocody', 'Plateau', 'Yopougon', 'Adjamé', 'Marcory', 'Treichville'];
  const pulse: CommunePulse[] = MAIN_COMMUNES.map(commune => {
    const cc = communeCheckins.get(commune) ?? 0;
    const reportCount = (reportsRaw ?? []).length; // simplified
    const status: 'vert' | 'orange' | 'rouge' = cc > 5 ? 'rouge' : cc > 2 ? 'orange' : 'vert';
    return { commune, report_count: reportCount, checkin_count: cc, status };
  });

  // 5. Fetch Followers (pour filtrage stories)
  let followingIds: string[] = [];
  if (user) {
    const { data: f } = await supabase.from('user_follows').select('following_id').eq('follower_id', user.id);
    followingIds = (f ?? []).map(row => row.following_id);
  }

  // 6. Fetch Stories (24h actives)
  // On récupère les stories avec les infos profil
  const { data: storiesRaw } = await supabase
    .from('gbairai_stories')
    .select(`
      *,
      profiles(display_name, avatar_emoji, total_points)
    `)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(40);

  // Filtrage des stories selon les règles :
  // - Celles des gens qu'on suit
  // - OU celles des gens de niveau 3+ (publiques)
  const filteredStories: Story[] = (storiesRaw ?? []).filter(s => {
    const profile = s.profiles as any;
    const isFollowed = followingIds.includes(s.user_id);
    const isLevel3Plus = profile && (profile.total_points ?? 0) >= 300; // 300 XP = Lvl 3
    return isFollowed || isLevel3Plus || s.user_id === user?.id;
  }).map(s => ({
    id: s.id,
    user_id: s.user_id,
    display_name: s.profiles?.display_name,
    avatar_emoji: s.profiles?.avatar_emoji,
    media_url: s.media_url,
    media_type: s.media_type,
    content: s.content,
    created_at: s.created_at,
    expires_at: s.expires_at,
  }));

  // 7. Trending hashtags
  const tagCount = new Map<string, number>();
  (posts ?? []).forEach(p => {
    (p.hashtags ?? []).forEach((tag: string) => {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    });
  });
  const trendingTags = Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  return (
    <GbairaiClient
      initialPosts={(posts ?? []) as GbairaiPost[]}
      myLikes={myLikes}
      hotSpots={hotSpots}
      pulse={pulse}
      stories={filteredStories}
      trendingTags={trendingTags}
      profile={profile}
      userId={user?.id ?? null}
    />
  );
}
