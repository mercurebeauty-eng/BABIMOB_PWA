import { NextResponse } from 'next/server';

const OVERPASS_SERVERS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.osm.ch/api/interpreter'
];

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    for (const server of OVERPASS_SERVERS) {
      try {
        const body = new URLSearchParams();
        body.append('data', query);

        // Timeout de 8 secondes par serveur pour ne pas dépasser la limite Vercel globale (10s ou 60s)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(server, {
          method: 'POST',
          body: body,
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
        
        console.warn(`OSM Proxy: Server ${server} returned ${res.status}`);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`OSM Proxy: Server ${server} timed out`);
        } else {
          console.error(`OSM Proxy error for ${server}:`, err);
        }
      }
    }

    return NextResponse.json({ error: 'All OSM servers failed or timed out' }, { status: 504 });
  } catch (err) {
    console.error('OSM Proxy global error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
