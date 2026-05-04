import { Suspense } from 'react';
import ItineraireClient from './ItineraireClient';

export const dynamic = 'force-dynamic';

export default function ItinerairePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-beige-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-abidjan-orange/30 border-t-abidjan-orange rounded-full animate-spin" />
    </div>}>
      <ItineraireClient />
    </Suspense>
  );
}
