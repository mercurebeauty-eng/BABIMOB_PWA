'use client';

import { useEffect, useState } from 'react';

type Hotspot = { id: string; lat: number; lon: number; intensity: number };

export function useHotspots() {
  const [heatMode, setHeatMode] = useState(false);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  useEffect(() => {
    if (heatMode && hotspots.length === 0) {
      import('@/lib/activity')
        .then((mod) => mod.fetchActivityHotspots())
        .then((data) => {
          setHotspots(data.map((h) => ({ 
            id: h.place_id, 
            lat: h.lat, 
            lon: h.lon, 
            intensity: h.count 
          })));
        });
    }
  }, [heatMode, hotspots.length]);

  return { heatMode, setHeatMode, hotspots };
}
