'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--muted)' }}>Chargement de la carte...</div> });

type Badge = { badge_key: string; awarded_at: string };
type CheckinDetail = { id: string; created_at: string; place_name: string; commune: string | null; lat?: number | null; lon?: number | null };
type Props = {
  displayName: string;
  avatarEmoji: string;
  totalPoints: number;
  checkinCount: number;
  badges: Badge[];
  checkinsDetail: CheckinDetail[];
  commune: string;
  children: React.ReactNode; // ProfileEditor + PreferencesEditor + SignOutButton + PersonalHeatmap
};

const BADGE_META: Record<string, { label: string; color: string; rare: string }> = {
  first_checkin: { label: 'Pied-à-terre', color: 'var(--orange)', rare: 'C' },
  explorer_5:    { label: 'Premier Gbaka', color: '#0EA85B', rare: 'C' },
  pioneer_10:    { label: 'Connaisseur', color: '#E8B23C', rare: 'R' },
  gbaka_master:  { label: 'Pont d\'or', color: '#1E5BFF', rare: 'R' },
  commune_3:     { label: 'Côte Sud', color: 'var(--muted)', rare: 'R' },
  commune_5:     { label: '100 Babis', color: 'var(--muted)', rare: 'SR' },
  points_500:    { label: 'Zo de nuit', color: 'var(--muted)', rare: 'SR' },
  verified:      { label: 'Empereur', color: 'var(--muted)', rare: 'SSR' },
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_checkin: <Ic.Pin s={22} fill />,
  explorer_5:    <Ic.Bus s={22} />,
  pioneer_10:    <Ic.Star s={22} fill />,
  gbaka_master:  <Ic.Bolt s={22} />,
  commune_3:     <Ic.Compass s={22} />,
  commune_5:     <Ic.Users s={22} />,
  points_500:    <Ic.Moon s={22} />,
  verified:      <Ic.Trophy s={22} />,
};

const ACTIVITY_ICONS = ['var(--orange)', '#0EA85B', '#1E5BFF', '#E8B23C', '#E5337A'];

function computeLevel(points: number, checkins: number): { level: number; xp: number; xpNext: number; title: string } {
  const xp = points + checkins * 15;
  const thresholds = [0, 200, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000];
  const titles = ['Débutant', 'Explorateur', 'Voyageur', 'Babi Confirmé', 'Connaisseur', 'Habitué', 'Garocheur', 'Ambassadeur', 'Légende', 'Empereur d\'Abidjan'];
  let level = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i;
  }
  return { level: level + 1, xp, xpNext: thresholds[Math.min(level + 1, thresholds.length - 1)], title: titles[level] };
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  if (mins < 1440) return `il y a ${Math.floor(mins / 60)}h`;
  return `il y a ${Math.floor(mins / 1440)}j`;
}

