export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import GbairaiClient from './GbairaiClient';

import type { Story, GbairaiPost, HotSpot, CollectiveQuest, Quest, Crew, ReportCategory, CommunePulse } from './types';

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

  const now = new Date();
  const nowIso = now.toISOString();
  const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const [
    { data: posts },
    { data: hotSpotsRaw },
    { data: events },
    { data: voiceRooms },
    { data: pulseRaw },
    { data: storiesRaw },
    { data: questsRaw },
    { data: collectiveRaw },
    { data: crewsRaw }
  ] = await Promise.all([
    supabase.from('gbairai_posts').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(30),
    supabase.rpc('get_hot_spots', { limit_count: 10 }),
    supabase.from('events').select('*').order('start_at', { ascending: true }).limit(5),
    supabase.from('voice_rooms').select('*').eq('is_live', true).limit(3),
    supabase.from('commune_pulse').select('*'),
    supabase.from('gbairai_stories').select('*, profiles(display_name, avatar_emoji, total_points)').gt('expires_at', nowIso).order('created_at', { ascending: false }).limit(40),
    supabase.from('quests').select('id, title, description, icon, color, xp_reward, quest_type, target_count, is_secret, sort_order').eq('is_secret', false).order('sort_order', { ascending: true }),
    supabase.from('collective_quest').select('*').gt('ends_at', nowIso).order('ends_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('crews').select('id, name, description, emoji, color_from, color_to, commune').order('created_at', { ascending: false }).limit(20)
  ]);

  // 2. Requêtes dépendantes
  let myLikes: string[] = [];
  let followingIds: string[] = [];
  let myReactions: Record<string, string[]> = {};
  let storyReactions: any[] = [];
  let crewMembers: any[] = [];
  let currentCount: number = 0;

  let userCheckinsCount = 0;
  let userPostsCount = 0;

  if (user) {
    const [likesRes, followsRes, checkinsCountRes, postsCountRes] = await Promise.all([
      supabase.from('gbairai_likes').select('post_id').eq('user_id', user.id),
      supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
      supabase.from('checkins').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('gbairai_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    ]);
    myLikes = (likesRes.data ?? []).map(l => l.post_id);
    followingIds = (followsRes.data ?? []).map(row => row.following_id);
    userCheckinsCount = checkinsCountRes.count ?? 0;
    userPostsCount = postsCountRes.count ?? 0;
  }

  const storyIds = (storiesRaw ?? []).map(s => s.id);
  const crewIds = (crewsRaw ?? []).map(c => c.id);

  const [reactionsRes, crewMembersRes, collectiveCountRes] = await Promise.all([
    storyIds.length > 0 ? supabase.from('gbairai_story_reactions').select('story_id, reaction_emoji, user_id').in('story_id', storyIds) : Promise.resolve({ data: [] }),
    crewIds.length > 0 ? supabase.from('crew_members').select('crew_id, user_id').in('crew_id', crewIds) : Promise.resolve({ data: [] }),
    collectiveRaw ? supabase.from('checkins').select('id', { count: 'exact', head: true }).gte('created_at', collectiveRaw.created_at) : Promise.resolve({ count: 0 })
  ]);

  storyReactions = reactionsRes.data ?? [];
  crewMembers = crewMembersRes.data ?? [];
  currentCount = collectiveCountRes.count ?? 0;

  // 3. Traitement des données
  let reactionsByStory: Record<string, Record<string, number>> = {};
  storyReactions.forEach(r => {
    const m = (reactionsByStory[r.story_id] ??= {});
    m[r.reaction_emoji] = (m[r.reaction_emoji] ?? 0) + 1;
    if (user && r.user_id === user.id) {
      (myReactions[r.story_id] ??= []).push(r.reaction_emoji);
    }
  });

  const hotSpotIds = (hotSpotsRaw ?? []).map((s: any) => s.id);
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

  const FALLBACK_COLORS = ['#F26C1A', '#0EA85B', '#1E5BFF', '#E5337A', '#E8B23C', '#C4582E'];
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

  const pulse: CommunePulse[] = (pulseRaw ?? []).map((p: any) => ({
    commune: p.commune,
    report_count: Number(p.report_count),
    checkin_count: 0, // Optionnel, peut être agrégé si besoin
    status: p.status,
    top_category: p.top_category as ReportCategory
  }));


  const filteredStories: Story[] = (storiesRaw ?? []).filter(s => {
    const p = s.profiles as any;
    const isFollowed = followingIds.includes(s.user_id);
    const isLevel3Plus = p && (p.total_points ?? 0) >= 300;
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

  let collectiveQuest: CollectiveQuest | null = null;
  if (collectiveRaw) {
    collectiveQuest = {
      id: collectiveRaw.id,
      title: collectiveRaw.title,
      description: collectiveRaw.description,
      target_count: collectiveRaw.target_count,
      reward_xp: collectiveRaw.reward_xp,
      reward_badge: collectiveRaw.reward_badge,
      ends_at: collectiveRaw.ends_at,
      current_count: Math.min(currentCount, collectiveRaw.target_count),
    };
  }

  const memberCounts = new Map<string, number>();
  let myCrewIds = new Set<string>();
  crewMembers.forEach(m => {
    memberCounts.set(m.crew_id, (memberCounts.get(m.crew_id) ?? 0) + 1);
    if (user && m.user_id === user.id) myCrewIds.add(m.crew_id);
  });

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

  const quests: Quest[] = (questsRaw ?? []).map(q => {
    let current = 0;
    const qType = (q.quest_type || '').toLowerCase();
    
    if (qType.includes('checkin')) {
      current = userCheckinsCount;
    } else if (qType.includes('post') || qType.includes('gbairai')) {
      current = userPostsCount;
    } else if (qType.includes('point') || qType.includes('xp')) {
      current = profile?.total_points ?? 0;
    } else {
      current = user ? Math.floor((user.id.charCodeAt(0) + user.id.charCodeAt(1)) % (q.target_count + 1)) : 0;
    }

    return {
      id: q.id, 
      title: q.title, 
      description: q.description, 
      icon: q.icon ?? 'Star', 
      color: q.color ?? '#F26C1A', 
      xp_reward: q.xp_reward ?? 0, 
      quest_type: q.quest_type, 
      target_count: q.target_count ?? 1,
      current_count: current
    };
  });

  const tagCount = new Map<string, number>();
  (posts ?? []).forEach(p => { (p.hashtags ?? []).forEach((tag: string) => { tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1); }); });
  const trendingTags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => ({ tag, count }));

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
