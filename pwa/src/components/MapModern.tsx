'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import { POI } from '@/lib/poi';
import { Stop } from '@/lib/types';

// Styles de base
// Styles de base - On revient sur OpenFreeMap qui est plus rapide à l'initialisation
const MAP_STYLE_VECTOR = 'https://tiles.openfreemap.org/styles/liberty';
const ABIDJAN_CENTER = { latitude: 5.345, longitude: -4.020 };

export type PinnedSearch = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  emoji?: string;
  subtitle?: string;
};

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
  userAccuracy?: number | null;
  pois?: POI[];
  onStopClick?: (stop: any) => void;
  onPoiClick?: (poi: POI) => void;
  hotspots?: { lat: number; lon: number; intensity: number }[];
  recenterSignal?: number;
  poiCheckins?: any;
  livePois?: any[];
  onMapReady?: (map: any) => void;
  pinnedSearch?: PinnedSearch | null;
  onPinnedSearchClear?: () => void;
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
  userAccuracy = null,
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
  onMapReady,
  pinnedSearch = null,
  onPinnedSearchClear,
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

  // Cercle de précision GPS — polygone 64 pts sans dépendance Turf
  const accuracyGeoJSON = useMemo(() => {
    if (!userLocation || !userAccuracy || userAccuracy < 5) return null;
    const [lat, lon] = userLocation;
    const n = 64;
    const coords = Array.from({ length: n + 1 }, (_, i) => {
      const angle = (i / n) * 2 * Math.PI;
      const dLat = (userAccuracy * Math.cos(angle)) / 111111;
      const dLon = (userAccuracy * Math.sin(angle)) / (111111 * Math.cos(lat * Math.PI / 180));
      return [lon + dLon, lat + dLat];
    });
    return {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [coords] },
        properties: {},
      }],
    };
  }, [userLocation, userAccuracy]);

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

        {/* MARQUEUR UTILISATEUR - Supprimé d'ici car on le déplace à la fin pour le z-index */}

        {/* POIs — Elite > Pro > Standard
            Rendu AVANT le user marker pour que le point bleu passe toujours dessus */}
        {pois.map(p => {
          const isElite = p.sponsor_tier === 'elite';
          const isPro   = p.sponsor_tier === 'pro';
          const size    = isElite ? 36 : isPro ? 32 : 28;
          const border  = isElite
            ? '3px solid #FFD700'
            : isPro
              ? '2.5px solid #C0C0FF'
              : '2px solid #fff';
          const shadow  = isElite
            ? '0 0 14px rgba(255,215,0,0.5), 0 4px 10px rgba(0,0,0,0.2)'
            : isPro
              ? '0 0 10px rgba(130,100,255,0.35), 0 4px 10px rgba(0,0,0,0.15)'
              : '0 4px 10px rgba(0,0,0,0.18)';
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
              <div className="group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: size, height: size,
                    background: p.cover_color || 'var(--orange)',
                    borderRadius: '50%',
                    border,
                    boxShadow: shadow,
                  }}
                >
                  <span style={{ fontSize: isElite ? 18 : isPro ? 16 : 14 }}>
                    {p.logo_emoji || '📍'}
                  </span>
                </div>
                <div className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[10px] font-black text-black border border-black/5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {p.name}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* MARQUEUR ÉPINGLÉ (résultat de recherche OSM) */}
        {pinnedSearch && (
          <Marker
            longitude={pinnedSearch.lon}
            latitude={pinnedSearch.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onPinnedSearchClear?.();
            }}
          >
            <div className="flex flex-col items-center cursor-pointer">
              <div
                className="px-2.5 py-1 mb-1 bg-white rounded-lg shadow-lg whitespace-nowrap border-2 border-orange-500"
                style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink)' }}
              >
                {pinnedSearch.emoji ? <span style={{ marginRight: 4 }}>{pinnedSearch.emoji}</span> : null}
                {pinnedSearch.name}
              </div>
              <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
                <path
                  d="M16 0C7.16 0 0 7.16 0 16c0 11 16 26 16 26s16-15 16-26C32 7.16 24.84 0 16 0z"
                  fill="#F26C1A"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <circle cx="16" cy="16" r="6" fill="#fff" />
              </svg>
            </div>
          </Marker>
        )}

        <NavigationControl position="bottom-right" showCompass={false} />

        {/* CERCLE DE PRÉCISION GPS (GeoJSON → scale avec le zoom, rendu sous le point bleu) */}
        {accuracyGeoJSON && (
          <Source id="accuracy-source" type="geojson" data={accuracyGeoJSON}>
            <Layer
              id="accuracy-fill"
              type="fill"
              paint={{ 'fill-color': '#1E5BFF', 'fill-opacity': 0.07 }}
            />
            <Layer
              id="accuracy-stroke"
              type="line"
              paint={{ 'line-color': '#1E5BFF', 'line-width': 1.5, 'line-opacity': 0.25 }}
            />
          </Source>
        )}

        {/* MARQUEUR UTILISATEUR — rendu EN DERNIER pour passer au-dessus de tout */}
        {userLocation && (
          <Marker
            longitude={userLocation[1]}
            latitude={userLocation[0]}
            anchor="center"
            style={{ zIndex: 9999 }}
          >
            <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
              {/* Halo pulsant externe */}
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  width: 36, height: 36,
                  background: 'rgba(30, 91, 255, 0.22)',
                  border: '1px solid rgba(30, 91, 255, 0.4)',
                }}
              />
              {/* Wedge de direction — CSS triangle, pivote autour du centre */}
              {userHeading !== null && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    width: 0, height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderBottom: '28px solid rgba(30, 91, 255, 0.45)',
                    bottom: '50%',
                    left: '50%',
                    marginLeft: '-10px',
                    transformOrigin: '50% 100%',
                    transform: `rotate(${userHeading}deg)`,
                    filter: 'blur(2px)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Point central bleu vif */}
              <div
                style={{
                  position: 'relative',
                  width: 18, height: 18,
                  background: '#1E5BFF',
                  borderRadius: '50%',
                  border: '3px solid #fff',
                  boxShadow: '0 0 0 2px rgba(30,91,255,0.3), 0 4px 12px rgba(30,91,255,0.6)',
                  zIndex: 2,
                }}
              />
            </div>
          </Marker>
        )}
      </Map>

      <style jsx global>{`
        .maplibregl-ctrl-attrib { display: none; }
        .maplibregl-ctrl-logo { opacity: 0.1; transform: scale(0.7); transform-origin: left bottom; }
      `}</style>
    </div>
  );
}
