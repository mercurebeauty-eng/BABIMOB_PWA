import { createClient } from '@/lib/supabase/client';

export type POI = {
  id: string;
  place_id?: string;
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
async function fetchSupabasePlaces(
  minLat: number, maxLat: number,
  minLon: number, maxLon: number,
): Promise<POI[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('places')
    .select('*')
    .gte('lat', minLat)
    .lte('lat', maxLat)
    .gte('lon', minLon)
    .lte('lon', maxLon)
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
async function fetchOSMPlaces(
  centerLat: number, centerLon: number, radiusM: number,
): Promise<POI[]> {
  const query = `
    [out:json][timeout:25];
    (
      nwr["shop"](around:${radiusM},${centerLat},${centerLon});
      nwr["amenity"~"restaurant|cafe|bar|fast_food|marketplace|pharmacy"](around:${radiusM},${centerLat},${centerLon});
      nwr["healthcare"~"clinic|hospital"](around:${radiusM},${centerLat},${centerLon});
    );
    out center 60;
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

// ── Export principal — prend les bounds visibles de la carte ──────────────
export async function fetchNearbyPOIs(
  minLat: number, maxLat: number,
  minLon: number, maxLon: number,
): Promise<POI[]> {
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  // Rayon OSM = demi-diagonale des bounds en mètres (plafonné à 5km)
  const latDiff = (maxLat - minLat) * 111000;
  const lonDiff = (maxLon - minLon) * 111000 * Math.cos(centerLat * Math.PI / 180);
  const radiusM = Math.min(Math.sqrt(latDiff ** 2 + lonDiff ** 2) / 2, 5000);

  const [supabasePOIs, osmPOIs] = await Promise.all([
    fetchSupabasePlaces(minLat, maxLat, minLon, maxLon),
    fetchOSMPlaces(centerLat, centerLon, radiusM),
  ]);

  const supabaseOsmIds = new Set(supabasePOIs.filter(p => p.id.startsWith('osm-')).map(p => p.id));
  const filteredOSM = osmPOIs.filter(p => !supabaseOsmIds.has(p.id));

  const score = (p: POI) =>
    p.sponsor_tier === 'elite' ? 4 : p.has_campaign ? 3 : p.sponsor_tier === 'pro' ? 2 : p.source === 'supabase' ? 1 : 0;

  return [...supabasePOIs, ...filteredOSM].sort((a, b) => score(b) - score(a));
}
