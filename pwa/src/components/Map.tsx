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
  userLocation = null,
  route = null,
  routeColor = '',
  hotspots = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
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
    
    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    hotspotsLayerRef.current = hotspotsLayer;

    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      hotspotsLayerRef.current = null;
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
      // Soft orange glow
      const radius = 50 + h.intensity * 20;
      L.circle([h.lat, h.lon], {
        radius,
        stroke: false,
        fillColor: '#f5a623',
        fillOpacity: Math.min(0.1 + h.intensity * 0.05, 0.4),
      }).addTo(layer);
      
      // Smaller core
      L.circle([h.lat, h.lon], {
        radius: radius * 0.4,
        stroke: false,
        fillColor: '#f5a623',
        fillOpacity: Math.min(0.2 + h.intensity * 0.1, 0.6),
      }).addTo(layer);
    });
  }, [hotspots]);

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
