'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

export type FeedCheckin = {
  id: string;
  place_name: string;
  commune: string | null;
  created_at: string;
  display_name: string;
  avatar_emoji: string;
};

const AVATAR_COLORS = ['var(--orange)', 'var(--green)', 'var(--blue)', 'var(--gold)', 'var(--orange-deep)'];

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
          setTimeout(() => setNewCount((n) => Math.max(0, n - 1)), 4000);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  if (checkins.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
        <p style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600, marginBottom: 20 }}>Sois le premier à marquer ton territoire !</p>
        <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--orange)', color: '#fff', padding: '12px 24px', borderRadius: 999, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          Explorer la carte <Ic.Arrow s={16} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {checkins.map((c, idx) => (
        <div
          key={c.id}
          className={idx === 0 && newCount > 0 ? 'slide-up' : ''}
          style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--cream-2)', border: `1px solid ${idx === 0 && newCount > 0 ? 'var(--green)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {c.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.display_name}</span>
              {idx === 0 && newCount > 0 && (
                <span style={{ fontSize: 9, fontWeight: 900, background: 'var(--green)', color: '#fff', padding: '2px 7px', borderRadius: 999, letterSpacing: 0.5, flexShrink: 0 }}>NOUVEAU</span>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.place_name}</div>
            {c.commune && <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{c.commune}</div>}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0 }}>{timeAgo(c.created_at)}</div>
        </div>
      ))}
    </div>
  );
}
