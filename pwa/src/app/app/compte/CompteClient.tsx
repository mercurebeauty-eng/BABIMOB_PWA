'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import dynamic from 'next/dynamic';
import { getLevel } from '@/lib/levels';

const Map = dynamic(() => import('@/components/Map'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--muted)' }}>Chargement de la carte...</div> });

import { useXP } from '@/components/providers/XPProvider';
import { createClient } from '@/lib/supabase/client';
import { BottomNav } from '@/components/ui/BottomNav';
import SidebarMenu from '@/components/SidebarMenu';

type Badge = { badge_key: string; awarded_at: string };
type FollowProfile = { id: string; display_name: string; avatar_emoji: string; total_points: number };
type Props = {
  displayName: string;
  avatarEmoji: string;
  totalPoints: number;
  checkinCount: number;
  badges: Badge[];
  checkinsDetail: any[];
  commune: string;
  streakCount: number;
  lastBonusAt: string | null;
  topExplorers: { id: string; display_name: string; avatar_emoji: string; total_points: number }[];
  dailyMissions: { id: string; label: string; task: string; current: number; target: number; xp: number }[];
  following?: FollowProfile[];
  followersCount?: number;
  crew?: any;
  collectiveQuest?: any;
  favorites: any[];
  recentPosts: any[];
  recentTarifs: any[];
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
  streak_7:      { label: 'Fidèle', color: 'var(--orange)', rare: 'C' },
  commune_all:   { label: 'Maître Babi', color: '#1E5BFF', rare: 'SSR' },
  posts_10:      { label: 'Informateur', color: '#0EA85B', rare: 'R' },
  top_1:         { label: 'Légende', color: '#E8B23C', rare: 'SSR' },
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
  streak_7:      <Ic.Flame s={22} />,
  commune_all:   <Ic.Map s={22} />,
  posts_10:      <Ic.Chat s={22} />,
  top_1:         <Ic.Star s={22} fill />,
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


// ── Crew / Proches & Famille — Babi network ──────────────────
function CrewCard({ following, followersCount }: { following: FollowProfile[]; followersCount: number }) {
  const empty = following.length === 0;
  return (
    <div
      style={{
        borderRadius: 20, overflow: 'hidden', marginBottom: 18, position: 'relative',
        background: 'var(--ink)', color: 'var(--cream)', padding: 16,
        boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
      }}
    >
      <div className="wax-zigzag" style={{ position: 'absolute', inset: 0, color: 'var(--green)', opacity: 0.10 }} />
      <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,178,60,0.25), transparent 70%)' }} />

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', letterSpacing: 0.6 }}>PROCHES &amp; FAMILLE</div>
            <div className="font-display" style={{ fontSize: 22, color: '#fff', marginTop: 2, lineHeight: 1.05 }}>
              {empty ? 'Lance ton crew' : `${following.length} dans ton crew`}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(247,241,230,0.6)', marginTop: 2 }}>
              {empty
                ? 'Suis tes proches pour voir leurs explorations en direct.'
                : `${followersCount} Babi${followersCount > 1 ? 's' : ''} te suivent en retour`}
            </div>
          </div>
          <Link
            href="/app/compte/favoris"
            className="press"
            style={{
              flexShrink: 0,
              padding: '8px 14px', borderRadius: 999,
              border: '1.5px solid var(--gold)', background: 'transparent',
              color: 'var(--gold)', fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
              textDecoration: 'none',
            }}
          >
            {empty ? 'Inviter' : 'Gérer'}
          </Link>
        </div>

        {!empty && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <div style={{ display: 'flex' }}>
              {following.slice(0, 6).map((f, i) => (
                <Link
                  key={f.id}
                  href={`/app/chat/${f.id}`}
                  title={f.display_name}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: PALETTE[i % PALETTE.length], color: '#fff',
                    border: '2.5px solid var(--ink)',
                    marginLeft: i === 0 ? 0 : -10,
                    fontSize: 16, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                >
                  {f.avatar_emoji || f.display_name?.[0] || '?'}
                </Link>
              ))}
              {following.length > 6 && (
                <div
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)', border: '2.5px solid var(--ink)',
                    marginLeft: -10, fontSize: 11, fontWeight: 800,
                    color: 'rgba(255,255,255,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >+{following.length - 6}</div>
              )}
            </div>
            <div style={{ flex: 1, fontSize: 11, color: 'rgba(247,241,230,0.7)' }}>
              <b style={{ color: 'var(--gold)' }}>{Math.min(following.length, 5)} Babis</b> sont actifs cette semaine
            </div>
          </div>
        )}

        {empty && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: 'rgba(232,178,60,0.10)', border: '1px dashed rgba(232,178,60,0.35)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 26 }}>👥</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(247,241,230,0.8)', lineHeight: 1.45 }}>
              Ajoute ton premier proche : tu verras ses check-ins, stories et tarifs en priorité.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const PALETTE = ['#F26C1A', '#0EA85B', '#1E5BFF', '#E8B23C', '#E5337A', '#C4582E'];

