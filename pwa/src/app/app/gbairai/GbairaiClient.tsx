'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';

export type FeedCheckin = {
  id: string;
  place_name: string;
  commune: string | null;
  created_at: string;
  display_name: string | null;
  avatar_emoji: string | null;
};

export type StoryItem = {
  id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  text_content: string | null;
  media_url: string | null;
  commune: string | null;
  user_level: number;
  created_at: string;
  expires_at: string;
};

export type TopSpot = {
  id: string;
  name: string;
  commune: string | null;
  category: string | null;
  sponsor_tier: string | null;
  checkin_count: number;
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  total_points: number;
};

type Props = {
  checkins: FeedCheckin[];
  stories: StoryItem[];
  topSpots: TopSpot[];
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
};

const AVATAR_COLORS = ['#F26C1A', '#0EA85B', '#1E5BFF', '#E8B23C', '#E5337A'];
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000];

function getLevel(totalPoints: number): number {
  let lvl = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) lvl = i;
  }
  return lvl;
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  if (mins < 1440) return `il y a ${Math.floor(mins / 60)}h`;
  return `il y a ${Math.floor(mins / 1440)}j`;
}

// ── Story Viewer ────────────────────────────────────────────
function StoryViewer({ story, onClose }: { story: StoryItem; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,16,0.92)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 380, borderRadius: 24, overflow: 'hidden', background: 'var(--cream)', position: 'relative' }}
        >
          {/* Progress bar */}
          <div style={{ height: 3, background: 'var(--line)', margin: '12px 12px 0' }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              onAnimationComplete={onClose}
              style={{ height: '100%', background: 'var(--orange)', borderRadius: 2 }}
            />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: AVATAR_COLORS[0], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: '2px solid var(--orange)' }}>
              {story.avatar_emoji || (story.display_name?.[0] ?? '?')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{story.display_name || 'Babi'}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{story.commune || 'Abidjan'} · {timeAgo(story.created_at)}</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--cream-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic.X s={16} color="var(--ink)" />
            </button>
          </div>

          {/* Content */}
          {story.media_url ? (
            <div style={{ margin: '0 12px', borderRadius: 16, overflow: 'hidden', aspectRatio: '9/16', background: 'var(--ink)' }}>
              {story.media_url.includes('.mp4') || story.media_url.includes('.mov') ? (
                <video src={story.media_url} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          ) : (
            <div style={{ margin: '0 12px', borderRadius: 16, minHeight: 200, background: `linear-gradient(135deg,${AVATAR_COLORS[0]},${AVATAR_COLORS[2]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
              <div className="font-display" style={{ fontSize: 24, color: '#fff', textAlign: 'center', position: 'relative', lineHeight: 1.2 }}>
                {story.text_content || '...'}
              </div>
            </div>
          )}
          {story.text_content && story.media_url && (
            <div style={{ padding: '12px 16px', fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{story.text_content}</div>
          )}

          {/* Reactions */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px 20px' }}>
            {['👍', '😍', '😂', '😡', '🔥'].map((r) => (
              <button key={r} className="press" style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--cream-2)', fontSize: 18, cursor: 'pointer' }}>
                {r}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Story Creator ────────────────────────────────────────────
function StoryCreatorModal({ userProfile, onClose, onCreated }: { userProfile: UserProfile | null; onClose: () => void; onCreated: (story: StoryItem) => void }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const supabase = createClient();

  const userLevel = userProfile ? getLevel(userProfile.total_points) : 0;

  async function handlePost() {
    if (!userProfile || !text.trim()) return;
    setPosting(true);

    const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: userProfile.id,
        display_name: userProfile.display_name,
        avatar_emoji: userProfile.avatar_emoji,
        text_content: text.trim(),
        is_public: true,
        user_level: userLevel,
        expires_at: expiresAt,
      })
      .select('id, display_name, avatar_emoji, text_content, media_url, commune, user_level, created_at, expires_at')
      .single();

    if (!error && data) {
      await supabase.rpc('award_xp', { p_xp: 5 });
      onCreated(data as StoryItem);
    }
    setPosting(false);
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,16,0.7)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 480, borderRadius: '24px 24px 0 0', background: 'var(--cream)', padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Handle */}
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto 20px' }} />

          {userLevel < 5 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
              <div className="font-display" style={{ fontSize: 20, marginBottom: 8 }}>Niveau 5 requis</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                Tu dois être <b>Zo Confirmé (niveau 5)</b> pour poster une Story.<br />
                Continue à explorer Babi pour monter en niveau !
              </p>
              <button onClick={onClose} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 999, border: 'none', background: 'var(--cream-2)', color: 'var(--ink)', fontWeight: 800, cursor: 'pointer' }}>
                Compris
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: AVATAR_COLORS[0], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {userProfile?.avatar_emoji || '🧭'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{userProfile?.display_name || 'Toi'}</div>
                  <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>+5 XP après publication · visible 24h</div>
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="C'comment là ? Dis-leur !"
                maxLength={280}
                style={{ width: '100%', minHeight: 120, padding: 14, borderRadius: 16, border: '1.5px solid var(--line)', background: 'var(--cream-2)', color: 'var(--ink)', fontSize: 16, fontWeight: 600, resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{text.length}/280</div>

              <button
                onClick={handlePost}
                disabled={posting || !text.trim()}
                className="press"
                style={{ marginTop: 12, width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: text.trim() ? 'var(--orange)' : 'var(--line)', color: text.trim() ? '#fff' : 'var(--muted)', fontSize: 15, fontWeight: 900, cursor: text.trim() ? 'pointer' : 'default', transition: 'background 0.2s' }}
              >
                {posting ? 'Publication...' : 'Publier la Story ✨'}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Tab : Pour toi ────────────────────────────────────────────
function TabVibe({ checkins, isLoggedIn, stories, onStoryClick, onAddStory }: {
  checkins: FeedCheckin[];
  isLoggedIn: boolean;
  stories: StoryItem[];
  onStoryClick: (story: StoryItem) => void;
  onAddStory: () => void;
}) {
  const HASHTAGS = [
    { tag: "#attiéké_du_soir", count: '2,1K', c: '#E8B23C', fire: true },
    { tag: '#cocody_by_night', count: '847', c: '#1E5BFF' },
    { tag: '#bon_woro', count: '1,5K', c: '#0EA85B', fire: true },
    { tag: '#zo_sapeur', count: '612', c: '#E5337A' },
    { tag: '#pluie_babi', count: '3,2K', c: '#F26C1A', fire: true },
  ];

  return (
    <>
      {/* Stories row */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 10, padding: '12px 16px 14px', overflowX: 'auto' }}>
        {/* Add story button */}
        <div onClick={onAddStory} style={{ flexShrink: 0, textAlign: 'center', width: 64, cursor: 'pointer' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--cream-2)', border: '2px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
            <Ic.Plus s={22} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', marginTop: 4, lineHeight: 1.1 }}>Sors !</div>
        </div>

        {stories.length === 0 ? (
          // Placeholder stories when empty
          [
            { n: 'Aïcha', loc: 'Plateau', c: '#1E5BFF', live: true },
            { n: 'Boris', loc: 'Cocody', c: '#E8B23C' },
            { n: 'Awa', loc: 'Yop', c: '#E5337A', live: true },
            { n: 'Didier', loc: 'Marcory', c: '#0EA85B' },
          ].map((s, i) => (
            <div key={i} style={{ flexShrink: 0, textAlign: 'center', width: 64, opacity: 0.5 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, padding: 2.5, background: `linear-gradient(135deg,${s.c},#F26C1A)`, position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 18, background: s.c, color: '#fff', fontFamily: 'Archivo Black,sans-serif', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--cream)' }}>
                  {s.n[0]}
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', marginTop: 6, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{s.loc}</div>
            </div>
          ))
        ) : (
          stories.map((s, i) => (
            <div key={s.id} onClick={() => onStoryClick(s)} style={{ flexShrink: 0, textAlign: 'center', width: 64, cursor: 'pointer' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, padding: 2.5, background: 'linear-gradient(135deg,var(--orange),#E8B23C)', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 18, background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', fontFamily: 'Archivo Black,sans-serif', fontSize: s.avatar_emoji ? 26 : 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--cream)' }}>
                  {s.avatar_emoji || (s.display_name?.[0] ?? '?')}
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', marginTop: 6, lineHeight: 1 }}>{s.display_name?.split(' ')[0] || 'Babi'}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{s.commune || 'Babi'}</div>
            </div>
          ))
        )}
      </div>

      {/* Pulse */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#0EA85B 0%,#0A8A4A 100%)', color: '#fff', padding: 18 }}>
          <div className="wax-stripe" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.13 }} />
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, opacity: 0.9, letterSpacing: 0.7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
              POULS · MAINTENANT
            </div>
            <div className="font-display" style={{ fontSize: 26, marginTop: 6, lineHeight: 1 }}>
              Plateau bouchonne.<br />Cocody coule.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[{ l: 'Plateau', v: 'Rouge', c: '#FF3B30' }, { l: 'Cocody', v: 'Vert', c: '#9DEFC4' }, { l: 'Yop', v: 'Orange', c: '#E8B23C' }].map((q, i) => (
                <div key={i} style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, letterSpacing: 0.4 }}>{q.l.toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: q.c, marginTop: 2 }}>{q.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Ic.Users s={13} /> {checkins.length > 0 ? checkins.length : '4 281'} Babis actifs
            </div>
          </div>
        </div>
      </div>

      {/* Hashtags */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, marginBottom: 8 }}>QUI BUZZ AUJOURD'HUI</div>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
          {HASHTAGS.map((h, i) => (
            <div key={i} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, background: 'var(--cream-2)', border: `1.5px solid ${h.c}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              {h.fire && <span style={{ color: 'var(--orange)' }}><Ic.Flame s={13} /></span>}
              <span style={{ fontSize: 13, fontWeight: 800, color: h.c }}>{h.tag}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{h.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA for logged out */}
      {!isLoggedIn && (
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{ padding: 20, borderRadius: 18, background: 'var(--cream-2)', border: '1.5px dashed var(--orange)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🗺️</div>
            <div className="font-display" style={{ fontSize: 20, marginBottom: 8 }}>Marque ton territoire</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Connecte-toi pour participer et être vu sur la carte.</p>
            <Link href="/app/auth/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--orange)', color: '#fff', padding: '12px 24px', borderRadius: 999, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
              Se connecter <Ic.Arrow s={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Feed masonry 2 colonnes */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {checkins.slice(0, 2).map((c, idx) => (
          <div key={c.id} style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ height: idx === 0 ? 160 : 200, background: `linear-gradient(135deg,${AVATAR_COLORS[idx % AVATAR_COLORS.length]},${AVATAR_COLORS[(idx + 2) % AVATAR_COLORS.length]})`, position: 'relative', overflow: 'hidden' }}>
              <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.45) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: 0.4 }}>📍 {c.commune || 'Babi'}</div>
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25 }}>{c.place_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(c.display_name || 'B')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{c.display_name || 'Babi'} · {timeAgo(c.created_at)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Tarif confirmé card */}
        <div style={{ borderRadius: 16, padding: 14, background: 'var(--ink)', color: 'var(--cream)', position: 'relative', overflow: 'hidden', minHeight: 180 }}>
          <div className="wax-zigzag" style={{ position: 'absolute', inset: 0, color: '#0EA85B', opacity: 0.12 }} />
          <div style={{ position: 'relative' }}>
            <Pill color="#0EA85B">TARIF CONFIRMÉ</Pill>
            <div className="font-display" style={{ fontSize: 18, marginTop: 8, color: '#fff', lineHeight: 1.05 }}>Adjamé → Yop Selmer</div>
            <div className="font-display" style={{ fontSize: 32, color: '#E8B23C', marginTop: 6 }}>200F</div>
            <div style={{ fontSize: 10, color: 'rgba(247,241,230,0.6)', marginTop: 4 }}>47 Babis confirment · 12h</div>
          </div>
        </div>

        {/* Alerte trafic */}
        <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
          <div style={{ height: 90, background: 'linear-gradient(135deg,#1A2D6B,#2B4FB7)', position: 'relative', overflow: 'hidden' }}>
            <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
            <svg viewBox="0 0 200 90" style={{ position: 'absolute', inset: 0 }}>
              <path d="M0 60 Q50 20 100 40 T200 20" stroke="#FF3B30" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="4 4" />
              <circle cx="100" cy="40" r="6" fill="#FF3B30" />
            </svg>
            <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 8, fontWeight: 900, color: '#fff', background: '#FF3B30', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.4 }}>ALERTE TRAFIC</div>
          </div>
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25 }}>Pont HKB bloqué — passe par De Gaulle</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>il y a 11min</div>
          </div>
        </div>

        {/* Salon vocal */}
        <div style={{ borderRadius: 16, padding: 14, background: 'linear-gradient(135deg,#E5337A,#B82460)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 900, letterSpacing: 0.5 }}>
              <Ic.Mic s={12} /> SALON VOCAL · LIVE
            </div>
            <div className="font-display" style={{ fontSize: 16, marginTop: 6, lineHeight: 1.1 }}>« Comment éviter Plateau ce soir »</div>
            <div style={{ display: 'flex', marginTop: 10 }}>
              {['#F26C1A', '#0EA85B', '#1E5BFF', '#E8B23C'].map((c, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '2px solid #B82460', marginLeft: i === 0 ? 0 : -6 }} />
              ))}
              <div style={{ marginLeft: 6, fontSize: 11, fontWeight: 700 }}>+38</div>
            </div>
            <button style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.95)', color: '#B82460', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Entrer</button>
          </div>
        </div>

        {/* Event ce soir */}
        <div style={{ borderRadius: 16, padding: 14, background: 'linear-gradient(135deg,#1A2D6B 0%,#2B4FB7 100%)', color: '#fff', position: 'relative', overflow: 'hidden', minHeight: 160 }}>
          <div className="wax-stripe" style={{ position: 'absolute', inset: 0, color: '#E8B23C', opacity: 0.18 }} />
          <div style={{ position: 'relative' }}>
            <Pill color="#E8B23C">CE SOIR · 22H</Pill>
            <div className="font-display" style={{ fontSize: 16, marginTop: 8, lineHeight: 1.1 }}>Coupé décalé chez Effa</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>Riviera Palmeraie · 5 000F</div>
            <div style={{ marginTop: 10, fontSize: 10, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Ic.Users s={11} /> 142 Babis y vont
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
        ↓ Tire pour rafraîchir le pouls de Babi ↓
      </div>
    </>
  );
}

// ── Tab : Spots du moment ────────────────────────────────────
function TabSpots({ topSpots }: { topSpots: TopSpot[] }) {
  const CATEGORY_GRADIENT: Record<string, string> = {
    restaurant: 'linear-gradient(135deg,#E8B23C,#F26C1A)',
    cafe: 'linear-gradient(135deg,#2A1F18,#3A2A1E)',
    bar: 'linear-gradient(135deg,#1A2D6B,#E5337A)',
    beach: 'linear-gradient(135deg,#1E5BFF,#0EA85B)',
    default: 'linear-gradient(135deg,#F26C1A,#E5337A)',
  };

  const getGradient = (spot: TopSpot) => {
    const cat = spot.category?.toLowerCase() ?? 'default';
    return CATEGORY_GRADIENT[cat] ?? CATEGORY_GRADIENT.default;
  };

  const EVENTS = [
    { d: 'JEU 6', t: 'Live coupé chez Effa', sub: 'Riviera · 22h', c: 'linear-gradient(135deg,#1A2D6B,#2B4FB7)' },
    { d: 'VEN 7', t: 'Fête de la rue', sub: 'Cocody · 18h', c: 'linear-gradient(135deg,#F26C1A,#D9510A)' },
    { d: 'SAM 8', t: 'Marché vintage', sub: 'Plateau · 10h', c: 'linear-gradient(135deg,#0EA85B,#0A8A4A)' },
    { d: 'DIM 9', t: 'Plage Babi run', sub: 'Bassam · 7h', c: 'linear-gradient(135deg,#E8B23C,#C4912A)' },
  ];

  const hero = topSpots[0];
  const rest = topSpots.slice(1, 6);

  return (
    <>
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.7 }}>OÙ ÇA BOUGE · MAINTENANT</div>
        <div className="font-display" style={{ fontSize: 22, marginTop: 2 }}>Les spots qui chauffent</div>
      </div>

      {/* Hero #1 */}
      {hero ? (
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <Link href={`/app/place/${hero.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
              <div style={{ height: 200, background: getGradient(hero), position: 'relative' }}>
                <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent,rgba(0,0,0,0.7))' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ background: 'var(--orange)', color: '#fff', fontFamily: 'Archivo Black,sans-serif', fontSize: 26, padding: '2px 12px', borderRadius: 10 }}>#1</div>
                  <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 999, letterSpacing: 0.4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Ic.Flame s={11} /> {hero.checkin_count} BABIS CETTE SEMAINE
                  </div>
                </div>
                {hero.sponsor_tier === 'elite' && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: '#E8B23C', color: 'var(--ink)', fontSize: 8, fontWeight: 900, padding: '3px 8px', borderRadius: 8, letterSpacing: 0.4 }}>ÉLITE</div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, color: '#fff' }}>
                  <div className="font-display" style={{ fontSize: 22 }}>{hero.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{hero.commune || 'Abidjan'} · {hero.category || 'Lieu'}</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ height: 200, background: 'linear-gradient(135deg,#E5337A 0%,#F26C1A 50%,#E8B23C 100%)', position: 'relative' }}>
              <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent,rgba(0,0,0,0.7))' }} />
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <div style={{ background: 'var(--orange)', color: '#fff', fontFamily: 'Archivo Black,sans-serif', fontSize: 26, padding: '2px 12px', borderRadius: 10 }}>#1</div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, color: '#fff' }}>
                <div className="font-display" style={{ fontSize: 22 }}>Maquis du Val</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>Riviera Palmeraie · Coupé · Poisson braisé</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(rest.length > 0 ? rest : [
          { id: '2', name: 'Tata Aya — Adjamé', commune: 'Adjamé', category: 'Attiéké', sponsor_tier: null, checkin_count: 612 },
          { id: '3', name: 'Bushman Café — Cocody', commune: 'Cocody', category: 'Café', sponsor_tier: null, checkin_count: 481 },
          { id: '4', name: 'Yop By Night', commune: 'Yopougon', category: 'Boîte', sponsor_tier: null, checkin_count: 392 },
          { id: '5', name: 'Plage Bassam', commune: 'Bassam', category: 'Plage', sponsor_tier: null, checkin_count: 287 },
        ] as TopSpot[]).map((s, i) => (
          <Link key={s.id} href={`/app/place/${s.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', gap: 12, padding: 10, borderRadius: 14, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
              <div style={{ width: 76, height: 76, borderRadius: 12, background: getGradient(s), position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.2 }} />
                <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: 'Archivo Black,sans-serif', fontSize: 11, padding: '2px 6px', borderRadius: 5 }}>#{i + 2}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{s.name}</div>
                  {s.sponsor_tier === 'elite' && <span style={{ fontSize: 8, fontWeight: 900, background: '#E8B23C', color: 'var(--ink)', padding: '1px 5px', borderRadius: 4, letterSpacing: 0.4 }}>ÉLITE</span>}
                  {s.sponsor_tier === 'pro' && <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', background: 'var(--orange)', padding: '1px 5px', borderRadius: 4, letterSpacing: 0.4 }}>PRO</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.commune || 'Babi'} · {s.category || 'Lieu'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Ic.Flame s={12} /> {s.checkin_count}
                  </span>
                </div>
              </div>
              <div style={{ alignSelf: 'center', color: 'var(--muted)' }}>
                <Ic.Arrow s={16} dir="right" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.7 }}>ÉVÉNEMENTS · CETTE SEMAINE</div>
        <div className="font-display" style={{ fontSize: 18, marginTop: 2 }}>Sors avec Babi</div>
      </div>
      <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 12px' }}>
        {EVENTS.map((e, i) => (
          <div key={i} style={{ flexShrink: 0, width: 180, borderRadius: 14, overflow: 'hidden', background: e.c, color: '#fff', padding: 14, position: 'relative' }}>
            <div className="wax-stripe" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.13 }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 9, fontWeight: 900, opacity: 0.9, letterSpacing: 0.6 }}>{e.d}</div>
              <div className="font-display" style={{ fontSize: 16, marginTop: 4, lineHeight: 1.1 }}>{e.t}</div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 6 }}>{e.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Tab : Quêtes ─────────────────────────────────────────────
function TabQuetes() {
  const QUETES = [
    { ic: 'Compass', c: 'var(--orange)', t: 'Tour des 17 communes', sub: '11 / 17 visitées', xp: 500, prog: 11, of: 17 },
    { ic: 'Bus', c: '#0EA85B', t: 'Roi du gbaka', sub: '50 trajets en gbaka', xp: 300, prog: 32, of: 50 },
    { ic: 'Wallet', c: '#1E5BFF', t: 'Vérificateur de tarifs', sub: 'Confirme 30 tarifs', xp: 200, prog: 18, of: 30 },
    { ic: 'Moon', c: '#E5337A', t: 'Zo de nuit', sub: '5 sorties après 22h', xp: 250, prog: 2, of: 5 },
  ];

  const SECRET_COLORS = [
    'linear-gradient(135deg,#1A2D6B,#2B4FB7)',
    'linear-gradient(135deg,#E5337A,#B82460)',
    'linear-gradient(135deg,#0EA85B,#0A8A4A)',
    'linear-gradient(135deg,#E8B23C,#F26C1A)',
  ];

  return (
    <>
      {/* Quête collective hero */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,var(--ink) 0%,#2A1F18 100%)', color: '#fff', padding: 20 }}>
          <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#E8B23C', opacity: 0.18 }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(232,178,60,0.35),transparent 70%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 900, letterSpacing: 0.7, color: '#E8B23C' }}>
              <Ic.Trophy s={13} /> QUÊTE DE LA SEMAINE · COLLECTIVE
            </div>
            <div className="font-display" style={{ fontSize: 26, marginTop: 6, lineHeight: 1, color: '#fff' }}>
              Cartographier<br />la côte Sud
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, lineHeight: 1.4 }}>
              Tous ensemble : 1000 check-ins à Marcory + Treichville + Koumassi avant dimanche.
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ color: '#E8B23C' }}>847 / 1 000</span>
                <span style={{ opacity: 0.7 }}>4 jours restants</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '84.7%', background: 'linear-gradient(90deg,#E8B23C,#F26C1A)', borderRadius: 999 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: 10, borderRadius: 12, background: 'rgba(232,178,60,0.12)', border: '1px solid rgba(232,178,60,0.3)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E8B23C', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic.Star s={20} fill />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#E8B23C' }}>Récompense pour TOUS</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>+200 XP · Badge "Côte Sud" · Skin avatar exclusif</div>
              </div>
            </div>
            <button style={{ marginTop: 14, width: '100%', padding: 12, borderRadius: 12, border: 'none', background: '#E8B23C', color: 'var(--ink)', fontSize: 13, fontWeight: 900, cursor: 'pointer', letterSpacing: 0.3 }}>
              Contribuer maintenant →
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 8px' }}>
        <div className="font-display" style={{ fontSize: 18 }}>Mes quêtes en cours</div>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {QUETES.map((q, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 14, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in oklab,${q.c} 15%,transparent)`, color: q.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {q.ic === 'Compass' && <Ic.Compass s={20} />}
                {q.ic === 'Bus' && <Ic.Bus s={20} />}
                {q.ic === 'Wallet' && <Ic.Wallet s={20} />}
                {q.ic === 'Moon' && <Ic.Moon s={20} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{q.t}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{q.sub}</div>
              </div>
              <div className="font-display" style={{ fontSize: 14, color: q.c }}>+{q.xp}</div>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--line)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(q.prog / q.of) * 100}%`, background: q.c, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 16px 8px' }}>
        <div className="font-display" style={{ fontSize: 18 }}>Quêtes secrètes</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Visite ces lieux pour les déclencher</div>
      </div>
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SECRET_COLORS.map((c, i) => (
          <div key={i} style={{ aspectRatio: '1.4', borderRadius: 14, background: c, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
            <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
              <div style={{ fontFamily: 'Archivo Black,sans-serif', fontSize: 32, lineHeight: 1 }}>?</div>
              <div style={{ fontSize: 9, fontWeight: 800, marginTop: 4, letterSpacing: 0.5, opacity: 0.85 }}>VERROUILLÉ</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Tab : Crews ──────────────────────────────────────────────
function TabCrews() {
  const CREWS = [
    { rank: 1, n: 'Yop Selmer Boys', xp: '128K', members: 89, c: 'linear-gradient(135deg,#F26C1A,#E5337A)', winner: true },
    { rank: 2, n: 'Plateau Crew', xp: '94K', members: 67, c: 'linear-gradient(135deg,#1A2D6B,#2B4FB7)' },
    { rank: 3, n: 'Cocody Family', xp: '78K', members: 24, c: 'linear-gradient(135deg,#0EA85B,#1E5BFF)', me: true },
    { rank: 4, n: 'Marcory Massive', xp: '61K', members: 41, c: 'linear-gradient(135deg,#E8B23C,#C4912A)' },
    { rank: 5, n: 'Adjamé Squad', xp: '52K', members: 53, c: 'linear-gradient(135deg,#E5337A,#B82460)' },
    { rank: 6, n: 'Riviera Vibes', xp: '47K', members: 32, c: 'linear-gradient(135deg,#2A1F18,#3A2A1E)' },
  ];

  const SUGGESTED = [
    { n: 'II Plateaux Vibes', m: 18, c: 'linear-gradient(135deg,#F26C1A,#E8B23C)' },
    { n: 'Bassam Beach', m: 36, c: 'linear-gradient(135deg,#1E5BFF,#0EA85B)' },
    { n: 'Sapeurs de Babi', m: 47, c: 'linear-gradient(135deg,#E5337A,#1A2D6B)' },
  ];

  return (
    <>
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, marginBottom: 8 }}>MON CREW</div>
        <div style={{ borderRadius: 20, padding: 16, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#0EA85B 0%,#1E5BFF 100%)', color: '#fff' }}>
          <div className="wax-zigzag" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.1 }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(0,0,0,0.3)', fontFamily: 'Archivo Black,sans-serif', fontSize: 26, color: '#E8B23C', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>CF</div>
            <div style={{ flex: 1 }}>
              <div className="font-display" style={{ fontSize: 22, lineHeight: 1 }}>Cocody Family</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>24 membres · Rang #3 / 47</div>
              <div style={{ display: 'flex', marginTop: 6 }}>
                {['#F26C1A', '#E8B23C', '#E5337A', '#1A2D6B'].map((c, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: '2px solid #1E5BFF', marginLeft: i === 0 ? 0 : -5 }} />
                ))}
              </div>
            </div>
            <button style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: '#E8B23C', color: 'var(--ink)', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Entrer</button>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 8px' }}>
        <div className="font-display" style={{ fontSize: 18 }}>Top crews · Saison Harmattan</div>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CREWS.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, background: c.me ? 'color-mix(in oklab,#0EA85B 12%,var(--cream-2))' : 'var(--cream-2)', border: c.me ? '1.5px solid #0EA85B' : '1px solid var(--line)' }}>
            <div className="font-display" style={{ width: 22, fontSize: 14, color: c.winner ? '#E8B23C' : 'var(--muted)', textAlign: 'center' }}>
              {c.winner ? '👑' : c.rank}
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.c, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                {c.n}
                {c.me && <span style={{ fontSize: 8, fontWeight: 900, color: '#0EA85B', marginLeft: 6, padding: '1px 5px', background: '#fff', borderRadius: 4, letterSpacing: 0.4 }}>TOI</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{c.members} membres · {c.xp} XP</div>
            </div>
            {!c.me && (
              <button className="press" style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>Voir</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 16px 8px' }}>
        <div className="font-display" style={{ fontSize: 18 }}>À découvrir</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Crews proches de toi</div>
      </div>
      <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 8px' }}>
        {SUGGESTED.map((s, i) => (
          <div key={i} style={{ flexShrink: 0, width: 170, borderRadius: 16, padding: 14, background: s.c, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div className="wax-stripe" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
            <div style={{ position: 'relative' }}>
              <div className="font-display" style={{ fontSize: 18, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>{s.m} membres</div>
              <button style={{ marginTop: 10, padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.95)', color: 'var(--ink)', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>+ Rejoindre</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Composant principal ──────────────────────────────────────
export default function GbairaiClient({ checkins, stories: initialStories, topSpots, userProfile, isLoggedIn }: Props) {
  const [tab, setTab] = useState<'vibe' | 'spots' | 'quetes' | 'crews'>('vibe');
  const [stories, setStories] = useState<StoryItem[]>(initialStories);
  const [viewingStory, setViewingStory] = useState<StoryItem | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  const TABS = [
    { id: 'vibe', l: 'Pour toi' },
    { id: 'spots', l: 'Spots du moment' },
    { id: 'quetes', l: 'Quêtes' },
    { id: 'crews', l: 'Crews' },
  ] as const;

  function handleAddStory() {
    if (!isLoggedIn) {
      window.location.href = '/app/auth/signin';
      return;
    }
    setShowCreator(true);
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(247,241,230,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)', paddingTop: 'max(14px,env(safe-area-inset-top))', paddingBottom: 0 }}>
        <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <Link href="/app" style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', background: 'var(--cream-2)', border: '1px solid var(--line)', textDecoration: 'none', flexShrink: 0 }}>
            <Ic.Back s={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 22, lineHeight: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              Gbairai
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF3B30', boxShadow: '0 0 0 0 rgba(255,59,48,0.7)', animation: 'shimmer 1.6s ease-in-out infinite' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              <b style={{ color: '#0EA85B' }}>{checkins.length > 0 ? `${checkins.length}` : '4 281'}</b> Babis actifs · MAJ à l'instant
            </div>
          </div>
          <button className="press" style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream-2)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Search s={18} />
          </button>
          <button onClick={handleAddStory} className="press" style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'var(--orange)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(242,108,26,0.4)' }}>
            <Ic.Plus s={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 4, overflowX: 'auto', margin: '0 -1px', padding: '0 16px', borderTop: '1px solid var(--line)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="press" style={{ padding: '10px 2px', border: 'none', background: 'none', color: tab === t.id ? 'var(--ink)' : 'var(--muted)', fontSize: 14, fontWeight: tab === t.id ? 900 : 600, cursor: 'pointer', fontFamily: tab === t.id ? 'Archivo Black,sans-serif' : 'inherit', borderBottom: tab === t.id ? '3px solid var(--orange)' : '3px solid transparent', whiteSpace: 'nowrap', marginRight: 14, flexShrink: 0 }}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {tab === 'vibe' && (
          <TabVibe
            checkins={checkins}
            isLoggedIn={isLoggedIn}
            stories={stories}
            onStoryClick={setViewingStory}
            onAddStory={handleAddStory}
          />
        )}
        {tab === 'spots' && <TabSpots topSpots={topSpots} />}
        {tab === 'quetes' && <TabQuetes />}
        {tab === 'crews' && <TabCrews />}
      </div>

      {/* Story Viewer */}
      {viewingStory && (
        <StoryViewer story={viewingStory} onClose={() => setViewingStory(null)} />
      )}

      {/* Story Creator */}
      {showCreator && (
        <StoryCreatorModal
          userProfile={userProfile}
          onClose={() => setShowCreator(false)}
          onCreated={(newStory) => setStories((prev) => [newStory, ...prev])}
        />
      )}
    </div>
  );
}
