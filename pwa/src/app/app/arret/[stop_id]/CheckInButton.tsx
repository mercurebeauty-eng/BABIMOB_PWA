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
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
        <span className="text-xl">✅</span>
        <div>
          <div className="text-sm font-semibold text-emerald-800">Check-in enregistré !</div>
          {recentCount !== null && recentCount > 0 && (
            <div className="text-xs text-emerald-600 mt-0.5">
              👤 {recentCount} personne{recentCount > 1 ? 's' : ''} ici cette semaine
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700">
        <span>❌</span>
        <span>Connecte-toi pour faire un check-in.</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckin}
      disabled={status === 'loading'}
      className="w-full flex items-center justify-center gap-2 bg-bm-amber/10 hover:bg-bm-amber/20 text-bm-amber text-sm font-semibold px-4 py-3.5 rounded-2xl transition-colors disabled:opacity-60"
    >
      {status === 'loading' ? (
        <span className="w-4 h-4 border-2 border-bm-amber border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>📍</span>
      )}
      J&apos;y suis ! — Check-in C&apos;comment
    </button>
  );
}
