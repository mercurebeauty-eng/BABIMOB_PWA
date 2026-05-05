'use client';

import dynamic from 'next/dynamic';
import type { POI } from '@/lib/poi';
import { useDataStore } from '@/context/DataStoreContext';
import { useEffect } from 'react';

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

  const poi: POI = {
    id,
    name,
    lat,
    lon,
    logo_emoji: emoji,
    category: 'other',
    cover_color: 'var(--orange)',
    is_sponsored: false,
    sponsor_tier: null,
    has_campaign: false,
    source: 'supabase'
  };

  return (
    <div style={{ height: '40dvh', position: 'relative', overflow: 'hidden' }}>
      <Map 
        center={[lat, lon]} 
        zoom={16} 
        pois={[poi]} 
        userLocation={userLoc}
        userHeading={userHeading}
      />
      {/* Immersive Overlay */}
      <div style={{ 
        position: 'absolute', inset: 0, 
        background: 'linear-gradient(to bottom, rgba(247,241,230,0) 60%, var(--cream) 100%)',
        pointerEvents: 'none'
      }} />
    </div>
  );
}
