'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VoiceRoom, VoiceParticipant, VoiceRoomComment, VoiceSpeakerRequest } from '@/app/app/gbairai/types';

const CRED_BADGE: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', legend: '👑' };
const MODE_LABEL: Record<string, string> = { classic: '🎙️ Classic', debate: '⚔️ Débat', hot_seat: '🔥 Hot Seat', lightning: '⚡ Lightning' };

function SpeakingRing({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${active ? '#E5337A' : 'transparent'}`, transition: 'all 0.3s' }}>
      {active && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(229,51,122,0.3)', animation: 'ping 1.5s infinite' }} />}
    </div>
  );
}

function UpvoteGauge({ score, threshold }: { score: number; threshold: number }) {
  const pct = Math.min(100, (score / threshold) * 100);
  return (
    <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginTop: 4 }}>
      <motion.div animate={{ width: `${pct}%` }} style={{ height: '100%', background: pct >= 100 ? '#0EA85B' : '#E5337A', borderRadius: 2 }} />
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
  const [commentText, setCommentText] = useState('');
  const [showRequests, setShowRequests] = useState(false);
  const [hostToast, setHostToast] = useState<string | null>(null);
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

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0D0D1A 0%, #1A0A2E 50%, #0D1A0D 100%)', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={onLeave} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{MODE_LABEL[room.room_mode]}</div>
          <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.1 }}>{room.emoji} {room.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isHost && (
            <button onClick={onTogglePrivacy} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: room.is_private ? 'rgba(229,51,122,0.3)' : 'rgba(14,168,91,0.3)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {room.is_private ? '🔒 Privé' : '🌍 Public'}
            </button>
          )}
          {isHost && requests.length > 0 && (
            <button onClick={() => setShowRequests(true)} style={{ position: 'relative', width: 36, height: 36, borderRadius: 12, background: 'rgba(229,183,0,0.25)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}>
              🙋
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#E5337A', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{requests.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Host toast ── */}
      <AnimatePresence>
        {hostToast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            style={{ margin: '8px 16px', padding: '10px 16px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(229,183,0,0.25), rgba(229,51,122,0.2))', border: '1px solid rgba(229,183,0,0.3)', fontSize: 13, fontWeight: 700 }}>
            {hostToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stage (Speakers) ── */}
      <div style={{ padding: '24px 20px 16px', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 20 }}>SCÈNE · {speakers.length} SPEAKER{speakers.length > 1 ? 'S' : ''}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
          {speakers.map(p => (
            <div key={p.user_id} style={{ textAlign: 'center', width: 70 }}>
              <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 8px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #E5337A, #C12763)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, position: 'relative', zIndex: 1, border: p.role === 'host' ? '2px solid #E8B23C' : '2px solid transparent' }}>
                  {p.avatar_emoji || '👤'}
                </div>
                <SpeakingRing active={!p.is_muted} />
                {p.is_muted && <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#FF3B30', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, zIndex: 2 }}>🔇</div>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: p.role === 'host' ? '#E8B23C' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name || 'Anonyme'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{p.role === 'host' ? '👑 Host' : '🎙️'}</div>
              <UpvoteGauge score={p.upvote_score} threshold={room.upvote_threshold} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Listeners count ── */}
      {listeners.length > 0 && (
        <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>👥 {listeners.length} auditeur{listeners.length > 1 ? 's' : ''}</div>
        </div>
      )}

      {/* ── Comments (public room only) ── */}
      {!room.is_private && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comments.map(c => {
              const alreadyUpvoted = myUpvotedComments.has(c.id);
              const isMe = c.user_id === userId;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, x: isMe ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{c.avatar_emoji}</div>
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: c.host_upvoted ? '#E8B23C' : 'rgba(255,255,255,0.5)', marginBottom: 2, textAlign: isMe ? 'right' : 'left' }}>
                      {c.display_name} {c.host_upvoted && '⭐'}
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: isMe ? 'rgba(229,51,122,0.25)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isMe ? 'rgba(229,51,122,0.3)' : 'rgba(255,255,255,0.1)'}`, fontSize: 13, lineHeight: 1.4 }}>{c.content}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
                      {!isMe && (
                        <button onClick={() => handleUpvote(c)} disabled={alreadyUpvoted}
                          style={{ background: 'none', border: 'none', cursor: alreadyUpvoted ? 'default' : 'pointer', fontSize: 13, color: alreadyUpvoted ? '#E8B23C' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 8, transition: 'all 0.2s' }}>
                          {alreadyUpvoted ? '❤️' : '🤍'} <span style={{ fontSize: 11, fontWeight: 700 }}>{c.upvotes}</span>
                        </button>
                      )}
                      {isHost && !c.host_upvoted && !isMe && (
                        <button onClick={() => handleUpvote(c)}
                          style={{ padding: '2px 8px', borderRadius: 8, border: '1px solid rgba(232,178,60,0.4)', background: 'rgba(232,178,60,0.1)', color: '#E8B23C', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                          ⭐ Créditer
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {comments.length === 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, padding: '32px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                Sois le premier à commenter.<br />Upvote tes commentaires pour demander la parole !
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment input */}
          <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendComment()}
              placeholder="Réagis en direct..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, outline: 'none' }}
            />
            <button onClick={handleSendComment} style={{ width: 40, height: 40, borderRadius: 12, background: '#E5337A', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
          </div>
        </div>
      )}

      {/* ── Bottom actions ── */}
      <div style={{ padding: '16px 20px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12 }}>
        {myRole === 'listener' && !isHost && (
          <motion.button
            onClick={onRequestSpeak}
            disabled={!canRequestSpeak}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: '14px', borderRadius: 18, border: 'none', background: canRequestSpeak ? 'linear-gradient(135deg, #E5337A, #C12763)' : 'rgba(255,255,255,0.08)', color: canRequestSpeak ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 900, cursor: canRequestSpeak ? 'pointer' : 'not-allowed', boxShadow: canRequestSpeak ? '0 8px 24px rgba(229,51,122,0.4)' : 'none', transition: 'all 0.3s' }}>
            {canRequestSpeak ? '🎙️ Demander la parole' : `🤍 ${(room.upvote_threshold)} upvotes pour parler`}
          </motion.button>
        )}
        {(myRole === 'host' || myRole === 'speaker') && (
          <motion.button whileTap={{ scale: 0.95 }} style={{ flex: 1, padding: '14px', borderRadius: 18, border: 'none', background: 'linear-gradient(135deg, #E5337A, #C12763)', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 24px rgba(229,51,122,0.4)' }}>
            🎙️ {myRole === 'host' ? 'Animer le salon' : 'Je parle'}
          </motion.button>
        )}
        <button onClick={onLeave} style={{ width: 52, height: 52, borderRadius: 18, background: 'rgba(255,59,48,0.2)', border: '1px solid rgba(255,59,48,0.3)', color: '#FF3B30', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* ── Speaker Requests modal ── */}
      <AnimatePresence>
        {showRequests && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowRequests(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', background: 'linear-gradient(180deg, #1A0A2E, #0D0D1A)', borderRadius: '24px 24px 0 0', padding: '24px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>🙋 Demandes de parole ({requests.length})</div>
              {requests.map(req => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{req.display_name || req.user_id}</div>
                  <button onClick={() => { onApproveRequest(req.id); setShowRequests(false); }}
                    style={{ padding: '8px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #0EA85B, #0A6E3D)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    ✅ Accepter
                  </button>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
