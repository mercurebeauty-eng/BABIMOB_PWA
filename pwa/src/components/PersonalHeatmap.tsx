'use client';

import { useEffect, useRef } from 'react';
import MapGL, { Source, Layer, MapRef } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  data: { lat: number; lon: number }[];
};

export default function PersonalHeatmap({ data }: Props) {
  const mapRef = useRef<MapRef>(null);

  const geojson = {
    type: 'FeatureCollection',
    features: data.map(d => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [d.lon, d.lat] }
    }))
  };

  useEffect(() => {
    // Fit map bounds to data on load or data change
    if (data.length > 0 && mapRef.current) {
      const lons = data.map(d => d.lon);
      const lats = data.map(d => d.lat);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      // Pad bounds slightly
      const lonPad = (maxLon - minLon) * 0.1 || 0.05;
      const latPad = (maxLat - minLat) * 0.1 || 0.05;

      mapRef.current.fitBounds(
        [
          [minLon - lonPad, minLat - latPad], // SW
          [maxLon + lonPad, maxLat + latPad]  // NE
        ],
        { padding: 20, duration: 1000 }
      );
    }
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full rounded-[2rem] overflow-hidden grayscale contrast-125">
        <MapGL
          ref={mapRef}
          initialViewState={{
            longitude: -4.0,
            latitude: 5.36,
            zoom: 11
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/light-all-gl-style/style.json"
          interactive={false}
          attributionControl={false}
        >
          {data.length > 0 && (
            <Source id="heat-data" type="geojson" data={geojson as any}>
              {/* High opacity small center */}
              <Layer
                id="heat-center"
                type="circle"
                paint={{
                  'circle-radius': 12,
                  'circle-color': '#FF7A00',
                  'circle-opacity': 0.15,
                  'circle-blur': 0.5
                }}
              />
              {/* Larger faint outer glow */}
              <Layer
                id="heat-glow"
                type="circle"
                paint={{
                  'circle-radius': 40,
                  'circle-color': '#FF7A00',
                  'circle-opacity': 0.05,
                  'circle-blur': 1
                }}
              />
            </Source>
          )}
        </MapGL>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-abidjan-orange/5 to-transparent pointer-events-none" />
    </div>
  );
}
