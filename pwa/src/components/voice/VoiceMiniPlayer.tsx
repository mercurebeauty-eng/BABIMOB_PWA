'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Ic } from '@/components/ui/Ic';
import { useVoiceRoom } from '@/context/VoiceRoomContext';

export function VoiceMiniPlayer() {
  const { activeRoom, isMiniPlayer, setIsMiniPlayer, joined, setJoined, isMuted, setIsMuted } = useVoiceRoom();
  const router = useRouter();

  if (!activeRoom || !isMiniPlayer || !joined) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.8 }}
      whileDrag={{ scale: 1.05 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: -500, bottom: 0 }}
      dragElastic={0.1}
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
        right: '16px',
        background: 'rgba(25, 25, 25, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 24,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        zIndex: 9500,
        cursor: 'grab'
      }}
      onTap={() => {
        setIsMiniPlayer(false);
        router.push(`/app/voice/${activeRoom.id}`);
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        {activeRoom.emoji || '🎙️'}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100, maxWidth: 140 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeRoom.title}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--orange)' }}>
          {activeRoom.participants_count || 1} Mobeurs
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: isMuted ? 'rgba(255,255,255,0.1)' : 'var(--orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {isMuted ? <Ic.MicOff s={16} /> : <Ic.Mic s={16} />}
        </button>
        <button 
          onClick={() => {
            setJoined(false);
            setIsMiniPlayer(false);
          }}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,59,48,0.15)', color: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Ic.X s={16} />
        </button>
      </div>
    </motion.div>
  );
}
