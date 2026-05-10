'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceRoom } from '@/context/VoiceRoomContext';
import { Ic } from '@/components/ui/Ic';
import type { VoiceRoom, VoiceParticipant, VoiceRoomComment, VoiceSpeakerRequest, FloatingReaction } from '@/app/app/gbairai/types';

const CRED_BADGE: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', legend: '👑' };
const MODE_LABEL: Record<string, string> = { classic: '🎙️ Classic', debate: '⚔️ Débat', hot_seat: '🔥 Hot Seat', lightning: '⚡ Lightning' };

// Simulate an audio visualizer
function AudioVisualizer({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 16, justifyContent: 'center' }}>
      {[0.5, 0.8, 1, 0.7, 0.4].map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: ['20%', `${h * 100}%`, '20%'] }}
          transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: 'easeInOut' }}
          style={{ width: 3, background: '#fff', borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

function SpeakingRing({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `2px solid ${active ? '#E5337A' : 'transparent'}`, transition: 'all 0.3s' }}>
      {active && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(229,51,122,0.4)', animation: 'ping 1.5s infinite' }} />}
    </div>
  );
}

function UpvoteArc({ score, threshold }: { score: number; threshold: number }) {
  const pct = Math.min(100, (score / threshold) * 100);
  return (
    <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 8 }}>
      <motion.div 
        animate={{ width: `${pct}%` }} 
        style={{ height: '100%', background: pct >= 100 ? 'linear-gradient(90deg, #0EA85B, #17D97B)' : 'linear-gradient(90deg, #E5337A, #FF4D95)', borderRadius: 2 }} 
      />
    </div>
  );
}

interface Props {
  room: VoiceRoom;
  participants: VoiceParticipant[];
  comments: VoiceRoomComment[];
  requests: VoiceSpeakerRequest[];
  userId: string | null;
  isHost: boolean;
  myRole: 'host' | 'speaker' | 'listener' | null;
  canRequestSpeak: boolean;
  myUpvotedComments: Set<string>;
  onUpvoteComment: (id: string, isHost: boolean) => void;
  onPostComment: (text: string) => void;
  onRequestSpeak: () => void;
  onApproveRequest: (reqId: string) => void;
  onTogglePrivacy: () => void;
  onLeave: () => void;
}

