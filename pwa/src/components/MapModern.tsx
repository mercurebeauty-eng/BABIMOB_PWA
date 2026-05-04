'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import { POI } from '@/lib/poi';
import { Stop } from '@/lib/types';

// Styles de base
const MAP_STYLE_VECTOR = 'https://tiles.openfreemap.org/styles/liberty';
const ABIDJAN_CENTER = { latitude: 5.345, longitude: -4.020 };

type Props = {
  stops?: Stop[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  selectedStopId?: string | null;
  selectedPoiId?: string | null;
  satellite?: boolean;
  userLocation?: [number, number] | null;
  userHeading?: number | null;
  pois?: POI[];
  onStopClick?: (stop: any) => void;
  onPoiClick?: (poi: POI) => void;
  hotspots?: { lat: number; lon: number; intensity: number }[];
  recenterSignal?: number;
};

export default function MapModern({
  stops = [],
  center = [ABIDJAN_CENTER.longitude, ABIDJAN_CENTER.latitude],
  zoom = 12,
  className = 'absolute inset-0',
  selectedStopId = null,
  selectedPoiId = null,
  satellite = false,
  userLocation = null,
  userHeading = null,
  pois = [],
  onStopClick,
  onPoiClick,
  hotspots = [],
  recenterSignal = 0
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom,
    pitch: 0,
    bearing: 0
  });

  // Synchronisation du centre si nécessaire
  useEffect(() => {
    if (center) {
      setViewState(prev => ({
        ...prev,
        longitude: center[0],
        latitude: center[1]
      }));
    }
  }, [center[0], center[1]]);

  // Recentrage forcé
  useEffect(() => {
    if (recenterSignal && userLocation) {
      mapRef.current?.flyTo({
        center: [userLocation[0], userLocation[1]],
        zoom: 15,
        duration: 2000
      });
    }
  }, [recenterSignal]);

  // Transformation des hotspots en GeoJSON pour Heatmap
  const hotspotsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: hotspots.map((h, i) => ({
      type: 'Feature' as const,
      id: i,
      geometry: { type: 'Point' as const, coordinates: [h.lon, h.lat] },
      properties: { intensity: h.intensity }
    }))
  }), [hotspots]);

  // Transformation des stops en GeoJSON pour la performance
  const stopsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: stops.map(s => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.stop_lon, s.stop_lat] },
      properties: { id: s.stop_id, name: s.stop_name }
    }))
  }), [stops]);

  // Style Satellite (Esri) - optimisé
  const satelliteStyle = useMemo(() => ({
    version: 8,
    sources: {
      'satellite': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri'
      },
      'openfreemap': {
        type: 'raster',
        tiles: ['https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png'],
        tileSize: 256
      }
    },
    layers: [
      { id: 'satellite-layer', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 20 }
    ]
  }), []);

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={satellite ? (satelliteStyle as any) : MAP_STYLE_VECTOR}
        maxZoom={20}
        hash={false}
      >
        {/* HEATMAP DES HOTSPOTS (WEBGL NATIF) */}
        {hotspots.length > 0 && (
          <Source id="hotspots-source" type="geojson" data={hotspotsGeoJSON}>
            <Layer
              id="hotspots-heat"
              type="heatmap"
              paint={{
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 50, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
                'heatmap-color': [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(242,108,26,0)',
                  0.2, 'rgba(242,108,26,0.2)',
                  0.4, 'rgba(242,108,26,0.4)',
                  0.6, 'rgba(242,108,26,0.7)',
                  0.8, '#F26C1A',
                  1, '#ffffff'
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 40],
                'heatmap-opacity': 0.6
              }}
            />
          </Source>
        )}

        {/* COUCHE DES ARRÊTS (CERLES OPTIMISÉS) */}
        <Source id="stops-source" type="geojson" data={stopsGeoJSON}>
          <Layer
            id="stops-layer"
            type="circle"
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 15, 6],
              'circle-color': '#F26C1A',
              'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 2],
              'circle-stroke-color': '#ffffff'
            }}
          />
        </Source>

        {/* MARQUEUR UTILISATEUR */}
        {userLocation && (
          <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
            <div className="relative flex items-center justify-center">
              {/* Halo pulsant */}
              <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
              {/* Point central */}
              <div className="w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-[0_0_15px_rgba(30,91,255,0.5)] z-10" />
              {/* Direction (faisceau) */}
              {userHeading !== null && (
                <div 
                  className="absolute w-16 h-24 pointer-events-none"
                  style={{ 
                    transform: `rotate(${userHeading}deg) translateY(-50%)`,
                    background: 'radial-gradient(ellipse at bottom center, rgba(30, 91, 255, 0.4) 0%, transparent 70%)',
                    clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                    bottom: '100%',
                    filter: 'blur(4px)'
                  }}
                />
              )}
            </div>
          </Marker>
        )}

        {/* POIs standards */}
        {pois.map(p => {
          const isElite = p.sponsor_tier === 'elite';
          const isPro = p.sponsor_tier === 'pro';
          
          return (
            <Marker 
              key={p.id} 
              longitude={p.lon} 
              latitude={p.lat}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onPoiClick?.(p);
              }}
            >
              <div className={`group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110`}>
                <div 
                  className="flex items-center justify-center shadow-lg"
                  style={{ 
                    width: isElite ? 36 : 28, 
                    height: isElite ? 36 : 28, 
                    background: p.cover_color || 'var(--orange)', 
                    borderRadius: '50%', 
                    border: isElite ? '3px solid #FFD700' : '2px solid #fff',
                    boxShadow: isElite ? '0 0 15px rgba(255,215,0,0.4)' : '0 4px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  <span style={{ fontSize: isElite ? 18 : 14 }}>{p.logo_emoji || '📍'}</span>
                </div>
                {/* Petit label élégant qui n'apparaît qu'au survol ou zoom élevé */}
                <div className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[10px] font-black text-black border border-black/5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {p.name}
                </div>
              </div>
            </Marker>
          );
        })}

        <NavigationControl position="bottom-right" />
      </Map>

      <style jsx global>{`
        .maplibregl-ctrl-attrib { display: none; }
        .maplibregl-ctrl-logo { opacity: 0.2; transform: scale(0.8); transform-origin: left bottom; }
      `}</style>
    </div>
  );
}
