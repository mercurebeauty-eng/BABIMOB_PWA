'use server';

import { AccessToken } from 'livekit-server-sdk';

export async function generateLiveKitToken(roomName: string, participantIdentity: string, participantName: string) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('LIVEKIT_ERROR: Missing API Keys in environment');
      return { token: null, error: 'Configuration serveur incomplète (Clés manquantes)' };
    }

    if (!roomName || !participantIdentity) {
      return { token: null, error: 'Paramètres de salon ou utilisateur manquants' };
    }

    // Nettoyage de l'identité pour LiveKit (pas d'espaces, pas de caractères spéciaux bizarres)
    const safeIdentity = participantIdentity.replace(/[^a-zA-Z0-9_-]/g, '_');

    console.log(`ACTION: Génération token pour ${safeIdentity} dans ${roomName}`);

    const at = new AccessToken(apiKey, apiSecret, {
      identity: safeIdentity,
      name: participantName || safeIdentity,
      ttl: '2h', // Token valide 2 heures
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    console.log('ACTION: Token généré avec succès');
    return { token, error: null };
  } catch (error: any) {
    console.error('SERVER_ACTION_LIVEKIT_FATAL:', error);
    return { token: null, error: error.message || 'Erreur interne lors de la génération du token' };
  }
}
