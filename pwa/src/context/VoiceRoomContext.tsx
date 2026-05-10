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
  error: string | null;
}

const VoiceRoomContext = createContext<VoiceRoomContextType | undefined>(undefined);

import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

import { generateLiveKitToken } from '@/app/actions/livekit';

export function VoiceRoomProvider({ children }: { children: ReactNode }) {
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function getToken() {
      if (!activeRoom || !joined) {
        if (isMounted) setToken(null);
        return;
      }

      try {
        if (isMounted) setError(null);
        
        const storedUser = localStorage.getItem('babimob_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.id || 'anon-' + Math.random().toString(36).substr(2, 9);
        const displayName = user?.display_name || 'Mobeur Anonyme';

        console.log('CONTEXT - Appel Server Action pour room:', activeRoom.id);
        const result = await generateLiveKitToken(activeRoom.id, userId, displayName);

        if (isMounted) {
          if (result.error) {
            setError(result.error);
          } else {
            setToken(result.token);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('CONTEXT_ACTION_ERROR:', err);
          setError(err.message);
        }
      }
    }

    getToken();

    return () => {
      isMounted = false;
    };
  }, [activeRoom, joined]);

  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  console.log('VoiceRoomProvider - LiveKit URL:', liveKitUrl);
  console.log('VoiceRoomProvider - Token Present:', !!token);

  return (
    <VoiceRoomContext.Provider 
      value={{ 
        activeRoom, setActiveRoom, 
        isMiniPlayer, setIsMiniPlayer,
        isMuted, setIsMuted,
        joined, setJoined,
        token,
        error
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
