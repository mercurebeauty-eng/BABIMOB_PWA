'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';
import { pickWax } from '@/lib/waxPattern';
import type { Crew } from './page';

export default function CrewsTab({ crews: initial, userId }: { crews: Crew[]; userId: string | null }) {
  const [crews, setCrews] = useState<Crew[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const supabase = createClient();

  async function toggleMembership(c: Crew) {
    if (!userId || busy) return;
    setBusy(c.id);
    const wasMember = c.is_member;

    setCrews(prev => prev.map(x => x.id === c.id ? {
      ...x,
      is_member: !wasMember,
      member_count: x.member_count + (wasMember ? -1 : 1),
    } : x));

    const { error } = wasMember
      ? await supabase.from('crew_members').delete().eq('crew_id', c.id).eq('user_id', userId)
      : await supabase.from('crew_members').insert({ crew_id: c.id, user_id: userId, role: 'member' });

    if (error) {
      // rollback
      setCrews(prev => prev.map(x => x.id === c.id ? {
        ...x, is_member: wasMember, member_count: x.member_count + (wasMember ? 1 : -1),
      } : x));
    }
    setBusy(null);
  }

  if (crews.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
        <div className="font-display" style={{ fontSize: 22, marginBottom: 8 }}>Pas encore de crews</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 280, margin: '0 auto' }}>Sois le premier à créer un crew de quartier.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px 16px 24px' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 0.7, marginBottom: 6 }}>CREWS DE QUARTIER</div>
      <h2 className="font-display" style={{ fontSize: 22, margin: '0 0 14px' }}>Trouve ta team</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {crews.map(c => {
          const wax = pickWax(`crew-${c.id}`, { rotate: true });
          const from = c.color_from ?? '#1E5BFF';
          const to = c.color_to ?? '#0EA85B';
          return (
            <div key={c.id} style={{
              borderRadius: 20, padding: 16, background: 'var(--cream-2)', border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${from}, ${to})`,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden', flexShrink: 0
              }}>
                <div className={wax} style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.22 }} />
                <span style={{ fontSize: 22, position: 'relative' }}>{c.emoji ?? '🤝'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>
                  {[c.commune, `${c.member_count} membre${c.member_count > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
                </div>
                {c.description && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.description}
                  </div>
                )}
              </div>
              <button
                disabled={!userId || busy === c.id}
                onClick={() => toggleMembership(c)}
                className="press"
                style={{
                  padding: '8px 14px', borderRadius: 12,
                  border: c.is_member ? '1px solid var(--line)' : 'none',
                  background: c.is_member ? '#fff' : 'var(--orange)',
                  color: c.is_member ? 'var(--ink)' : '#fff',
                  fontWeight: 800, fontSize: 12, cursor: userId ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  opacity: busy === c.id ? 0.6 : 1,
                }}>
                {c.is_member ? (<><Ic.Check s={12} /> Membre</>) : 'Rejoindre'}
              </button>
            </div>
          );
        })}
      </div>

      {!userId && (
        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 14 }}>
          Connecte-toi pour rejoindre un crew.
        </p>
      )}
    </div>
  );
}
