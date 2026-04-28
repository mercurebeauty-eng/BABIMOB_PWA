import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import CcommentFeed from './CcommentFeed';
import type { FeedCheckin } from './CcommentFeed';
import { Pill } from '@/components/ui/Pill';
import { Ic } from '@/components/ui/Ic';
import { WaxStrip } from '@/components/ui/WaxStrip';

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (mins < 1440) return `il y a ${Math.floor(mins / 60)} h`;
  return `il y a ${Math.floor(mins / 1440)} j`;
}

export default async function CcommentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: feed } = await supabase
    .from('checkins')
    .select('id, place_name, commune, created_at, display_name, avatar_emoji')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(30);

  const { data: mine } = user
    ? await supabase
        .from('checkins')
        .select('id, place_name, commune, created_at, display_name, avatar_emoji')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)
    : { data: [] };

  const checkins = (feed ?? []) as FeedCheckin[];
  const myCheckins = (mine ?? []) as FeedCheckin[];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(247,241,230,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)', padding: '14px 16px 12px', paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', background: 'var(--cream-2)', border: '1px solid var(--line)', textDecoration: 'none' }}>
            <Ic.Back s={20} />
          </Link>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 22 }}>C'comment ?</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Le pouls d'Abidjan, en direct</div>
          </div>
          {user && (
            <Link href="/app/compte" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--orange)', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 14 }}>
              <Ic.Plus s={20} />
            </Link>
          )}
        </div>
        {/* Filter bar */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {['Tout', 'Près de moi', 'Trafic', 'Bons plans', 'Alertes'].map((label, i) => (
            <button key={label} className="press" style={{ padding: '7px 14px', borderRadius: 999, border: i === 0 ? 'none' : '1px solid var(--line)', background: i === 0 ? 'var(--ink)' : 'transparent', color: i === 0 ? 'var(--cream)' : 'var(--ink)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 100px' }}>

        {/* Pulse card */}
        <div style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(135deg, var(--green) 0%, var(--green-deep) 100%)', color: '#fff', padding: 16, marginBottom: 14, position: 'relative' }}>
          <div className="wax-stripe" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.9, letterSpacing: 0.6 }}>POULS DE LA VILLE · MAINTENANT</div>
            <div className="font-display" style={{ fontSize: 22, marginTop: 4 }}>Cocody coule.<br/>Plateau bouchonne.</div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{checkins.length} Babis actifs · MAJ à l'instant</div>
          </div>
        </div>

        {/* Mes visites récentes */}
        {user && myCheckins.length > 0 && (
          <div style={{ marginBottom: 14, padding: 14, borderRadius: 16, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Pill color="var(--orange)">MES VISITES</Pill>
              <Link href="/app/compte" style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textDecoration: 'none' }}>Voir profil →</Link>
            </div>
            {myCheckins.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 20 }}>{c.avatar_emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.place_name}</div>
                  {c.commune && <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{c.commune}</div>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 800, flexShrink: 0 }}>{timeAgo(c.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sign in CTA if not logged in */}
        {!user && (
          <div style={{ marginBottom: 14, padding: 20, borderRadius: 18, background: 'var(--cream-2)', border: '1.5px dashed var(--orange)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🗺️</div>
            <div className="font-display" style={{ fontSize: 20, marginBottom: 8 }}>Marque ton territoire</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Connecte-toi pour participer et être vu sur la carte.</p>
            <Link href="/app/auth/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--orange)', color: '#fff', padding: '12px 24px', borderRadius: 999, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
              Se connecter <Ic.Arrow s={16} />
            </Link>
          </div>
        )}

        {/* Live feed */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, textTransform: 'uppercase' }}>En direct ({checkins.length})</div>
          <div className="shimmer" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
        </div>
        <CcommentFeed initialCheckins={checkins} />
      </div>
    </div>
  );
}
