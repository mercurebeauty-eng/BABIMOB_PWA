'use client';

import { useState, useEffect, useCallback } from 'react';

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    // webkitCompassHeading is specific to iOS and returns degrees from magnetic north
    // For Android/Other, we might need a fallback or alpha calculation
    const h = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
    setHeading(h);
  }, []);

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          setPermissionStatus('granted');
          return true;
        } else {
          setPermissionStatus('denied');
          return false;
        }
      } catch (err) {
        setError('Erreur de permission boussole');
        return false;
      }
    } else {
      // Android/Chrome often doesn't need explicit permission prompt for orientation
      window.addEventListener('deviceorientation', handleOrientation, true);
      setPermissionStatus('granted');
      return true;
    }
  };

  useEffect(() => {
    // Auto-try if already granted or not needed (Android)
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [handleOrientation]);

  return { heading, error, permissionStatus, requestPermission };
}
