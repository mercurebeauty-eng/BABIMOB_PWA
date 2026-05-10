'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { VoiceRoom } from '@/app/app/gbairai/types';

interface VoiceRoomContextType {
  activeRoom: VoiceRoom | null;
  setActiveRoom: (room: VoiceRoom | null) => void;
  isMiniPlayer: boolean;
  setIsMiniPlayer: (isMini: boolean) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  joined: boolean;
  setJoined: (joined: boolean) => void;
}

const VoiceRoomContext = createContext<VoiceRoomContextType | undefined>(undefined);

export function VoiceRoomProvider({ children }: { children: ReactNode }) {
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [joined, setJoined] = useState(false);

  return (
    <VoiceRoomContext.Provider 
      value={{ 
        activeRoom, setActiveRoom, 
        isMiniPlayer, setIsMiniPlayer,
        isMuted, setIsMuted,
        joined, setJoined
      }}
    >
      {children}
    </VoiceRoomContext.Provider>
  );
}

export function useVoiceRoom() {
  const context = useContext(VoiceRoomContext);
  if (context === undefined) {
    throw new Error('useVoiceRoom must be used within a VoiceRoomProvider');
  }
  return context;
}
