'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Stop } from '@/lib/types';

// Fix icônes Leaflet sous Next (les chemins par défaut pointent vers /dist/)
const DefaultIcon = L.icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Centre d'Abidjan (~Plateau)
const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];

type Props = {
  stops?: Stop[];
  center?: [number, number];
  zoom?: number;
  className?: string;
};

/**
 * Carte Leaflet "vanilla", pilotée en impératif via useEffect.
 * On évite react-leaflet parce qu'en React 19 + StrictMode (Next 16),
 * les effects sont invoqués deux fois en dev et react-leaflet crashe avec
 * "Map container is already initialized."
 */
export default function Map({
  stops = [],
  center = ABIDJAN_CENTER,
  zoom = 12,
  className = 'h-[70vh] w-full rounded-xl overflow-hidden shadow-md'
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // ---- Mount / Unmount ----
  useEffect(() => {
    if (!containerRef.current) return;

    // Si un container a déjà un id Leaflet (double-invoke StrictMode),
    // on le nettoie avant de ré-initialiser.
    // @ts-expect-error propriété interne Leaflet
    if (containerRef.current._leaflet_id) {
      // @ts-expect-error propriété interne Leaflet
      containerRef.current._leaflet_id = null;
    }

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← init une seule fois, le reste est piloté en effets séparés

  // ---- Recentrage ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, zoom);
  }, [center, zoom]);

  // ---- Markers ----
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    stops.forEach((s) => {
      const marker = L.marker([s.stop_lat, s.stop_lon]);
      const popupHtml = `
        <div style="font-size:13px">
          <div style="font-weight:600">${escapeHtml(s.stop_name)}</div>
          ${s.commune ? `<div style="color:#6b7280">${escapeHtml(s.commune)}</div>` : ''}
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.addTo(layer);
    });
  }, [stops]);

  return <div ref={containerRef} className={className} />;
}

// Mini-helper pour éviter l'injection HTML dans les popups
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