// ── Tab : Passeport ──────────────────────────────────────────
function TabPasseport({ badges, checkinsDetail, totalPoints, checkinCount, children }: {
  badges: Badge[]; checkinsDetail: CheckinDetail[]; totalPoints: number; checkinCount: number; children: React.ReactNode;
}) {
  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = checkinsDetail.some(c => c.created_at.startsWith(today));
  
  const MISSIONS = [
    { ic: <Ic.Pin s={18} fill />, c: 'var(--orange)', t: 'Check-in aujourd\'hui', sub: 'Visite 1 arrêt', xp: 30, done: hasCheckedInToday },
    { ic: <Ic.Star s={18} fill />, c: '#0EA85B', t: 'Collectionneur', sub: 'Gagne 5 badges', xp: 100, done: badges.length >= 5 },
    { ic: <Ic.Map s={18} />, c: '#1E5BFF', t: 'Explorateur local', sub: "Visite 3 communes", xp: 150, done: new Set(checkinsDetail.map(c => c.commune)).size >= 3 },
  ];

  return (
    <>
      {/* Premium Passport Card */}
      <div style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 20, position: 'relative', background: 'linear-gradient(135deg,#1A1410 0%,#2A1F18 100%)', color: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }}>
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.15 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg,var(--orange),#E8B23C)' }} />
        
        <div style={{ position: 'relative', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic.Flame s={24} color="#E8B23C" />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1.5 }}>SÉRIE ACTUELLE</div>
              <div className="font-display" style={{ fontSize: 28, color: '#fff' }}>{checkinCount}j</div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>VOTRE PROGRESSION HEBDO</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => {
                const isDone = i < (checkinCount % 7) || (i === 6 && checkinCount > 0 && checkinCount % 7 === 0);
                return (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, height: 32, borderRadius: 10, background: isDone ? 'var(--orange)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }}>
                      {isDone ? '✓' : ''}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, marginTop: 4, color: isDone ? '#fff' : 'rgba(255,255,255,0.4)' }}>{d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Missions du jour */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>Missions du jour</h3>
        <Pill color="var(--orange)">{MISSIONS.filter(m => m.done).length}/{MISSIONS.length}</Pill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {MISSIONS.map((m, i) => (
          <div key={i} className="press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, background: 'var(--cream-2)', border: `1px solid ${m.done ? 'color-mix(in oklab,#0EA85B 30%,transparent)' : 'var(--line)'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `color-mix(in oklab,${m.c} 12%,transparent)`, color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m.ic}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', textDecoration: m.done ? 'line-through' : 'none', opacity: m.done ? 0.6 : 1 }}>{m.t}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.sub}</div>
            </div>
            {m.done ? (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0EA85B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic.Check s={16} />
              </div>
            ) : (
              <div className="font-display" style={{ fontSize: 16, color: 'var(--orange)' }}>+{m.xp} XP</div>
            )}
          </div>
        ))}
      </div>

      {/* Album de badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>Album de badges</h3>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)' }}>VOIR TOUT →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {Object.entries(BADGE_META).slice(0, 8).map(([key, meta]) => {
          const earned = badges.some(b => b.badge_key === key);
          return (
            <div key={key} className="press" style={{ aspectRatio: '1', borderRadius: 18, background: 'var(--cream-2)', border: earned ? `2px solid ${meta.color}` : '1.5px dashed var(--line)', opacity: earned ? 1 : 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: earned ? `color-mix(in oklab,${meta.color} 15%,transparent)` : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, marginBottom: 4 }}>
                {earned ? (BADGE_ICONS[key] || <Ic.Star s={20} />) : <Ic.X s={16} />}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{meta.label}</div>
            </div>
          );
        })}
      </div>

      {/* Crew card */}
      <div style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 18, position: 'relative', background: 'var(--ink)', color: 'var(--cream)', padding: 16 }}>
        <div className="wax-zigzag" style={{ position: 'absolute', inset: 0, color: '#0EA85B', opacity: 0.1 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#E8B23C', letterSpacing: 0.6 }}>TON CREW</div>
              <div className="font-display" style={{ fontSize: 22, color: '#fff', marginTop: 2 }}>Cocody Family</div>
              <div style={{ fontSize: 11, color: 'rgba(247,241,230,0.6)', marginTop: 2 }}>#3 sur 47 crews · 24 membres</div>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg,#0EA85B,#1E5BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Archivo Black,sans-serif', fontSize: 22, color: '#fff', position: 'relative' }}>
              CF
              <div style={{ position: 'absolute', top: -6, right: -6, background: '#E8B23C', color: 'var(--ink)', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 999 }}>3</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <div style={{ display: 'flex' }}>
              {['#F26C1A', '#0EA85B', '#1E5BFF', '#E8B23C', '#E5337A'].map((c, i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: '2px solid var(--ink)', marginLeft: i === 0 ? 0 : -7, fontSize: 11, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {['M', 'A', 'D', 'K', 'I'][i]}
                </div>
              ))}
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid var(--ink)', marginLeft: -7, fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+19</div>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: 'rgba(247,241,230,0.65)' }}>
              <b style={{ color: '#E8B23C' }}>5 actifs</b> en ce moment
            </div>
          </div>
          <div style={{ marginTop: 14, padding: 10, borderRadius: 12, background: 'rgba(232,178,60,0.1)', border: '1px solid rgba(232,178,60,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#E8B23C', letterSpacing: 0.5 }}>QUÊTE COLLECTIVE · 4j RESTANTS</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>847 / 1000</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Cartographier 1 000 arrêts ensemble</div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '84.7%', background: 'linear-gradient(90deg,#E8B23C,#F26C1A)', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <h3 className="font-display" style={{ fontSize: 18, margin: '0 0 10px' }}>Activité récente</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {checkinsDetail.slice(0, 5).map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 11, borderRadius: 12, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `color-mix(in oklab,${ACTIVITY_ICONS[i % ACTIVITY_ICONS.length]} 15%,transparent)`, color: ACTIVITY_ICONS[i % ACTIVITY_ICONS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic.Pin s={16} fill />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.place_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.commune || 'Abidjan'} · {timeAgo(a.created_at)}</div>
            </div>
            <div className="font-display" style={{ fontSize: 14, color: 'var(--orange)' }}>+15</div>
          </div>
        ))}
        {checkinsDetail.length === 0 && (
          <div style={{ padding: '24px 20px', textAlign: 'center', borderRadius: 14, background: 'var(--cream-2)', border: '1px dashed var(--line)', fontSize: 13, color: 'var(--muted)' }}>
            Aucune activité pour l'instant — explore Abidjan !
          </div>
        )}
      </div>

      {/* Paramètres (ProfileEditor + PreferencesEditor) */}
      <h3 className="font-display" style={{ fontSize: 18, margin: '24px 0 12px' }}>Paramètres</h3>
      {children}
    </>
  );
}

