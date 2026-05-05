'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type ShapePoint = { shape_pt_lat: number; shape_pt_lon: number };
type RouteStop = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_sequence: number;
};

type Props = {
  shape: ShapePoint[];
  stops: RouteStop[];
  routeColor?: string;
  isSegmented: boolean;
};

export default function RouteMap({ shape, stops, routeColor = '1565c0', isSegmented }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const layersRef    = useRef<L.LayerGroup | null>(null);

  // ── Créer la carte UNE SEULE FOIS au montage ──────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const layers = L.layerGroup().addTo(map);

    mapRef.current  = map;
    layersRef.current = layers;

    // ── Localisation de l'utilisateur ──
    map.locate({ watch: true, enableHighAccuracy: true });
    
    let userMarker: L.Marker | null = null;
    map.on('locationfound', (e) => {
      if (!userMarker) {
        userMarker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: '',
            html: `<div style="width:16px;height:16px;border-radius:50%;background:var(--blue, #1E5BFF);border:3px solid #fff;box-shadow:0 0 0 4px rgba(30,91,255,0.3), 0 4px 10px rgba(0,0,0,0.2)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
        }).addTo(map);
      } else {
        userMarker.setLatLng(e.latlng);
      }
    });

    return () => {
      map.stopLocate();
      map.remove();
      mapRef.current    = null;
      layersRef.current = null;
    };
  }, []); // vide → exécuté une seule fois

  // ── Mettre à jour les couches sans recréer la carte ───────────────
  // Se déclenche à chaque changement de tracé, d'arrêts ou de mode
  useEffect(() => {
    const map    = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    // Effacer toutes les couches précédentes
    layers.clearLayers();

    const color     = `#${routeColor}`;
    const lineColor = isSegmented ? '#E8B23C' : color; // gold si segmenté

    // ── Tracé de la ligne ──
    if (shape.length > 1) {
      const latlngs = shape.map((p) => [p.shape_pt_lat, p.shape_pt_lon] as [number, number]);

      L.polyline(latlngs, {
        color: lineColor,
        weight: 5,
        opacity: isSegmented ? 1 : 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layers);

      // fitBounds avec padding asymétrique pour pousser le tracé vers le haut
      // et laisser de la place à la liste en dessous
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, {
        paddingTopLeft:     [20, 16],
        paddingBottomRight: [20, 48],
        animate: false,
        maxZoom: 15,
      });
    } else if (stops.length > 0) {
      // Pas de shape : centrer sur les arrêts disponibles
      const lls = stops.map((s) => [s.stop_lat, s.stop_lon] as [number, number]);
      map.fitBounds(L.latLngBounds(lls), { padding: [40, 40], animate: false });
    }

    // ── Marqueurs des arrêts ──
    stops.forEach((stop, idx) => {
      const isFirst    = idx === 0;
      const isLast     = idx === stops.length - 1;
      const isEndpoint = isFirst || isLast;

      // Départ = Bleu, Arrivée = Vert (identique à la timeline)
      const bg   = isFirst ? '#1E5BFF' : isLast ? '#0EA85B' : '#ffffff';
      const size = isEndpoint ? 16 : 8;

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2px solid ${lineColor};box-shadow:0 2px 6px rgba(0,0,0,0.2)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([stop.stop_lat, stop.stop_lon], { icon }).addTo(layers);
      
      // Infobulle stylisée
      marker.bindTooltip(`
        <div style="font-family: var(--font-display, sans-serif); font-weight: 800; font-size: 13px; color: var(--ink, #1a1a1a);">
          ${stop.stop_name}
        </div>
      `, {
        direction: 'top',
        offset: [0, -size / 2],
        className: 'custom-leaflet-tooltip',
      });
    });
  }, [shape, stops, routeColor, isSegmented]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
