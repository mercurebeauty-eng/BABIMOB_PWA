'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ArretProche } from '@/lib/types';

type Options = {
  onPositionAcquired?: (loc: [number, number]) => void;
  onLocate?: () => void;
};

export function useGeoLocation({ onPositionAcquired, onLocate }: Options = {}) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const watchIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [nearbyStops, setNearbyStops] = useState<ArretProche[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPositionAcquiredRef = useRef(onPositionAcquired);
  const onLocateRef = useRef(onLocate);
  useEffect(() => { onPositionAcquiredRef.current = onPositionAcquired; }, [onPositionAcquired]);
  useEffect(() => { onLocateRef.current = onLocate; }, [onLocate]);

  const locateMe = useCallback(() => {
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
        if (!mountedRef.current) return;

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLoc([lat, lon]);
        setUserHeading(pos.coords.heading);
        setUserAccuracy(pos.coords.accuracy ?? null);
        onPositionAcquiredRef.current?.([lat, lon]);

        const { data, error: rpcError } = await supabase.rpc('arrets_proches', {
          p_lat: lat,
          p_lon: lon,
          p_radius_m: 800,
          p_limit: 15,
        });

        if (!mountedRef.current) return;

        setLoading(false);
        if (!rpcError && data) {
          setNearbyStops(data as ArretProche[]);
          onLocateRef.current?.();
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            if (mountedRef.current) {
              setUserLoc([p.coords.latitude, p.coords.longitude]);
              setUserHeading(p.coords.heading);
              setUserAccuracy(p.coords.accuracy ?? null);
            }
          },
          () => {},
          { enableHighAccuracy: true }
        );
      },
      (err) => {
        if (!mountedRef.current) return;
        setLoading(false);
        setError(err.code === err.PERMISSION_DENIED ? 'Autorise la localisation.' : 'Erreur GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return { userLoc, userHeading, userAccuracy, nearbyStops, setNearbyStops, loading, error, locateMe };
}