// ── Tab : Territoire ─────────────────────────────────────────
function TabTerritoire({ 
  commune, 
  heatmapNode, 
  checkinsDetail 
}: { 
  commune: string; 
  heatmapNode: React.ReactNode;
  checkinsDetail: CheckinDetail[];
}) {
  // Dynamic calculation of conquest by commune
  const communeCounts: Record<string, number> = {};
  checkinsDetail.forEach(c => {
    const com = c.commune || 'Abidjan';
    communeCounts[com] = (communeCounts[com] || 0) + 1;
  });

  const total = checkinsDetail.length || 1;
  const COMMUNES = Object.entries(communeCounts)
    .map(([n, count]) => ({
      n,
      count,
      pct: Math.round((count / total) * 100),
      c: n === commune ? 'var(--orange)' : n === 'Plateau' ? '#1E5BFF' : n === 'Marcory' ? '#E5337A' : '#0EA85B',
      mayor: n === commune && count > 5
    }))
    .sort((a, b) => b.pct - a.pct);

  // Fallback if no checkins
  const displayCommunes = COMMUNES.length > 0 ? COMMUNES : [
    { n: commune || 'Ma Commune', pct: 0, c: 'var(--orange)', mayor: false }
  ];

  return (
    <>
      {/* Heatmap */}
      <div style={{ borderRadius: 24, overflow: 'hidden', background: 'var(--cream-2)', border: '1px solid var(--line)', marginBottom: 18, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1 }}>TON EMPREINTE</div>
            <h3 className="font-display" style={{ fontSize: 24, margin: '2px 0 0' }}>{Math.round((COMMUNES.length / 13) * 100)}% d'Abidjan</h3>
          </div>
          <Pill color="#0EA85B">+{COMMUNES.length} COMMUNES</Pill>
        </div>
        <div style={{ height: 220, background: 'var(--cream)', position: 'relative' }}>
          {heatmapNode}
        </div>
      </div>

      {/* Conquête par commune */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>Conquête du territoire</h3>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>{COMMUNES.length} EXPLORÉES</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {displayCommunes.map((c, i) => (
          <div key={i} className="press" style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: c.c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>
                  <Ic.Pin s={16} fill />
                </div>
                <div>
                  <div className="font-display" style={{ fontSize: 16 }}>{c.n}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginTop: 1 }}>{c.count} VISITES</div>
                </div>
                {c.mayor && <span style={{ fontSize: 9, fontWeight: 900, color: '#fff', background: 'var(--orange)', padding: '2px 6px', borderRadius: 5, letterSpacing: 0.5 }}>MAIRE</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>{c.pct}%</div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${c.pct}%`, background: c.c, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Tab : Classement ─────────────────────────────────────────
function TabClassement({ displayName, totalPoints }: { displayName: string; totalPoints: number }) {
  const [scope, setScope] = useState<0 | 1 | 2>(0);

  const PODIUM = [
    { rank: 2, name: 'Aïcha B.', xp: '4 820', c: '#1E5BFF', h: 80 },
    { rank: 1, name: 'Boris K.', xp: '6 240', c: '#E8B23C', h: 100 },
    { rank: 3, name: 'Yann T.', xp: '3 110', c: '#0EA85B', h: 64 },
  ];

  const LIST = [
    { rank: 4, name: displayName, me: true, xp: totalPoints.toLocaleString(), delta: '+12', c: 'var(--orange)' },
    { rank: 5, name: 'Didier A.', xp: '2 290', delta: '+5', c: '#0EA85B' },
    { rank: 6, name: 'Awa K.', xp: '2 105', delta: '-2', c: '#E8B23C' },
    { rank: 7, name: 'Kobi N.', xp: '1 880', delta: '+8', c: '#E5337A' },
  ];

  return (
    <>
      {/* Podium */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 24, padding: '10px 0' }}>
        {PODIUM.map((p, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 50, height: 50, margin: '0 auto 8px' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 16, background: p.c, color: '#fff', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: p.rank === 1 ? '3px solid #E8B23C' : 'none', transform: 'rotate(-5deg)' }}>
                {p.name[0]}
              </div>
              {p.rank === 1 && <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 24 }}>👑</div>}
            </div>
            <div className="font-display" style={{ fontSize: 13, color: 'var(--ink)' }}>{p.name}</div>
            <div style={{ height: p.h, borderRadius: '14px 14px 0 0', marginTop: 10, background: `linear-gradient(180deg,${p.c} 0%,color-mix(in oklab,${p.c} 70%,black) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Archivo Black,sans-serif', fontSize: 28, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              {p.rank}
            </div>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LIST.map((p, i) => (
          <div key={i} className="press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, background: p.me ? 'color-mix(in oklab,var(--orange) 10%,var(--cream-2))' : 'var(--cream-2)', border: p.me ? '2px solid var(--orange)' : '1px solid var(--line)' }}>
            <div className="font-display" style={{ width: 24, fontSize: 16, color: p.me ? 'var(--orange)' : 'var(--muted)', textAlign: 'center' }}>{p.rank}</div>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: p.c, color: '#fff', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.xp} XP</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, color: p.delta.startsWith('+') ? '#0EA85B' : '#D9510A', background: 'var(--cream)', padding: '4px 8px', borderRadius: 8 }}>
              {p.delta}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Composant principal ──────────────────────────────────────
export default function CompteClient({ displayName, avatarEmoji, totalPoints, checkinCount, badges, checkinsDetail, commune, children }: Props) {
  const [tab, setTab] = useState<'passeport' | 'territoire' | 'tableau'>('passeport');

  const { level, xp, xpNext, title } = computeLevel(totalPoints, checkinCount);
  const xpPct = Math.min(100, Math.round((xp / xpNext) * 100));

  const TABS = [
    { id: 'passeport', l: 'Passeport' },
    { id: 'territoire', l: 'Territoire' },
    { id: 'tableau', l: 'Classement' },
  ] as const;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* Header dark "Passeport" */}
      <div style={{ position: 'relative', paddingTop: 'max(52px,env(safe-area-inset-top,0px))', paddingBottom: 18, background: 'linear-gradient(165deg,#1A1410 0%,#2A1F18 50%,#3A2A1E 100%)', color: 'var(--cream)', overflow: 'hidden' }}>
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.14 }} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(242,108,26,0.35),transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,168,91,0.25),transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 2, padding: '0 16px' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Link href="/app" style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              <Ic.Back s={18} />
            </Link>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(247,241,230,0.5)' }}>PASSEPORT BABI</div>
            <button className="press" style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic.Share s={16} />
            </button>
          </div>

          {/* Identité */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative' }}>
              {/* Avatar géométrique style wax */}
              <div style={{ width: 84, height: 84, borderRadius: 24, position: 'relative', background: 'linear-gradient(135deg,var(--orange) 0%,#D9510A 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 30px rgba(242,108,26,0.45),inset 0 0 0 2px rgba(255,255,255,0.25)' }}>
                <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                  {avatarEmoji}
                </div>
              </div>
              {/* Level chip */}
              <div style={{ position: 'absolute', bottom: -6, right: -6, background: '#E8B23C', color: 'var(--ink)', width: 32, height: 32, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Archivo Black,sans-serif', fontSize: 14, border: '3px solid #1A1410', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                {level}
              </div>
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div className="font-display" style={{ fontSize: 24, lineHeight: 1 }}>{displayName}</div>
              <div style={{ fontSize: 11, color: 'rgba(247,241,230,0.55)', marginTop: 4, letterSpacing: 0.3 }}>{commune || 'Abidjan'}</div>
              {/* Honorific badge */}
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 6px', borderRadius: 999, background: 'linear-gradient(90deg,var(--orange) 0%,#E8B23C 100%)', color: 'var(--ink)', fontSize: 10, fontWeight: 900, letterSpacing: 0.6, boxShadow: '0 4px 12px rgba(242,108,26,0.4)' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--ink)', color: '#E8B23C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>★</span>
                {title.toUpperCase()}
              </div>
            </div>
          </div>

          {/* XP bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'rgba(247,241,230,0.7)', marginBottom: 5, letterSpacing: 0.5 }}>
              <span>NIV. {level} · {title.toUpperCase()}</span>
              <span>{xp.toLocaleString()} / {xpNext.toLocaleString()} XP</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${xpPct}%`, height: '100%', background: 'linear-gradient(90deg,var(--orange),#E8B23C)', borderRadius: 999, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)', backgroundSize: '40px 100%', animation: 'shimmer 2s linear infinite' }} />
              </div>
            </div>
          </div>

          {/* Stats 4 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 14 }}>
            {[
              { v: checkinCount.toString(), l: 'Trajets', c: 'var(--orange)' },
              { v: badges.length.toString(), l: 'Badges', c: '#0EA85B' },
              { v: '17%', l: 'Babi', c: '#1E5BFF' },
              { v: totalPoints.toLocaleString(), l: 'Points', c: '#E8B23C' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '8px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.c }} />
                <div className="font-display" style={{ fontSize: 17, color: '#fff', lineHeight: 1.1 }}>{s.v}</div>
                <div style={{ fontSize: 8.5, color: 'rgba(247,241,230,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, fontWeight: 700 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WaxStrip color="var(--orange)" height={5} />

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '12px 16px 0', gap: 6, background: 'var(--cream)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--line)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="press" style={{ flex: 1, padding: '9px 10px', borderRadius: 12, border: tab === t.id ? 'none' : '1px solid var(--line)', background: tab === t.id ? 'var(--ink)' : 'transparent', color: tab === t.id ? 'var(--cream)' : 'var(--ink)', fontSize: 12, fontWeight: 800, letterSpacing: 0.3, cursor: 'pointer', marginBottom: 12 }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 100px' }}>
        {tab === 'passeport' && (
          <TabPasseport badges={badges} checkinsDetail={checkinsDetail} totalPoints={totalPoints} checkinCount={checkinCount}>
            {children}
          </TabPasseport>
        )}
        {tab === 'territoire' && (
          <TabTerritoire 
            commune={commune} 
            checkinsDetail={checkinsDetail}
            heatmapNode={
              <Map 
                center={[5.35, -4.02]} 
                zoom={11} 
                hotspots={checkinsDetail.filter(c => c.lat && c.lon).map(c => ({ id: c.id, lat: c.lat!, lon: c.lon!, intensity: 10 }))}
                className="w-full h-full"
              />
            } 
          />
        )}
        {tab === 'tableau' && (
          <TabClassement displayName={displayName} totalPoints={totalPoints} />
        )}

        {/* Paramètres toujours visibles en bas */}
        <div style={{ marginTop: 32 }}>
          <div style={{ height: 1, background: 'var(--line)', marginBottom: 24 }} />
          <h3 className="font-display" style={{ fontSize: 20, marginBottom: 16 }}>Paramètres du compte</h3>
          {children}
        </div>
      </div>
    </div>
  );
}
