'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  token: string | null;
}

const VoiceRoomContext = createContext<VoiceRoomContextType | undefined>(undefined);

import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

export function VoiceRoomProvider({ children }: { children: ReactNode }) {
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Ideally we would pass user info in the Context or fetch from DataStore
    // For now, if activeRoom and joined, fetch token using generic name or fetch from localStorage
    if (activeRoom && joined) {
      const storedUser = localStorage.getItem('babimob_user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userId = user?.id || 'anon-' + Math.random().toString(36).substr(2, 9);
      const displayName = user?.display_name || 'Mobeur Anonyme';

      fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomName: activeRoom.id, 
          participantIdentity: userId,
          participantName: displayName,
          isHost: false 
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) setToken(data.token);
      })
      .catch(console.error);
    } else {
      setToken(null);
    }
  }, [activeRoom, joined]);

  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  return (
    <VoiceRoomContext.Provider 
      value={{ 
        activeRoom, setActiveRoom, 
        isMiniPlayer, setIsMiniPlayer,
        isMuted, setIsMuted,
        joined, setJoined,
        token
      }}
    >
      {token && liveKitUrl ? (
        <LiveKitRoom
          video={false}
          audio={!isMuted} // Controlled by the global mute state
          token={token}
          serverUrl={liveKitUrl}
          connect={joined}
          style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}
        >
          <RoomAudioRenderer />
          {children}
        </LiveKitRoom>
      ) : (
        children
      )}
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
