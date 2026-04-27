'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { POI } from '@/lib/poi';
import type { ReachSource } from './useReachTracking';

type Options = {
  logReach: (userId: string, source: ReachSource) => void;
};

export function useMapPois({ logReach }: Options) {
  const supabase = createClient();
  const mapRef = useRef<any>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [poiCheckins, setPoiCheckins] = useState<Record<string, number>>({});
  const [livePois, setLivePois] = useState<string[]>([]);
  const [liveTickerFeed, setLiveTickerFeed] = useState<any[]>([]);

  const handleMapReady = useCallback((map: any) => {
    mapRef.current = map;

    const loadPois = async () => {
      const b = map.getBounds();
      const mod = await import('@/lib/poi');
      const fetchedPois = await mod.fetchNearbyPOIs(b.getSouth(), b.getNorth(), b.getWest(), b.getEast());
      setPois(fetchedPois);
      if (fetchedPois.length === 0) return;

      const placeIds = fetchedPois.map((p) => p.id);

      const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase
        .from('checkins').select('place_id')
        .in('place_id', placeIds)
        .gte('created_at', since7d);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((c: any) => { counts[c.place_id] = (counts[c.place_id] ?? 0) + 1; });
        setPoiCheckins(counts);
      }

      const since3h = new Date(Date.now() - 3 * 3600000).toISOString();
      const { data: liveData } = await supabase
        .from('checkins').select('place_id, profile:profiles(id, display_name, is_public_visits)')
        .in('place_id', placeIds)
        .gte('created_at', since3h)
        .order('created_at', { ascending: false });

      if (liveData) {
        setLivePois(Array.from(new Set(liveData.map((d: any) => d.place_id))));

        const filteredTicker = liveData.map((d: any) => ({
          ...d,
          display_name: d.profile?.is_public_visits ? d.profile.display_name : 'Un explorateur',
        })).slice(0, 5);

        setLiveTickerFeed(filteredTicker);
        filteredTicker.forEach((d: any) => {
          const uid = d.profile?.id;
          if (uid) logReach(uid, 'ticker');
        });
      }
    };

    map.on('moveend', loadPois);
    loadPois();
  }, [supabase, logReach]);

  return { pois, poiCheckins, livePois, liveTickerFeed, handleMapReady, mapRef };
}
