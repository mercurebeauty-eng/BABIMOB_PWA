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
  activeDirection: number;
  isSegmented: boolean;
};

export default function RouteMap({ shape, stops, routeColor = '1565c0', activeDirection, isSegmented }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const color = `#${routeColor}`;
    const segmentColor = isSegmented ? 'var(--gold)' : color;

    if (shape.length > 1) {
      const latlngs = shape.map((p) => [p.shape_pt_lat, p.shape_pt_lon] as [number, number]);
      const bounds = L.latLngBounds(latlngs);
      
      L.polyline(latlngs, { 
        color: segmentColor, 
        weight: 5, 
        opacity: isSegmented ? 1 : 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(bounds, { padding: [40, 40] });
    }

    stops.forEach((stop, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === stops.length - 1;
      const isEndpoint = isFirst || isLast;
      
      // Nouvelle logique demandée : Départ = Bleu, Arrivée = Vert
      const bg = isFirst ? 'var(--blue)' : isLast ? 'var(--green)' : '#ffffff';
      const size = isEndpoint ? 16 : 8;
      const border = segmentColor;

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2px solid ${border};box-shadow:0 2px 6px rgba(0,0,0,0.2)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      L.marker([stop.stop_lat, stop.stop_lon], { icon }).addTo(map);
    });

    return () => { 
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [shape, stops, routeColor, activeDirection, isSegmented]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
