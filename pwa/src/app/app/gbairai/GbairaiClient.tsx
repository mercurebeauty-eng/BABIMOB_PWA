'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BottomNav } from '@/components/ui/BottomNav';
import type { GbairaiPost, HotSpot, CommunePulse, Story, Quest, CollectiveQuest, Crew, Event, VoiceRoom, ReportCategory } from './types';
import GbairaiFeed from './GbairaiFeed';
import PostComposer from './PostComposer';
import StoryComposer from './StoryComposer';
import StoryViewer from './StoryViewer';
import SpotsTab from './SpotsTab';
import QuetesTab from './QuetesTab';
import CrewsTab from './CrewsTab';
import EmptyState from './EmptyState';
import { pickWax } from '@/lib/waxPattern';
import { Ic } from '@/components/ui/Ic';
import { getLevel } from '@/lib/levels';
import { useProfileGating } from '@/hooks/useProfileGating';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PlusBubble from '@/components/ui/PlusBubble';

type Props = {
  initialPosts: GbairaiPost[];
  myLikes: string[];
  hotSpots: HotSpot[];
  pulse: CommunePulse[];
  stories: Story[];
  trendingTags: { tag: string; count: number }[];
  profile: any | null;
  userId: string | null;
  reactionsByStory?: Record<string, Record<string, number>>;
  myReactions?: Record<string, string[]>;
  events: Event[];
  voiceRooms: VoiceRoom[];
  quests: Quest[];
  collectiveQuest: CollectiveQuest | null;
  crews: Crew[];
};

const TABS = [
  { id: 'vibe', l: 'Pour toi' },
  { id: 'spots', l: 'Spots du moment' },
  { id: 'quetes', l: 'Quêtes' },
  { id: 'crews', l: 'Crews' },
] as const;

const STATUS_COLORS: Record<string, string> = { vert: '#9DEFC4', orange: 'var(--gold)', rouge: '#FF3B30' };
const AVATAR_COLORS = ['#FF6B00', '#0EA85B', '#1E5BFF', '#E8B23C', '#E5337A', '#C4582E'];
const TAG_COLORS = ['#FF6B00', '#1E5BFF', '#0EA85B', '#E5337A', '#F26C1A'];

// ── Components ──

// Catégories de C'comment (hors tarif, qui n'est pas un signal de pouls)
const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  trafic:   { emoji: '🚦', label: 'Trafic' },
  incident: { emoji: '⚠️', label: 'Incident' },
  travaux:  { emoji: '🚧', label: 'Travaux' },
  ambiance: { emoji: '✨', label: 'Ambiance' },
};

function pulseHeadline(pulse: CommunePulse[]): string {
  const rouge = pulse.find(p => p.status === 'rouge');
  if (rouge && rouge.top_category) {
    const meta = CATEGORY_META[rouge.top_category];
    if (rouge.top_category === 'trafic')   return `${rouge.commune} bouchonne.`;
    if (rouge.top_category === 'incident') return `Incident à ${rouge.commune}.`;
    if (rouge.top_category === 'travaux')  return `Travaux à ${rouge.commune}.`;
    if (rouge.top_category === 'ambiance') return `${rouge.commune} chauffe.`;
    return `${rouge.commune} ${meta?.label.toLowerCase() ?? 'bouge'}.`;
  }
  if (rouge) return `${rouge.commune} bouchonne.`;
  const orange = pulse.find(p => p.status === 'orange');
  if (orange) return 'Abidjan s’éveille.';
  return 'Abidjan respire.';
}

