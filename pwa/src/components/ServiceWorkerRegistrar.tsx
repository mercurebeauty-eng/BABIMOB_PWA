'use client';

import { useEffect } from 'react';
import { createServiceWorker } from '@/lib/sw';

// Registers the SW via blob URL (zero HTTP request).
// If the browser rejects blob scope, falls back to the Workbox file-based SW.
// Also installs a PerformanceObserver to log FCP for autovérification.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    // FCP measurement — target < 2 000 ms
    if ('PerformanceObserver' in window) {
      const obs = new PerformanceObserver((list) => {
        const entry = list.getEntriesByName('first-contentful-paint')[0];
        if (entry) {
          const ms = Math.round(entry.startTime);
          console.info(`[BABIMOB] FCP: ${ms}ms ${ms < 2000 ? '✅ < 2s' : '⚠️ > 2s'}`);
          obs.disconnect();
        }
      });
      try { obs.observe({ type: 'paint', buffered: true }); } catch { /* unsupported */ }
    }

    // Detect install eligibility (Android "Add to Home Screen")
    const onBeforeInstall = () => {
      console.info('[BABIMOB] PWA installable ✅');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall, { once: true });

    if (!('serviceWorker' in navigator)) return;

    const code    = createServiceWorker();
    const blob    = new Blob([code], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    navigator.serviceWorker
      .register(blobUrl, { scope: '/' })
      .then(() => console.info('[SW] Registered via inline blob ✅'))
      .catch(() => {
        // Blob scope restriction (expected on most origins) → file-based fallback
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      })
      .finally(() => URL.revokeObjectURL(blobUrl));

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  return null;
}
