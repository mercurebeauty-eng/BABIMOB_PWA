'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl/maplibre';

type Checkin = {
  lat: number;
  lon: number;
  weight: number;
};

export default function PersonalHeatmap({ checkins }: { checkins: any[] }) {
  const mapRef = useRef<MapRef>(null);
  const [mounted, setMounted] = useState(false);

  const heatmapData = useMemo(() => {
    if (!checkins || checkins.length === 0) return null;
    
    const geoGroups: Record<string, number> = {};
    checkins.forEach(c => {
      if (c.lat && c.lon) {
        const key = `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`;
        geoGroups[key] = (geoGroups[key] || 0) + 1;
      }
    });

    const features = Object.entries(geoGroups).map(([key, count]) => {
      const [lat, lon] = key.split(',').map(Number);
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [lon, lat]
        },
        properties: {
          weight: count
        }
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [checkins]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fit bounds when data changes
  useEffect(() => {
    if (!mapRef.current || !heatmapData || heatmapData.features.length === 0) return;
    
    const lons = heatmapData.features.map(f => f.geometry.coordinates[0]);
    const lats = heatmapData.features.map(f => f.geometry.coordinates[1]);
    
    mapRef.current.fitBounds(
      [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
      { padding: 40, duration: 1000 }
    );
  }, [heatmapData]);

  if (!mounted || !heatmapData || heatmapData.features.length === 0) return (
    <div className="w-full h-full bg-beige-100/50 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-beige-muted">
       Pas encore d&apos;activité enregistrée
    </div>
  );

  return (
    <div className="w-full h-full relative rounded-[2rem] overflow-hidden grayscale contrast-125 brightness-110">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -4.0305,
          latitude: 5.3484,
          zoom: 11
        }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        dragPan={false}
        scrollZoom={false}
        boxZoom={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
      >
        <Source id="personal-heat-source" type="geojson" data={heatmapData}>
          <Layer
            id="personal-heat-layer"
            type="heatmap"
            paint={{
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 1, 0.5, 10, 1],
              'heatmap-intensity': 1,
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(255,122,0,0)',
                0.2, 'rgba(255,122,0,0.2)',
                0.4, 'rgba(255,122,0,0.4)',
                0.6, 'rgba(255,122,0,0.6)',
                0.8, '#FF7A00',
                1, '#ffffff'
              ],
              'heatmap-radius': 30,
              'heatmap-opacity': 0.7
            }}
          />
        </Source>
      </Map>
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
