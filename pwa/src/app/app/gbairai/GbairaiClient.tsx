'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';
import { getLevel } from '@/lib/levels';
import type { GbairaiPost, HotSpot, CommunePulse, Story } from './page';
import GbairaiFeed from './GbairaiFeed';
import PostComposer from './PostComposer';
import StoryComposer from './StoryComposer';
import StoryViewer from './StoryViewer';
import SpotsTab from './SpotsTab';

export type Event = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  location_name: string | null;
  price_label: string | null;
  category: string | null;
  image_url: string | null;
};

export type VoiceRoom = {
  id: string;
  title: string;
  participants_count: number;
  emoji: string;
  is_live: boolean;
};

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
};

const TABS = [
  { id: 'vibe', l: 'Pour toi' },
  { id: 'spots', l: 'Spots du moment' },
  { id: 'quetes', l: 'Quêtes' },
  { id: 'crews', l: 'Crews' },
] as const;

const STATUS_COLORS: Record<string, string> = { vert: '#9DEFC4', orange: 'var(--gold)', rouge: '#FF3B30' };
const AVATAR_COLORS = ['#F26C1A', '#0EA85B', '#1E5BFF', '#E8B23C', '#E5337A', '#C4582E'];
const TAG_COLORS = ['var(--gold)', 'var(--blue)', 'var(--green)', '#E5337A', 'var(--orange)'];

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
  if (rooms.length === 0) return null;
  return (
    <div style={{ padding: '0 16px', marginBottom: 20 }}>
      {rooms.map(room => (
        <div key={room.id} className="press" style={{
          borderRadius: 24, padding: 20, background: 'linear-gradient(135deg, #E5337A 0%, #C12763 100%)',
          color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(229,51,122,0.3)'
        }}>
          <div className="wax-stripe" style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, marginBottom: 8 }}>
              <Ic.Mic s={14} fill /> SALON VOCAL · LIVE
            </div>
            <h3 className="font-display" style={{ fontSize: 24, margin: '0 0 16px', lineHeight: 1.1 }}>« {room.title} »</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: -8 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: AVATAR_COLORS[i], border: '2px solid #E5337A', marginLeft: i === 0 ? 0 : -10 }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 800 }}>+{room.participants_count}</span>
            </div>

            <button style={{ width: '100%', padding: '12px', borderRadius: 14, border: 'none', background: '#fff', color: '#E5337A', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
              Entrer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendingSection({ spots }: { spots: HotSpot[] }) {
  if (spots.length === 0) return null;
  const top = spots[0];
  const others = spots.slice(1, 4);

  return (
    <div style={{ padding: '0 16px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1 }}>OÙ ÇA BOUGE · MAINTENANT</div>
      </div>
      <h2 className="font-display" style={{ fontSize: 28, margin: '0 0 16px' }}>Les spots qui chauffent</h2>

      {/* Top 1 Card */}
      <div className="press" style={{
        borderRadius: 24, height: 240, background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%), linear-gradient(135deg, ${top.cover_color} 0%, #1A1410 100%)`,
        position: 'relative', overflow: 'hidden', marginBottom: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 20, color: '#fff'
      }}>
        <div className="wax-stripe" style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />
        <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--orange)', color: '#fff', padding: '4px 12px', borderRadius: 8, fontSize: 18, fontWeight: 900 }}>#1</div>
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
          {top.is_new && (
            <div style={{ background: '#0EA85B', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, backdropFilter: 'blur(10px)' }}>
              ✨ NOUVEAU
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {top.checkin_count > 0 ? `🔥 ${top.checkin_count * 12} BABIS Y VONT` : '🔥 PREMIER À ARRIVER ?'}
          </div>
        </div>
        
        <h3 className="font-display" style={{ fontSize: 32, margin: 0 }}>{top.place_name}</h3>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginTop: 4 }}>
          {top.commune} · {top.category || 'Spot'} · Poisson braisé
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>★ 4.8</div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>5 000–15 000F</div>
          <div style={{ background: '#0EA85B', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>OUVERT</div>
        </div>
      </div>

      {/* Others List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {others.map((s, i) => (
          <div key={s.place_id} className="press" style={{
            padding: 16, borderRadius: 20, background: 'var(--cream-2)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: s.cover_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -6, left: -6, width: 24, height: 24, borderRadius: 6, background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>#{i + 2}</div>
              <span style={{ fontSize: 24 }}>{s.logo_emoji}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{s.place_name} — {s.commune}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Attiéké · 1 500F</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 800 }}>
                  {s.checkin_count > 0 ? `🔥 ${s.checkin_count * 10}` : '🔥 À DÉCOUVRIR'}
                </span>
                {s.is_new && <span style={{ fontSize: 10, color: '#0EA85B', fontWeight: 900 }}>✨ NOUVEAU</span>}
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>👥 12 amis</span>
              </div>
            </div>
            <button style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--line)', background: '#fff', fontWeight: 800, fontSize: 12 }}>Y aller</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsSection({ events }: { events: Event[] }) {
  if (events.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1 }}>ÉVÉNEMENTS · CETTE SEMAINE</div>
        <h2 className="font-display" style={{ fontSize: 28, margin: '0 0 16px' }}>Sors avec Babi</h2>
      </div>
      
      <div className="no-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 16px' }}>
        {events.map((e, i) => (
          <div key={e.id} className="press" style={{
            flexShrink: 0, width: 240, height: 160, borderRadius: 24, padding: 20,
            background: i % 2 === 0 ? 'linear-gradient(135deg, #1E5BFF 0%, #1540B3 100%)' : 'linear-gradient(135deg, #F26C1A 0%, #C4582E 100%)',
            color: '#fff', position: 'relative', overflow: 'hidden'
          }}>
            <div className="wax-stripe" style={{ position: 'absolute', inset: 0, opacity: 0.15, transform: 'rotate(-45deg) scale(2)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>
                {new Date(e.start_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }).toUpperCase()}
              </div>
              <h3 className="font-display" style={{ fontSize: 22, margin: '0 0 4px', lineHeight: 1.1 }}>{e.title}</h3>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{e.location_name} · {new Date(e.start_at).getHours()}h</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GbairaiClient({ initialPosts, myLikes, hotSpots, pulse, stories, trendingTags, profile, userId, reactionsByStory = {}, myReactions = {}, events, voiceRooms }: Props) {
  const [tab, setTab] = useState<string>('vibe');
  const [showComposer, setShowComposer] = useState(false);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

  const level = profile ? getLevel(profile.total_points ?? 0) : null;
  const activeMobeurs = stories.length;

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

        {/* TAB — POUR TOI */}
        {tab === 'vibe' && (
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
                  <div style={{ width: 64, height: 64, borderRadius: 24, padding: 3, background: 'linear-gradient(135deg, #F26C1A, #E5337A)' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: 21, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {s.media_url ? (
                        <img src={s.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
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
              <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #0EA85B 0%, #0A8A4A 100%)', color: '#fff', padding: 18 }}>
                <div className="wax-stripe" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.13 }} />
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, opacity: 0.9, letterSpacing: 0.7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                    POULS · MAINTENANT
                  </div>
                  <div className="font-display" style={{ fontSize: 24, marginTop: 6, lineHeight: 1.05 }}>
                    {pulseHeadline(pulse)}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85, marginTop: 4, letterSpacing: 0.2 }}>
                    Basé sur les C&apos;comment actifs des arrêts · hors tarif
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {pulse.slice(0, 3).map((p, i) => {
                      const cat = p.top_category ? CATEGORY_META[p.top_category] : null;
                      return (
                        <div key={i} style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', textAlign: 'center', position: 'relative' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, letterSpacing: 0.4 }}>{p.commune.toUpperCase()}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2 }}>
                            {cat && <span style={{ fontSize: 13 }}>{cat.emoji}</span>}
                            <span style={{ fontSize: 13, fontWeight: 900, color: STATUS_COLORS[p.status], textTransform: 'capitalize' }}>
                              {cat ? cat.label.toLowerCase() : p.status}
                            </span>
                          </div>
                          {p.report_count > 0 && (
                            <div style={{ position: 'absolute', top: 4, right: 6, fontSize: 9, fontWeight: 900, color: '#fff', opacity: 0.9 }}>
                              {p.report_count}
                            </div>
                          )}
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

            {/* Masonry Feed */}
            <GbairaiFeed initialPosts={initialPosts} myLikes={myLikes} userId={userId} />
          </>
        )}

        {/* TAB — SPOTS DU MOMENT */}
        {tab === 'spots' && <SpotsTab hotSpots={hotSpots} />}

        {/* TAB — QUÊTES (placeholder) */}
        {tab === 'quetes' && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <div className="font-display" style={{ fontSize: 22, marginBottom: 8 }}>Quêtes collectives</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 280, margin: '0 auto' }}>Les quêtes pour cartographier Abidjan ensemble arrivent bientôt !</p>
            <div style={{ marginTop: 16, fontSize: 10, fontWeight: 900, background: 'var(--line)', padding: '6px 14px', borderRadius: 8, display: 'inline-block', color: 'var(--ink)' }}>BIENTÔT DISPONIBLE</div>
          </div>
        )}

        {/* TAB — CREWS (placeholder) */}
        {tab === 'crews' && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <div className="font-display" style={{ fontSize: 22, marginBottom: 8 }}>Crews de quartier</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 280, margin: '0 auto' }}>Forme ton crew et conquiers Abidjan ensemble.</p>
            <div style={{ marginTop: 16, fontSize: 10, fontWeight: 900, background: 'var(--line)', padding: '6px 14px', borderRadius: 8, display: 'inline-block', color: 'var(--ink)' }}>BIENTÔT DISPONIBLE</div>
          </div>
        )}
      </div>

      {/* Post Composer Modal */}
      {showComposer && profile && userId && (
        <PostComposer
          userId={userId}
          displayName={profile.display_name ?? 'Explorateur'}
          avatarEmoji={profile.avatar_emoji ?? '🧭'}
          commune={profile.origin_commune}
          onClose={() => setShowComposer(false)}
        />
      )}

      {/* Story Composer Modal */}
      {showStoryComposer && userId && (
        <StoryComposer 
          userId={userId} 
          onClose={() => setShowStoryComposer(false)} 
          onSuccess={() => window.location.reload()} 
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
    </div>
  );
}
