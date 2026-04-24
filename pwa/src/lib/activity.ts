import { createClient } from '@/lib/supabase/client';

export type ActivityHotspot = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  count: number;
};

/**
 * Fetch activity hotspots based on checkins from the last 24 hours.
 */
export async function fetchActivityHotspots(): Promise<ActivityHotspot[]> {
  const supabase = createClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Simple aggregation query
  // Note: Depending on your Supabase version, you might need a RPC or just count
  const { data, error } = await supabase
    .from('checkins')
    .select('stop_id, gtfs_stops(stop_name, stop_lat, stop_lon)')
    .gt('created_at', yesterday);

  if (error || !data) return [];

  // Manual aggregation for demonstration
  const counts: Record<string, { count: number; stop: any }> = {};
  data.forEach((c: any) => {
    if (!counts[c.stop_id]) {
      counts[c.stop_id] = { count: 0, stop: c.gtfs_stops };
    }
    counts[c.stop_id].count++;
  });

  return Object.entries(counts).map(([id, val]) => ({
    stop_id: id,
    stop_name: val.stop.stop_name,
    stop_lat: val.stop.stop_lat,
    stop_lon: val.stop.stop_lon,
    count: val.count,
  }));
}
