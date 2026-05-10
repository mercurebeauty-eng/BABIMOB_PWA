'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

interface Participant {
  id: string;
  name: string;
  avatar_emoji: string;
  is_speaking: boolean;
  is_muted: boolean;
  role: 'host' | 'speaker' | 'listener';
}

interface VoiceRoomUIProps {
  title: string;
  participants: Participant[];
  onClose: () => void;
}

export default function VoiceRoomUI({ title, participants, onClose }: VoiceRoomUIProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [showReactions, setShowReactions] = useState(false);

  const host = participants.find(p => p.role === 'host');
  const speakers = participants.filter(p => p.role === 'speaker').slice(0, 4);
  const listeners = participants.filter(p => p.role === 'listener');

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: '#0A0D14',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    fontFamily: 'Inter, sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    padding: '20px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)'
  };

  const controlsStyle: React.CSSProperties = {
    padding: '24px 16px calc(env(safe-area-inset-bottom, 20px) + 10px)',
    background: 'rgba(10, 13, 20, 0.95)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={containerStyle}
    >
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', padding: 8 }}>
          <Ic.ChevronDown s={24} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#F26C1A', letterSpacing: 1, marginBottom: 2 }}>LIVE GBAIRAI</div>
          <div className="font-display" style={{ fontSize: 18, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
        </div>
        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 800 }}>
          PARTAGER
        </button>
      </div>

      {/* Main Content (Scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        
        {/* Speakers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
          {/* Host */}
          {host && <SpeakerAvatar participant={host} isHost />}
          
          {/* Other Speakers */}
          {speakers.map(s => (
            <SpeakerAvatar key={s.id} participant={s} />
          ))}

          {/* Empty Slots if < 5 total speakers */}
          {Array.from({ length: 4 - speakers.length }).map((_, i) => (
            <div key={`empty-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.3 }}>
              <div style={{ width: 80, height: 80, borderRadius: 32, border: '2px dashed #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                ➕
              </div>
              <div style={{ fontSize: 11, marginTop: 8, fontWeight: 700 }}>Libre</div>
            </div>
          ))}
        </div>

        {/* Listeners Section */}
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>AUDITEURS ({listeners.length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {listeners.map(l => (
              <div key={l.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48 }}>
                <div style={{ width: 48, height: 48, borderRadius: 18, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {l.avatar_emoji}
                </div>
                <div style={{ fontSize: 9, marginTop: 4, fontWeight: 600, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.name.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div style={controlsStyle}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="press"
            style={{ 
              width: 56, height: 56, borderRadius: 28, border: 'none',
              background: isMuted ? 'rgba(255,255,255,0.1)' : '#F26C1A',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isMuted ? 'none' : '0 0 20px rgba(242,108,26,0.4)'
            }}
          >
            {isMuted ? <Ic.MicOff s={24} /> : <Ic.Mic s={24} />}
          </button>
          
          <button 
            onClick={() => setShowReactions(!showReactions)}
            className="press"
            style={{ 
              width: 56, height: 56, borderRadius: 28, border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: 24 }}>😊</span>
          </button>
        </div>

        <button 
          className="press"
          style={{ 
            padding: '0 24px', height: 56, borderRadius: 28, border: 'none',
            background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800, fontSize: 14
          }}
        >
          ✋ LEVER LA MAIN
        </button>

        <button 
          onClick={onClose}
          className="press"
          style={{ 
            padding: '0 24px', height: 56, borderRadius: 28, border: 'none',
            background: '#FF3B30', color: '#fff', fontWeight: 800, fontSize: 14
          }}
        >
          QUITTER
        </button>
      </div>
    </motion.div>
  );
}

function SpeakerAvatar({ participant, isHost = false }: { participant: Participant, isHost?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {/* Animated Voice Waves */}
        {participant.is_speaking && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ 
              position: 'absolute', inset: -8, borderRadius: 36, 
              border: `2px solid ${isHost ? '#F26C1A' : '#E5337A'}`,
              zIndex: 0
            }} 
          />
        )}
        
        <div style={{ 
          position: 'relative', zIndex: 1, width: '100%', height: '100%', 
          borderRadius: 32, background: 'rgba(255,255,255,0.1)', 
          border: `3px solid ${participant.is_speaking ? (isHost ? '#F26C1A' : '#E5337A') : 'transparent'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
          boxShadow: participant.is_speaking ? `0 0 20px ${isHost ? 'rgba(242,108,26,0.3)' : 'rgba(229,51,122,0.3)'}` : 'none'
        }}>
          {participant.avatar_emoji}
          
          {/* Muted Badge */}
          {participant.is_muted && (
            <div style={{ 
              position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, 
              borderRadius: 12, background: '#1A1D23', border: '2px solid #0A0D14',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Ic.MicOff s={12} />
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {participant.name} {isHost && '👑'}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
          {isHost ? 'Hôte' : 'Speaker'}
        </div>
      </div>
    </div>
  );
}
