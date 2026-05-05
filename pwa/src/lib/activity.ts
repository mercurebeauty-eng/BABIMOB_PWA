import { createClient } from '@/lib/supabase/client';

export type ActivityHotspot = {
  place_id: string;
  place_name: string;
  lat: number;
  lon: number;
  count: number;
};

// Fetch transport hotspots based ONLY on arret validations from the last 7 days.
export async function fetchActivityHotspots(): Promise<ActivityHotspot[]> {
  const supabase = createClient();
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch Arret validations (Pure Transport Heatmap)
  const { data: arrets } = await supabase
    .from('arret_validations')
    .select('stop_id, stop_name, lat, lon')
    .gt('created_at', lastWeek)
    .not('lat', 'is', null)
    .not('lon', 'is', null);

  const counts: Record<string, { count: number; name: string; lat: number; lon: number }> = {};

  (arrets ?? []).forEach((v: any) => {
    const key = `stop-${v.stop_id}`;
    if (!counts[key]) {
      counts[key] = { count: 0, name: v.stop_name, lat: v.lat, lon: v.lon };
    }
    counts[key].count++;
  });

  return Object.entries(counts).map(([id, val]) => ({
    place_id: id,
    place_name: val.name,
    lat: val.lat,
    lon: val.lon,
    count: val.count,
  }));
}
