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
  price_range: string | null;
  rating: number | null;
  is_new: boolean;
  friends_count: number;
  lat: number;
  lon: number;
};

export type CollectiveQuest = {
  id: string;
  title: string;
  description: string | null;
  target_count: number;
  current_count: number;
  reward_xp: number;
  reward_badge: string | null;
  ends_at: string;
};

export type Quest = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  xp_reward: number;
  quest_type: string;
  target_count: number;
};

export type Crew = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color_from: string | null;
  color_to: string | null;
  commune: string | null;
  member_count: number;
  is_member: boolean;
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

  // 2b. Followers (utilisé pour spots/stories)
  let followingIds: string[] = [];
  if (user) {
    const { data: f } = await supabase.from('user_follows').select('following_id').eq('follower_id', user.id);
    followingIds = (f ?? []).map(row => row.following_id);
  }

  // 3. Spots chauds via RPC (renvoie maintenant logo_emoji/cover_color/lat/lon/price_range/rating)
  const { data: hotSpotsRaw } = await supabase.rpc('get_hot_spots', { limit_count: 10 });
  const FALLBACK_COLORS = ['#F26C1A', '#0EA85B', '#1E5BFF', '#E5337A', '#E8B23C', '#C4582E'];
  const hotSpotIds = (hotSpotsRaw ?? []).map((s: any) => s.id);

  // Compte d'amis présents sur chaque spot (ceux qu'on suit qui ont check-in dans les 12h)
  const friendsByPlace = new Map<string, number>();
  if (user && hotSpotIds.length > 0 && followingIds.length > 0) {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data: friendCheckins } = await supabase
      .from('checkins')
      .select('place_id, user_id')
      .in('place_id', hotSpotIds)
      .in('user_id', followingIds)
      .gte('created_at', twelveHoursAgo);
    (friendCheckins ?? []).forEach(c => {
      if (c.place_id) friendsByPlace.set(c.place_id, (friendsByPlace.get(c.place_id) ?? 0) + 1);
    });
  }

  const hotSpots: HotSpot[] = (hotSpotsRaw ?? []).map((s: any, i: number) => ({
    place_id: s.id,
    place_name: s.name,
    commune: s.commune,
    logo_emoji: s.logo_emoji ?? (s.is_new ? '✨' : '📍'),
    cover_color: s.cover_color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    checkin_count: Number(s.checkin_count ?? 0),
    category: s.category,
    price_range: s.price_range ?? null,
    rating: s.rating !== null && s.rating !== undefined ? Number(s.rating) : null,
    is_new: Boolean(s.is_new),
    friends_count: friendsByPlace.get(s.id) ?? 0,
    lat: Number(s.lat || 5.308),
    lon: Number(s.lon || -4.016),
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

  // 7a. Quêtes individuelles (catalogue)
  const { data: questsRaw } = await supabase
    .from('quests')
    .select('id, title, description, icon, color, xp_reward, quest_type, target_count, is_secret, sort_order')
    .eq('is_secret', false)
    .order('sort_order', { ascending: true });
  const quests: Quest[] = (questsRaw ?? []).map(q => ({
    id: q.id,
    title: q.title,
    description: q.description,
    icon: q.icon ?? 'Star',
    color: q.color ?? '#F26C1A',
    xp_reward: q.xp_reward ?? 0,
    quest_type: q.quest_type,
    target_count: q.target_count ?? 1,
  }));

  // 7b. Quête collective (active)
  const { data: collectiveRaw } = await supabase
    .from('collective_quest')
    .select('*')
    .gt('ends_at', nowIso)
    .order('ends_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  let collectiveQuest: CollectiveQuest | null = null;
  if (collectiveRaw) {
    // current_count = total checkins publics depuis le démarrage de la quête
    const { count: currentCount } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', collectiveRaw.created_at);
    collectiveQuest = {
      id: collectiveRaw.id,
      title: collectiveRaw.title,
      description: collectiveRaw.description,
      target_count: collectiveRaw.target_count,
      reward_xp: collectiveRaw.reward_xp,
      reward_badge: collectiveRaw.reward_badge,
      ends_at: collectiveRaw.ends_at,
      current_count: Math.min(currentCount ?? 0, collectiveRaw.target_count),
    };
  }

  // 7c. Crews + nombre de membres
  const { data: crewsRaw } = await supabase
    .from('crews')
    .select('id, name, description, emoji, color_from, color_to, commune')
    .order('created_at', { ascending: false })
    .limit(20);
  const crewIds = (crewsRaw ?? []).map(c => c.id);
  const memberCounts = new Map<string, number>();
  let myCrewIds = new Set<string>();
  if (crewIds.length > 0) {
    const { data: members } = await supabase
      .from('crew_members')
      .select('crew_id, user_id')
      .in('crew_id', crewIds);
    (members ?? []).forEach(m => {
      memberCounts.set(m.crew_id, (memberCounts.get(m.crew_id) ?? 0) + 1);
      if (user && m.user_id === user.id) myCrewIds.add(m.crew_id);
    });
  }
  const crews: Crew[] = (crewsRaw ?? []).map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    emoji: c.emoji,
    color_from: c.color_from,
    color_to: c.color_to,
    commune: c.commune,
    member_count: memberCounts.get(c.id) ?? 0,
    is_member: myCrewIds.has(c.id),
  }));

  // 8. Trending hashtags
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
      quests={quests}
      collectiveQuest={collectiveQuest}
      crews={crews}
    />
  );
}
