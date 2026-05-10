'use server';

import { AccessToken } from 'livekit-server-sdk';

export async function generateLiveKitToken(roomName: string, participantIdentity: string, participantName: string) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit API credentials not configured on server');
    }

    if (!roomName || !participantIdentity) {
      throw new Error('roomName and participantIdentity are required');
    }

    // Clean identity to avoid issues with special characters
    const safeIdentity = participantIdentity.replace(/\s/g, '_');

    const at = new AccessToken(apiKey, apiSecret, {
      identity: safeIdentity,
      name: participantName || safeIdentity,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return { token, error: null };
  } catch (error: any) {
    console.error('SERVER_ACTION_LIVEKIT_ERROR:', error);
    return { token: null, error: error.message };
  }
}
