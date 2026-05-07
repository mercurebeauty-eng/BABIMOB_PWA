'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
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
import { useCompass } from '@/hooks/useCompass';

interface DataStoreContextType {
  pois: POI[];
  poiCheckins: Record<string, number>;
  livePois: string[];
  liveTickerFeed: any[];
  userLoc: [number, number] | null;
  userHeading: number | null;
  userAccuracy: number | null;
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
  mapRef: MutableRefObject<MapLibreMap | null>;
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
    userHeading: gpsHeading,
    userAccuracy,
    nearbyStops,
    loading: geoLoading,
    locateMe: baseLocateMe,
  } = useGeoLocation({
    onPositionAcquired: () => {},
    onLocate: () => {},
  });

  // Compass
  const { heading: deviceHeading, requestPermission: requestCompassPermission } = useCompass();

  const locateMe = useCallback(() => {
    baseLocateMe();
    requestCompassPermission();
  }, [baseLocateMe, requestCompassPermission]);

  const userHeading = deviceHeading ?? gpsHeading;

  // POIs & Map Data
  const { pois, poiCheckins, livePois, liveTickerFeed, handleMapReady, mapRef } = useMapPois({ logReach });
  
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
    userAccuracy,
    nearbyStops,
    heatMode,
    setHeatMode,
    hotspots,
    ...communityData,
    loading: geoLoading,
    locateMe,
    handleMapReady,
    mapRef,
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
