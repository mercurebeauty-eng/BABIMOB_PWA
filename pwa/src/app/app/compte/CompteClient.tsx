'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import dynamic from 'next/dynamic';
import { getLevel } from '@/lib/levels';

const Map = dynamic(() => import('@/components/Map'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--muted)' }}>Chargement de la carte...</div> });

type Badge = { badge_key: string; awarded_at: string };
type Props = {
  displayName: string;
  avatarEmoji: string;
  totalPoints: number;
  checkinCount: number;
  badges: Badge[];
  checkinsDetail: any[];
  commune: string;
  topExplorers: { id: string; display_name: string; avatar_emoji: string; total_points: number }[];
  dailyMissions: { id: string; label: string; task: string; current: number; target: number; xp: number }[];
  children?: React.ReactNode;
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

const ABIDJAN_COMMUNES = [
  'Abobo', 'Adjamé', 'Anyama', 'Attécoubé', 'Bingerville', 
  'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 
  'Songon', 'Treichville', 'Yopougon'
];


function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  if (mins < 1440) return `il y a ${Math.floor(mins / 60)}h`;
  return `il y a ${Math.floor(mins / 1440)}j`;
}

// ── Tab : Passeport ──────────────────────────────────────────
function TabPasseport({ badges, checkinsDetail, totalPoints, checkinCount, dailyMissions, setShowAlbum }: {
  badges: Badge[]; checkinsDetail: any[]; totalPoints: number; checkinCount: number; dailyMissions: any[]; setShowAlbum: (s: boolean) => void;
}) {

  return (
    <>
      {/* ──── STREAK · type Duolingo / LINE ──── */}
      <div style={{
        borderRadius: 20, overflow: 'hidden', marginBottom: 14, position: 'relative',
        background: 'linear-gradient(135deg, #FF6B35 0%, #F26C1A 50%, #D9510A 100%)',
        color: '#fff', padding: 16, boxShadow: '0 8px 24px rgba(242,108,26,0.3)'
      }}>
        <div className="wax-stripe" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.12 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.3)',
          }}>
            <span className="font-display" style={{ fontSize: 28, color: '#E8B23C' }}>{checkinCount}</span>
            <div style={{ position: 'absolute', top: -8, right: -8, fontSize: 24 }}>
              <Ic.Flame s={28} />
            </div>
          </div>
          <div style={{ flex: 1, padding: '16px 14px', borderRadius: 20, background: 'var(--ink)', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>Missions du jour</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', background: 'rgba(242,108,26,0.15)', padding: '2px 6px', borderRadius: 6 }}>{dailyMissions.filter(m => m.current >= m.target).length}/{dailyMissions.length}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dailyMissions.map((m) => {
                const done = m.current >= m.target;
                return (
                  <div key={m.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ opacity: done ? 0.5 : 1 }}>{m.task}</span>
                      <span style={{ color: done ? '#0EA85B' : 'var(--orange)' }}>{done ? 'V' : `+${m.xp} XP`}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (m.current / m.target) * 100)}%`, background: done ? '#0EA85B' : 'var(--orange)', borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Album de badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>Album de badges</h3>
        <button onClick={() => setShowAlbum(true)} style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, fontWeight: 800, color: 'var(--orange)', cursor: 'pointer' }}>VOIR TOUT →</button>
      </div>
      <div style={{ gridTemplateColumns: 'repeat(4, 1fr)', display: 'grid', gap: 10, marginBottom: 24 }}>
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

      {/* Activité récente */}
      <h3 className="font-display" style={{ fontSize: 18, margin: '0 0 10px' }}>Activité récente</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {checkinsDetail.slice(0, 5).map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 11, borderRadius: 12, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in oklab, ${ACTIVITY_ICONS[i % ACTIVITY_ICONS.length]} 15%, transparent)`, color: ACTIVITY_ICONS[i % ACTIVITY_ICONS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {c.places?.logo_emoji || '📍'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{c.place_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{c.commune || 'Abidjan'} · {timeAgo(c.created_at)}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--orange)' }}>+{c.points_earned || 10}</div>
          </div>
        ))}
      </div>
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
  checkinsDetail: any[];
}) {
  const totalVisits = checkinsDetail.length;
  const communeCounts: Record<string, number> = {};
  checkinsDetail.forEach(c => {
    const com = c.commune || 'Abidjan';
    if (com === 'Abidjan') return;
    communeCounts[com] = (communeCounts[com] || 0) + 1;
  });

  const uniqueCommunesVisited = Object.keys(communeCounts).length;
  const explorationPct = Math.round((uniqueCommunesVisited / ABIDJAN_COMMUNES.length) * 100);

  const COMMUNES = Object.entries(communeCounts)
    .map(([n, count]) => ({
      n,
      count,
      pct: Math.round((count / (totalVisits || 1)) * 100),
      c: n === commune ? 'var(--orange)' : n === 'Plateau' ? '#1E5BFF' : n === 'Marcory' ? '#E5337A' : '#0EA85B',
      mayor: n === commune && count > 5
    }))
    .sort((a, b) => b.count - a.count);

  const displayCommunes = COMMUNES.length > 0 ? COMMUNES : (commune && commune !== 'Abidjan' ? [
    { n: commune, count: 0, pct: 0, c: 'var(--orange)', mayor: false }
  ] : []);

  return (
    <>
      <div style={{ borderRadius: 24, overflow: 'hidden', background: 'var(--cream-2)', border: '1px solid var(--line)', marginBottom: 18, boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1 }}>TON EMPREINTE</div>
            <h3 className="font-display" style={{ fontSize: 24, margin: '2px 0 0' }}>{explorationPct}% d'Abidjan</h3>
          </div>
          <Pill color="#0EA85B">{uniqueCommunesVisited}/13 COMMUNES</Pill>
        </div>
        <div style={{ height: 220, background: 'var(--cream)', position: 'relative' }}>
          {heatmapNode}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>Conquête du territoire</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)' }}>{uniqueCommunesVisited} EXPLORÉES</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)' }}>{totalVisits} VISITES TOTAL</span>
        </div>
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
function TabClassement({ 
  displayName, 
  topExplorers 
}: { 
  displayName: string; 
  topExplorers: { id: string; display_name: string; avatar_emoji: string; total_points: number }[]
}) {
  const podiumData = [
    topExplorers[1] || null, 
    topExplorers[0] || null, 
    topExplorers[2] || null, 
  ];

  const PODIUM_CONFIG = [
    { rank: 2, c: '#1E5BFF', h: 80 },
    { rank: 1, c: '#E8B23C', h: 100 },
    { rank: 3, c: '#0EA85B', h: 64 },
  ];

  const LIST = topExplorers.slice(3).map((p, i) => ({
    rank: i + 4,
    name: p.display_name,
    me: p.display_name === displayName,
    xp: p.total_points.toLocaleString(),
    c: ACTIVITY_ICONS[i % ACTIVITY_ICONS.length]
  }));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 20, padding: '10px 0' }}>
        {PODIUM_CONFIG.map((conf, i) => {
          const user = podiumData[i];
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center', opacity: user ? 1 : 0.4 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: conf.c, color: '#fff', fontSize: 16, fontWeight: 900, fontFamily: 'Archivo Black, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', border: conf.rank === 1 ? '3px solid #E8B23C' : 'none', position: 'relative' }}>
                {user ? (user.avatar_emoji || user.display_name[0]) : '?'}
                {conf.rank === 1 && <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>👑</div>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user ? user.display_name : '---'}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>{user ? `${user.total_points.toLocaleString()} XP` : '0 XP'}</div>
              <div style={{
                height: conf.h, borderRadius: '12px 12px 0 0', marginTop: 6,
                background: `linear-gradient(180deg, ${conf.c} 0%, color-mix(in oklab, ${conf.c} 70%, black) 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'Archivo Black, sans-serif', fontSize: 24,
              }}>{conf.rank}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {LIST.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 12,
            background: p.me ? 'color-mix(in oklab, var(--orange) 12%, var(--cream-2))' : 'var(--cream-2)',
            border: p.me ? '1.5px solid var(--orange)' : '1px solid var(--line)',
          }}>
            <div className="font-display" style={{ width: 22, fontSize: 14, color: p.me ? 'var(--orange)' : 'var(--muted)', textAlign: 'center' }}>{p.rank}</div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.c, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{p.name}{p.me && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--orange)', marginLeft: 6, padding: '1px 5px', background: '#fff', borderRadius: 4, letterSpacing: 0.5 }}>TOI</span>}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.xp} XP</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: 'var(--cream-2)', border: '1px dashed var(--line)', textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
        Saison <b style={{ color: 'var(--ink)' }}>Harmattan</b> · se termine dans <b style={{ color: 'var(--orange)' }}>12 jours</b>
      </div>
    </>
  );
}

export default function CompteClient({ 
  displayName, avatarEmoji, totalPoints, checkinCount, badges, checkinsDetail, commune, topExplorers, dailyMissions, children 
}: Props) {
  const [tab, setTab] = useState<'passeport' | 'territoire' | 'tableau'>('passeport');
  const [points, setPoints] = useState(totalPoints);
  const [showAlbum, setShowAlbum] = useState(false);

  // Dynamic calculation of conquest
  const communeCounts: Record<string, number> = {};
  checkinsDetail.forEach(c => {
    const com = c.commune || 'Abidjan';
    if (com !== 'Abidjan') communeCounts[com] = (communeCounts[com] || 0) + 1;
  });
  const uniqueCommunesVisited = Object.keys(communeCounts).length;
  const explorationPct = Math.round((uniqueCommunesVisited / ABIDJAN_COMMUNES.length) * 100);

  const levelInfo = getLevel(points);
  const { level, title, xp, xpForNext: xpNext, progress } = levelInfo;
  const xpPct = Math.round(progress * 100);

  // Daily Bonus XP Logic
  useEffect(() => {
    const claimBonus = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.rpc('claim_daily_bonus');
      if (data?.success) {
        setPoints(p => p + 50);
        // On pourrait ajouter une petite notif ici
      }
    };
    claimBonus();
  }, []);

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
              { v: `${explorationPct}%`, l: 'Babi', c: '#1E5BFF' },
              { v: points.toLocaleString(), l: 'Points', c: '#E8B23C' },
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
          <TabPasseport badges={badges} checkinsDetail={checkinsDetail} totalPoints={points} checkinCount={checkinCount} dailyMissions={dailyMissions} setShowAlbum={setShowAlbum} />
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
          <TabClassement displayName={displayName} topExplorers={topExplorers} />
        )}

        {/* Paramètres toujours visibles en bas */}
        <div style={{ marginTop: 40, padding: '0 4px' }}>
          <div style={{ height: 1.5, background: 'var(--line)', marginBottom: 28, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -1, left: 0, width: 40, height: 3, background: 'var(--orange)' }} />
          </div>
          <h3 className="font-display" style={{ fontSize: 20, marginBottom: 20, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Ic.Settings s={20} /> Paramètres du compte
          </h3>
          <div style={{ background: 'var(--cream-2)', padding: 20, borderRadius: 24, border: '1.5px solid var(--line)' }}>
            {children}
          </div>
        </div>
      </div>
      {/* Modal Album */}
      <AnimatePresence>
        {showAlbum && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', flexDirection: 'column', padding: 'env(safe-area-inset-top, 20px) 20px 40px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
              <div className="font-display" style={{ fontSize: 24, color: '#fff' }}>Album de Badges</div>
              <button onClick={() => setShowAlbum(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {Object.entries(BADGE_META).map(([key, meta]) => {
                  const unlocked = badges.some(b => b.badge_key === key);
                  return (
                    <div key={key} style={{ 
                      padding: 20, borderRadius: 20, background: unlocked ? 'var(--cream)' : 'rgba(255,255,255,0.05)', 
                      border: unlocked ? '2px solid var(--orange)' : '1px solid rgba(255,255,255,0.1)',
                      textAlign: 'center', opacity: unlocked ? 1 : 0.6,
                      position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>
                        {unlocked ? BADGE_ICONS[key as keyof typeof BADGE_ICONS] : '🔒'}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: unlocked ? 'var(--ink)' : '#fff', textTransform: 'uppercase', marginBottom: 4 }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: meta.rare === 'SSR' ? 'gold' : meta.rare === 'SR' ? '#E5337A' : '#1E5BFF', color: '#fff', display: 'inline-block' }}>
                        {meta.rare}
                      </div>
                      {!unlocked && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Vérifie les défis pour débloquer</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              Total débloqués : <b style={{ color: 'var(--orange)' }}>{badges.length} / {Object.keys(BADGE_META).length}</b>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
