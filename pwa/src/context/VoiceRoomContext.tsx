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
    // Vérifications de sécurité avant toute opération
    if (!activeRoom || !joined || !agoraClient) {
      // Nettoyage quand on quitte ou si les prérequis ne sont pas là
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
    
    // On capture les valeurs sûres dans des constantes pour TypeScript
    const client = agoraClient;
    const room = activeRoom;

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

        console.log('[AGORA] Tentative de connexion au salon:', room.id, 'UID:', uid);
        
        // Fetch dynamic token from server
        const { generateAgoraToken } = await import('@/app/actions/agora');
        const token = await generateAgoraToken(room.id, uid);
        
        await client.join(appId, room.id, token, uid);
        
        // Publication du flux audio local
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish(audioTrack);
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
