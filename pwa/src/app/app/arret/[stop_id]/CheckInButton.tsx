'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = { stopId: string; stopName: string; commune: string | null };

export default function CheckInButton({ stopId, stopName, commune }: Props) {
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
      stop_id: stopId,
      stop_name: stopName,
      commune,
      is_public: true,
      display_name: profile?.display_name ?? 'Explorateur',
      avatar_emoji: profile?.avatar_emoji ?? '🧭',
    });

    if (error) { setStatus('error'); return; }

    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('stop_id', stopId)
      .eq('is_public', true)
      .gte('created_at', since);

    setRecentCount(count ?? 0);
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-4 bg-abidjan-green/10 border-2 border-abidjan-green/20 rounded-[2rem] px-6 py-4 shadow-inner animate-in zoom-in-95 duration-300">
        <span className="text-2xl">✅</span>
        <div>
          <div className="text-sm font-black text-abidjan-green uppercase tracking-widest">C&apos;est validé !</div>
          {recentCount !== null && (
            <div className="text-[10px] text-abidjan-green font-bold mt-1 uppercase tracking-wider">
              👤 {recentCount} personne{recentCount > 1 ? 's' : ''} ici cette semaine
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Link href="/app/auth/signin" className="w-full flex items-center justify-center gap-3 bg-red-50 border-2 border-red-100 rounded-[2rem] px-6 py-4 text-xs font-black text-red-600 uppercase tracking-widest hover:bg-red-100 transition-colors">
        <span>❌</span>
        <span>Connecte-toi pour check-in</span>
      </Link>
    );
  }

  return (
    <div className="relative group">
      {/* Pulse ring */}
      <div className="absolute -inset-1 bg-abidjan-orange/20 rounded-[2.2rem] animate-pulse group-hover:bg-abidjan-orange/30 transition-all" />
      
      <button
        onClick={handleCheckin}
        disabled={status === 'loading'}
        className="relative w-full flex items-center justify-center gap-3 bg-abidjan-orange text-white text-base font-black px-6 py-4.5 rounded-[2rem] shadow-xl shadow-abidjan-orange/30 hover:shadow-abidjan-orange/50 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60"
      >
        {status === 'loading' ? (
          <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span className="text-xl">📍</span>
        )}
        <span className="uppercase tracking-tight">Je suis ici !</span>
      </button>
    </div>
  );
}

import Link from 'next/link';
