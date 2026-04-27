'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Check if dismissed recently (24h cooldown)
    const dismissed = localStorage.getItem('bm-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 86400000) return;

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isiOS);

    if (isiOS) {
      // Show banner after 5 seconds on iOS
      const t = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(t);
    }

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('bm-install-dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  // iOS guide overlay
  if (isIOS && showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.png" alt="BABIMOB" width={44} height={44} className="rounded-xl" />
              <div>
                <div className="font-bold text-gray-900">Installer BABIMOB</div>
                <div className="text-xs text-gray-500">3 étapes rapides</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold text-sm">1</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Appuie sur le bouton partage</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    L&apos;icône{' '}
                    <svg className="inline w-4 h-4 text-blue-500 align-text-bottom" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16,6 12,2 8,6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>{' '}
                    en bas de Safari
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold text-sm">2</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Défile et choisis</div>
                  <div className="text-xs text-gray-500 mt-0.5">&laquo; Sur l&apos;écran d&apos;accueil &raquo;</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold text-sm">3</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Confirme &laquo; Ajouter &raquo;</div>
                  <div className="text-xs text-gray-500 mt-0.5">BABIMOB apparaîtra sur ton écran d&apos;accueil !</div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bottom banner (Android + iOS)
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-slide-up">
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-gray-100 p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="BABIMOB" width={44} height={44} className="rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-sm">Installer BABIMOB</div>
            <div className="text-xs text-gray-500 mt-0.5">Accès rapide depuis ton écran d&apos;accueil</div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition flex-shrink-0"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex-1 bg-bm-gradient text-black font-semibold text-sm py-2.5 rounded-xl active:opacity-90 transition-opacity"
            >
              Comment installer →
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="flex-1 bg-bm-gradient text-black font-semibold text-sm py-2.5 rounded-xl active:opacity-90 transition-opacity"
            >
              Installer
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
