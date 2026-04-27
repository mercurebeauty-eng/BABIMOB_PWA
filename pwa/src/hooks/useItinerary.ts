'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function useItinerary() {
  const searchParams = useSearchParams();
  const [activeItinerary, setActiveItinerary] = useState<any | null>(null);

  useEffect(() => {
    const itiParam = searchParams.get('iti');
    if (itiParam) {
      try { setActiveItinerary(JSON.parse(decodeURIComponent(itiParam))); } catch { /* noop */ }
    }
  }, [searchParams]);

  return { activeItinerary, setActiveItinerary };
}
