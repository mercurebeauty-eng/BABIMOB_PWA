import { createClient } from '@/lib/supabase/client';

export type ActivityHotspot = {
  place_id: string;
  place_name: string;
  lat: number;
  lon: number;
  count: number;
};

// Fetch activity hotspots based on place check-ins AND arret validations from the last 7 days.
export async function fetchActivityHotspots(): Promise<ActivityHotspot[]> {
  const supabase = createClient();
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch POI checkins
  const { data: checkins } = await supabase
    .from('checkins')
    .select('place_id, place_name, lat, lon')
    .gt('created_at', lastWeek)
    .not('lat', 'is', null)
    .not('lon', 'is', null);

  // 2. Fetch Arret validations
  const { data: arrets } = await supabase
    .from('arret_validations')
    .select('stop_id, stop_name, lat, lon')
    .gt('created_at', lastWeek)
    .not('lat', 'is', null)
    .not('lon', 'is', null);

  const counts: Record<string, { count: number; name: string; lat: number; lon: number }> = {};

  (checkins ?? []).forEach((c: any) => {
    if (!counts[c.place_id]) {
      counts[c.place_id] = { count: 0, name: c.place_name, lat: c.lat, lon: c.lon };
    }
    counts[c.place_id].count++;
  });

  (arrets ?? []).forEach((v: any) => {
    // We use stop_id as key, avoiding collision with place_id if possible (usually different formats)
    const key = `stop-${v.stop_id}`;
    if (!counts[key]) {
      counts[key] = { count: 0, name: v.stop_name, lat: v.lat, lon: v.lon };
    }
    counts[key].count += 1.5; // Arret validations have more weight for Transport Heatmap
  });

  return Object.entries(counts).map(([id, val]) => ({
    place_id: id,
    place_name: val.name,
    lat: val.lat,
    lon: val.lon,
    count: val.count,
  }));
}
