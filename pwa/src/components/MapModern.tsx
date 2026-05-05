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

  // Synchronisation du viewState quand center change (Prop → State)
  useEffect(() => {
    if (center && center[0] && center[1]) {
      setViewState(prev => ({
        ...prev,
        latitude: center[0],
        longitude: center[1]
      }));
    }
  }, [center[0], center[1]]);

  // Atterrissage cinématique (Landing Zoom)
  const hasLanded = useRef(false);
  useEffect(() => {
    if (mapRef.current && !hasLanded.current && center && center[0]) {
      hasLanded.current = true;
      const targetZoom = zoom;
      const startZoom = Math.max(targetZoom - 3, 10);
      
      mapRef.current.setZoom(startZoom);
      mapRef.current.setCenter([center[1], center[0]]);
      
      setTimeout(() => {
        mapRef.current?.flyTo({
          center: [center[1], center[0]],
          zoom: targetZoom,
          duration: 2000,
          essential: true
        });
      }, 300);
    }
  }, [center, zoom]);

  // Recentrage forcé (Bouton Locate Me)
  useEffect(() => {
    if (recenterSignal && userLocation) {
      mapRef.current?.flyTo({
        center: [userLocation[1], userLocation[0]],
        zoom: 16,
        duration: 2000,
        curve: 1.5,
        essential: true
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

  // Transformation des stops en GeoJSON pour la performance avec clustering
  const stopsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: stops.map(s => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.stop_lon, s.stop_lat] },
      properties: { id: s.stop_id, name: s.stop_name, type: 'stop' }
    }))
  }), [stops]);

  // Séparation des POIs : Elite/Pro (Markers) vs Standards (Vector)
  const premiumPois = useMemo(() => pois.filter(p => p.sponsor_tier === 'elite' || p.sponsor_tier === 'pro'), [pois]);
  const standardPoisGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: pois.filter(p => !p.sponsor_tier).map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
      properties: { ...p }
    }))
  }), [pois]);

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
        onClick={e => {
          const feature = e.features?.[0];
          if (feature && feature.layer.id === 'stops-clusters') {
            const clusterId = feature.properties.cluster_id;
            const map = mapRef.current?.getMap();
            if (!map) return;
            
            const source: any = map.getSource('stops-source');
            source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
              if (err) return;
              map.easeTo({
                center: (feature.geometry as any).coordinates,
                zoom: zoom,
                duration: 500
              });
            });
          }
        }}
        interactiveLayerIds={['stops-clusters', 'poi-clusters']}
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
        <Source id="hotspots-source" type="geojson" data={hotspotsGeoJSON}>
          <Layer
            id="hotspots-heat"
            type="heatmap"
            layout={{
              'visibility': hotspots.length > 0 ? 'visible' : 'none'
            }}
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

        {/* COUCHE DES ARRÊTS AVEC CLUSTERING */}
        <Source 
          id="stops-source" 
          type="geojson" 
          data={stopsGeoJSON}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          {/* Cercles de clusters */}
          <Layer
            id="stops-clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#F26C1A',
              'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25],
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }}
          />
          {/* Chiffre dans les clusters */}
          <Layer
            id="stops-cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 12
            }}
            paint={{ 'text-color': '#ffffff' }}
          />
          {/* Arrêts individuels (quand non-clusterisé) */}
          <Layer
            id="unclustered-stop"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 15, 8],
              'circle-color': '#F26C1A',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 12, 1]
            }}
          />
        </Source>

        {/* COUCHE DES POIS STANDARDS (VECTOR CLUSTERING) */}
        <Source 
          id="standard-pois-source" 
          type="geojson" 
          data={standardPoisGeoJSON}
          cluster={true}
          clusterMaxZoom={15}
          clusterRadius={40}
        >
          <Layer
            id="poi-clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#8a93a2',
              'circle-radius': 12,
              'circle-opacity': 0.6,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff'
            }}
          />
          <Layer
            id="poi-unclustered"
            type="symbol"
            filter={['!', ['has', 'point_count']]}
            layout={{
              'text-field': ['get', 'logo_emoji'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 12, 14, 18, 22],
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              'text-padding': 0
            }}
            paint={{
              'text-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0, 12, 1]
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

        {/* POIs PREMIUM (Elite & Pro) — Toujours des Markers pour l'animation et le style */}
        {premiumPois.map(p => {
          const isElite = p.sponsor_tier === 'elite';
          const isPro   = p.sponsor_tier === 'pro';
          const size    = isElite ? 42 : isPro ? 34 : 28;
          const border  = isElite
            ? '3px solid #FFD700'
            : isPro
              ? '2.5px solid rgba(255, 255, 255, 0.9)'
              : '2px solid #fff';
          const shadow  = isElite
            ? '0 0 20px rgba(255,215,0,0.6), 0 8px 16px rgba(0,0,0,0.3)'
            : isPro
              ? '0 0 12px rgba(255,255,255,0.4), 0 4px 10px rgba(0,0,0,0.2)'
              : '0 4px 10px rgba(0,0,0,0.18)';
          
          return (
            <Marker 
              key={p.id} 
              longitude={p.lon} 
              latitude={p.lat}
              anchor="bottom"
              style={{ zIndex: isElite ? 70 : isPro ? 60 : 50 }}
              onClick={e => {
                e.originalEvent.stopPropagation();
                onPoiClick?.(p);
              }}
            >
              <div className="group flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-115">
                <div style={{ position: 'relative' }}>
                  {isElite && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400/30" style={{ transform: 'scale(1.5)' }} />
                  )}
                  <div
                    className="flex items-center justify-center relative z-10"
                    style={{
                      width: size, height: size,
                      background: p.cover_color || 'var(--orange)',
                      borderRadius: '50%',
                      border,
                      boxShadow: shadow,
                    }}
                  >
                    <span style={{ fontSize: isElite ? 22 : isPro ? 18 : 14 }}>
                      {p.logo_emoji || '📍'}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-black text-black border border-black/5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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

        {/* CERCLE DE PRÉCISION GPS (Rendu sous le point bleu) */}
        {accuracyGeoJSON && (
          <Source id="accuracy-source" type="geojson" data={accuracyGeoJSON}>
            <Layer
              id="accuracy-fill"
              type="fill"
              paint={{ 'fill-color': '#1A73E8', 'fill-opacity': 0.05 }}
            />
            <Layer
              id="accuracy-stroke"
              type="line"
              paint={{ 'line-color': '#1A73E8', 'line-width': 1, 'line-opacity': 0.2 }}
            />
          </Source>
        )}

        {/* MARQUEUR UTILISATEUR (Point Bleu Premium) */}
        {userLocation && (
          <Marker
            longitude={userLocation[1]}
            latitude={userLocation[0]}
            anchor="center"
            style={{ zIndex: 100 }}
          >
            <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* Halo pulsant adouci */}
              <div className="pulse" style={{
                position: 'absolute',
                width: 24, height: 24,
                borderRadius: '50%',
                background: 'rgba(26, 115, 232, 0.2)',
              }} />

              {/* Wedge Directionnel (Cône de vue) */}
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

              {/* Point Bleu Central */}
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

        <NavigationControl position="bottom-right" showCompass={false} />
      </Map>

      <style jsx global>{`
        .maplibregl-ctrl-attrib { display: none; }
        .maplibregl-ctrl-logo { opacity: 0.1; transform: scale(0.7); transform-origin: left bottom; }
      `}</style>
    </div>
  );
}
