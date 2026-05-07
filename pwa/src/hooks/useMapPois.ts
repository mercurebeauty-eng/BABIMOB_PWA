'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { POI } from '@/lib/poi';
import type { ReachSource } from './useReachTracking';

type RawLiveCheckin = {
  place_id: string;
  place_name: string;
  profile: { id: string | null; display_name: string | null; is_public_visits: boolean } | null;
};

export type LiveCheckin = RawLiveCheckin & { display_name: string };

type Options = {
  logReach: (userId: string, source: ReachSource) => void;
};

export function useMapPois({ logReach }: Options) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const mapRef = useRef<MapLibreMap | null>(null);
  const moveListenerRef = useRef<(() => void) | null>(null);

  const [pois, setPois] = useState<POI[]>([]);
  const [poiCheckins, setPoiCheckins] = useState<Record<string, number>>({});
  const [livePois, setLivePois] = useState<string[]>([]);
  const [liveTickerFeed, setLiveTickerFeed] = useState<LiveCheckin[]>([]);

  const logReachRef = useRef(logReach);
  // Keep logReachRef current without adding it to handleMapReady deps
  useCallback(() => { logReachRef.current = logReach; }, [logReach])();

  const handleMapReady = useCallback((map: MapLibreMap) => {
    mapRef.current = map;
    console.log("🗺️ MapReady in useMapPois");

    const loadPois = async () => {
      if (!map.getStyle()) {
        console.warn("⚠️ Map style not ready, skipping POI load");
        return;
      }
      
      const b = map.getBounds();
      if (!b || !b.getSouth()) {
        console.warn("⚠️ Map bounds not ready, skipping POI load");
        return;
      }

      console.log(`🔍 Loading POIs for bounds: S:${b.getSouth()} N:${b.getNorth()} W:${b.getWest()} E:${b.getEast()}`);

      try {
        const mod = await import('@/lib/poi');
        const fetchedPois = await mod.fetchNearbyPOIs(
          b.getSouth(), b.getNorth(), b.getWest(), b.getEast()
        );
        
        console.log(`✅ Fetched ${fetchedPois?.length || 0} POIs from hybrid source`);

        if (fetchedPois && fetchedPois.length > 0) {
          setPois(fetchedPois);
        } else {
          console.warn("⚠️ No POIs found in this area");
        }

        const placeIds = fetchedPois.length > 0 ? fetchedPois.map((p) => p.id) : pois.map(p => p.id);
        if (placeIds.length === 0) return;

        // Stats & Live
        const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: checkinsData, error: errC } = await supabase
          .from('checkins')
          .select('place_id')
          .in('place_id', placeIds)
          .gte('created_at', since7d);

        if (errC) console.error("❌ Error fetching checkins:", errC);

        if (checkinsData) {
          const counts: Record<string, number> = {};
          checkinsData.forEach((c: { place_id: string }) => {
            counts[c.place_id] = (counts[c.place_id] ?? 0) + 1;
          });
          setPoiCheckins(counts);
        }

        const since3h = new Date(Date.now() - 3 * 3600000).toISOString();
        const { data: liveData, error: errL } = await supabase
          .from('checkins')
          .select('place_id, place_name, profile:profiles(id, display_name, is_public_visits)')
          .in('place_id', placeIds)
          .gte('created_at', since3h)
          .order('created_at', { ascending: false });

        if (errL) console.error("❌ Error fetching live checkins:", errL);

        if (liveData) {
          const raw = liveData as unknown as RawLiveCheckin[];
          setLivePois(Array.from(new Set(raw.map((d) => d.place_id))));

          const filteredTicker: LiveCheckin[] = raw.map((d) => ({
            ...d,
            display_name: d.profile?.is_public_visits
              ? (d.profile.display_name ?? 'Un explorateur')
              : 'Un explorateur',
          })).slice(0, 5);

          setLiveTickerFeed(filteredTicker);
        }
      } catch (err) {
        console.error("❌ Failed to load POIs process:", err);
      }
    };

    moveListenerRef.current = loadPois;
    map.on('moveend', loadPois);
    
    // On force un premier chargement avec un petit délai pour laisser les bounds se stabiliser
    setTimeout(loadPois, 100);
    setTimeout(loadPois, 1000);
    setTimeout(loadPois, 3000); 
  // stable — all mutable values accessed via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pois, poiCheckins, livePois, liveTickerFeed, handleMapReady, mapRef };
}
