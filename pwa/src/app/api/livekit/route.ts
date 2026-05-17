import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');

  if (!room || !username) {
    return NextResponse.json({ error: 'Missing parameters: room and username are required' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    console.error('LiveKit configuration missing:', {
      hasKey: !!apiKey,
      hasSecret: !!apiSecret,
      hasUrl: !!wsUrl
    });
    return NextResponse.json({ error: 'Server misconfigured: LiveKit credentials missing' }, { status: 500 });
  }

  try {
    const token = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
      ttl: '15m',
    });

    token.addGrant({ 
      room, 
      roomJoin: true, 
      canPublish: true, 
      canSubscribe: true,
      canPublishData: true
    });

    const jwt = await token.toJwt();

    return NextResponse.json({ 
      token: jwt, 
      serverUrl: wsUrl,
      room,
      username
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
