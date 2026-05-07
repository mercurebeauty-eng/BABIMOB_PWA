'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl/maplibre';

type Props = {
  data: { lat: number; lon: number }[];
};

export default function PersonalHeatmap({ data }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [mounted, setMounted] = useState(false);

  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    return {
      type: 'FeatureCollection' as const,
      features: data.map((p, i) => ({
        type: 'Feature' as const,
        id: i,
        geometry: {
          type: 'Point' as const,
          coordinates: [p.lon, p.lat]
        },
        properties: {}
      }))
    };
  }, [data]);

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

  if (!mounted || !heatmapData || heatmapData.features.length === 0) return null;

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full rounded-[2rem] overflow-hidden grayscale contrast-125">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: -4.0,
            latitude: 5.36,
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
          <Source id="personal-heat-comp-source" type="geojson" data={heatmapData}>
            <Layer
              id="personal-heat-comp-layer"
              type="heatmap"
              paint={{
                'heatmap-weight': 1,
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
                'heatmap-radius': 25,
                'heatmap-opacity': 0.6
              }}
            />
          </Source>
        </Map>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-abidjan-orange/5 to-transparent pointer-events-none" />
    </div>
  );
}
