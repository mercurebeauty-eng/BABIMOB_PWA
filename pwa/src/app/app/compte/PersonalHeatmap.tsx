'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Loading Leaflet dynamically to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

type Checkin = {
  lat: number;
  lon: number;
  weight: number;
};

export default function PersonalHeatmap({ checkins }: { checkins: any[] }) {
  const [mounted, setMounted] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Checkin[]>([]);

  useEffect(() => {
    setMounted(true);
    // Process checkins to group by coordinates
    const geoGroups: Record<string, number> = {};
    checkins.forEach(c => {
      if (c.lat && c.lon) {
        const key = `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`;
        geoGroups[key] = (geoGroups[key] || 0) + 1;
      }
    });

    const data = Object.entries(geoGroups).map(([key, count]) => {
      const [lat, lon] = key.split(',').map(Number);
      return { lat, lon, weight: count };
    });
    setHeatmapData(data);
  }, [checkins]);

  if (!mounted || heatmapData.length === 0) return (
    <div className="w-full h-full bg-beige-100/50 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-beige-muted">
       Pas encore d&apos;activité enregistrée
    </div>
  );

  const center: [number, number] = [5.3484, -4.0305]; // Abidjan

  return (
    <div className="w-full h-full relative rounded-[2rem] overflow-hidden grayscale contrast-125 brightness-110">
      <MapContainer 
        center={center} 
        zoom={11} 
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        style={{ height: '100%', width: '100%', background: '#f4f4f0' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {heatmapData.map((d, i) => (
          <CircleMarker
            key={i}
            center={[d.lat, d.lon]}
            radius={6 + (d.weight * 2)}
            fillColor="#FF7A00"
            color="transparent"
            fillOpacity={0.4}
          />
        ))}
      </MapContainer>
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
