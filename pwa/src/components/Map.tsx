'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { escapeHtml } from '@/lib/html';
import type { Stop } from '@/lib/types';
import type { POI } from '@/lib/poi';

const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];

const SVG_PERSON = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 10-16 0h16z"/></svg>`;

type ItineraryLeg = {
  coords: [number, number][];
  mode: string;
  routeColor?: string;
};

type Props = {
  stops?: Stop[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  selectedStopId?: string | null;
  selectedPoiId?: string | null;
  satellite?: boolean;
  onStopClick?: (stop: any) => void;
  onPoiClick?: (poi: POI) => void;
  onMapReady?: (map: L.Map) => void;
  userLocation?: [number, number] | null;
  userHeading?: number | null;
  route?: [number, number][] | null;
  routeColor?: string;
  legs?: ItineraryLeg[] | null;
  hotspots?: { lat: number; lon: number; intensity: number }[];
  explorers?: { lat: number; lon: number; name: string }[];
  poiCheckins?: Record<string, number>;
  livePois?: string[];
  broadcasts?: { id: string; display_name: string | null; avatar_emoji: string | null; broadcast_text: string | null; broadcast_lat: number | null; broadcast_lon: number | null }[];
  pois?: POI[];
  recenterSignal?: number;
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
  selectedPoiId = null,
  satellite = false,
  onStopClick,
  onMapReady,
  userLocation = null,
  userHeading = null,
  route = null,
  routeColor = '',
  legs = null,
  hotspots = [],
  explorers = [],
  poiCheckins = {},
  livePois = [],
  broadcasts = [],
  pois = [],
  recenterSignal = 0,
  onPoiClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const explorersLayerRef = useRef<L.LayerGroup | null>(null);
  const legsLayerRef = useRef<L.LayerGroup | null>(null);
  const poisLayerRef = useRef<L.LayerGroup | null>(null);
  const broadcastsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const satTileRef = useRef<L.TileLayer | null>(null);
  const onStopClickRef = useRef(onStopClick);
  const userLocationRef = useRef(userLocation);
  const poiCheckinsRef = useRef(poiCheckins);

  useEffect(() => { onStopClickRef.current = onStopClick; }, [onStopClick]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { poiCheckinsRef.current = poiCheckins; }, [poiCheckins]);

  const [currentZoom, setCurrentZoom] = useState(zoom);

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
      attributionControl: false,
    });

    const baseLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(map);

    const satLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 20 }
    );

    baseTileRef.current = baseLayer;
    satTileRef.current = satLayer;

    const markersLayer = L.layerGroup().addTo(map);
    const hotspotsLayer = L.layerGroup().addTo(map);
    const explorersLayer = L.layerGroup().addTo(map);
    const legsLayer = L.layerGroup().addTo(map);
    const poisLayer = L.layerGroup().addTo(map);
    const broadcastsLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;
    hotspotsLayerRef.current = hotspotsLayer;
    explorersLayerRef.current = explorersLayer;
    legsLayerRef.current = legsLayer;
    poisLayerRef.current = poisLayer;
    broadcastsLayerRef.current = broadcastsLayer;

    map.on('zoomend', () => setCurrentZoom(map.getZoom()));

    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
      baseTileRef.current = null;
      satTileRef.current = null;
      markersLayerRef.current = null;
      hotspotsLayerRef.current = null;
      explorersLayerRef.current = null;
      legsLayerRef.current = null;
      poisLayerRef.current = null;
      broadcastsLayerRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Drag tracking ──────────────────────────────────────────────────────────
  const userPannedRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onDragStart = () => { userPannedRef.current = true; };
    map.on('dragstart', onDragStart);
    return () => { map.off('dragstart', onDragStart); };
  }, []);

  // ── Satellite toggle ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const base = baseTileRef.current;
    const sat = satTileRef.current;
    if (!map || !base || !sat) return;
    if (satellite) {
      if (map.hasLayer(base)) map.removeLayer(base);
      if (!map.hasLayer(sat)) sat.addTo(map);
    } else {
      if (map.hasLayer(sat)) map.removeLayer(sat);
      if (!map.hasLayer(base)) base.addTo(map);
    }
  }, [satellite]);

  // ── Recentrage ─────────────────────────────────────────────────────────────
  const prevSelectedStopId = useRef(selectedStopId);
  const prevSelectedPoiId = useRef(selectedPoiId);
  const prevRecenterSignal = useRef(recenterSignal);
  const initialCenterDone = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const stopChanged = selectedStopId !== prevSelectedStopId.current;
    const poiChanged = selectedPoiId !== prevSelectedPoiId.current;
    const signalChanged = recenterSignal !== prevRecenterSignal.current;

    // Center if it's the first time and we have a valid center (not [0,0] if that was default)
    const isFirstTime = !initialCenterDone.current;

    if (stopChanged || poiChanged || signalChanged || isFirstTime) {
      userPannedRef.current = false;
      map.setView(center, zoom);
      
      prevSelectedStopId.current = selectedStopId;
      prevSelectedPoiId.current = selectedPoiId;
      prevRecenterSignal.current = recenterSignal;
      initialCenterDone.current = true;
      return;
    }

    // Si on n'a pas déclenché de re-centrage forcé et que l'utilisateur a manipulé la carte, on ignore.
    if (userPannedRef.current) return;

    map.setView(center, zoom);
  }, [center[0], center[1], zoom, selectedStopId, selectedPoiId, recenterSignal]);

  // ── Hotspots (Heatmap) ─────────────────────────────────────────────────────
  useEffect(() => {
    const layer = hotspotsLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    hotspots.forEach((h: any) => {
      const isTransport = h.id?.startsWith('stop-') || h.place_id?.startsWith('stop-');
      const baseColor = isTransport ? 'var(--blue)' : '#ff3d00';
      const coreColor = isTransport ? '#5d87ff' : '#ff9100';

      // 1. Large vibrant glow
      const intensityScale = Math.min(h.intensity / 50, 1);
      const outerRadius = 100 + intensityScale * 150;
      
      L.circle([h.lat, h.lon], {
        radius: outerRadius,
        stroke: false,
        fillColor: baseColor,
        fillOpacity: 0.15 + intensityScale * 0.1,
      }).addTo(layer);
      
      // 2. High intensity core
      L.circle([h.lat, h.lon], {
        radius: outerRadius * 0.5,
        stroke: false,
        fillColor: coreColor,
        fillOpacity: 0.3 + intensityScale * 0.2,
      }).addTo(layer);

      // 3. Ultra-hot center
      L.circle([h.lat, h.lon], {
        radius: 30,
        stroke: true,
        weight: 1,
        color: '#ffffff50',
        fillColor: '#ffffff',
        fillOpacity: 0.5,
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
  const onPoiClickRef = useRef(onPoiClick);
  useEffect(() => { onPoiClickRef.current = onPoiClick; }, [onPoiClick]);

  useEffect(() => {
    const layer = poisLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    pois.forEach((p) => {
      const isElite = p.sponsor_tier === 'elite';
      const isPro = p.sponsor_tier === 'pro' || p.has_campaign;

      // Progressive zoom visibility — Apple Maps Style
      // < 12: Elite only · 12-14: Elite + Pro · >= 14: all
      if (currentZoom < 12 && !isElite) return;
      if (currentZoom < 14 && !isElite && !isPro) return;

      const emoji = p.logo_emoji ?? '🏢';
      const bgColor = p.cover_color ?? '#6B7280';
      const isSelected = selectedPoiId === p.id;
      const isLive = livePois.includes(p.id) || livePois.includes(`sp-${p.id}`);
      const checkinCount = poiCheckinsRef.current[p.id] ?? 0;

      // Dynamic scaling based on zoom
      const baseSize = isElite ? 42 : isPro ? 32 : 24;
      const zoomFactor = Math.max(1, (currentZoom - 14) * 0.4 + 1);
      const circleSize = Math.round(baseSize * (isSelected ? 1.2 : zoomFactor));
      const emojiSize  = Math.round(circleSize * 0.55);

      // Labels at high zoom or for selected/elite
      const showLabel = isElite || isSelected || currentZoom >= 16;
      // Show emoji always if zoom is high enough, or if it's a partner
      const showEmoji = isElite || isPro || currentZoom >= 14.5;

      let extraClass = isElite
        ? 'bm-poi-circle-elite bm-poi-elite-pulse'
        : isPro
        ? 'bm-poi-circle-pro'
        : '';
      if (isLive) extraClass += ' bm-poi-live-pulse';
      if (isSelected) extraClass += ' bm-poi-selected-glow';

      const labelClass = isElite ? 'bm-poi-label-under-elite' : '';
      const stateClass = showLabel ? 'bm-poi-label-expanded' : 'bm-poi-label-collapsed';

      const presenceHtml = checkinCount > 0
        ? `<div class="bm-poi-presence">${SVG_PERSON}${checkinCount > 1 ? `<span class="bm-poi-presence-count">${checkinCount > 9 ? '9+' : checkinCount}</span>` : ''}</div>`
        : '';

      const html = `
        <div class="bm-poi-container ${isSelected ? 'bm-poi-container-selected' : ''}" style="transform:translate(-50%,-50%);">
          ${presenceHtml}
          <div class="bm-poi-circle ${extraClass}" style="width:${circleSize}px;height:${circleSize}px;background:${bgColor};border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;border-radius:50%;">
            ${showEmoji ? `<span class="bm-poi-emoji" style="font-size:${emojiSize}px;line-height:1;">${emoji}</span>` : ''}
          </div>
          ${showLabel ? `<span class="bm-poi-label-under ${labelClass} ${stateClass}">${p.name}</span>` : ''}
        </div>
      `;

      const icon = L.divIcon({
        className: '',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([p.lat, p.lon], {
        icon,
        zIndexOffset: isElite ? 1000 : isPro ? 500 : 100,
      });

      marker.on('click', () => onPoiClickRef.current?.(p));
      marker.addTo(layer);
    });
  }, [pois, livePois, currentZoom, selectedPoiId]);

  // ── Broadcasts (Pro Social Status) ────────────────────────────────────────
  useEffect(() => {
    const layer = broadcastsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    broadcasts.forEach((bc) => {
      if (!bc.broadcast_lat || !bc.broadcast_lon) return;

      const html = `
        <div class="bm-broadcast-bubble">
          <div class="bm-broadcast-card">
            <span style="font-size:16px">${escapeHtml(bc.avatar_emoji ?? '')}</span>
            <div style="display:flex;flex-direction:column;gap:1px">
              <span class="bm-broadcast-name">${escapeHtml(bc.display_name ?? '')}</span>
              <span class="bm-broadcast-text">${escapeHtml(bc.broadcast_text ?? '')}</span>
            </div>
          </div>
          <div class="bm-broadcast-dot"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: '',
        html,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([bc.broadcast_lat, bc.broadcast_lon], { icon, zIndexOffset: 2000 }).addTo(layer);
    });
  }, [broadcasts]);

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

    const hasHeading = userHeading !== null;
    const rotate = hasHeading ? `rotate(${userHeading}deg)` : 'rotate(0deg)';

    const icon = L.divIcon({
      className: 'bm-user-marker-parent',
      html: `
        <div class="bm-user-marker">
          ${hasHeading ? `<div class="bm-user-heading" style="transform: ${rotate}"></div>` : ''}
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker(userLocation, { icon, zIndexOffset: 1000 })
      .bindPopup('<div class="bm-popup"><strong>Ma position</strong></div>', {
        className: 'bm-popup-wrapper',
        offset: [0, -4],
      })
      .addTo(map);

    userMarkerRef.current = marker;
  }, [userLocation, userHeading]);

  // ── Multi-leg itinerary ───────────────────────────────────────────────────
  useEffect(() => {
    const layer = legsLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    if (!legs || legs.length === 0) return;

    const allCoords: [number, number][] = [];

    legs.forEach((leg) => {
      if (!leg.coords || leg.coords.length === 0) return;
      allCoords.push(...leg.coords);

      const isWalk = leg.mode === 'WALK';
      const color = isWalk
        ? '#8a93a2'
        : leg.routeColor
        ? `#${leg.routeColor}`
        : '#FF7A00';

      L.polyline(leg.coords, {
        color,
        weight: isWalk ? 3 : 6,
        opacity: isWalk ? 0.55 : 0.9,
        dashArray: isWalk ? '6 10' : undefined,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(layer);
    });

    const dot = (color: string) =>
      L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

    const firstCoord = legs[0]?.coords?.[0];
    const lastLeg = legs[legs.length - 1];
    const lastCoord = lastLeg?.coords?.[lastLeg.coords.length - 1];

    if (firstCoord) L.marker(firstCoord, { icon: dot('#00A651'), zIndexOffset: 500 }).addTo(layer);
    if (lastCoord) L.marker(lastCoord, { icon: dot('#FF7A00'), zIndexOffset: 500 }).addTo(layer);

    if (allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60] });
    }
  }, [legs]);

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

  return <div ref={containerRef} className={className} style={{ zIndex: 0 }} />;
}
