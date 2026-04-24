'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Stop } from '@/lib/types';

const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];

type Props = {
  stops?: Stop[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  selectedStopId?: string | null;
  onStopClick?: (stop: Stop) => void;
  onMapReady?: (map: L.Map) => void;
  userLocation?: [number, number] | null;
  route?: [number, number][] | null;
  routeColor?: string;
  hotspots?: { lat: number; lon: number; intensity: number }[];
  explorers?: { lat: number; lon: number; name: string }[];
  pois?: { id: string; lat: number; lon: number; name: string; category: string }[];
};

function makeMarkerIcon(selected = false) {
  const size = selected ? 14 : 10;
  const style = [
    `width:${size}px`,
    `height:${size}px`,
    'border-radius:50%',
    'background:#f5a623',
    'border:2px solid white',
    'box-shadow:0 1px 4px rgba(0,0,0,0.25)',
    ...(selected ? ['outline:3px solid rgba(245,166,35,0.35)', 'outline-offset:1px'] : []),
  ].join(';');
  return L.divIcon({
    className: '',
    html: `<div style="${style}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function Map({
  stops = [],
  center = ABIDJAN_CENTER,
  zoom = 12,
  className = 'absolute inset-0',
  selectedStopId = null,
  onStopClick,
  onMapReady,
  userLocation = null,
  route = null,
  routeColor = '',
  hotspots = [],
  explorers = [],
  pois = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const explorersLayerRef = useRef<L.LayerGroup | null>(null);
  const poisLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const onStopClickRef = useRef(onStopClick);

  useEffect(() => { onStopClickRef.current = onStopClick; }, [onStopClick]);

  // ── Init (once) ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    // Reset Leaflet internal ID in case StrictMode double-invokes
    // @ts-expect-error Leaflet internal
    if (containerRef.current._leaflet_id) {
      // @ts-expect-error Leaflet internal
      containerRef.current._leaflet_id = null;
    }

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(map);

    // Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const hotspotsLayer = L.layerGroup().addTo(map);
    const explorersLayer = L.layerGroup().addTo(map);
    const poisLayer = L.layerGroup().addTo(map);
    
    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    hotspotsLayerRef.current = hotspotsLayer;
    explorersLayerRef.current = explorersLayer;
    poisLayerRef.current = poisLayer;

    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      hotspotsLayerRef.current = null;
      explorersLayerRef.current = null;
      poisLayerRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Recentrage ─────────────────────────────────────────────────────────────
  useEffect(() => {
    mapRef.current?.setView(center, zoom);
  }, [center, zoom]);

  // ── Hotspots (Heatmap) ─────────────────────────────────────────────────────
  useEffect(() => {
    const layer = hotspotsLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    hotspots.forEach((h) => {
      // 1. Large soft glow (Red-ish/Beige)
      const outerRadius = 80 + h.intensity * 30;
      L.circle([h.lat, h.lon], {
        radius: outerRadius,
        stroke: false,
        fillColor: '#ff5722',
        fillOpacity: 0.08,
      }).addTo(layer);
      
      // 2. Middle glow (Orange)
      L.circle([h.lat, h.lon], {
        radius: outerRadius * 0.6,
        stroke: false,
        fillColor: '#f5a623',
        fillOpacity: 0.15,
      }).addTo(layer);
      
      // 3. Hot core (Yellow)
      L.circle([h.lat, h.lon], {
        radius: outerRadius * 0.3,
        stroke: false,
        fillColor: '#ffeb3b',
        fillOpacity: 0.3,
      }).addTo(layer);
    });
  }, [hotspots]);

  // ── Explorers (Social) ─────────────────────────────────────────────────────
  useEffect(() => {
    const layer = explorersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    explorers.forEach((exp) => {
      const icon = L.divIcon({
        className: 'custom-explorer-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-4 h-4 bg-abidjan-blue/20 rounded-full animate-ping"></div>
            <div class="w-3 h-3 bg-abidjan-blue rounded-full border-2 border-white shadow-sm"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([exp.lat, exp.lon], { icon }).addTo(layer);
    });
  }, [explorers]);

  // ── POIs (Points of Interest) ──────────────────────────────────────────────
  useEffect(() => {
    const layer = poisLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    pois.forEach((p) => {
      const isSponsored = p.is_sponsored;
      const emoji = p.category === 'food' ? '🥘' : p.category === 'shop' ? '🛍️' : '🏢';
      
      const icon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div class="flex flex-col items-center group relative">
            ${isSponsored ? `
              <div class="absolute -inset-2 bg-abidjan-orange/20 rounded-full animate-pulse blur-md"></div>
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-abidjan-orange text-[7px] font-black text-white px-2 py-0.5 rounded-full shadow-sm z-50 whitespace-nowrap">
                CERTIFIÉ
              </div>
            ` : ''}
            
            <div class="rounded-full bg-white border-2 flex items-center justify-center text-sm shadow-md transition-all group-hover:scale-125 relative z-[50] ${
              isSponsored 
                ? 'w-12 h-12 border-abidjan-orange shadow-abidjan-orange/30 p-1' 
                : 'w-8 h-8 border-beige-200'
            }">
              ${isSponsored && p.logo_url ? `
                <img src="${p.logo_url}" class="w-full h-full object-cover rounded-full" alt="${p.name}" />
              ` : `
                <span>${emoji}</span>
              `}
            </div>

            <div class="hidden group-hover:block absolute top-full mt-2 bg-white px-3 py-2 rounded-2xl shadow-2xl border-2 border-beige-100 z-[100] min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
              <div class="text-[11px] font-black text-beige-text mb-0.5">${p.name}</div>
              <div class="text-[8px] text-beige-muted font-bold uppercase tracking-widest">${p.type}</div>
              ${p.promo ? `
                <div class="mt-2 pt-2 border-t border-beige-50">
                  <div class="text-[9px] font-black text-abidjan-orange uppercase mb-1">Offre Spéciale</div>
                  <div class="text-[10px] text-beige-text leading-tight font-medium">${p.promo}</div>
                </div>
              ` : ''}
            </div>
          </div>
        `,
        iconSize: isSponsored ? [48, 48] : [32, 32],
        iconAnchor: isSponsored ? [24, 24] : [16, 16],
      });

      L.marker([p.lat, p.lon], { icon }).addTo(layer);
    });
  }, [pois]);

  // ── Markers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    stops.forEach((s) => {
      const isSelected = s.stop_id === selectedStopId;
      const marker = L.marker([s.stop_lat, s.stop_lon], {
        icon: makeMarkerIcon(isSelected),
      });

      marker.bindPopup(
        `<div class="bm-popup"><strong>${escapeHtml(s.stop_name)}</strong>${
          s.commune ? `<div class="bm-popup-sub">${escapeHtml(s.commune)}</div>` : ''
        }</div>`,
        { className: 'bm-popup-wrapper', offset: [0, -4] }
      );

      if (onStopClick) {
        marker.on('click', () => onStopClickRef.current?.(s));
      }

      marker.addTo(layer);
    });
  }, [stops, selectedStopId]);

  // ── User location marker ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!userLocation) return;

    const icon = L.divIcon({
      className: '',
      html: '<div class="bm-user-marker"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const marker = L.marker(userLocation, { icon, zIndexOffset: 1000 })
      .bindPopup('<div class="bm-popup"><strong>Ma position</strong></div>', {
        className: 'bm-popup-wrapper',
        offset: [0, -4],
      })
      .addTo(map);

    userMarkerRef.current = marker;
  }, [userLocation]);

  // ── Route polyline ────────────────────────────────────────────────────────
  const routeLayerRef = useRef<L.Polyline | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (!route || route.length === 0) return;

    const polyline = L.polyline(route, {
      color: routeColor || '#f5a623',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round',
    }).addTo(map);

    routeLayerRef.current = polyline;

    // Optional: fit bounds to route
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  }, [route, routeColor]);

  return <div ref={containerRef} className={className} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
