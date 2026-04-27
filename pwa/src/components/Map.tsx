'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Stop } from '@/lib/types';
import type { POI } from '@/lib/poi';

const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];

const SVG_LAYERS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
const SVG_GPS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>`;
const SVG_COMPASS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
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
  onStopClick?: (stop: any) => void;
  onPoiClick?: (poi: POI) => void;
  onMapReady?: (map: L.Map) => void;
  userLocation?: [number, number] | null;
  route?: [number, number][] | null;
  routeColor?: string;
  legs?: ItineraryLeg[] | null;
  hotspots?: { lat: number; lon: number; intensity: number }[];
  explorers?: { lat: number; lon: number; name: string }[];
  poiCheckins?: Record<string, number>;
  livePois?: string[];
  broadcasts?: { id: string; display_name: string; avatar_emoji: string; broadcast_text: string; broadcast_lat: number; broadcast_lon: number }[];
  pois?: POI[];
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const explorersLayerRef = useRef<L.LayerGroup | null>(null);
  const legsLayerRef = useRef<L.LayerGroup | null>(null);
  const poisLayerRef = useRef<L.LayerGroup | null>(null);
  const broadcastsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const onStopClickRef = useRef(onStopClick);
  const userLocationRef = useRef(userLocation);
  const poiCheckinsRef = useRef(poiCheckins);

  useEffect(() => { onStopClickRef.current = onStopClick; }, [onStopClick]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { poiCheckinsRef.current = poiCheckins; }, [poiCheckins]);

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

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const NavControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const c = L.DomUtil.create('div', 'bm-nav-toolbar');
        L.DomEvent.disableClickPropagation(c);
        L.DomEvent.disableScrollPropagation(c);

        const layerBtn = L.DomUtil.create('button', 'bm-map-btn', c) as HTMLButtonElement;
        layerBtn.title = 'Vue satellite';
        layerBtn.innerHTML = SVG_LAYERS;
        let isSat = false;
        L.DomEvent.on(layerBtn, 'click', () => {
          isSat = !isSat;
          if (isSat) {
            map.removeLayer(baseLayer);
            satLayer.addTo(map);
            layerBtn.classList.add('bm-map-btn--active');
          } else {
            map.removeLayer(satLayer);
            baseLayer.addTo(map);
            layerBtn.classList.remove('bm-map-btn--active');
          }
        });

        const gpsBtn = L.DomUtil.create('button', 'bm-map-btn', c) as HTMLButtonElement;
        gpsBtn.title = 'Ma position';
        gpsBtn.innerHTML = SVG_GPS;
        L.DomEvent.on(gpsBtn, 'click', () => {
          const loc = userLocationRef.current;
          if (loc) map.flyTo(loc, 16, { duration: 1.2 });
        });

        const compassBtn = L.DomUtil.create('button', 'bm-map-btn', c) as HTMLButtonElement;
        compassBtn.title = 'Vue Abidjan';
        compassBtn.innerHTML = SVG_COMPASS;
        L.DomEvent.on(compassBtn, 'click', () => {
          map.flyTo(ABIDJAN_CENTER, 12, { duration: 1.2 });
        });

        return c;
      },
    });

    new NavControl().addTo(map);

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

    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
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
      // 1. Large vibrant glow (Orange/Red)
      const intensityScale = Math.min(h.intensity / 50, 1); // Scale based on checkins
      const outerRadius = 100 + intensityScale * 150;
      
      L.circle([h.lat, h.lon], {
        radius: outerRadius,
        stroke: false,
        fillColor: '#ff3d00',
        fillOpacity: 0.15 + intensityScale * 0.1,
      }).addTo(layer);
      
      // 2. High intensity core
      L.circle([h.lat, h.lon], {
        radius: outerRadius * 0.5,
        stroke: false,
        fillColor: '#ff9100',
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
      const emoji = p.logo_emoji ?? '🏢';
      const isElite = p.sponsor_tier === 'elite';
      const isPro = p.sponsor_tier === 'pro' || p.has_campaign;
      const isSelected = selectedPoiId === p.id;
      const isLive = livePois.includes(p.id) || livePois.includes(`sp-${p.id}`);
      const checkinCount = poiCheckinsRef.current[p.id] ?? 0;

      const circleSize = isElite ? 40 : isPro ? 32 : 24;
      const emojiSize = isElite ? 22 : isPro ? 17 : 14;

      let extraClass = isElite
        ? 'bm-poi-circle-elite bm-poi-elite-pulse'
        : isPro
        ? 'bm-poi-circle-pro'
        : '';

      if (isLive) extraClass += ' bm-poi-live-pulse';

      const labelClass = isElite ? 'bm-poi-label-under-elite' : '';
      const stateClass = isSelected ? 'bm-poi-label-expanded' : 'bm-poi-label-collapsed';

      const presenceHtml = checkinCount > 0
        ? `<div class="bm-poi-presence">${SVG_PERSON}${checkinCount > 1 ? `<span class="bm-poi-presence-count">${checkinCount > 9 ? '9+' : checkinCount}</span>` : ''}</div>`
        : '';

      const html = `
        <div class="bm-poi-container ${isSelected ? 'bm-poi-container-selected' : ''}">
          ${presenceHtml}
          <div class="bm-poi-circle ${extraClass}" style="width:${circleSize}px; height:${circleSize}px;">
            <span class="bm-poi-emoji" style="font-size:${emojiSize}px;">${emoji}</span>
          </div>
          <span class="bm-poi-label-under ${labelClass} ${stateClass}">${p.name}</span>
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
  }, [pois, livePois]);

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
            <span style="font-size:16px">${bc.avatar_emoji}</span>
            <div style="display:flex;flex-direction:column;gap:1px">
              <span class="bm-broadcast-name">${bc.display_name}</span>
              <span class="bm-broadcast-text">${bc.broadcast_text}</span>
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
