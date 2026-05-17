'use server';

import { NextResponse } from 'next/server';

/**
 * Génère un token Agora pour rejoindre un salon.
 * Note: Pour une sécurité maximale, la génération de token devrait se faire côté serveur Node.js pur.
 * Ici, nous utilisons une approche simplifiée pour le prototype.
 * 
 * IMPORTANT: Pour la production, installez 'agora-access-token' et générez le token avec votre Certificate.
 * npm install agora-access-token
 */

export async function generateAgoraToken(channelName: string, uid: number): Promise<string> {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    // Mode test : retourne null pour utiliser le mode "No Security" d'Agora
    console.warn('[AGORA] Certificat manquant. Utilisation du mode Test (pas de token).');
    return ''; 
  }

  // TODO: Implémenter la vraie génération de token avec la librairie agora-access-token
  // Exemple:
  // const RtcTokenBuilder = require('agora-access-token').RtcTokenBuilder;
  // const role = RtcTokenBuilder.Role.RTC_PUBLISHER;
  // const expirationTimeInSecond = 3600;
  // const currentTimestamp = Math.floor(Date.now() / 1000);
  // const privilegeExpiredTs = currentTimestamp + expirationTimeInSecond;
  // return RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);

  console.error('[AGORA] Génération de token non implémentée sans librairie.');
  return '';
}
