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
  lat: number;
  lon: number;
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

  // 3. Spots chauds (lieux + arrêts avec le plus d'activité ces 7 derniers jours)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Fetch POI checkins
  const { data: recentCheckins } = await supabase
    .from('checkins')
    .select('place_id, place_name, commune, lat, lon')
    .gte('created_at', oneWeekAgo)
    .eq('is_public', true);

  // Fetch Arret validations (Transport Heatmap base)
  const { data: recentArretValidations } = await supabase
    .from('arret_validations')
    .select('stop_id, stop_name, lat, lon')
    .gte('created_at', oneWeekAgo);

  // Aggregator
  const spotMap = new Map<string, { name: string; commune?: string | null; count: number; lat: number; lon: number; type: 'place' | 'arret' }>();

  (recentCheckins ?? []).forEach(c => {
    const existing = spotMap.get(c.place_id);
    if (existing) {
      existing.count++;
    } else if (c.lat && c.lon) {
      spotMap.set(c.place_id, { name: c.place_name, commune: c.commune, count: 1, lat: c.lat, lon: c.lon, type: 'place' });
    }
  });

  (recentArretValidations ?? []).forEach(v => {
    const existing = spotMap.get(v.stop_id);
    if (existing) {
      existing.count++;
    } else if (v.lat && v.lon) {
      spotMap.set(v.stop_id, { name: v.stop_name, count: 1, lat: v.lat, lon: v.lon, type: 'arret' });
    }
  });

  const hotSpots: HotSpot[] = Array.from(spotMap.entries())
    .map(([id, v]) => ({
      place_id: id,
      place_name: v.name,
      commune: v.commune ?? null,
      logo_emoji: v.type === 'arret' ? '🚌' : '📍',
      cover_color: v.type === 'arret' ? 'var(--blue)' : '#F26C1A',
      checkin_count: v.count,
      lat: v.lat,
      lon: v.lon
    }))
    .sort((a, b) => b.checkin_count - a.checkin_count)
    .slice(0, 10);

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
