'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import { POI } from '@/lib/poi';
import { Stop } from '@/lib/types';

// Styles de base
// Styles de base - On revient sur OpenFreeMap qui est plus rapide à l'initialisation
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
  poiCheckins?: any;
  livePois?: any[];
  onMapReady?: (map: any) => void;
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
  recenterSignal = 0,
  poiCheckins = {},
  livePois = [],
  legs = [],
  explorers = [],
  broadcasts = [],
  onMapReady
}: Props & { 
  legs?: { coords: [number, number][]; mode?: string; routeColor?: string }[];
  explorers?: any[];
  broadcasts?: any[];
}) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: zoom,
    pitch: 0,
    bearing: 0
  });

  // Signal Map Ready
  useEffect(() => {
    if (mapRef.current && onMapReady) {
      onMapReady(mapRef.current.getMap());
    }
  }, [onMapReady]);

  // Synchronisation du centre si nécessaire
  useEffect(() => {
    if (center) {
      setViewState(prev => ({
        ...prev,
        longitude: center[1],
        latitude: center[0]
      }));
    }
  }, [center[0], center[1]]);

  // Recentrage forcé
  useEffect(() => {
    if (recenterSignal && userLocation) {
      mapRef.current?.flyTo({
        center: [userLocation[1], userLocation[0]],
        zoom: 15,
        duration: 2000
      });
    }
  }, [recenterSignal, userLocation]);

  // GeoJSON pour Itinéraires
  const legsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: legs.map((l, i) => ({
      type: 'Feature' as const,
      id: i,
      geometry: { type: 'LineString' as const, coordinates: l.coords.map(c => [c[1], c[0]]) },
      properties: { color: l.routeColor || '#F26C1A', mode: l.mode }
    }))
  }), [legs]);

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
      }
    },
    layers: [
      { id: 'satellite-layer', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 20 }
    ]
  }), []);

  return (
    <div className={className} style={{ width: '100%', height: '100%', background: 'var(--cream)' }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={satellite ? (satelliteStyle as any) : MAP_STYLE_VECTOR}
        maxZoom={20}
        hash={false}
        onError={(e) => console.error('MapLibre Error:', e)}
        style={{ width: '100%', height: '100%' }}
      >
        {/* ITINÉRAIRES (TRACÉS VECTORIELS) */}
        {legs.length > 0 && (
          <Source id="legs-source" type="geojson" data={legsGeoJSON}>
            <Layer
              id="legs-layer"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': ['get', 'color'],
                'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 15, 6],
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

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

        {/* COUCHE DES ARRÊTS */}
        <Source id="stops-source" type="geojson" data={stopsGeoJSON}>
          <Layer
            id="stops-layer"
            type="circle"
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 15, 6],
              'circle-color': '#F26C1A',
              'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 2],
              'circle-stroke-color': '#ffffff',
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 1],
              'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 1]
            }}
          />
        </Source>

        {/* EXPLORERS (AUTRES UTILISATEURS) */}
        {explorers.map((exp: any) => (
          <Marker 
            key={exp.id || exp.user_id} 
            longitude={exp.lon} 
            latitude={exp.lat}
            anchor="center"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-white overflow-hidden">
                <span className="text-lg">{exp.avatar_emoji || '👤'}</span>
              </div>
              <div className="mt-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[8px] font-bold text-white whitespace-nowrap">
                {exp.display_name}
              </div>
            </div>
          </Marker>
        ))}

        {/* BROADCASTS (FLUX LIVE) */}
        {broadcasts.map((b: any) => (
          <Marker 
            key={b.id} 
            longitude={b.lon} 
            latitude={b.lat}
            anchor="center"
          >
            <div className="flex items-center justify-center relative">
              <div className="absolute w-12 h-12 bg-orange-500/20 rounded-full animate-ping" />
              <div className="w-6 h-6 bg-orange-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center z-10">
                <span className="text-xs text-white">📡</span>
              </div>
            </div>
          </Marker>
        ))}

        {/* MARQUEUR UTILISATEUR */}
        {userLocation && (
          <Marker longitude={userLocation[1]} latitude={userLocation[0]} anchor="center">
            <div className="relative flex items-center justify-center">
              {/* Halo pulsant */}
              <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
              {/* Point central */}
              <div className="w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-[0_0_15px_rgba(30,91,255,0.8)] z-[2000]" />
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
                <div className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[10px] font-black text-black border border-black/5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {p.name}
                </div>
              </div>
            </Marker>
          );
        })}

        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>

      <style jsx global>{`
        .maplibregl-ctrl-attrib { display: none; }
        .maplibregl-ctrl-logo { opacity: 0.1; transform: scale(0.7); transform-origin: left bottom; }
      `}</style>
    </div>
  );
}
