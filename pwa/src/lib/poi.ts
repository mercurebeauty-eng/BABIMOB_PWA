/**
 * Utility to fetch Points of Interest (POI) from OpenStreetMap using Overpass API.
 */
export type POI = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  category: 'food' | 'shop' | 'amenity' | 'other';
  is_sponsored?: boolean;
  promo?: string;
  logo_url?: string;
};

export async function fetchNearbyPOIs(supabase: any, lat: number, lon: number, radius = 1000): Promise<POI[]> {
  // 1. Fetch Sponsored POIs from DB
  const { data: sponsored } = await supabase
    .from('sponsored_places')
    .select('*')
    .filter('is_active', 'eq', true); // Simple filter, could be geographic RPC later

  const sponsoredPOIs: POI[] = (sponsored || []).map((s: any) => ({
    id: `sponsored-${s.id}`,
    name: s.name,
    lat: s.lat,
    lon: s.lon,
    type: s.category || 'poi',
    category: s.category as any,
    is_sponsored: true,
    promo: s.promo_text,
    logo_url: s.logo_url
  }));

  // 2. Overpass QL query to find organic shops, restaurants, and amenities
  // nwr means Node, Way, Relation. out center gets the center of ways/relations.
  const query = `
    [out:json][timeout:30];
    (
      nwr["shop"](around:${radius},${lat},${lon});
      nwr["amenity"~"restaurant|cafe|bar|fast_food|marketplace|bank|pharmacy"](around:${radius},${lat},${lon});
      nwr["leisure"~"park|garden"](around:${radius},${lat},${lon});
      nwr["tourism"~"hotel|guest_house|attraction"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });

    if (!response.ok) throw new Error('Overpass API error');
    
    const organicPOIs = (data.elements || []).map((el: any) => {
      let category: POI['category'] = 'other';
      if (el.tags.shop) category = 'shop';
      else if (el.tags.amenity?.match(/restaurant|cafe|bar|fast_food|marketplace/)) category = 'food';
      else if (el.tags.leisure?.match(/park|garden/) || el.tags.amenity?.match(/bank|pharmacy/) || el.tags.tourism) category = 'amenity';

      const pointLat = el.lat || el.center?.lat;
      const pointLon = el.lon || el.center?.lon;

      if (!pointLat || !pointLon) return null;

      return {
        id: `poi-${el.id}`,
        name: el.tags.name || el.tags.shop || el.tags.amenity || el.tags.tourism || 'Lieu',
        lat: pointLat,
        lon: pointLon,
        type: el.tags.shop || el.tags.amenity || el.tags.tourism || 'poi',
        category,
        is_sponsored: false,
      };
    }).filter(Boolean) as POI[];

    return [...sponsoredPOIs, ...organicPOIs];
  } catch (err) {
    console.error('Failed to fetch POIs', err);
    return sponsoredPOIs; // Return at least sponsored ones if OSM fails
  }
}
