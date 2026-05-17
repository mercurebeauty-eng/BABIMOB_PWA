'use server';

import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

/**
 * Génère un token Agora pour rejoindre un salon.
 * Note: La génération du token se fait côté serveur pour la sécurité.
 */
export async function generateAgoraToken(channelName: string, uid: number): Promise<string> {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.warn('[AGORA] Certificat manquant. Utilisation du mode Test (pas de token).');
    return ''; 
  }

  try {
    const role = RtcRole.PUBLISHER;
    // Expiration in seconds (e.g. 24 hours)
    const expirationTimeInSeconds = 3600 * 24; 
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs // Optional: tokenExpire
    );

    return token;
  } catch (error) {
    console.error('[AGORA] Erreur lors de la génération du token:', error);
    return '';
  }
}
