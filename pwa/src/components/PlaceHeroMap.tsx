'use client';

import dynamic from 'next/dynamic';
import type { POI } from '@/lib/poi';
import { useDataStore } from '@/context/DataStoreContext';
import { useEffect } from 'react';
import { Marker } from 'react-map-gl/maplibre';

const Map = dynamic(() => import('@/components/MapModern'), { ssr: false });

type Props = {
  lat: number;
  lon: number;
  emoji: string;
  name: string;
  id: string;
};

export default function PlaceHeroMap({ lat, lon, emoji, name, id }: Props) {
  const { userLoc, userHeading, locateMe } = useDataStore();

  useEffect(() => {
    locateMe();
  }, [locateMe]);

  return (
    <div style={{ height: '45dvh', position: 'relative', overflow: 'hidden', background: 'var(--cream)' }}>
      <Map 
        center={[lat, lon]} 
        zoom={16} 
        pois={[]} // On ne passe pas le POI principal en standard pour éviter les doublons
      >
        {/* LE MARQUEUR VEDETTE (Toujours visible et premium) */}
        <Marker longitude={lon} latitude={lat} anchor="bottom">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 50, height: 50,
              background: 'var(--ink)',
              borderRadius: '50%',
              border: '3px solid #fff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              position: 'relative',
              zIndex: 10
            }}>
              {emoji || '📍'}
              <div className="pulse" style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%', background: 'rgba(242,108,26,0.2)',
                zIndex: -1
              }} />
            </div>
            <div style={{
              marginTop: 6, padding: '4px 12px',
              background: '#fff', borderRadius: 12,
              fontSize: 11, fontWeight: 900, color: 'var(--ink)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              {name}
            </div>
          </div>
        </Marker>
      </Map>

      {/* Immersive Overlay adouci */}
      <div style={{ 
        position: 'absolute', inset: 0, 
        background: 'linear-gradient(to bottom, transparent 50%, var(--cream) 100%)',
        pointerEvents: 'none',
        zIndex: 5
      }} />
    </div>
  );
}
