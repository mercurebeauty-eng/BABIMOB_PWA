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

    const { error } = await supabase.from('checkins').insert({
      user_id: user.id,
      stop_id: stopId,
      stop_name: stopName,
      commune,
      is_public: true,
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
    <button
      onClick={handleCheckin}
      disabled={status === 'loading'}
      className="w-full flex items-center justify-center gap-3 bg-abidjan-orange text-white text-base font-black px-6 py-4.5 rounded-[2rem] shadow-lg shadow-abidjan-orange/20 hover:shadow-abidjan-orange/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60"
    >
      {status === 'loading' ? (
        <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <span className="text-xl">📍</span>
      )}
      <span className="uppercase tracking-tight">Je suis ici !</span>
    </button>
  );
}

import Link from 'next/link';
