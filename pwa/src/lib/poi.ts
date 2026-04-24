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
};

export async function fetchNearbyPOIs(lat: number, lon: number, radius = 500): Promise<POI[]> {
  // Overpass QL query to find shops, restaurants, and amenities
  const query = `
    [out:json][timeout:25];
    (
      node["shop"](around:${radius},${lat},${lon});
      node["amenity"~"restaurant|cafe|bar|fast_food|marketplace"](around:${radius},${lat},${lon});
      node["leisure"~"park|garden"](around:${radius},${lat},${lon});
    );
    out body;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });

    if (!response.ok) throw new Error('Overpass API error');
    
    const data = await response.json();
    return (data.elements || []).map((el: any) => {
      let category: POI['category'] = 'other';
      if (el.tags.shop) category = 'shop';
      else if (el.tags.amenity?.match(/restaurant|cafe|bar|fast_food|marketplace/)) category = 'food';
      else if (el.tags.leisure?.match(/park|garden/)) category = 'amenity';

      return {
        id: `poi-${el.id}`,
        name: el.tags.name || el.tags.shop || el.tags.amenity || 'Lieu sans nom',
        lat: el.lat,
        lon: el.lon,
        type: el.tags.shop || el.tags.amenity || 'poi',
        category,
      };
    });
  } catch (err) {
    console.error('Failed to fetch POIs', err);
    return [];
  }
}
