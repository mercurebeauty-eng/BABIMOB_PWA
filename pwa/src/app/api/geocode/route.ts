import { NextResponse } from 'next/server';

// Proxy Nominatim (OSM geocoding). On force le User-Agent côté serveur et on
// restreint à la Côte d'Ivoire pour rester dans la politique d'usage Nominatim.
// Doc: https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const COUNTRY = 'ci';
// Cadre Abidjan élargi pour pondérer les résultats locaux
const VIEWBOX = '-4.30,5.45,-3.80,5.20'; // left,top,right,bottom

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '6', 10) || 6, 10);

  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL(NOMINATIM);
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', q);
  url.searchParams.set('countrycodes', COUNTRY);
  url.searchParams.set('viewbox', VIEWBOX);
  url.searchParams.set('bounded', '0');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('addressdetails', '1');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'BABIMOB-PWA/1.0 (contact: tech@babimob)',
        'Accept-Language': 'fr',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const raw = await res.json();
    const results = (Array.isArray(raw) ? raw : []).map((r: any) => ({
      id: `nominatim-${r.osm_type}-${r.osm_id}`,
      name: r.display_name?.split(',')[0] ?? r.name ?? 'Lieu',
      fullName: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      category: r.class as string,
      subcategory: r.type as string,
      commune:
        r.address?.suburb ??
        r.address?.city_district ??
        r.address?.municipality ??
        r.address?.city ??
        null,
    }));

    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.error('Nominatim proxy error:', err);
    }
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
