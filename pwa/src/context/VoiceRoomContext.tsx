'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { VoiceRoom } from '@/app/app/gbairai/types';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

interface VoiceRoomContextType {
  activeRoom: VoiceRoom | null;
  setActiveRoom: (room: VoiceRoom | null) => void;
  isMiniPlayer: boolean;
  setIsMiniPlayer: (isMini: boolean) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  joined: boolean;
  setJoined: (joined: boolean) => void;
  error: string | null;
  agoraClient: IAgoraRTCClient | null;
  localAudioTrack: any | null;
}

const VoiceRoomContext = createContext<VoiceRoomContextType | undefined>(undefined);

export function VoiceRoomProvider({ children }: { children: ReactNode }) {
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraClient, setAgoraClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialisation du client Agora
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    if (!appId) {
      console.warn('[AGORA] APP_ID manquant dans les variables d\'environnement');
      return;
    }

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setAgoraClient(client);

    // Gestion des utilisateurs distants
    client.on('user-published', async (user: any, mediaType: any) => {
      console.log('[AGORA] Utilisateur distant publié:', user.uid);
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    client.on('user-unpublished', (user: any, mediaType: any) => {
      console.log('[AGORA] Utilisateur distant non publié:', user.uid);
    });

    return () => {
      client.leave();
      setAgoraClient(null);
    };
  }, []);

  // Connexion/Déconnexion au salon
  useEffect(() => {
    if (!activeRoom || !joined || !agoraClient) {
      // Nettoyage quand on quitte
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      setError(null);
      setIsConnecting(false);
      return;
    }

    let isMounted = true;

    async function handleConnection() {
      try {
        if (!isMounted) return;
        setIsConnecting(true);
        setError(null);

        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
        if (!appId) {
          throw new Error('APP_ID Agora non configuré');
        }

        // Récupération sécurisée de l'utilisateur
        const storedUser = localStorage.getItem('babimob_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        
        // On génère un UID unique si pas connecté
        const uid = user?.id ? parseInt(user.id) || Math.floor(Math.random() * 100000) : Math.floor(Math.random() * 100000);
        const displayName = user?.display_name || 'Mobeur';

        if (!activeRoom) {
            console.error('[AGORA] Erreur: activeRoom est null');
            return;
        }

        console.log('[AGORA] Tentative de connexion au salon:', activeRoom.id, 'UID:', uid);
        
        // Token vide pour le mode "No Security" (à remplacer par un token généré côté serveur en prod)
        const token = null;
        
        await agoraClient.join(appId, activeRoom.id, token, uid);
        
        // Publication du flux audio local
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish(audioTrack);
        setLocalAudioTrack(audioTrack);
        
        // Gestion du mute
        audioTrack.setEnabled(!isMuted);

        console.log('[AGORA] Connecté avec succès !');
        
      } catch (err: any) {
        console.error('[AGORA] Erreur de connexion:', err);
        if (isMounted) {
          setError(err.message || "Impossible de se connecter au salon vocal.");
        }
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    }

    handleConnection();

    return () => {
      isMounted = false;
    };
  }, [activeRoom?.id, joined, agoraClient]);

  // Gestion du mute/unmute
  useEffect(() => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!isMuted);
    }
  }, [isMuted, localAudioTrack]);

  return (
    <VoiceRoomContext.Provider 
      value={{ 
        activeRoom, setActiveRoom, 
        isMiniPlayer, setIsMiniPlayer,
        isMuted, setIsMuted,
        joined, setJoined,
        error,
        agoraClient,
        localAudioTrack
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
