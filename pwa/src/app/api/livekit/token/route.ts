import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: NextRequest) {
  try {
    const { roomName, participantIdentity, participantName, isHost } = await req.json();

    if (!roomName || !participantIdentity) {
      return NextResponse.json({ error: 'roomName and participantIdentity are required' }, { status: 400 });
    }

    console.log('Generating token for room:', roomName, 'identity:', participantIdentity);

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    console.log('API Key presence:', !!apiKey);
    console.log('API Secret presence:', !!apiSecret);

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit API credentials not configured' }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName || participantIdentity,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true, // For simplicity in Phase 3, everyone can publish, we'll manage mute on the client
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('LIVEKIT_TOKEN_ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
