'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toSubTier } from '@/lib/types';
import type { SubTier } from '@/lib/types';
import type { ReachSource } from './useReachTracking';

// ── Types ──────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  sub_tier: SubTier | null;
  is_admin: boolean;
  is_public_visits: boolean;
  total_points: number | null;
};

type BroadcastProfile = {
  id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  last_broadcast_at: string | null;
  broadcast_text: string | null;
  broadcast_lat: number | null;
  broadcast_lon: number | null;
  sub_tier: string | null;
  is_public_visits: boolean;
};

export type Explorer = {
  lat: number;
  lon: number;
  name: string;
  emoji: string;
};

type CheckinProfile = {
  id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  is_verified_explorer: boolean | null;
  is_public_visits: boolean;
};

export type CommunityCheckin = {
  id: string;
  place_id: string;
  place_name: string;
  created_at: string;
  points_earned: number | null;
  profile: CheckinProfile | null;
};

type Options = {
  logReach: (userId: string, source: ReachSource) => void;
};

// ── Hook ───────────────────────────────────────────────────────────────────

export function useCommunityData({ logReach }: Options) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [broadcasts, setBroadcasts] = useState<BroadcastProfile[]>([]);
  const [explorers, setExplorers] = useState<Explorer[]>([]);
  const [communityFeed, setCommunityFeed] = useState<CommunityCheckin[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<{ id: string; name: string; count: number }[]>([]);

  const logReachRef = useRef(logReach);
  useEffect(() => { logReachRef.current = logReach; }, [logReach]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_emoji, sub_tier, is_admin, is_public_visits, total_points')
          .eq('id', user.id)
          .single();
        if (!cancelled && data) setProfile({ ...(data as Omit<UserProfile, 'sub_tier'> & { sub_tier: string | null }), sub_tier: toSubTier(data.sub_tier) });
      }

      const fourHoursAgo = new Date(Date.now() - 4 * 3600000).toISOString();
      const { data: bc } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, last_broadcast_at, broadcast_text, broadcast_lat, broadcast_lon, sub_tier, is_public_visits')
        .not('last_broadcast_at', 'is', null)
        .gt('last_broadcast_at', fourHoursAgo);

      if (!cancelled && bc) {
        const typed = bc as BroadcastProfile[];
        setBroadcasts(typed);

        const publicExplorers = typed.filter((p) => p.is_public_visits && p.broadcast_lat && p.broadcast_lon);
        setExplorers(
          publicExplorers.map((p) => ({
            lat: p.broadcast_lat!,
            lon: p.broadcast_lon!,
            name: p.display_name ?? 'Explorateur',
            emoji: p.avatar_emoji ?? '🧭',
          }))
        );
        publicExplorers.forEach((p) => logReachRef.current(p.id, 'map'));
        typed.filter((p) => p.broadcast_text).forEach((p) => logReachRef.current(p.id, 'broadcast'));
      }

      const { data: globalFeed } = await supabase
        .from('checkins')
        .select('id, place_id, place_name, created_at, points_earned, profile:profiles(id, display_name, avatar_emoji, is_verified_explorer, is_public_visits)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!cancelled && globalFeed) {
        const typed = globalFeed as unknown as CommunityCheckin[];
        const publicFeed = typed.filter((f) => f.profile?.is_public_visits);
        setCommunityFeed(publicFeed);
        publicFeed.forEach((f) => { if (f.profile?.id) logReachRef.current(f.profile.id, 'feed'); });

        const counts: Record<string, { count: number; name: string }> = {};
        typed.forEach((f) => {
          if (!counts[f.place_id]) counts[f.place_id] = { count: 0, name: f.place_name };
          counts[f.place_id].count++;
        });
        setTrendingPlaces(
          Object.entries(counts)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3)
            .map(([id, val]) => ({ id, name: val.name, count: val.count }))
        );
      }
    }

    loadData();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { profile, broadcasts, explorers, communityFeed, trendingPlaces };
}
