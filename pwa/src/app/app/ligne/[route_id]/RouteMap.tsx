'use client';

import { useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, Marker, MapRef } from 'react-map-gl/maplibre';

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
  isSegmented: boolean;
  // Optionnel: si on veut passer le tracé complet pour le segment "passé"
  fullShape?: ShapePoint[]; 
};

const ABIDJAN_CENTER = { latitude: 5.345, longitude: -4.020 };

export default function RouteMap({ shape, stops, routeColor = '1565c0', isSegmented }: Props) {
  const mapRef = useRef<MapRef>(null);
  
  // GeoJSON pour le tracé principal (actif)
  const shapeGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: shape.map(p => [p.shape_pt_lon, p.shape_pt_lat])
      },
      properties: {}
    }]
  }), [shape]);

  // Fit bounds
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    if (shape.length > 0) {
      const lons = shape.map(p => p.shape_pt_lon);
      const lats = shape.map(p => p.shape_pt_lat);
      map.fitBounds([Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)], {
        padding: { top: 40, bottom: 80, left: 40, right: 40 },
        duration: 1000
      });
    }
  }, [shape]);

  const color = `#${routeColor}`;
  // Si segmenté, on utilise une couleur "focus" (Gold) pour le segment sélectionné
  const lineColor = isSegmented ? '#E8B23C' : color;

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--cream)' }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: ABIDJAN_CENTER.longitude,
          latitude: ABIDJAN_CENTER.latitude,
          zoom: 12
        }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {/* Tracé de la ligne */}
        {shape.length > 1 && (
          <Source id="route-shape" type="geojson" data={shapeGeoJSON}>
            <Layer
              id="route-line-casing"
              type="line"
              paint={{
                'line-color': '#fff',
                'line-width': 7,
                'line-opacity': 0.3
              }}
            />
            <Layer
              id="route-line"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': lineColor,
                'line-width': 5,
                'line-opacity': 1
              }}
            />
          </Source>
        )}

        {/* Marqueurs d'arrêts */}
        {stops.map((stop, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === stops.length - 1;
          
          // Style des arrêts : Départ (Bleu), Arrivée (Vert), Intermédiaire (Blanc)
          const bg = isFirst ? '#1E5BFF' : isLast ? '#0EA85B' : '#ffffff';
          const size = (isFirst || isLast) ? 14 : 8;
          const zIndex = (isFirst || isLast) ? 10 : 5;

          return (
            <Marker
              key={`${stop.stop_id}-${idx}`}
              longitude={stop.stop_lon}
              latitude={stop.stop_lat}
              anchor="center"
              style={{ zIndex }}
            >
              <div style={{
                width: size, height: size,
                borderRadius: '50%',
                background: bg,
                border: `2px solid ${lineColor}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                 {/* Petit point interne pour les terminus */}
                 {(isFirst || isLast) && <div style={{ width: 4, height: 4, background: '#fff', borderRadius: '50%' }} />}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
