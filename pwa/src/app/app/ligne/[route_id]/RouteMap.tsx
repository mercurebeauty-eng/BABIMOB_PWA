'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

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
};

export default function RouteMap({ shape, stops, routeColor = '1565c0' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // @ts-expect-error Leaflet internal
    if (containerRef.current._leaflet_id) containerRef.current._leaflet_id = null;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const color = `#${routeColor}`;

    if (shape.length > 1) {
      const latlngs = shape.map((p) => [p.shape_pt_lat, p.shape_pt_lon] as [number, number]);
      L.polyline(latlngs, { color, weight: 4, opacity: 0.85 }).addTo(map);
      map.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24] });
    } else if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map((s) => [s.stop_lat, s.stop_lon]));
      map.fitBounds(bounds, { padding: [24, 24] });
    }

    stops.forEach((stop, idx) => {
      const isEndpoint = idx === 0 || idx === stops.length - 1;
      const size = isEndpoint ? 14 : 8;
      const bg = isEndpoint ? color : '#ffffff';
      const border = color;

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2px solid ${border};box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      L.marker([stop.stop_lat, stop.stop_lon], { icon })
        .bindPopup(
          `<div class="bm-popup"><strong>${escapeHtml(stop.stop_name)}</strong></div>`,
          { className: 'bm-popup-wrapper', offset: [0, -4] }
        )
        .addTo(map);
    });

    return () => { map.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '220px' }} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