// ── Tab : Passeport ──────────────────────────────────────────
function TabPasseport({ badges, checkinsDetail, totalPoints, checkinCount, streak, showWeekly, setShowWeekly, dailyMissions, setShowAlbum, following, followersCount, crew, collectiveQuest, favorites }: {
  badges: Badge[]; checkinsDetail: any[]; totalPoints: number; checkinCount: number; streak: number; showWeekly: boolean; setShowWeekly: (v: boolean) => void; dailyMissions: any[]; setShowAlbum: (s: boolean) => void;
  following: FollowProfile[]; followersCount: number; crew: any; collectiveQuest: any; favorites: any[];
}) {
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const todayIndex = (new Date().getDay() + 6) % 7; // 0=Mon, 6=Sun

  return (
    <>
      {/* ──── STREAK CARD (Screenshot 2 style) ──── */}
      <div style={{
        borderRadius: 24, overflow: 'hidden', marginBottom: 20, position: 'relative',
        background: 'linear-gradient(135deg, #FF6B35 0%, #F26C1A 100%)',
        color: '#fff', padding: 20, boxShadow: '0 10px 30px rgba(242,108,26,0.25)'
      }}>
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
        
        <div style={{ position: 'relative', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Big Number Square */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            border: '1.5px solid rgba(255,255,255,0.2)',
          }}>
            <span className="font-display" style={{ fontSize: 36, color: '#fff', lineHeight: 1 }}>{streak}</span>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
              <Ic.Flame s={28} />
            </div>
          </div>

          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.8)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
              <Ic.Bolt s={12} fill /> SÉRIE EN COURS
            </div>
            <div className="font-display" style={{ fontSize: 22, lineHeight: 1.1, marginBottom: 4 }}>{streak} jours sur Babi</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Reviens demain pour <span style={{ color: '#fff' }}>+50 XP bonus</span></div>
          </div>
        </div>

        {/* Weekly Progress Row */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginTop: 20, padding: '0 4px' }}>
          {weekDays.map((day, i) => {
            const active = i <= todayIndex && (todayIndex - i) < streak;
            return (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 900, marginBottom: 6, color: 'rgba(255,255,255,0.7)' }}>{day}</div>
                <div style={{ 
                  height: 32, margin: '0 4px', borderRadius: 8, 
                  background: active ? '#fff' : 'rgba(0,0,0,0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: active ? '#F26C1A' : 'rgba(255,255,255,0.2)',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.1)'
                }}>
                  {active ? <Ic.Check s={16} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──── MISSIONS (Screenshot 2 style) ──── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="font-display" style={{ fontSize: 19, margin: 0 }}>Missions du jour</h3>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
          {dailyMissions.filter((m: any) => m.current >= m.target).length}/{dailyMissions.length} • 23H 12 RESTANTES
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {dailyMissions.map((m: any) => {
          const done = m.current >= m.target;
          return (
            <div key={m.id} style={{ 
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', 
              borderRadius: 20, background: 'var(--cream-2)', border: '1px solid var(--line)',
              opacity: done ? 0.7 : 1, position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: done ? 'var(--line)' : 'color-mix(in oklab, var(--orange) 10%, var(--cream))', color: done ? 'var(--muted)' : 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.id === 'm1' ? <Ic.Pin s={20} fill={!done} /> : m.id === 'm2' ? <Ic.Chat s={20} /> : <Ic.Bolt s={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }}>{m.task}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{m.label}</div>
                <div style={{ height: 3, background: 'var(--line)', borderRadius: 2, marginTop: 8, width: '100%' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (m.current / m.target) * 100)}%`, background: done ? '#0EA85B' : 'var(--orange)', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ marginLeft: 10 }}>
                {done ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0EA85B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ic.Check s={16} />
                  </div>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--orange)' }}>+{m.xp}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div onClick={() => setShowAlbum(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, cursor: 'pointer' }}>
        <h3 className="font-display" style={{ fontSize: 24, margin: 0 }}>
          Album de badges
        </h3>
        <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--orange)' }}>
          {badges.length} / {Object.keys(BADGE_META).length} →
        </div>
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

      {/* Favoris */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="font-display" style={{ fontSize: 24, margin: 0 }}>Favoris</h3>
        <Link href="/app/compte/favoris" style={{ fontSize: 13, fontWeight: 900, color: 'var(--orange)', textDecoration: 'none' }}>
          Gérer →
        </Link>
      </div>

      <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
        {favorites.length === 0 ? (
          <div style={{ padding: '24px 16px', borderRadius: 20, background: 'var(--cream-2)', border: '1px dashed var(--line)', flex: 1, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Enregistre tes lieux et lignes habituels pour les retrouver ici.
          </div>
        ) : (
          favorites.map((fav) => (
            <div key={fav.id} className="press" style={{ flexShrink: 0, width: 140, padding: 16, borderRadius: 20, background: 'var(--cream-2)', border: '1px solid var(--line)', position: 'relative' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {fav.kind === 'place' ? '📍' : fav.kind === 'stop' ? '🚏' : '🚌'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fav.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                {fav.kind === 'place' ? 'Lieu' : fav.kind === 'stop' ? 'Arrêt' : 'Ligne'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Proches & Famille (Optionnel si on veut garder la fonctionnalité réelle) */}
      {/* <CrewCard following={following} followersCount={followersCount} /> */}

      <ActivityLog checkinsDetail={checkinsDetail} crew={crew} collectiveQuest={collectiveQuest} />
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
  displayName, avatarEmoji, totalPoints, checkinCount, badges, checkinsDetail, recentPosts, recentTarifs, commune, streakCount: initialStreak, lastBonusAt, topExplorers, dailyMissions, following = [], followersCount = 0, crew, collectiveQuest, favorites, children
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileForMenu = { display_name: displayName, avatar_emoji: avatarEmoji, total_points: totalPoints };
  const [tab, setTab] = useState<'passeport' | 'territoire' | 'tableau'>('passeport');
  const [points, setPoints] = useState(totalPoints);
  const [streak, setStreak] = useState(initialStreak);
  const [showWeekly, setShowWeekly] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [activities, setActivities] = useState<any[]>(() => {
    const combined = [
      ...checkinsDetail.map(c => ({ ...c, type: 'checkin' })),
      ...recentPosts.map(p => ({ ...p, type: 'post' })),
      ...recentTarifs.map(t => ({ ...t, type: 'tarif' }))
    ];
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
  const { addXP } = useXP();
  const supabase = createClient();

  // Dynamic calculation of conquest
  const communeCounts: Record<string, number> = {};
  checkinsDetail.forEach(c => {
    const com = c.commune || 'Abidjan';
    if (com !== 'Abidjan') communeCounts[com] = (communeCounts[com] || 0) + 1;
  });
  const uniqueCommunesVisited = Object.keys(communeCounts).length;
  const explorationPct = Math.round((uniqueCommunesVisited / ABIDJAN_COMMUNES.length) * 100);

  const levelInfo = getLevel(points);
  const { level, title, nextTitle, xp, xpForNext: xpNext, progress } = levelInfo;
  const xpPct = Math.round(progress * 100);

  // Daily Bonus XP Logic
  useEffect(() => {
    const claimBonus = async () => {
      const { data } = await supabase.rpc('claim_daily_bonus');
      if (data?.success) {
        setPoints(p => p + 50);
        addXP(50); // Feedback visuel !
        if (data.streak_count) setStreak(data.streak_count);
      }
    };
    claimBonus();

    // Live Activity Listener
    const channel = supabase
      .channel('profile-activities')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'checkins'
      }, (payload) => {
        setActivities(prev => [{ ...payload.new, type: 'checkin' }, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setPoints(p => p + (payload.new.points_earned || 10));
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'gbairai_posts'
      }, (payload) => {
        setActivities(prev => [{ ...payload.new, type: 'post' }, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setPoints(p => p + 30);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'tarif_confirmations'
      }, (payload) => {
        setActivities(prev => [{ ...payload.new, type: 'tarif' }, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setPoints(p => p + 25);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900, color: 'rgba(247,241,230,0.9)', marginBottom: 6, letterSpacing: 0.5 }}>
              <span>NIV. {level} · {title.toUpperCase()}</span>
              <span>{xp.toLocaleString()} / {xpNext.toLocaleString()} XP</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}>
              <div
                className="xp-glow"
                style={{
                  width: `${xpPct}%`, height: '100%',
                  background: 'linear-gradient(90deg, #F26C1A 0%, #FF8E3C 35%, #E8B23C 70%, #FFE08A 100%)',
                  borderRadius: 999,
                  position: 'relative', overflow: 'hidden',
                  transition: 'width 0.6s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              >
                {/* Vague lumineuse qui se déplace */}
                <div className="xp-shine" />
                {/* Reflet supérieur */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.45), transparent)', borderRadius: 999 }} />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'rgba(247,241,230,0.5)', fontWeight: 600 }}>
              Plus que <b style={{ color: '#E8B23C' }}>{(xpNext - xp).toLocaleString()} XP</b> pour devenir <b style={{ color: '#fff' }}>{nextTitle}</b> (Niv.{level + 1})
            </div>
          </div>

          {/* Stats 4 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 14 }}>
            {[
              { v: streak.toString(), l: 'Série', c: 'var(--orange)' },
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
          <TabPasseport
            badges={badges}
            checkinsDetail={activities}
            totalPoints={points}
            checkinCount={checkinCount}
            streak={streak}
            showWeekly={showWeekly}
            setShowWeekly={setShowWeekly}
            dailyMissions={dailyMissions}
            setShowAlbum={setShowAlbum}
            following={following}
            followersCount={followersCount}
            crew={crew}
            collectiveQuest={collectiveQuest}
            favorites={favorites}
          />
        )}
        {tab === 'territoire' && (
          <TabTerritoire 
            commune={commune} 
            checkinsDetail={activities}
            heatmapNode={
              <Map 
                center={[5.35, -4.02]} 
                zoom={11} 
                hotspots={activities.filter(c => c.lat && c.lon).map(c => ({ id: c.id, lat: c.lat!, lon: c.lon!, intensity: 10 }))}
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

      <SidebarMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        profile={profileForMenu} 
      />
      <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
    </div>
  );
}
// ── Component : ActivityLog (Screenshot 1 style) ──────────────────────────
function ActivityLog({ checkinsDetail, crew: realCrew, collectiveQuest: realQuest }: { checkinsDetail: any[]; crew: any; collectiveQuest: any }) {
  const crew = realCrew || null;
  const quest = realQuest || {
    title: 'Quête : Explorateur de Babi',
    target_count: 1000,
    current: 450, // Mock current if no real progression table exists yet
    ends_at: new Date(Date.now() + 5 * 86400000).toISOString()
  };

  const daysLeft = quest.ends_at ? Math.max(0, Math.ceil((new Date(quest.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const activities = checkinsDetail.slice(0, 15).map((c, i) => {
    if (c.type === 'checkin') {
      return {
        id: c.id || i,
        type: 'Check-in',
        title: 'Check-in',
        subtitle: `${c.commune || 'Abidjan'} · ${c.place_name || 'Lieu inconnu'} · ${timeAgo(c.created_at)}`,
        points: c.points_earned || 15,
        icon: <Ic.Pin s={18} fill />
      };
    } else if (c.type === 'post') {
      return {
        id: c.id || i,
        type: 'Gbairai',
        title: 'Post Gbairai',
        subtitle: `${c.commune || 'Abidjan'} · ${c.content?.slice(0, 30)}... · ${timeAgo(c.created_at)}`,
        points: 30,
        icon: <Ic.Chat s={18} />
      };
    } else {
      return {
        id: c.id || i,
        type: 'Tarif',
        title: 'Tarif confirmé',
        subtitle: `${c.stop_name_depart} → ${c.stop_name_arrivee} · ${c.prix}F · ${timeAgo(c.created_at)}`,
        points: 25,
        icon: <Ic.Bolt s={18} />
      };
    }
  });

  return (
    <div style={{ marginTop: 20 }}>
      {/* ──── CREW CARD (Functional) ──── */}
      <div style={{
        borderRadius: 24, padding: 20, marginBottom: 24, position: 'relative', overflow: 'hidden',
        background: crew ? `linear-gradient(135deg, ${crew.color_from || '#1A1410'} 0%, ${crew.color_to || '#2A1F18'} 100%)` : 'linear-gradient(135deg, #1A1410 0%, #2A1F18 100%)', 
        color: '#fff'
      }}>
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.1, color: '#fff' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1 }}>TON CREW</div>
              <div className="font-display" style={{ fontSize: 24, marginBottom: 2 }}>{crew ? crew.name : 'Pas de Crew'}</div>
              <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>
                {crew ? `${crew.membersCount} membres · ${crew.commune || 'Abidjan'}` : 'Rejoins une famille pour progresser plus vite !'}
              </div>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: crew ? 'linear-gradient(135deg, #0EA85B 0%, #0B8A4A 100%)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <span className="font-display" style={{ fontSize: 24 }}>{crew ? (crew.emoji || '🏙️') : '👤'}</span>
            </div>
          </div>

          {crew && (
            <div style={{ display: 'flex', alignItems: 'center', gap: -8, marginTop: 12 }}>
              {['M','A','D','K','I'].map((initial, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: PALETTE[i % PALETTE.length], border: '2px solid #1A1410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, marginLeft: i === 0 ? 0 : -8 }}>{initial}</div>
              ))}
              {crew.membersCount > 5 && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#333', border: '2px solid #1A1410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, marginLeft: -8, color: 'rgba(255,255,255,0.6)' }}>+{crew.membersCount - 5}</div>
              )}
              <div style={{ marginLeft: 10, fontSize: 11, fontWeight: 700 }}><span style={{ color: 'var(--orange)' }}>2 actifs</span> en ce moment</div>
              <Link href="/app/crews" style={{ marginLeft: 'auto', border: '1px solid var(--orange)', color: 'var(--orange)', borderRadius: 12, padding: '4px 12px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>Gérer</Link>
            </div>
          )}

          {!crew && (
            <div style={{ marginTop: 16 }}>
              <Link href="/app/crews" style={{ display: 'inline-block', background: 'var(--orange)', color: '#fff', borderRadius: 12, padding: '8px 16px', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>Trouver un Crew</Link>
            </div>
          )}

          <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 8 }}>
              <span>QUÊTE COLLECTIVE · {daysLeft}j RESTANTS</span>
              <span style={{ color: '#fff' }}>{quest.current || 0} / {quest.target_count}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>{quest.title}</div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${Math.min(100, ((quest.current || 0) / quest.target_count) * 100)}%`, background: 'var(--orange)', borderRadius: 3, boxShadow: '0 0 10px rgba(242,108,26,0.5)' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="font-display" style={{ fontSize: 24, margin: 0 }}>Activité récente</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', background: 'var(--cream-2)', borderRadius: 24, border: '1px dashed var(--line)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🌵</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Pas encore d'activité</div>
            <div style={{ fontSize: 12 }}>Explore Abidjan pour gagner tes premiers points !</div>
          </div>
        )}
        {activities.map((a) => (
          <div key={a.id} style={{ 
            padding: '16px', borderRadius: 20, background: 'var(--cream-2)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 16, 
              background: a.type === 'Check-in' ? '#FFF0E6' : a.type === 'Tarif' ? '#E6F9F0' : '#FFF9E6', 
              color: a.type === 'Check-in' ? '#F26C1A' : a.type === 'Tarif' ? '#0EA85B' : '#E8B23C', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              {a.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{a.subtitle}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--orange)' }}>+{a.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
