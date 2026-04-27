'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import MapGL, { Marker, MapRef, Layer, Source } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stop } from '@/lib/types';
import type { POI } from '@/lib/poi';

// MapLibre uses [lng, lat] while Leaflet used [lat, lng].
const ABIDJAN_CENTER: [number, number] = [-4.020, 5.345];

// Map Styles (Using Carto for consistency with previous Leaflet style, but full vector)
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Inline SVG icons
const SVG_LAYERS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
const SVG_GPS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>`;
const SVG_COMPASS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;

type ItineraryLeg = {
  coords: [number, number][]; // [lat, lng] from API!
  mode: string;
  routeColor?: string;
};

type Props = {
  stops?: Stop[];
  center?: [number, number]; // [lat, lng] format kept for backward compatibility with parent
  zoom?: number;
  className?: string;
  selectedStopId?: string | null;
  selectedPoiId?: string | null;
  onStopClick?: (stop: any) => void;
  onPoiClick?: (poi: POI) => void;
  onMapReady?: (map: maplibregl.Map) => void;
  userLocation?: [number, number] | null; // [lat, lng]
  route?: [number, number][] | null; // [lat, lng]
  routeColor?: string;
  legs?: ItineraryLeg[] | null;
  hotspots?: { lat: number; lon: number; intensity: number }[];
  explorers?: { lat: number; lon: number; name: string; emoji?: string }[];
  poiCheckins?: Record<string, number>;
  livePois?: string[];
  broadcasts?: { id: string; display_name: string; avatar_emoji: string; broadcast_text: string; broadcast_lat: number; broadcast_lon: number }[];
  pois?: POI[];
};

export default function Map({
  stops = [],
  center = [5.345, -4.020], // Default Leaflet center [lat, lng]
  zoom = 12,
  className = 'absolute inset-0',
  selectedStopId = null,
  selectedPoiId = null,
  onStopClick,
  onMapReady,
  userLocation = null,
  route = null,
  routeColor = '',
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

  // ── Theme state ──

  const [mapStyle, setMapStyle] = useState(LIGHT_STYLE);
  const [isSatellite, setIsSatellite] = useState(false);

  useEffect(() => {
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const updateStyle = (e: MediaQueryListEvent | MediaQueryList) => {
      setMapStyle(e.matches ? DARK_STYLE : LIGHT_STYLE);
    };
    updateStyle(matcher);
    matcher.addEventListener('change', updateStyle);
    return () => matcher.removeEventListener('change', updateStyle);
  }, []);

  // ── Actions ──
  const onMapLoad = () => {
    if (mapRef.current && onMapReady) {
      onMapReady(mapRef.current.getMap());
    }
  };

  const flyToUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: [userLocation[1], userLocation[0]], zoom: 16, duration: 1200 });
    }
  };

  const flyToCenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [ABIDJAN_CENTER[0], ABIDJAN_CENTER[1]], zoom: 12, pitch: 0, bearing: 0, duration: 1200 });
    }
  };

  // ── Data Transformers ──

  const legsFeatures = useMemo(() => {
    if (!legs) return [];
    return legs.map((leg, i) => {
      const isWalk = leg.mode === 'WALK';
      const color = isWalk ? '#8a93a2' : leg.routeColor ? `#${leg.routeColor}` : '#FF7A00';
      return {
        type: 'Feature',
        properties: {
          color,
          isWalk,
        },
        geometry: {
          type: 'LineString',
          coordinates: leg.coords.map(c => [c[1], c[0]]), // [lng, lat]
        }
      };
    });
  }, [legs]);

  return (
    <div className={className}>
      <MapGL
        ref={mapRef}
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: zoom,
          pitch: 45, // MapLibre 3D flair
        }}
        mapStyle={mapStyle}
        onLoad={onMapLoad}
        attributionControl={false}
        maxZoom={20}
      >
        {/* Nav Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-[10]">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bm-map-btn"
            onClick={flyToUser}
            dangerouslySetInnerHTML={{ __html: SVG_GPS }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bm-map-btn"
            onClick={flyToCenter}
            dangerouslySetInnerHTML={{ __html: SVG_COMPASS }}
          />
        </div>

        {/* 3D Buildings Layer */}
        <Layer
          id="3d-buildings"
          source="openmaptiles" // Needs to match source in the Style JSON, often 'openmaptiles' or 'v3' in carto styles
          source-layer="building"
          filter={['==', 'extrude', 'true']}
          type="fill-extrusion"
          minzoom={15}
          paint={{
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              15, 0,
              15.05, ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              15, 0,
              15.05, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }}
        />

        {/* Hotspots (Heatmap using MapLibre natively) */}
        {hotspots.length > 0 && (
          <Source id="hotspots" type="geojson" data={{
            type: 'FeatureCollection',
            features: hotspots.map(h => ({
              type: 'Feature',
              properties: { intensity: h.intensity },
              geometry: { type: 'Point', coordinates: [h.lon, h.lat] }
            }))
          }}>
            <Layer
              id="hotspot-heat"
              type="heatmap"
              paint={{
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 100, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
                'heatmap-color': [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(255,61,0,0)',
                  0.2, '#ff9100',
                  0.6, '#ff3d00',
                  1, '#ffffff'
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 20, 15, 60],
                'heatmap-opacity': 0.7
              }}
            />
          </Source>
        )}

        {/* Multi-Leg Route */}
        {legsFeatures.length > 0 && (
          <Source id="legs-source" type="geojson" data={{
            type: 'FeatureCollection',
            features: legsFeatures as any
          }}>
            <Layer
              id="legs-line"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': ['get', 'color'],
                'line-width': ['case', ['==', ['get', 'isWalk'], true], 3, 6],
                'line-dasharray': ['case', ['==', ['get', 'isWalk'], true], ['literal', [2, 3]], ['literal', [1]]]
              }}
            />
          </Source>
        )}

        {/* Stops */}
        {stops.map(s => (
          <Marker
            key={s.stop_id}
            longitude={s.stop_lon}
            latitude={s.stop_lat}
            onClick={() => onStopClick?.(s)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`w-2.5 h-2.5 rounded-full bg-abidjan-orange border-2 border-white shadow-sm ${s.stop_id === selectedStopId ? 'ring-2 ring-abidjan-orange ring-offset-1 scale-125' : ''}`} />
          </Marker>
        ))}

        {/* POIs */}
        {pois.map(p => {
          const isSelected = selectedPoiId === p.id;
          const isElite = p.sponsor_tier === 'elite';
          const isPro = p.sponsor_tier === 'pro' || p.has_campaign;
          const isLive = livePois.includes(p.id) || livePois.includes(`sp-${p.id}`);
          const checkinCount = poiCheckins[p.id] || poiCheckins[p.place_id ?? ''] || 0;
          
          return (
            <Marker key={p.id} longitude={p.lon} latitude={p.lat} onClick={() => onPoiClick?.(p)} style={{ zIndex: isElite ? 100 : 50 }}>
              <motion.div 
                className={`bm-poi-container ${isSelected ? 'scale-110 z-50' : ''}`}
                whileHover={{ scale: 1.15, y: -4 }}
                layout
              >
                {isLive && (
                  <div className="pulse-ring" style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isElite ? 50 : 36, height: isElite ? 50 : 36, borderRadius: '50%',
                    background: isElite ? 'var(--gold)' : 'var(--orange)',
                    zIndex: -1
                  }} />
                )}
                <div className={`bm-poi-circle ${isElite ? 'bm-poi-circle-elite' : isPro ? 'bm-poi-circle-pro' : ''}`} 
                     style={{ 
                       width: isElite ? 44 : 32, 
                       height: isElite ? 44 : 32,
                       background: 'white',
                       borderRadius: '14px',
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                       border: isElite ? '3px solid var(--gold)' : isPro ? '2px solid var(--orange)' : '1.5px solid var(--line)'
                     }}>
                  <span className="bm-poi-emoji" style={{ fontSize: isElite ? 24 : 18 }}>{p.logo_emoji || '📍'}</span>
                </div>
                <div className={`bm-poi-label-under ${isSelected ? 'bm-poi-label-expanded' : 'bm-poi-label-collapsed'}`}
                     style={{ 
                       background: 'white', color: 'var(--ink)', 
                       fontFamily: 'var(--font-archivo-black)',
                       padding: '4px 10px', borderRadius: '8px',
                       fontSize: '11px', marginTop: '4px',
                       boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                     }}>
                  {p.name}
                </div>
              </motion.div>
            </Marker>
          );
        })}

        {/* Explorers — Snap-style avatar bubbles */}
        {explorers.map((exp, idx) => {
          const label = exp.name.length > 10 ? exp.name.slice(0, 10) + '…' : exp.name;
          return (
            <Marker key={idx} longitude={exp.lon} latitude={exp.lat} anchor="bottom" style={{ zIndex: 800 }}>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center cursor-pointer"
                style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.22))' }}
              >
                <div className="w-[48px] h-[48px] rounded-full bg-white border-[3px] border-abidjan-orange flex items-center justify-center text-2xl shadow-lg shadow-abidjan-orange/30"
                     style={{ borderColor: 'var(--orange)' }}>
                  {exp.emoji ?? '🧭'}
                </div>
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[9px] border-l-transparent border-r-transparent border-t-white -mt-px" />
                <div className="bg-black/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 whitespace-nowrap"
                     style={{ background: 'var(--ink)', fontFamily: 'var(--font-archivo-black)' }}>
                  {label}
                </div>
              </motion.div>
            </Marker>
          );
        })}

        {/* Broadcasts (Social Updates) */}
        {broadcasts.map(bc => bc.broadcast_lon && bc.broadcast_lat && (
          <Marker key={bc.id} longitude={bc.broadcast_lon} latitude={bc.broadcast_lat} style={{ zIndex: 1000 }}>
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bm-broadcast-bubble group cursor-pointer"
            >
              <div className="bm-broadcast-card animate-in fade-in zoom-in duration-300" 
                   style={{ border: '2px solid var(--orange)', background: 'white', borderRadius: '1.5rem', padding: '10px 16px' }}>
                 <div className="w-10 h-10 rounded-full bg-cream-2 flex items-center justify-center text-xl shadow-inner" style={{ background: 'var(--cream-2)' }}>{bc.avatar_emoji}</div>
                 <div className="flex flex-col">
                    <span className="bm-broadcast-name" style={{ color: 'var(--orange)', fontFamily: 'var(--font-archivo-black)', fontSize: '10px' }}>{bc.display_name}</span>
                    <span className="bm-broadcast-text" style={{ color: 'var(--ink)', fontSize: '13px', fontWeight: 700 }}>{bc.broadcast_text}</span>
                 </div>
              </div>
              <div className="bm-broadcast-dot" style={{ background: 'var(--orange)', width: '14px', height: '14px', border: '3px solid white' }}></div>
            </motion.div>
          </Marker>
        ))}

        {/* User Location */}
        {userLocation && (
          <Marker longitude={userLocation[1]} latitude={userLocation[0]} style={{ zIndex: 2000 }}>
            <div className="relative">
              <div className="pulse-ring" style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--orange)'
              }} />
              <div className="bm-user-marker" style={{ 
                background: 'var(--orange)', 
                width: '14px', height: '14px', 
                border: '3px solid white',
                borderRadius: '50%',
                position: 'relative',
                zIndex: 1
              }}></div>
            </div>
          </Marker>
        )}

      </MapGL>
    </div>
  );
}
