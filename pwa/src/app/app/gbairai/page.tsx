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
  category: string | null;
  lat: number;
  lon: number;
  is_new: boolean;
};

export type ReportCategory = 'trafic' | 'incident' | 'travaux' | 'ambiance';

export type CommunePulse = {
  commune: string;
  report_count: number;
  checkin_count: number;
  status: 'vert' | 'orange' | 'rouge';
  /** Catégorie dominante des C'comment actifs sur la commune (hors tarif). */
  top_category: ReportCategory | null;
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

  // 3. Spots chauds via RPC
  const { data: hotSpotsRaw } = await supabase.rpc('get_hot_spots');
  const hotSpots: HotSpot[] = (hotSpotsRaw ?? []).map((s: any) => ({
    place_id: s.place_id,
    place_name: s.place_name,
    commune: s.commune,
    logo_emoji: s.logo_emoji || (s.is_new ? '✨' : '📍'),
    cover_color: s.cover_color || (s.is_new ? '#0EA85B' : '#F26C1A'),
    checkin_count: Number(s.checkin_count),
    category: s.category,
    lat: Number(s.lat || 5.308),
    lon: Number(s.lon || -4.016),
    is_new: !!s.is_new
  }));

  // 3b. Fetch Events & Voice Rooms
  const { data: events } = await supabase.from('events').select('*').order('start_at', { ascending: true }).limit(5);
  const { data: voiceRooms } = await supabase.from('voice_rooms').select('*').eq('is_live', true).limit(3);

  // 3c. Fetch recent checkins for City Pulse
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentCheckins } = await supabase
    .from('checkins')
    .select('place_id, place_name, commune, lat, lon')
    .gte('created_at', oneWeekAgo)
    .eq('is_public', true)
    .not('place_id', 'is', null);

  // 4. Pulse de la ville — basé sur les C'comment des arrêts (stop_reports)
  //    sauf catégorie "tarif" (qui est purement informatif, pas un signal de pouls).
  //    On ne garde que les reports encore actifs (expires_at > now).
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();
  const { data: reportsRaw } = await supabase
    .from('stop_reports')
    .select('stop_id, category, expires_at')
    .gte('created_at', oneDayAgo)
    .neq('category', 'tarif')
    .gt('expires_at', nowIso);

  // Résoudre la commune via gtfs_stops (pas de FK garantie ⇒ 2-step query)
  const reportedStopIds = Array.from(new Set((reportsRaw ?? []).map(r => r.stop_id))).filter(Boolean);
  let stopToCommune = new Map<string, string | null>();
  if (reportedStopIds.length > 0) {
    const { data: stopsMeta } = await supabase
      .from('gtfs_stops')
      .select('stop_id, commune')
      .in('stop_id', reportedStopIds);
    stopToCommune = new Map((stopsMeta ?? []).map(s => [s.stop_id, s.commune]));
  }

  const communeReports = new Map<string, number>();
  // commune → { category → count }
  const communeCats = new Map<string, Map<ReportCategory, number>>();
  (reportsRaw ?? []).forEach(r => {
    const com = stopToCommune.get(r.stop_id);
    if (!com) return;
    communeReports.set(com, (communeReports.get(com) ?? 0) + 1);
    const cat = r.category as ReportCategory;
    const inner = communeCats.get(com) ?? new Map<ReportCategory, number>();
    inner.set(cat, (inner.get(cat) ?? 0) + 1);
    communeCats.set(com, inner);
  });

  const communeCheckins = new Map<string, number>();
  (recentCheckins ?? []).forEach(c => {
    if (c.commune) communeCheckins.set(c.commune, (communeCheckins.get(c.commune) ?? 0) + 1);
  });

  const MAIN_COMMUNES = ['Cocody', 'Plateau', 'Yopougon', 'Adjamé', 'Marcory', 'Treichville'];
  const pulse: CommunePulse[] = MAIN_COMMUNES.map(commune => {
    const cc = communeCheckins.get(commune) ?? 0;
    const reportCount = communeReports.get(commune) ?? 0;
    const cats = communeCats.get(commune);
    let topCategory: ReportCategory | null = null;
    if (cats && cats.size > 0) {
      let best = -1;
      cats.forEach((n, cat) => { if (n > best) { best = n; topCategory = cat; } });
    }
    // Pouls basé sur les C'comment actifs des arrêts (hors tarif) :
    // - 2+ signalements ⇒ rouge (ça chauffe)
    // - 1 signalement OU forte densité d'activité ⇒ orange
    // - sinon ⇒ vert (Abidjan respire)
    const status: 'vert' | 'orange' | 'rouge' =
      reportCount >= 2 ? 'rouge'
      : reportCount >= 1 || cc > 5 ? 'orange'
      : 'vert';
    return { commune, report_count: reportCount, checkin_count: cc, status, top_category: topCategory };
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

  // 6b. Réactions agrégées par story (et par emoji), + ce que l'utilisateur a déjà mis
  const storyIds = (storiesRaw ?? []).map(s => s.id);
  let reactionsByStory: Record<string, Record<string, number>> = {};
  let myReactions: Record<string, string[]> = {};
  if (storyIds.length > 0) {
    const { data: rxRaw } = await supabase
      .from('gbairai_story_reactions')
      .select('story_id, reaction_emoji, user_id')
      .in('story_id', storyIds);
    (rxRaw ?? []).forEach(r => {
      const m = (reactionsByStory[r.story_id] ??= {});
      m[r.reaction_emoji] = (m[r.reaction_emoji] ?? 0) + 1;
      if (user && r.user_id === user.id) {
        (myReactions[r.story_id] ??= []).push(r.reaction_emoji);
      }
    });
  }

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
      reactionsByStory={reactionsByStory}
      myReactions={myReactions}
      events={events ?? []}
      voiceRooms={voiceRooms ?? []}
    />
  );
}
