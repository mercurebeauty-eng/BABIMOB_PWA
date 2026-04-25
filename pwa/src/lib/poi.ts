import { createClient } from '@/lib/supabase/client';

export type POI = {
  id: string;
  place_id?: string;       // UUID Supabase (pour /app/place/[id])
  name: string;
  lat: number;
  lon: number;
  category: 'food' | 'shop' | 'service' | 'health' | 'entertainment' | 'other';
  subcategory?: string;
  description?: string;
  address?: string;
  commune?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  logo_emoji: string;
  cover_color: string;
  is_sponsored: boolean;
  sponsor_tier: 'pro' | 'elite' | null;
  has_campaign: boolean;
  campaign_label?: string;
  source: 'supabase' | 'osm';
};

const CATEGORY_EMOJI: Record<string, string> = {
  food:          '🍽️',
  shop:          '🛍️',
  service:       '💼',
  health:        '💊',
  entertainment: '🎭',
  other:         '🏢',
};

// ── 1. Places depuis Supabase (sponsorisées + vérifiées) ──────────────────
async function fetchSupabasePlaces(lat: number, lon: number, radiusKm = 1.5): Promise<POI[]> {
  const supabase = createClient();
  const delta = radiusKm / 111;

  const { data, error } = await supabase
    .from('places')
    .select('*')
    .gte('lat', lat - delta)
    .lte('lat', lat + delta)
    .gte('lon', lon - delta)
    .lte('lon', lon + delta)
    .or('is_sponsored.eq.true,verified.eq.true');

  if (error || !data) return [];

  const now = new Date();
  return data
    .filter(p => !(p.is_sponsored && p.sponsor_expires_at && new Date(p.sponsor_expires_at) < now))
    .map(p => ({
      id:            p.osm_id ? `osm-${p.osm_id}` : `sp-${p.id}`,
      place_id:      p.id,
      name:          p.name,
      lat:           p.lat,
      lon:           p.lon,
      category:      p.category as POI['category'],
      subcategory:   p.subcategory ?? undefined,
      description:   p.description ?? undefined,
      address:       p.address ?? undefined,
      commune:       p.commune ?? undefined,
      phone:         p.phone ?? undefined,
      whatsapp:      p.whatsapp ?? undefined,
      instagram:     p.instagram ?? undefined,
      logo_emoji:    p.logo_emoji ?? CATEGORY_EMOJI[p.category] ?? '🏪',
      cover_color:   p.cover_color ?? '#FF7A00',
      is_sponsored:  p.is_sponsored && (!p.sponsor_expires_at || new Date(p.sponsor_expires_at) > now),
      sponsor_tier:  p.sponsor_tier as 'pro' | 'elite' | null,
      has_campaign:  p.has_campaign && (!p.campaign_expires_at || new Date(p.campaign_expires_at) > now),
      campaign_label: p.campaign_label ?? undefined,
      source:        'supabase' as const,
    }));
}

// ── 2. Places depuis OpenStreetMap (fallback) ─────────────────────────────
async function fetchOSMPlaces(lat: number, lon: number, radius = 1000): Promise<POI[]> {
  const query = `
    [out:json][timeout:25];
    (
      nwr["shop"](around:${radius},${lat},${lon});
      nwr["amenity"~"restaurant|cafe|bar|fast_food|marketplace|pharmacy"](around:${radius},${lat},${lon});
      nwr["healthcare"~"clinic|hospital"](around:${radius},${lat},${lon});
    );
    out center 40;
  `;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.elements || [])
      .map((el: any) => {
        const pointLat = el.lat ?? el.center?.lat;
        const pointLon = el.lon ?? el.center?.lon;
        if (!pointLat || !pointLon || !el.tags?.name) return null;
        let category: POI['category'] = 'other';
        if (el.tags.shop) category = 'shop';
        else if (el.tags.amenity?.match(/restaurant|cafe|bar|fast_food|marketplace/)) category = 'food';
        else if (el.tags.amenity === 'pharmacy' || el.tags.healthcare) category = 'health';
        return {
          id:          `osm-${el.id}`,
          name:        el.tags.name,
          lat:         pointLat,
          lon:         pointLon,
          category,
          subcategory: el.tags.shop || el.tags.amenity || el.tags.healthcare,
          logo_emoji:  CATEGORY_EMOJI[category] ?? '🏢',
          cover_color: '#8a93a2',
          is_sponsored: false,
          sponsor_tier: null,
          has_campaign: false,
          source:      'osm' as const,
        };
      })
      .filter(Boolean) as POI[];
  } catch {
    return [];
  }
}

// ── Export principal ──────────────────────────────────────────────────────
export async function fetchNearbyPOIs(lat: number, lon: number, radius = 1000): Promise<POI[]> {
  const [supabasePOIs, osmPOIs] = await Promise.all([
    fetchSupabasePlaces(lat, lon, radius / 1000),
    fetchOSMPlaces(lat, lon, radius),
  ]);

  // Déduplique OSM si la fiche existe déjà dans Supabase via osm_id
  const supabaseOsmIds = new Set(supabasePOIs.filter(p => p.id.startsWith('osm-')).map(p => p.id));
  const filteredOSM = osmPOIs.filter(p => !supabaseOsmIds.has(p.id));

  // Tri : elite > campagne active > pro > OSM
  const score = (p: POI) =>
    p.sponsor_tier === 'elite' ? 4 : p.has_campaign ? 3 : p.sponsor_tier === 'pro' ? 2 : p.source === 'supabase' ? 1 : 0;

  return [...supabasePOIs, ...filteredOSM].sort((a, b) => score(b) - score(a));
}
