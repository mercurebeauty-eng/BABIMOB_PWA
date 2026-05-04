'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { POI } from '@/lib/poi';
import type { ArretProche } from '@/lib/types';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useHotspots } from '@/hooks/useHotspots';
import { useMapPois } from '@/hooks/useMapPois';
import { useReachTracking } from '@/hooks/useReachTracking';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useItinerary } from '@/hooks/useItinerary';
import { useNearbyTransport } from '@/hooks/useNearbyTransport';

interface DataStoreContextType {
  pois: POI[];
  poiCheckins: Record<string, number>;
  livePois: string[];
  liveTickerFeed: any[];
  userLoc: [number, number] | null;
  userHeading: number | null;
  nearbyStops: ArretProche[];
  heatMode: boolean;
  setHeatMode: (mode: boolean) => void;
  hotspots: any[];
  profile: any;
  broadcasts: any[];
  explorers: any[];
  communityFeed: any[];
  trendingPlaces: any[];
  loading: boolean;
  locateMe: () => void;
  handleMapReady: (map: any) => void;
  geoLoading: boolean;
  activeItinerary: any;
  setActiveItinerary: (it: any) => void;
  nearbyTransport: any[];
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const { logReach } = useReachTracking();
  
  // Geolocation
  const {
    userLoc,
    userHeading,
    nearbyStops,
    loading: geoLoading,
    locateMe,
  } = useGeoLocation({
    onPositionAcquired: () => {},
    onLocate: () => {},
  });

  // POIs & Map Data
  const { pois, poiCheckins, livePois, liveTickerFeed, handleMapReady } = useMapPois({ logReach });
  
  // Hotspots
  const { heatMode, setHeatMode, hotspots } = useHotspots();
  
  // Community Data
  const communityData = useCommunityData({ logReach });

  // Itinerary
  const { activeItinerary, setActiveItinerary } = useItinerary();
  
  // Transport
  const nearbyTransport = useNearbyTransport(nearbyStops);

  const value = {
    pois,
    poiCheckins,
    livePois,
    liveTickerFeed,
    userLoc,
    userHeading,
    nearbyStops,
    heatMode,
    setHeatMode,
    hotspots,
    ...communityData,
    loading: geoLoading,
    locateMe,
    handleMapReady,
    geoLoading,
    activeItinerary,
    setActiveItinerary,
    nearbyTransport
  };

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const context = useContext(DataStoreContext);
  if (context === undefined) {
    throw new Error('useDataStore must be used within a DataStoreProvider');
  }
  return context;
}
