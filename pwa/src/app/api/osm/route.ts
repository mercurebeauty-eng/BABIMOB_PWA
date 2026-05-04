import { NextResponse } from 'next/server';

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter'
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

        const res = await fetch(server, {
          method: 'POST',
          body: body,
          headers: {
            'Accept': 'application/json',
          },
          // On peut ajouter un signal d'abort si on veut, mais Next.js gère déjà les timeouts par défaut
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
        
        console.warn(`OSM Proxy: Server ${server} returned ${res.status}`);
      } catch (err) {
        console.error(`OSM Proxy error for ${server}:`, err);
      }
    }

    return NextResponse.json({ error: 'All OSM servers failed' }, { status: 502 });
  } catch (err) {
    console.error('OSM Proxy global error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
