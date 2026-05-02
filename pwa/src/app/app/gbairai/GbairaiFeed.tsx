'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';
import Vehicle from '@/components/ui/Vehicle';
import { Pill } from '@/components/ui/Pill';

export type FeedCheckin = {
  id: string;
  place_name: string;
  commune: string | null;
  created_at: string;
  display_name: string;
  avatar_emoji: string;
};

const AVATAR_COLORS = ['#F26C1A', '#0EA85B', '#1E5BFF', '#E8B23C', '#FF3B30'];

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}j`;
}

export default function GbairaiFeed({ initialCheckins }: { initialCheckins: FeedCheckin[] }) {
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

  // Mock data for social feel
  const getSocialMock = (idx: number) => ({
    likes: 5 + (idx * 3) % 40,
    replies: (idx * 2) % 12,
    kind: idx % 4 === 0 ? 'Trafic' : idx % 4 === 1 ? 'Bon plan' : idx % 4 === 2 ? 'Alerte' : 'Check-in',
    kindC: idx % 4 === 0 ? 'var(--orange)' : idx % 4 === 1 ? 'var(--green)' : idx % 4 === 2 ? 'var(--orange-deep)' : 'var(--blue)'
  });

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {checkins.map((c, idx) => {
        const social = getSocialMock(idx);
        return (
          <div key={c.id} style={{ padding: 14, borderRadius: 16, background: 'var(--cream-2)', border: '1px solid var(--line)', position: 'relative' }}>
            <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.02, borderRadius: 16 }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.avatar_emoji || c.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {c.display_name}
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--orange)', color: '#fff', fontSize: 9, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.commune || 'Abidjan'} · {timeAgo(c.created_at)}</div>
              </div>
              <Pill color={social.kindC}>{social.kind}</Pill>
            </div>

            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 10, position: 'relative' }}>
              Est passé par <b>{c.place_name}</b>. {idx % 3 === 0 ? "Le trafic est fluide ici !" : idx % 3 === 1 ? "Attention, petit bouchon à prévoir." : "Prenez le Gbaka 205, il y en a beaucoup aujourd'hui."}
            </div>

            {idx % 5 === 1 && (
              <div style={{ height: 120, borderRadius: 12, background: 'linear-gradient(135deg, var(--ink) 0%, var(--orange) 100%)', marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
                <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.2 }} />
                <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, background: 'rgba(0,0,0,0.4)', padding: '3px 7px', borderRadius: 6 }}>Photo · {c.place_name}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', fontWeight: 600, position: 'relative' }}>
              <button className="press" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 600 }}>
                <Ic.Star s={15} /> {social.likes}
              </button>
              <button className="press" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 600 }}>
                <Ic.Chat s={15} /> {social.replies}
              </button>
              <button className="press" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 600, marginLeft: 'auto' }}>
                <Ic.Route s={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