function VoiceRoomSection({ rooms }: { rooms: VoiceRoom[] }) {
  const [notice, setNotice] = useState<string | null>(null);
  
  if (rooms.length === 0) {
    return (
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <EmptyState 
          emoji="🎙️"
          title="Pas de salon vocal actif" 
          description="C'est calme ici. Pourquoi ne pas lancer ton propre Gbairai ?" 
          action={{ label: "Lancer un salon", onClick: () => window.location.href = '/app/voice/create' }}
        />
      </div>
    );
  }
  return (
    <div style={{ padding: '0 16px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rooms.map(room => {
        const wax = pickWax(`vroom-${room.id}`, { rotate: true });
        const visibleAvatars = Math.min(4, Math.max(1, room.participants_count));
        const overflow = Math.max(0, room.participants_count - visibleAvatars);
        return (
          <div key={room.id} className="press" style={{
            borderRadius: 24, padding: 20, background: 'linear-gradient(135deg, #E5337A 0%, #C12763 100%)',
            color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(229,51,122,0.3)'
          }}>
            <div className={wax} style={{ position: 'absolute', inset: 0, opacity: 0.12 }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, marginBottom: 8 }}>
                <Ic.Mic s={14} fill /> {room.emoji ? `${room.emoji} ` : ''}SALON VOCAL · LIVE
              </div>
              <h3 className="font-display" style={{ fontSize: 24, margin: '0 0 16px', lineHeight: 1.1 }}>« {room.title} »</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {Array.from({ length: visibleAvatars }).map((_, i) => {
                    const seed = hashString(`${room.id}-${i}`);
                    return (
                      <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: AVATAR_COLORS[seed % AVATAR_COLORS.length], border: '2px solid #E5337A', marginLeft: i === 0 ? 0 : -10 }} />
                    );
                  })}
                </div>
                {overflow > 0 && <span style={{ fontSize: 13, fontWeight: 800 }}>+{overflow}</span>}
                {overflow === 0 && <span style={{ fontSize: 13, fontWeight: 800 }}>{room.participants_count} dans le salon</span>}
              </div>

              <button
                onClick={() => window.location.href = `/app/voice/${room.id}`}
                style={{ width: '100%', padding: '12px', borderRadius: 14, border: 'none', background: '#fff', color: '#E5337A', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                Rejoindre le Gbairai
              </button>
              {notice && <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, opacity: 0.95 }}>{notice}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Petit hash texte → entier pour seeds
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function TrendingSection({ spots }: { spots: HotSpot[] }) {
  if (spots.length === 0) return null;
  const top = spots[0];
  const others = spots.slice(1, 4);
  const topWax = pickWax(`spot-top-${top.place_id}`, { rotate: true });

  return (
    <div style={{ padding: '0 16px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1 }}>OÙ ÇA BOUGE · MAINTENANT</div>
      </div>
      <h2 className="font-display" style={{ fontSize: 28, margin: '0 0 16px' }}>Les spots qui chauffent</h2>

      {/* Top 1 Card */}
      <Link href={`/app/place/${top.place_id}`} className="press" style={{
        textDecoration: 'none',
        display: 'flex',
        borderRadius: 24, height: 240, background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%), linear-gradient(135deg, ${top.cover_color} 0%, #1A1410 100%)`,
        position: 'relative', overflow: 'hidden', marginBottom: 16, flexDirection: 'column', justifyContent: 'flex-end', padding: 20, color: '#fff'
      }}>
        <div className={topWax} style={{ position: 'absolute', inset: 0, opacity: 0.12 }} />
        <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--orange)', color: '#fff', padding: '4px 12px', borderRadius: 8, fontSize: 18, fontWeight: 900 }}>#1</div>
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
          {top.is_new && (
            <div style={{ background: '#0EA85B', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, backdropFilter: 'blur(10px)' }}>
              ✨ NOUVEAU
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {top.checkin_count > 0
              ? `🔥 ${top.checkin_count} ${top.checkin_count > 1 ? 'BABIS Y SONT' : 'BABI Y EST'}`
              : '🔥 PREMIER À ARRIVER ?'}
          </div>
        </div>

        <h3 className="font-display" style={{ fontSize: 32, margin: 0 }}>{top.place_name}</h3>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginTop: 4 }}>
          {[top.commune, top.category].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {top.rating !== null && (
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>★ {top.rating.toFixed(1)}</div>
          )}
          {top.price_range && (
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>{top.price_range}</div>
          )}
        </div>
      </Link>

      {/* Others List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {others.map((s, i) => {
          const wax = pickWax(`spot-${s.place_id}`, { rotate: true });
          return (
            <Link key={s.place_id} href={`/app/place/${s.place_id}`} className="press" style={{
              textDecoration: 'none', color: 'inherit',
              padding: 16, borderRadius: 20, background: 'var(--cream-2)', border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: s.cover_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div className={wax} style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.25 }} />
                <div style={{ position: 'absolute', top: -6, left: -6, width: 24, height: 24, borderRadius: 6, background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>#{i + 2}</div>
                <span style={{ fontSize: 24, position: 'relative' }}>{s.logo_emoji}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.place_name}{s.commune ? ` — ${s.commune}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>
                  {[s.category, s.price_range].filter(Boolean).join(' · ') || 'Spot'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  {s.checkin_count > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 800 }}>🔥 {s.checkin_count}</span>
                  )}
                  {s.friends_count > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>👥 {s.friends_count} ami{s.friends_count > 1 ? 's' : ''}</span>
                  )}
                  {s.rating !== null && (
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>★ {s.rating.toFixed(1)}</span>
                  )}
                </div>
              </div>
              <span style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--line)', background: '#fff', fontWeight: 800, fontSize: 12 }}>Y aller</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function EventsSection({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <EmptyState 
          emoji="🎫"
          title="Pas d'événements" 
          description="Rien de prévu cette semaine ? Reviens plus tard pour les bons plans." 
        />
      </div>
    );
  }
  const GRADIENTS = [
    'linear-gradient(135deg, #1E5BFF 0%, #1540B3 100%)',
    'linear-gradient(135deg, #F26C1A 0%, #C4582E 100%)',
    'linear-gradient(135deg, #E5337A 0%, #9B2454 100%)',
    'linear-gradient(135deg, #0EA85B 0%, #0A6E3D 100%)',
    'linear-gradient(135deg, #E8B23C 0%, #B5832A 100%)',
    'linear-gradient(135deg, #1A2D6B 0%, #2B4FB7 100%)',
  ];
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1 }}>ÉVÉNEMENTS · CETTE SEMAINE</div>
        <h2 className="font-display" style={{ fontSize: 28, margin: '0 0 16px' }}>Sors avec Babi</h2>
      </div>

      <div className="no-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 16px' }}>
        {events.map((e) => {
          const wax = pickWax(`event-${e.id}`, { rotate: true });
          const grad = GRADIENTS[hashString(e.id) % GRADIENTS.length];
          const start = new Date(e.start_at);
          return (
            <div key={e.id} className="press" style={{
              flexShrink: 0, width: 240, height: 160, borderRadius: 24, padding: 20,
              background: grad, color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
              <div className={wax} style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>
                  {start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }).toUpperCase()}
                </div>
                <h3 className="font-display" style={{ fontSize: 22, margin: '0 0 4px', lineHeight: 1.1 }}>{e.title}</h3>
                <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>
                  {[e.location_name, `${start.getHours()}h${start.getMinutes() ? String(start.getMinutes()).padStart(2,'0') : ''}`].filter(Boolean).join(' · ')}
                </div>
                {e.price_label && (
                  <div style={{ marginTop: 10, display: 'inline-block', background: 'rgba(255,255,255,0.18)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>{e.price_label}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GbairaiClient({ initialPosts, myLikes, hotSpots, pulse, stories, trendingTags, profile, userId, reactionsByStory = {}, myReactions = {}, events, voiceRooms: initialVoiceRooms = [], quests, collectiveQuest, crews, initialTab = 'vibe' }: Props) {
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>(initialVoiceRooms.length > 0 ? initialVoiceRooms : [
    { id: '1', title: 'On gère le Gbairai de Babi 🇨🇮', participants_count: 12, emoji: '🎙️', is_live: true },
    { id: '2', title: 'Debrief Match de hier ⚽', participants_count: 5, emoji: '⚽', is_live: true }
  ]);
  const [tab, setTab] = useState(initialTab);
  const { isComplete, loading: profileLoading } = useProfileGating();
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [heatMode, setHeatMode] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('gbairai_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gbairai_posts' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const level = profile ? getLevel(profile.total_points ?? 0) : null;
  const activeMobeurs = stories.length;

  const overallStatus = useMemo(() => {
    if (pulse.some(p => p.status === 'rouge')) return 'rouge';
    if (pulse.some(p => p.status === 'orange')) return 'orange';
    return 'vert';
  }, [pulse]);

  const filteredPosts = useMemo(() => {
    if (!selectedCommune) return initialPosts;
    return initialPosts.filter(p => p.commune === selectedCommune);
  }, [initialPosts, selectedCommune]);

  const communes = useMemo(() => {
    return Array.from(new Set(pulse.map(p => p.commune))).sort();
  }, [pulse]);

  const PULSE_GRADIENTS = {
    vert:   'linear-gradient(135deg, #0EA85B 0%, #0A8A4A 100%)',
    orange: 'linear-gradient(135deg, #FF6B00 0%, #C4582E 100%)',
    rouge:  'linear-gradient(135deg, #FF3B30 0%, #B22A22 100%)',
  } as const;

  const pulseWax = pickWax(`pulse-${overallStatus}`, { rotate: true });

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <div style={{ paddingTop: 'max(14px, env(safe-area-inset-top))', padding: 'max(14px, env(safe-area-inset-top)) 16px 10px', background: 'var(--cream)', position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Link href="/app" style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'var(--cream-2)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <Ic.Back s={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 22, lineHeight: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              Gbairai
              <span className="shimmer" style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF3B30' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              <b style={{ color: 'var(--green)' }}>{activeMobeurs > 0 ? activeMobeurs : '—'}</b> Mobeurs en direct
            </div>
          </div>
          <button style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'var(--cream-2)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Search s={18} />
          </button>
          {level?.canPost && (
            <button onClick={() => setShowComposer(true)} className="press" style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'var(--orange)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(242,108,26,0.4)' }}>
              <Ic.Plus s={18} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 4, overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="press" style={{
              padding: '6px 2px', border: 'none', background: 'none',
              color: tab === t.id ? 'var(--ink)' : 'var(--muted)',
              fontSize: 14, fontWeight: tab === t.id ? 900 : 600, cursor: 'pointer',
              fontFamily: tab === t.id ? 'var(--font-display), Archivo Black, sans-serif' : 'Inter',
              borderBottom: tab === t.id ? '3px solid var(--orange)' : '3px solid transparent',
              whiteSpace: 'nowrap', marginRight: 14,
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        
        {/* Profile Gating Overlay for Social Features */}
        {!isComplete && (tab === 'vibe' || tab === 'crews') && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
             <div style={{ 
               background: 'var(--cream-2)', 
               borderRadius: 32, 
               padding: '32px 24px', 
               border: '2px dashed var(--line)',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center'
             }}>
               <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
               <h3 className="font-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>Profil Incomplet</h3>
               <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
                 Pour accéder au <b>Gbairai</b> et aux <b>Crews</b>, tu dois renseigner ton <b>Nom</b> et ton <b>Téléphone</b> dans tes paramètres.
               </p>
               <button
                 onClick={() => router.push('/app/compte')}
                 className="press font-display"
                 style={{
                   width: '100%',
                   padding: '16px',
                   borderRadius: 18,
                   border: 'none',
                   background: 'var(--orange)',
                   color: '#fff',
                   fontSize: 15,
                   fontWeight: 800,
                   boxShadow: '0 8px 20px rgba(242,108,26,0.25)',
                   cursor: 'pointer'
                 }}
               >
                 COMPLÉTER MON PROFIL
               </button>
             </div>
          </div>
        )}

        {/* TAB — POUR TOI */}
        {tab === 'vibe' && isComplete && (
          <>
            {/* Stories row */}
            <div className="no-scrollbar" style={{ display: 'flex', gap: 12, padding: '12px 16px 14px', overflowX: 'auto' }}>
              {/* Post story CTA */}
              {level?.canStory && userId && (
                <div onClick={() => setShowStoryComposer(true)} className="press" style={{ flexShrink: 0, textAlign: 'center', width: 64, cursor: 'pointer' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 24, background: 'var(--cream-2)', border: '2px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                    <Ic.Plus s={22} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>Sors !</div>
                </div>
              )}

              {stories.map((s, i) => (
                <div 
                  key={s.id} 
                  onClick={() => setViewingStoryIndex(i)}
                  className="press" 
                  style={{ flexShrink: 0, textAlign: 'center', width: 64, cursor: 'pointer' }}
                >
                  <div style={{ width: 64, height: 64, borderRadius: 24, padding: 3, background: 'linear-gradient(135deg, #FF6B00, #E5337A)' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: 21, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      {s.media_url ? (
                        <Image src={s.media_url} fill style={{ objectFit: 'cover' }} alt="story" />
                      ) : (
                        <div style={{ fontSize: 24 }}>{s.avatar_emoji || '👤'}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', marginTop: 4, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.display_name?.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>

            {/* Voice Rooms (If any) */}
            <VoiceRoomSection rooms={voiceRooms} />

            {/* Pulse card */}
            <div style={{ padding: '0 16px', marginBottom: 14 }}>
              <div style={{ 
                borderRadius: 24, 
                overflow: 'hidden', 
                position: 'relative', 
                background: PULSE_GRADIENTS[overallStatus], 
                color: '#fff', 
                padding: 20,
                boxShadow: `0 12px 32px rgba(${overallStatus === 'rouge' ? '255,59,48' : overallStatus === 'orange' ? '255,107,0' : '14,168,91'}, 0.25)`
              }}>
                <div className={pulseWax} style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
                <div className="pulse-glow" style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', filter: 'blur(30px)' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>
                    <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px #fff' }} />
                    POULS D&apos;ABIDJAN
                  </div>
                  <div className="font-display" style={{ fontSize: 28, marginTop: 10, lineHeight: 1.05 }}>
                    {pulseHeadline(pulse)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginTop: 6 }}>
                    Directement depuis le terrain · {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    {pulse.slice(0, 3).map((p, i) => {
                      const cat = p.top_category ? CATEGORY_META[p.top_category] : null;
                      return (
                        <div key={i} style={{ 
                          flex: 1, 
                          padding: '10px', 
                          borderRadius: 14, 
                          background: 'rgba(255,255,255,0.15)', 
                          backdropFilter: 'blur(10px)',
                          textAlign: 'center', 
                          position: 'relative',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 900, opacity: 0.8, letterSpacing: 0.5 }}>{p.commune.toUpperCase()}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                            {cat && <span style={{ fontSize: 14 }}>{cat.emoji}</span>}
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
                              {cat ? cat.label : p.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Sections */}
            <TrendingSection spots={hotSpots} />
            <EventsSection events={events} />

            {/* Trending hashtags */}
            {trendingTags.length > 0 && (
              <div style={{ padding: '0 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, marginBottom: 8 }}>QUI BUZZ AUJOURD&apos;HUI</div>
                <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
                  {trendingTags.map((h, i) => (
                    <div key={i} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, background: 'var(--cream-2)', border: `1.5px solid ${TAG_COLORS[i % TAG_COLORS.length]}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {h.count > 3 && <span style={{ fontSize: 13 }}>🔥</span>}
                      <span style={{ fontSize: 13, fontWeight: 800, color: TAG_COLORS[i % TAG_COLORS.length] }}>#{h.tag}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{h.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commune Filter */}
            <div style={{ padding: '0 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, marginBottom: 10 }}>OÙ ÇA SE PASSE ?</div>
              <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
                <button 
                  onClick={() => setSelectedCommune(null)}
                  className="press"
                  style={{
                    flexShrink: 0, padding: '8px 16px', borderRadius: 12,
                    background: selectedCommune === null ? 'var(--ink)' : 'var(--cream-2)',
                    color: selectedCommune === null ? '#fff' : 'var(--ink)',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer', border: '1.5px solid var(--line)'
                  }}
                >
                  Tout Babi
                </button>
                {communes.map(c => (
                  <button 
                    key={c}
                    onClick={() => setSelectedCommune(c)}
                    className="press"
                    style={{
                      flexShrink: 0, padding: '8px 16px', borderRadius: 12,
                      background: selectedCommune === c ? 'var(--ink)' : 'var(--cream-2)',
                      color: selectedCommune === c ? '#fff' : 'var(--ink)',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer', border: '1.5px solid var(--line)'
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Masonry Feed */}
            {filteredPosts.length > 0 ? (
              <GbairaiFeed initialPosts={filteredPosts} myLikes={myLikes} userId={userId} />
            ) : (
              <div style={{ padding: '0 16px' }}>
                <EmptyState 
                  emoji="🔎"
                  title="Aucun post ici" 
                  description={`Personne n'a encore gbairai sur ${selectedCommune}. Sois le premier !`}
                  action={{ label: "Lancer le gbairai", onClick: () => setShowComposer(true) }}
                />
              </div>
            )}
          </>
        )}

        {/* TAB — SPOTS DU MOMENT */}
        {tab === 'spots' && <SpotsTab hotSpots={hotSpots} />}

        {/* TAB — QUÊTES */}
        {tab === 'quetes' && <QuetesTab quests={quests} collective={collectiveQuest} />}

        {/* TAB — CREWS */}
        {tab === 'crews' && isComplete && <CrewsTab crews={crews} userId={userId} />}
      </div>

      {/* Post Composer Modal */}
      {showComposer && profile && userId && (
        <PostComposer
          userId={userId}
          displayName={profile.display_name ?? 'Explorateur'}
          avatarEmoji={profile.avatar_emoji ?? '🧭'}
          commune={profile.origin_commune}
          onClose={() => setShowComposer(false)}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Story Composer Modal */}
      {showStoryComposer && userId && (
        <StoryComposer 
          userId={userId} 
          onClose={() => setShowStoryComposer(false)} 
          onSuccess={() => router.refresh()} 
        />
      )}

      {/* Story Viewer Modal */}
      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewingStoryIndex}
          userId={userId}
          reactionsByStory={reactionsByStory}
          myReactions={myReactions}
          onClose={() => setViewingStoryIndex(null)}
        />
      )}

      <BottomNav 
        onToggleHeatmap={() => setHeatMode(!heatMode)} 
        heatMode={heatMode} 
        isPlusOpen={isPlusOpen}
        onTogglePlus={() => setIsPlusOpen(!isPlusOpen)}
        isAdmin={profile?.is_admin}
      />

      <PlusBubble 
        isOpen={isPlusOpen} 
        onClose={() => setIsPlusOpen(false)} 
        onToggleHeatmap={() => setHeatMode(!heatMode)}
        onDiscover={() => router.push('/app?discover=1')}
        heatMode={heatMode}
        isAdmin={profile?.is_admin}
      />
    </div>
  );
}
