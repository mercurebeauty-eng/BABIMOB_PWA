'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export type FeedCheckin = {
  id: string;
  stop_name: string;
  commune: string | null;
  created_at: string;
  display_name: string;
  avatar_emoji: string;
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (mins < 1440) return `il y a ${Math.floor(mins / 60)} h`;
  return `il y a ${Math.floor(mins / 1440)} j`;
}

export default function CcommentFeed({ initialCheckins }: { initialCheckins: FeedCheckin[] }) {
  const [checkins, setCheckins] = useState<FeedCheckin[]>(initialCheckins);
  const [newCount, setNewCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('checkins-live-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checkins' },
        (payload) => {
          const c = payload.new as FeedCheckin & { is_public: boolean };
          if (!c.is_public) return;
          setCheckins((prev) => [c, ...prev].slice(0, 30));
          setNewCount((n) => n + 1);
          // Reset badge après 4 s
          setTimeout(() => setNewCount((n) => Math.max(0, n - 1)), 4000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  if (checkins.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-12 text-center shadow-xl shadow-black/5">
        <div className="text-5xl mb-6">👋</div>
        <p className="text-lg text-beige-muted font-bold mb-8 leading-relaxed">
          Sois le premier à marquer ton territoire !
        </p>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 bg-abidjan-orange text-white font-black px-8 py-4 rounded-full shadow-lg shadow-abidjan-orange/20"
        >
          Explorer la carte →
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {checkins.map((c, idx) => (
        <li
          key={c.id}
          className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all flex items-center gap-4 px-5 py-4 group ${
            idx === 0 && newCount > 0
              ? 'border-abidjan-green/40 animate-in slide-in-from-top-2 duration-500'
              : 'border-beige-200'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-beige-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform flex-shrink-0 select-none">
            {c.avatar_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black text-abidjan-orange uppercase tracking-wider truncate">
                {c.display_name}
              </span>
              {idx === 0 && newCount > 0 && (
                <span className="text-[9px] font-black bg-abidjan-green text-white px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">
                  Nouveau
                </span>
              )}
            </div>
            <div className="text-sm font-black text-beige-text truncate">{c.stop_name}</div>
            {c.commune && (
              <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-1">
                {c.commune}
              </div>
            )}
          </div>
          <div className="text-[9px] font-black text-beige-muted uppercase tracking-widest flex-shrink-0 text-right">
            {timeAgo(c.created_at)}
          </div>
        </li>
      ))}
    </ul>
  );
}
