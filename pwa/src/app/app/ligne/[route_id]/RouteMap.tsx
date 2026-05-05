'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  userLocation?: [number, number] | null;
  userHeading?: number | null;
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

  const [mapLoaded, setMapLoaded] = useState(false);

  // Fit bounds function
  const fitToData = useCallback(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current.getMap();
    
    let coords: [number, number][] = [];
    
    if (shape && shape.length > 0) {
      coords = shape.map(p => [p.shape_pt_lon, p.shape_pt_lat]);
    } else if (stops && stops.length > 0) {
      coords = stops.map(s => [s.stop_lon, s.stop_lat]);
    }

    if (coords.length > 0) {
      const lons = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)]
      ];
      
      map.fitBounds(bounds, {
        padding: { top: 40, bottom: 80, left: 40, right: 40 },
        duration: 1000
      });
    }
  }, [shape, stops, mapLoaded]);

  // Trigger fit whenever data changes or map loads
  useEffect(() => {
    fitToData();
  }, [fitToData, isSegmented]);

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
        onLoad={() => setMapLoaded(true)}
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
        {/* MARQUEUR UTILISATEUR (Point Bleu Premium) */}
        {userLocation && (
          <Marker
            longitude={userLocation[1]}
            latitude={userLocation[0]}
            anchor="center"
            style={{ zIndex: 100 }}
          >
            <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute',
                width: 24, height: 24,
                borderRadius: '50%',
                background: 'rgba(26, 115, 232, 0.2)',
                animation: 'pulse 2s infinite'
              }} />
              {userHeading !== null && (
                <div style={{
                  position: 'absolute',
                  width: 60, height: 60,
                  transform: `rotate(${userHeading}deg)`,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  top: -10 
                }}>
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: '14px solid transparent',
                    borderRight: '14px solid transparent',
                    borderBottom: '38px solid rgba(26, 115, 232, 0.2)',
                    filter: 'blur(3px)',
                  }} />
                </div>
              )}
              <div style={{
                width: 13, height: 13,
                background: '#1A73E8',
                borderRadius: '50%',
                border: '2.5px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 2,
              }} />
            </div>
          </Marker>
        )}
      </Map>
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
