'use client';

import { useEffect, useState } from 'react';
import MapGL, { Source, Layer, MapRef } from 'react-map-gl';

type Checkin = {
  lat: number;
  lon: number;
  weight: number;
};

export default function PersonalHeatmap({ checkins }: { checkins: any[] }) {
  const [mounted, setMounted] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Checkin[]>([]);

  useEffect(() => {
    setMounted(true);
    // Process checkins to group by coordinates
    const geoGroups: Record<string, number> = {};
    checkins.forEach(c => {
      if (c.lat && c.lon) {
        const key = `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`;
        geoGroups[key] = (geoGroups[key] || 0) + 1;
      }
    });

    const data = Object.entries(geoGroups).map(([key, count]) => {
      const [lat, lon] = key.split(',').map(Number);
      return { lat, lon, weight: count };
    });
    setHeatmapData(data);
  }, [checkins]);

  if (!mounted || heatmapData.length === 0) return (
    <div className="w-full h-full bg-beige-100/50 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-beige-muted">
       Pas encore d&apos;activité enregistrée
    </div>
  );

  const center = { latitude: 5.3484, longitude: -4.0305 }; // Abidjan

  const geojson = {
    type: 'FeatureCollection',
    features: heatmapData.map(d => ({
      type: 'Feature',
      properties: { weight: d.weight },
      geometry: { type: 'Point', coordinates: [d.lon, d.lat] }
    }))
  };

  return (
    <div className="w-full h-full relative rounded-[2rem] overflow-hidden grayscale contrast-125 brightness-110">
      <MapGL 
        initialViewState={{
          ...center,
          zoom: 11
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        interactive={false}
        attributionControl={false}
      >
        <Source id="personal-heat" type="geojson" data={geojson as any}>
          {/* We emulate the CircleMarker with a circle layer */}
          <Layer
            id="heatmap-circles"
            type="circle"
            paint={{
              'circle-radius': ['+', 6, ['*', ['get', 'weight'], 2]],
              'circle-color': '#FF7A00',
              'circle-opacity': 0.4
            }}
          />
        </Source>
      </MapGL>
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
