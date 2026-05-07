/**
 * Recherche OSM dans les tuiles vectorielles MapLibre + via Nominatim.
 *
 * - Rendered features: instantané, ne couvre que les tuiles chargées (viewport
 *   + zoom courant). Idéal pour suggérer ce que l'utilisateur voit déjà.
 * - Nominatim: complet, free-text, mais async + rate limit (proxy /api/geocode).
 *
 * Schéma OpenMapTiles utilisé par OpenFreeMap Liberty :
 *   - source-layer "poi" : restaurants, banques, écoles, hôpitaux, etc.
 *   - source-layer "place" : quartiers, communes, hameaux.
 */

import type { Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';

export type OSMRenderedHit = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: string | null;
  subcategory: string | null;
};

export type OSMNominatimHit = {
  id: string;
  name: string;
  fullName: string | null;
  lat: number;
  lon: number;
  category: string | null;
  subcategory: string | null;
  commune: string | null;
};

const POI_LAYERS = ['poi', 'place'];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function featureCenter(f: MapGeoJSONFeature): [number, number] | null {
  const g: any = f.geometry;
  if (!g) return null;
  if (g.type === 'Point') return [g.coordinates[1], g.coordinates[0]];
  if (g.type === 'Polygon' && g.coordinates?.[0]?.length) {
    const ring = g.coordinates[0];
    let lat = 0, lon = 0;
    for (const c of ring) { lon += c[0]; lat += c[1]; }
    return [lat / ring.length, lon / ring.length];
  }
  return null;
}

/**
 * Cherche dans les couches POI/place rendues actuellement par MapLibre.
 * Filtre côté client par sous-chaîne du nom (insensible aux accents).
 */
export function searchRenderedFeatures(
  map: MapLibreMap | null,
  query: string,
  limit = 6
): OSMRenderedHit[] {
  if (!map || !query || query.trim().length < 2) return [];

  let features: MapGeoJSONFeature[] = [];
  try {
    // Tente queryRenderedFeatures d'abord (visible) puis querySourceFeatures
    // (toutes tuiles chargées en cache). Les deux ne lèvent qu'en cas de
    // style non chargé.
    features = map.queryRenderedFeatures(undefined, { layers: POI_LAYERS } as any) ?? [];
  } catch {
    return [];
  }

  const needle = normalize(query.trim());
  const seen = new Set<string>();
  const hits: OSMRenderedHit[] = [];

  for (const f of features) {
    const props = f.properties ?? {};
    const rawName: string = props.name ?? props['name:fr'] ?? props['name:en'] ?? '';
    if (!rawName) continue;
    if (!normalize(rawName).includes(needle)) continue;

    const center = featureCenter(f);
    if (!center) continue;

    // Dédupe par nom + coordonnées arrondies (les tuiles découpent les features)
    const key = `${normalize(rawName)}@${center[0].toFixed(4)},${center[1].toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    hits.push({
      id: `osm-rendered-${f.id ?? key}`,
      name: rawName,
      lat: center[0],
      lon: center[1],
      category: (props.class as string) ?? null,
      subcategory: (props.subclass as string) ?? null,
    });

    if (hits.length >= limit) break;
  }

  return hits;
}

/**
 * Appelle le proxy Nominatim. Ne lève jamais — renvoie [] sur erreur.
 */
export async function searchNominatim(
  query: string,
  signal?: AbortSignal,
  limit = 6
): Promise<OSMNominatimHit[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const url = `/api/geocode?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch {
    return [];
  }
}

/**
 * Emoji par classe OSM (pour afficher une icône cohérente dans la liste).
 */
export function osmCategoryEmoji(category: string | null, subcategory: string | null): string {
  const c = (category ?? '').toLowerCase();
  const sc = (subcategory ?? '').toLowerCase();

  if (c === 'amenity') {
    if (['restaurant', 'fast_food', 'food_court'].includes(sc)) return '🍽️';
    if (['cafe', 'bar', 'pub'].includes(sc)) return '☕';
    if (['hospital', 'clinic', 'doctors'].includes(sc)) return '🏥';
    if (sc === 'pharmacy') return '💊';
    if (['school', 'university', 'college'].includes(sc)) return '🎓';
    if (['bank', 'atm'].includes(sc)) return '🏦';
    if (sc === 'fuel') return '⛽';
    if (['place_of_worship', 'mosque', 'church'].includes(sc)) return '🕌';
    if (sc === 'marketplace') return '🛍️';
    return '📍';
  }
  if (c === 'shop') return '🛍️';
  if (c === 'tourism') {
    if (['hotel', 'guest_house', 'hostel'].includes(sc)) return '🏨';
    return '📸';
  }
  if (c === 'leisure') return '🌳';
  if (c === 'highway') return '🛣️';
  if (c === 'place') {
    if (['city', 'town'].includes(sc)) return '🏙️';
    if (['village', 'hamlet', 'suburb', 'neighbourhood'].includes(sc)) return '🏘️';
    return '📌';
  }
  return '📍';
}
