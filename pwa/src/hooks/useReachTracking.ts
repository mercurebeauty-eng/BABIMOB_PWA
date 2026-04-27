'use client';

import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export type ReachSource = 'ticker' | 'map' | 'feed' | 'broadcast';

export function useReachTracking() {
  const supabase = createClient();
  const loggedRef = useRef<Set<string>>(new Set());

  const logReach = useCallback((userId: string, source: ReachSource) => {
    const key = `${userId}:${source}`;
    if (loggedRef.current.has(key)) return;
    loggedRef.current.add(key);
    supabase.rpc('record_reach', { p_user_id: userId, p_source: source });
  }, [supabase]);

  return { logReach };
}