export default function VoiceRoomUI({
  room, participants, comments, requests,
  userId, isHost, myRole, canRequestSpeak, myUpvotedComments,
  onUpvoteComment, onPostComment, onRequestSpeak, onTogglePrivacy, onLeave, onApproveRequest,
}: Props) {
  const { setIsMiniPlayer, isMuted, setIsMuted } = useVoiceRoom();
  const [commentText, setCommentText] = useState('');
  const [showRequests, setShowRequests] = useState(false);
  const [hostToast, setHostToast] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const speakers = participants.filter(p => p.role === 'host' || p.role === 'speaker');
  const listeners = participants.filter(p => p.role === 'listener');

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleUpvote = (comment: VoiceRoomComment) => {
    onUpvoteComment(comment.id, isHost);
    if (isHost && !comment.host_upvoted) {
      setHostToast(`👆 ${comment.display_name} peut maintenant demander la parole !`);
      setTimeout(() => setHostToast(null), 4000);
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    onPostComment(commentText);
    setCommentText('');
  };

  const triggerReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: Date.now().toString() + Math.random().toString(),
      emoji,
      user_id: userId || 'anon',
      created_at: Date.now()
    };
    setFloatingReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2000);
  };

  return (
    <div style={{ 
      position: 'relative',
      minHeight: '100dvh', 
      background: 'url(/app/images/noise.png), linear-gradient(145deg, #1A0B2E 0%, #0F0F1A 40%, #1A0B1A 100%)', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '40%', background: 'radial-gradient(circle, rgba(229,51,122,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '50%', background: 'radial-gradient(circle, rgba(14,168,91,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      {/* ── Header Glassmorphism ── */}
      <div style={{ 
        padding: 'env(safe-area-inset-top, 16px) 20px 16px', 
        display: 'flex', alignItems: 'center', gap: 12, 
        background: 'rgba(255,255,255,0.03)', 
        backdropFilter: 'blur(30px) saturate(150%)',
        WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        zIndex: 20
      }}>
        <button onClick={() => setIsMiniPlayer(true)} style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic.ChevronDown s={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', textTransform: 'uppercase' }}>{MODE_LABEL[room.room_mode]}</span>
            {room.is_live && <span style={{ fontSize: 10, fontWeight: 900, color: '#FF3B30', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#FF3B30', animation: 'ping 1.5s infinite' }}/> LIVE</span>}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {room.emoji} {room.title}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isHost && (
            <button onClick={onTogglePrivacy} style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: room.is_private ? 'rgba(229,51,122,0.15)' : 'rgba(14,168,91,0.15)', color: room.is_private ? '#FF4D95' : '#17D97B', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {room.is_private ? '🔒' : '🌍'}
            </button>
          )}
          {isHost && (
            <button onClick={() => setShowRequests(true)} style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🙋
              {requests.length > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#E5337A', borderRadius: '50%', width: 20, height: 20, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1A0B2E' }}>{requests.length}</span>}
            </button>
          )}
        </div>
      </div>

      {/* ── Host toast ── */}
      <AnimatePresence>
        {hostToast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            style={{ position: 'absolute', top: 100, left: 16, right: 16, zIndex: 100, padding: '12px 16px', borderRadius: 16, background: 'rgba(229,183,0,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)', color: '#1A0B2E', fontSize: 14, fontWeight: 800, textAlign: 'center', boxShadow: '0 10px 30px rgba(229,183,0,0.3)' }}>
            {hostToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stage (Speakers Arena) ── */}
      <div style={{ position: 'relative', padding: '32px 20px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
          {speakers.map(p => {
            const isMeSpeaker = p.user_id === userId;
            const speaking = isMeSpeaker ? !isMuted : p.is_speaking; // Simul for local user
            
            return (
            <motion.div key={p.user_id} layout style={{ textAlign: 'center', width: 84, position: 'relative' }}>
              <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 12px' }}>
                <div style={{ 
                  width: '100%', height: '100%', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, 
                  position: 'relative', zIndex: 1, 
                  border: p.role === 'host' ? '3px solid #E8B23C' : '2px solid rgba(255,255,255,0.2)' 
                }}>
                  {p.avatar_emoji || '👤'}
                </div>
                <SpeakingRing active={!!speaking} />
                {(isMeSpeaker ? isMuted : p.is_muted) && (
                  <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#FF3B30', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, border: '2px solid #1A0B2E', zIndex: 2 }}>
                    <Ic.MicOff s={12} />
                  </div>
                )}
                {speaking && (
                  <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                    <AudioVisualizer active={true} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: p.role === 'host' ? '#E8B23C' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.display_name || 'Anonyme'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {p.role === 'host' && '👑'} {p.cred_level && CRED_BADGE[p.cred_level]}
              </div>
              <UpvoteArc score={p.upvote_score} threshold={room.upvote_threshold} />
            </motion.div>
          )})}
        </div>
      </div>

      {/* ── Listeners / Audience Bar ── */}
      {listeners.length > 0 && (
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginRight: 8 }}>Audience</div>
          {listeners.map(l => (
            <div key={l.user_id} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              {l.avatar_emoji}
            </div>
          ))}
          <div style={{ padding: '0 12px', height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
            + {listeners.length}
          </div>
        </div>
      )}

      {/* ── Chat Feed ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12, maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
        {comments.map(c => {
          const alreadyUpvoted = myUpvotedComments.has(c.id);
          const isMe = c.user_id === userId;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.avatar_emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: c.host_upvoted ? '#E8B23C' : 'rgba(255,255,255,0.7)' }}>{c.display_name}</span>
                  {c.host_upvoted && <span style={{ fontSize: 10 }}>⭐ Validé</span>}
                </div>
                <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.4, wordBreak: 'break-word' }}>{c.content}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                  <button onClick={() => handleUpvote(c)} disabled={alreadyUpvoted}
                    style={{ background: alreadyUpvoted ? 'rgba(229,51,122,0.15)' : 'rgba(255,255,255,0.05)', border: 'none', cursor: alreadyUpvoted ? 'default' : 'pointer', fontSize: 11, fontWeight: 700, color: alreadyUpvoted ? '#FF4D95' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, transition: 'all 0.2s' }}>
                    {alreadyUpvoted ? '🔥' : '🤍'} {c.upvotes > 0 && c.upvotes}
                  </button>
                  {isHost && !c.host_upvoted && !isMe && (
                    <button onClick={() => handleUpvote(c)}
                      style={{ padding: '4px 10px', borderRadius: 12, border: '1px solid rgba(232,178,60,0.4)', background: 'rgba(232,178,60,0.1)', color: '#E8B23C', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                      ⭐ Créditer
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {comments.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>💭</div>
            Le salon est calme.<br/>Envoie un message pour réagir.
          </div>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* ── Reaction Bar & Actions ── */}
      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {['🔥', '👏', '😂', '💯', '❤️'].map(emoji => (
            <button key={emoji} onClick={() => triggerReaction(emoji)} style={{ flex: 1, padding: '8px 0', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 20, cursor: 'pointer' }}>
              {emoji}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendComment()}
            placeholder="Écrire un message..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleSendComment} style={{ width: 44, height: 44, borderRadius: '50%', background: commentText.trim() ? '#E5337A' : 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
            <Ic.Send s={20} />
          </button>
        </div>
      </div>

      {/* ── Bottom Fixed Actions (Mic, Request, Leave) ── */}
      <div style={{ padding: '16px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12 }}>
        
        {myRole === 'listener' && !isHost && (
          <motion.button
            onClick={onRequestSpeak}
            disabled={!canRequestSpeak}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: '16px', borderRadius: 20, border: 'none', background: canRequestSpeak ? 'linear-gradient(135deg, #0EA85B, #0A6E3D)' : 'rgba(255,255,255,0.05)', color: canRequestSpeak ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 900, cursor: canRequestSpeak ? 'pointer' : 'not-allowed', boxShadow: canRequestSpeak ? '0 10px 30px rgba(14,168,91,0.3)' : 'none', transition: 'all 0.3s' }}>
            {canRequestSpeak ? '✋ Lever la main' : `🤍 ${(room.upvote_threshold)} upvotes requis`}
          </motion.button>
        )}

        {(myRole === 'host' || myRole === 'speaker') && (
          <motion.button 
            whileTap={{ scale: 0.95 }} 
            onClick={() => setIsMuted(!isMuted)}
            style={{ flex: 1, padding: '16px', borderRadius: 20, border: 'none', background: isMuted ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #E5337A, #C12763)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: isMuted ? 'none' : '0 10px 30px rgba(229,51,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {isMuted ? <Ic.MicOff s={20} /> : <Ic.Mic s={20} />} {isMuted ? 'Micro Coupé' : 'En direct'}
          </motion.button>
        )}

        <button onClick={onLeave} style={{ width: 56, height: 56, borderRadius: 20, background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', color: '#FF3B30', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ic.X s={24} />
        </button>
      </div>

      {/* ── Floating Reactions ── */}
      {floatingReactions.map(r => (
        <motion.div
          key={r.id}
          initial={{ y: 0, opacity: 1, scale: 0.5, x: Math.random() * 40 - 20 }}
          animate={{ y: -200, opacity: 0, scale: 1.5, x: Math.random() * 100 - 50 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          style={{ position: 'absolute', bottom: 150, right: 30, fontSize: 32, pointerEvents: 'none', zIndex: 100 }}
        >
          {r.emoji}
        </motion.div>
      ))}

      {/* ── Speaker Requests modal ── */}
      <AnimatePresence>
        {showRequests && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowRequests(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', background: 'linear-gradient(180deg, rgba(30,20,50,0.95), rgba(10,10,20,0.95))', borderRadius: '32px 32px 0 0', padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Demandes de parole ({requests.length})
                <button onClick={() => setShowRequests(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24 }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '50vh', overflowY: 'auto' }}>
                {requests.map(req => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{req.display_name?.charAt(0) || '👤'}</div>
                    <div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{req.display_name || req.user_id}</div>
                    <button onClick={() => { onApproveRequest(req.id); setShowRequests(false); }}
                      style={{ padding: '10px 20px', borderRadius: 16, background: '#17D97B', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                      Accepter
                    </button>
                  </div>
                ))}
                {requests.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px 0' }}>Aucune demande en attente.</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
