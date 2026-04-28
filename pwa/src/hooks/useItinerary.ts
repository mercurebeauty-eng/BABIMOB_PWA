'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export type ItineraryLeg = {
  coords?: [number, number][];
  mode: string;
  route?: { color?: string; shortName?: string };
  to: { name: string };
};

export type Itinerary = {
  legs: ItineraryLeg[];
};

function isValidItinerary(val: unknown): val is Itinerary {
  if (!val || typeof val !== 'object') return false;
  const obj = val as Record<string, unknown>;
  if (!Array.isArray(obj.legs)) return false;
  return obj.legs.every(
    (leg: unknown) =>
      leg &&
      typeof leg === 'object' &&
      typeof (leg as Record<string, unknown>).mode === 'string'
  );
}

export function useItinerary() {
  const searchParams = useSearchParams();
  const [activeItinerary, setActiveItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    const itiParam = searchParams.get('iti');
    if (!itiParam) return;
    try {
      const parsed = JSON.parse(decodeURIComponent(itiParam));
      if (isValidItinerary(parsed)) setActiveItinerary(parsed);
    } catch {
      // invalid JSON — ignore
    }
  }, [searchParams]);

  return { activeItinerary, setActiveItinerary };
}
