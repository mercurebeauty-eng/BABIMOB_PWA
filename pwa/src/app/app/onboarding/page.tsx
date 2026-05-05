import { Suspense } from 'react';
import OnboardingClient from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-orange-500 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>}>
      <OnboardingClient />
    </Suspense>
  );
}
