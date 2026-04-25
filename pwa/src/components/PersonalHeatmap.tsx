'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  data: { lat: number; lon: number }[];
};

export default function PersonalHeatmap({ data }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize Map with a light theme (CartoDB Positron)
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    }).setView([5.36, -4.0], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !data.length) return;

    const map = mapInstance.current;
    
    // Clear previous markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Circle) map.removeLayer(layer);
    });

    // Add "Heat" circles
    data.forEach(p => {
       // High opacity small center
       L.circle([p.lat, p.lon], {
         radius: 120,
         fillColor: '#FF7A00',
         fillOpacity: 0.15,
         stroke: false
       }).addTo(map);
       
       // Larger faint outer glow
       L.circle([p.lat, p.lon], {
         radius: 400,
         fillColor: '#FF7A00',
         fillOpacity: 0.05,
         stroke: false
       }).addTo(map);
    });

    // Fit map to data
    if (data.length > 0) {
      const bounds = L.latLngBounds(data.map(p => [p.lat, p.lon]));
      map.fitBounds(bounds.pad(0.3));
    }
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-[2rem] overflow-hidden grayscale contrast-125" />
      <div className="absolute inset-0 bg-gradient-to-br from-abidjan-orange/5 to-transparent pointer-events-none" />
    </div>
  );
}
