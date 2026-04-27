'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ReachSource } from './useReachTracking';

type TrendingPlace = {
  id: string;
  name: string;
  count: number;
};

type Options = {
  logReach: (userId: string, source: ReachSource) => void;
};

export function useCommunityData({ logReach }: Options) {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [explorers, setExplorers] = useState<any[]>([]);
  const [communityFeed, setCommunityFeed] = useState<any[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<TrendingPlace[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }

      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data: bc } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, last_broadcast_at, broadcast_text, broadcast_lat, broadcast_lon, sub_tier, is_public_visits')
        .not('last_broadcast_at', 'is', null)
        .gt('last_broadcast_at', fourHoursAgo);
      if (bc) {
        setBroadcasts(bc);
        const publicExplorers = bc.filter((p: any) => p.is_public_visits && p.broadcast_lat && p.broadcast_lon);
        setExplorers(
          publicExplorers.map((p: any) => ({
            lat: p.broadcast_lat,
            lon: p.broadcast_lon,
            name: p.display_name ?? 'Explorateur',
            emoji: p.avatar_emoji ?? '🧭',
          }))
        );
        publicExplorers.forEach((p: any) => logReach(p.id, 'map'));
        bc.filter((p: any) => p.broadcast_text).forEach((p: any) => logReach(p.id, 'broadcast'));
      }

      const { data: globalFeed } = await supabase
        .from('checkins')
        .select(`
          id, place_id, place_name, created_at, points_earned,
          profile:profiles(id, display_name, avatar_emoji, is_verified_explorer, is_public_visits)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      if (globalFeed) {
        const publicFeed = (globalFeed as any[]).filter((f) => f.profile?.is_public_visits);
        setCommunityFeed(publicFeed);
        publicFeed.forEach((f) => {
          if (f.profile?.id) logReach(f.profile.id, 'feed');
        });
        const counts: Record<string, { count: number; name: string }> = {};
        (globalFeed as any[]).forEach((f) => {
          if (!counts[f.place_id]) counts[f.place_id] = { count: 0, name: f.place_name };
          counts[f.place_id].count++;
        });
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 3)
          .map(([id, val]) => ({ id, name: val.name, count: val.count }));
        setTrendingPlaces(sorted);
      }
    }
    loadData();
  }, [supabase, logReach]);

  return { profile, broadcasts, explorers, communityFeed, trendingPlaces };
}
