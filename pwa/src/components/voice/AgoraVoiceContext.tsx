import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

interface VoiceRoomContextType {
  client: IAgoraRTCClient | null;
  isConnected: boolean;
  joinRoom: (channel: string, token: string | null, uid: number) => Promise<void>;
  leaveRoom: () => Promise<void>;
  error: string | null;
}

const VoiceRoomContext = createContext<VoiceRoomContextType | undefined>(undefined);

export const useVoiceRoom = () => {
  const context = useContext(VoiceRoomContext);
  if (!context) {
    throw new Error('useVoiceRoom must be used within a VoiceRoomProvider');
  }
  return context;
};

interface VoiceRoomProviderProps {
  children: ReactNode;
  appId: string;
}

export const VoiceRoomProvider: React.FC<VoiceRoomProviderProps> = ({ children, appId }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialisation du client Agora au montage
    const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setClient(agoraClient);

    // Gestion des événements
    agoraClient.on('user-published', async (user, mediaType) => {
      await agoraClient.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    agoraClient.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        user.audioTrack?.stop();
      }
    });

    return () => {
      agoraClient.leave();
      setClient(null);
    };
  }, [appId]);

  const joinRoom = async (channel: string, token: string | null, uid: number) => {
    if (!client) return;
    setError(null);
    try {
      console.log('[AGORA] Tentative de connexion au salon:', channel);
      await client.join(appId, channel, token || null, uid);
      
      // Publication du flux audio local
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish(localAudioTrack);
      
      setIsConnected(true);
      console.log('[AGORA] Connecté avec succès !');
    } catch (err: any) {
      console.error('[AGORA] Erreur de connexion:', err);
      setError(err.message || 'Échec de la connexion au salon vocal');
      setIsConnected(false);
    }
  };

  const leaveRoom = async () => {
    if (!client) return;
    try {
      await client.leave();
      setIsConnected(false);
      console.log('[AGORA] Déconnecté du salon');
    } catch (err) {
      console.error('[AGORA] Erreur lors du départ:', err);
    }
  };

  return (
    <VoiceRoomContext.Provider value={{ client, isConnected, joinRoom, leaveRoom, error }}>
      {children}
    </VoiceRoomContext.Provider>
  );
};
