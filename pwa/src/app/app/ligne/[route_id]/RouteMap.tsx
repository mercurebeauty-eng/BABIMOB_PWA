'use client';

import { useEffect, useRef, useMemo } from 'react';
import MapGL, { Source, Layer, MapRef, Marker } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type ShapePoint = { shape_pt_lat: number; shape_pt_lon: number };
type RouteStop = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_sequence: number;
};

type Props = {
  shape: ShapePoint[];
  stops: RouteStop[];
  routeColor?: string;
};

export default function RouteMap({ shape, stops, routeColor = '1565c0' }: Props) {
  const mapRef = useRef<MapRef>(null);

  const color = `#${routeColor}`;

  const routeGeojson = useMemo(() => {
    if (shape.length < 2) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: shape.map(p => [p.shape_pt_lon, p.shape_pt_lat]) // MapLibre takes [lon, lat]
          }
        }
      ]
    };
  }, [shape]);

  useEffect(() => {
    if (!mapRef.current) return;
    
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    
    if (shape.length > 1) {
      shape.forEach(p => {
        if (p.shape_pt_lon < minLon) minLon = p.shape_pt_lon;
        if (p.shape_pt_lon > maxLon) maxLon = p.shape_pt_lon;
        if (p.shape_pt_lat < minLat) minLat = p.shape_pt_lat;
        if (p.shape_pt_lat > maxLat) maxLat = p.shape_pt_lat;
      });
    } else if (stops.length > 0) {
      stops.forEach(s => {
        if (s.stop_lon < minLon) minLon = s.stop_lon;
        if (s.stop_lon > maxLon) maxLon = s.stop_lon;
        if (s.stop_lat < minLat) minLat = s.stop_lat;
        if (s.stop_lat > maxLat) maxLat = s.stop_lat;
      });
    } else {
      return;
    }

    const lonPad = (maxLon - minLon) * 0.1 || 0.01;
    const latPad = (maxLat - minLat) * 0.1 || 0.01;

    mapRef.current.fitBounds(
      [
        [minLon - lonPad, minLat - latPad],
        [maxLon + lonPad, maxLat + latPad]
      ],
      { padding: 24, duration: 1000 }
    );
  }, [shape, stops]);

  return (
    <div style={{ width: '100%', height: '220px' }}>
      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: -4.01,
          latitude: 5.35,
          zoom: 12
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/light-all-gl-style/style.json"
        interactive={false}
        attributionControl={false}
      >
        {routeGeojson && (
          <Source id="route-line" type="geojson" data={routeGeojson as any}>
            <Layer
              id="route-line-layer"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': color,
                'line-width': 4,
                'line-opacity': 0.85
              }}
            />
          </Source>
        )}

        {stops.map((stop, idx) => {
          const isEndpoint = idx === 0 || idx === stops.length - 1;
          const size = isEndpoint ? 14 : 8;
          const bg = isEndpoint ? color : '#ffffff';
          const border = color;

          return (
            <Marker key={stop.stop_id} longitude={stop.stop_lon} latitude={stop.stop_lat}>
              <div style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: bg,
                border: `2px solid ${border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                transform: 'translate(-50%, -50%)'
              }} />
            </Marker>
          );
        })}
      </MapGL>
    </div>
  );
}
