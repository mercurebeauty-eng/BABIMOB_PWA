'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import MapGL, { Marker, MapRef, Layer, Source } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stop } from '@/lib/types';
import type { POI } from '@/lib/poi';

const ABIDJAN_CENTER: [number, number] = [-4.020, 5.345];

// Map Styles
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Inline SVG icons
const SVG_LAYERS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
const SVG_GPS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>`;
const SVG_COMPASS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
const SVG_3D = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;

type ItineraryLeg = {
  coords: [number, number][]; // [lat, lng]
  mode: string;
  routeColor?: string;
};

type Props = {
  stops?: Stop[];
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  className?: string;
  selectedStopId?: string | null;
  selectedPoiId?: string | null;
  onStopClick?: (stop: any) => void;
  onPoiClick?: (poi: POI) => void;
  onMapReady?: (map: maplibregl.Map) => void;
  userLocation?: [number, number] | null; // [lat, lng]
  legs?: ItineraryLeg[] | null;
  hotspots?: { lat: number; lon: number; intensity: number }[];
  explorers?: { lat: number; lon: number; name: string; emoji?: string }[];
  poiCheckins?: Record<string, number>;
  livePois?: string[];
  broadcasts?: any[];
  pois?: POI[];
};

export default function Map({
  stops = [],
  center = [5.345, -4.020],
  zoom = 12,
  className = 'absolute inset-0',
  selectedStopId = null,
  selectedPoiId = null,
  onStopClick,
  onMapReady,
  userLocation = null,
  legs = null,
  hotspots = [],
  explorers = [],
  poiCheckins = {},
  livePois = [],
  broadcasts = [],
  pois = [],
  onPoiClick,
}: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapStyle, setMapStyle] = useState(LIGHT_STYLE);
  const [isSatellite, setIsSatellite] = useState(false);
  const [pitch3d, setPitch3d] = useState(0);

  useEffect(() => {
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const updateStyle = (e: MediaQueryListEvent | MediaQueryList) => {
      if (!isSatellite) setMapStyle(e.matches ? DARK_STYLE : LIGHT_STYLE);
    };
    updateStyle(matcher);
    if (matcher.addEventListener) matcher.addEventListener('change', updateStyle);
    return () => matcher.removeEventListener && matcher.removeEventListener('change', updateStyle);
  }, [isSatellite]);

  const legsFeatures = useMemo(() => {
    if (!legs) return [];
    return legs.map((leg) => {
      const isWalk = leg.mode === 'WALK';
      const color = isWalk ? '#8a93a2' : leg.routeColor ? `#${leg.routeColor}` : '#FF7A00';
      return {
        type: 'Feature',
        properties: { color, isWalk },
        geometry: {
          type: 'LineString',
          coordinates: leg.coords.map(c => [c[1], c[0]]),
        }
      };
    });
  }, [legs]);

  const toggle3d = () => {
    const nextPitch = pitch3d === 0 ? 60 : 0;
    setPitch3d(nextPitch);
    if (mapRef.current) {
      mapRef.current.easeTo({ pitch: nextPitch, duration: 1000 });
    }
  };

  const flyToUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: [userLocation[1], userLocation[0]], zoom: 16, duration: 1500 });
    }
  };

  const flyToCenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: ABIDJAN_CENTER, zoom: 13, pitch: 0, bearing: 0, duration: 1500 });
    }
  };

  return (
    <div className={className}>
      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: zoom,
          pitch: 0,
        }}
        mapStyle={mapStyle}
        onLoad={() => onMapReady?.(mapRef.current!.getMap())}
        attributionControl={false}
        maxZoom={20}
      >
        {/* Raster Satellite Layer */}
        {isSatellite && (
          <Source id="satellite-source" type="raster" tiles={[SATELLITE_TILE_URL]} tileSize={256}>
            <Layer id="satellite-layer" type="raster" beforeId={stops.length > 0 ? "stops" : undefined} />
          </Source>
        )}

        {/* Buttons Controls — Right Side */}
        <div className="absolute top-24 right-4 flex flex-col gap-3 z-[200]">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="bm-map-btn shadow-2xl"
            onClick={flyToUser}
            dangerouslySetInnerHTML={{ __html: SVG_GPS }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="bm-map-btn shadow-2xl"
            onClick={toggle3d}
            dangerouslySetInnerHTML={{ __html: SVG_3D }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={`bm-map-btn shadow-2xl ${isSatellite ? 'bg-bm-orange text-white border-bm-orange' : ''}`}
            onClick={() => setIsSatellite(!isSatellite)}
            dangerouslySetInnerHTML={{ __html: SVG_LAYERS }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="bm-map-btn shadow-2xl"
            onClick={flyToCenter}
            dangerouslySetInnerHTML={{ __html: SVG_COMPASS }}
          />
        </div>

        {/* 3D Buildings Layer — Only visible in Vector styles */}
        {!isSatellite && (
          <Layer
            id="3d-buildings"
            source="carto" 
            source-layer="building"
            type="fill-extrusion"
            minzoom={15}
            paint={{
              'fill-extrusion-color': mapStyle === DARK_STYLE ? '#1F2533' : '#E8E7E0',
              'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['coalesce', ['get', 'render_height'], ['get', 'height'], 20]],
              'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]],
              'fill-extrusion-opacity': 0.8
            }}
          />
        )}

        {/* Hotspots Heatmap */}
        {hotspots.length > 0 && (
          <Source id="hotspots" type="geojson" data={{ 
            type: 'FeatureCollection', 
            features: hotspots.map(h => ({ 
              type: 'Feature', properties: { intensity: h.intensity }, geometry: { type: 'Point', coordinates: [h.lon, h.lat] } 
            })) 
          }}>
            <Layer id="hotspot-heat" type="heatmap" paint={{
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 100, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
              'heatmap-color': ['interpolate',['linear'],['heatmap-density'],0,'rgba(255,107,0,0)',0.2,'#FFB300',0.6,'#FF6B00',1,'#FFFFFF'],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 25, 15, 70],
              'heatmap-opacity': 0.6
            }} />
          </Source>
        )}

        {/* Route Lines */}
        {legsFeatures.length > 0 && (
          <Source id="legs-source" type="geojson" data={{ type: 'FeatureCollection', features: legsFeatures as any }}>
            <Layer id="legs-line" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{
              'line-color': ['get', 'color'],
              'line-width': ['case', ['==', ['get', 'isWalk'], true], 4, 8],
              'line-dasharray': ['case', ['==', ['get', 'isWalk'], true], ['literal', [2, 2]], ['literal', [1]]]
            }} />
          </Source>
        )}

        {/* Stops Markers */}
        {stops.map(s => (
          <Marker key={s.stop_id} longitude={s.stop_lon} latitude={s.stop_lat} onClick={() => onStopClick?.(s)}>
            <div className={`w-3 h-3 rounded-full bg-bm-orange border-2 border-white shadow-xl cursor-pointer ${s.stop_id === selectedStopId ? 'ring-4 ring-bm-orange/30 scale-150' : ''} transition-all`} />
          </Marker>
        ))}

        {/* POI Markers */}
        {pois.map(p => {
          const isSelected = selectedPoiId === p.id;
          const isElite = p.sponsor_tier === 'elite';
          const isLive = livePois.includes(p.id) || livePois.includes(`sp-${p.id}`);
          const count = poiCheckins[p.id] || 0;
          return (
            <Marker key={p.id} longitude={p.lon} latitude={p.lat} onClick={() => onPoiClick?.(p)} style={{ zIndex: isElite ? 100 : 50 }}>
               <motion.div whileHover={{ scale: 1.1, y: -5 }} className="flex flex-col items-center">
                  <div className={`relative flex items-center justify-center rounded-2xl bg-white shadow-2xl border-2 transition-all p-1.5 ${isSelected ? 'border-bm-orange scale-110' : 'border-gray-50'}`}>
                     <span className="text-xl leading-none">{p.logo_emoji || '📍'}</span>
                     {count > 0 && <span className="absolute -top-3 -right-3 bg-bm-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white">{count}</span>}
                     {isLive && <div className="absolute -inset-1 rounded-2xl bg-bm-orange animate-ping opacity-20 pointer-events-none" />}
                  </div>
                  <AnimatePresence>
                    {(isElite || isSelected) && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 bg-bm-obsidian/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white whitespace-nowrap">{p.name}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </motion.div>
            </Marker>
          );
        })}

        {/* Live Explorers Avatars */}
        {explorers.map((exp, idx) => (
          <Marker key={idx} longitude={exp.lon} latitude={exp.lat}>
             <div className="bm-user-marker w-5 h-5 bg-bm-blue flex items-center justify-center border-2 border-white overflow-hidden shadow-2xl">
                <span className="text-xs">{exp.emoji || '🦁'}</span>
             </div>
          </Marker>
        ))}

        {/* User Marker */}
        {userLocation && (
          <Marker longitude={userLocation[1]} latitude={userLocation[0]} style={{ zIndex: 1000 }}>
             <div className="bm-user-marker w-5 h-5 bg-blue-500 border-2 border-white shadow-xl" />
          </Marker>
        )}

      </MapGL>
    </div>
  );
}
