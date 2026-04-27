'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ArretProche } from '@/lib/types';

type Options = {
  onPositionAcquired?: (loc: [number, number]) => void;
  onLocate?: () => void;
};

export function useGeoLocation({ onPositionAcquired, onLocate }: Options = {}) {
  const supabase = createClient();
  const watchIdRef = useRef<number | null>(null);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [nearbyStops, setNearbyStops] = useState<ArretProche[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locateMe = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLoc([lat, lon]);
        onPositionAcquired?.([lat, lon]);

        const { data, error: rpcError } = await supabase.rpc('arrets_proches', {
          p_lat: lat,
          p_lon: lon,
          p_radius_m: 800,
          p_limit: 15,
        });

        setLoading(false);
        if (!rpcError && data) {
          setNearbyStops(data as ArretProche[]);
          onLocate?.();
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
          () => {},
          { enableHighAccuracy: true }
        );
      },
      (err) => {
        setLoading(false);
        setError(err.code === err.PERMISSION_DENIED ? 'Autorise la localisation.' : 'Erreur GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [supabase, onPositionAcquired, onLocate]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return {
    userLoc,
    nearbyStops,
    setNearbyStops,
    loading,
    error,
    locateMe,
  };
}
