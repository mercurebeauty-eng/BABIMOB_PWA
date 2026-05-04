'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const MapModern = dynamic(() => import('@/components/MapModern'), { ssr: false });

export default function TestMapPage() {
  const [satellite, setSatellite] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      <MapModern 
        satellite={satellite}
        zoom={13}
        userLocation={[-4.020, 5.345]}
        userHeading={45}
        stops={[
          { stop_id: '1', stop_name: 'Gare Nord', stop_lat: 5.350, stop_lon: -4.010, commune: 'Abobo' },
          { stop_id: '2', stop_name: 'Gare Sud', stop_lat: 5.340, stop_lon: -4.030, commune: 'Plateau' },
        ]}
        pois={[
          { id: 'p1', name: 'Maquis du Coin', lat: 5.345, lon: -4.015, category: 'food', logo_emoji: '🍲', cover_color: '#FF6B6B', is_sponsored: true, sponsor_tier: 'elite', source: 'supabase', has_campaign: false },
          { id: 'p2', name: 'Pharmacie de Garde', lat: 5.342, lon: -4.022, category: 'health', logo_emoji: '💊', cover_color: '#FF4D6D', is_sponsored: false, sponsor_tier: null, source: 'osm', has_campaign: false },
        ]}
        hotspots={[
          { lat: 5.345, lon: -4.020, intensity: 45 },
          { lat: 5.348, lon: -4.018, intensity: 30 },
          { lat: 5.342, lon: -4.025, intensity: 20 },
        ]}
      />
      
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: 10 }}>
        <button 
          onClick={() => setSatellite(!satellite)}
          style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--orange)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
        >
          {satellite ? '🛰️ Vue Satellite' : '🗺️ Vue Plan'}
        </button>
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: 8, color: '#fff', fontSize: 12, backdropFilter: 'blur(10px)' }}>
          Mode WebGL : <b>Activé (MapLibre)</b>
        </div>
      </div>
    </div>
  );
}
