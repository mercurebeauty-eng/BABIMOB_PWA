'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { VoiceRoomMode } from '@/app/app/gbairai/types';

interface Props {
  userId: string;
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

const MODES: { id: VoiceRoomMode; label: string; icon: string; desc: string }[] = [
  { id: 'classic', label: '🎙️ Classic', icon: '🎙️', desc: 'Libre échange méritocratique' },
  { id: 'debate', label: '⚔️ Débat', icon: '⚔️', desc: 'Pour vs Contre avec scores' },
  { id: 'hot_seat', label: '🔥 Hot Seat', icon: '🔥', desc: 'Le public pose les questions' },
  { id: 'lightning', label: '⚡ Lightning', icon: '⚡', desc: '60s chrono par personne' },
];

const EMOJIS = ['🎙️', '🔥', '⚔️', '⚡', '⚽', '🎶', '💡', '🥘', '💎', '👑'];

export default function CreateVoiceRoomModal({ userId, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎙️');
  const [mode, setMode] = useState<VoiceRoomMode>('classic');
  const [isPrivate, setIsPrivate] = useState(false);
  const [threshold, setThreshold] = useState(15);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCreate = async () => {
    if (!title.trim() || loading) return;
    setLoading(true);
    
    const { data, error } = await supabase.from('voice_rooms').insert({
      title: title.trim(),
      emoji: selectedEmoji,
      creator_id: userId,
      room_mode: mode,
      is_private: isPrivate,
      upvote_threshold: threshold,
      is_live: true,
      participants_count: 1
    }).select().single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Add creator as host participant
    await supabase.from('voice_room_participants').insert({
      room_id: data.id,
      user_id: userId,
      role: 'host',
      is_muted: false
    });

    onSuccess(data.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ width: '100%', background: 'linear-gradient(180deg, #1A0A2E 0%, #0D0D1A 100%)', borderRadius: '32px 32px 0 0', padding: '28px 24px', color: '#fff' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 24px' }} />
        
        <h2 className="font-display" style={{ fontSize: 24, marginBottom: 8 }}>Lancer un Gbairai 🎙️</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Crée un espace méritocratique où la parole se gagne.</p>

        {/* Title & Emoji */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              {selectedEmoji}
            </div>
            <select 
              value={selectedEmoji} 
              onChange={e => setSelectedEmoji(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            >
              {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <input 
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de ton salon..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '0 16px', color: '#fff', fontSize: 16, outline: 'none' }}
          />
        </div>

        {/* Mode Selector */}
        <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 12 }}>MODE DE SALON</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              textAlign: 'left', padding: 14, borderRadius: 18, border: `2px solid ${mode === m.id ? '#E5337A' : 'rgba(255,255,255,0.08)'}`,
              background: mode === m.id ? 'rgba(229,51,122,0.15)' : 'rgba(255,255,255,0.03)', color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button onClick={() => setIsPrivate(!isPrivate)} style={{
            flex: 1, padding: '14px', borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {isPrivate ? '🔒 Privé' : '🌍 Public'}
          </button>
          <div style={{ flex: 1, padding: '14px', borderRadius: 18, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>❤️ {threshold} upvotes</span>
          </div>
        </div>

        {/* Action */}
        <button 
          onClick={handleCreate}
          disabled={!title.trim() || loading}
          style={{
            width: '100%', padding: '18px', borderRadius: 20, border: 'none', 
            background: 'linear-gradient(135deg, #E5337A, #C12763)', color: '#fff',
            fontSize: 16, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 24px rgba(229,51,122,0.4)',
            opacity: !title.trim() || loading ? 0.5 : 1
          }}
        >
          {loading ? 'Création...' : 'LANCER LE GBAIRAI 🎙️'}
        </button>

        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </motion.div>
    </motion.div>
  );
}
