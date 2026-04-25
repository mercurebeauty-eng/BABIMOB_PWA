'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Props = { 
  placeId: string; 
  placeName: string; 
  commune: string | null;
  onSuccess?: () => void;
};

export default function CheckInButtonPlace({ placeId, placeName, commune, onSuccess }: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [recentCount, setRecentCount] = useState<number | null>(null);

  async function handleCheckin() {
    setStatus('loading');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus('error'); return; }

    // Get or create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_emoji')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const raw = user.email?.split('@')[0] ?? 'Explorateur';
      const defaultName = raw
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: user.id, display_name: defaultName, avatar_emoji: '🧭' })
        .select('display_name, avatar_emoji')
        .single();
      profile = created;
    }

    const { error } = await supabase.from('checkins').insert({
      user_id: user.id,
      place_id: placeId,
      stop_name: placeName, // We reuse stop_name for display consistency in simple lists
      commune,
      is_public: true,
      display_name: profile?.display_name ?? 'Explorateur',
      avatar_emoji: profile?.avatar_emoji ?? '🧭',
    });

    if (error) { 
      console.error(error);
      setStatus('error'); 
      return; 
    }

    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId)
      .eq('is_public', true)
      .gte('created_at', since);

    setRecentCount(count ?? 0);
    setStatus('done');
    onSuccess?.();
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-4 bg-abidjan-green/10 border-2 border-abidjan-green/20 rounded-2xl px-5 py-4 shadow-inner animate-in zoom-in-95 duration-300">
        <span className="text-2xl">✅</span>
        <div>
          <div className="text-sm font-black text-abidjan-green uppercase tracking-widest">C&apos;est validé !</div>
          <div className="text-[10px] text-abidjan-green font-bold mt-1 uppercase tracking-wider">
             Tu es check-in à {placeName}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Link href="/app/auth/signin" className="w-full flex items-center justify-center gap-3 bg-red-50 border-2 border-red-100 rounded-2xl px-6 py-4 text-xs font-black text-red-600 uppercase tracking-widest hover:bg-red-100 transition-colors">
        <span>❌</span>
        <span>Connecte-toi pour check-in</span>
      </Link>
    );
  }

  return (
    <button
      onClick={handleCheckin}
      disabled={status === 'loading'}
      className="w-full flex items-center justify-center gap-3 bg-abidjan-blue text-white text-sm font-black py-4 rounded-2xl shadow-lg shadow-abidjan-blue/20 hover:shadow-abidjan-blue/40 transition-all active:scale-95 disabled:opacity-60"
    >
      {status === 'loading' ? (
        <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <span className="text-lg">📍</span>
      )}
      <span className="uppercase tracking-tight">Je suis ici ! (Check-in)</span>
    </button>
  );
}
