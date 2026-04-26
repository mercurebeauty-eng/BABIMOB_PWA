import { createClient } from '@/lib/supabase/client';

export type ActivityHotspot = {
  place_id: string;
  place_name: string;
  lat: number;
  lon: number;
  count: number;
};

// Fetch activity hotspots based on place check-ins from the last 24 hours.
// lat/lon are stored directly on each check-in row (no join needed).
export async function fetchActivityHotspots(): Promise<ActivityHotspot[]> {
  const supabase = createClient();
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('checkins')
    .select('place_id, place_name, lat, lon')
    .gt('created_at', lastWeek)
    .not('lat', 'is', null)
    .not('lon', 'is', null);

  if (error || !data) return [];

  const counts: Record<string, { count: number; name: string; lat: number; lon: number }> = {};
  data.forEach((c: any) => {
    if (!counts[c.place_id]) {
      counts[c.place_id] = { count: 0, name: c.place_name, lat: c.lat, lon: c.lon };
    }
    counts[c.place_id].count++;
  });

  return Object.entries(counts).map(([id, val]) => ({
    place_id: id,
    place_name: val.name,
    lat: val.lat,
    lon: val.lon,
    count: val.count,
  }));
}
