import type { Metadata, Viewport } from 'next';
import { DM_Sans, Syne, Archivo_Black } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import InstallPrompt from '@/components/InstallPrompt';
import OfflineBanner from '@/components/OfflineBanner';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import { getManifestDataURI } from '@/lib/manifest';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-archivo-black',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://babimob.app';
const OG_IMAGE  = `${SITE_URL}/og-image.png`;
const OG_TITLE  = 'BABIMOB — Mobilité Abidjan';
const OG_DESC   = 'Gbaka, woro-woro et itinéraires en temps réel à Abidjan.';

export const metadata: Metadata = {
  title:       OG_TITLE,
  description: 'Trouve ton gbaka, ton woro-woro et tes itinéraires à Abidjan. Sur Telegram ou sur le web — au choix.',
  // manifest intentionally omitted here — injected as data URI in <head> below
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'default',
    title:           'BABIMOB',
  },
  icons: {
    icon: [
      { url: '/favicon.ico',        sizes: 'any' },
      { url: '/favicon-32x32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/favicon-16x16.png',  sizes: '16x16',  type: 'image/png' },
      { url: '/favicon.svg',        type:  'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  // Open Graph
  openGraph: {
    type:        'website',
    url:         SITE_URL,
    title:       OG_TITLE,
    description: OG_DESC,
    images:      [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'BABIMOB — Mobilité Abidjan' }],
    locale:      'fr_CI',
    siteName:    'BABIMOB',
  },
  // Twitter / X Card
  twitter: {
    card:        'summary_large_image',
    title:       OG_TITLE,
    description: OG_DESC,
    images:      [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor:    '#FF7A00',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  5,
  viewportFit:   'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side: encode manifest as base64 data URI — zero HTTP request
  const manifestURI = getManifestDataURI();

  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${syne.variable} ${archivoBlack.variable}`}
    >
      <head>
        {/* Manifest inlined as data URI — satisfies PWA install without an extra HTTP round-trip */}
        <link rel="manifest" href={manifestURI} />
      </head>

      <body className="font-sans min-h-screen flex flex-col">

        {/* Noscript fallback — functional message + inline styles (no JS dependency) */}
        <noscript>
          <div
            role="alert"
            style={{
              position:       'fixed',
              top:            0, left: 0, right: 0, bottom: 0,
              background:     '#F7F1E6',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        '40px',
              textAlign:      'center',
              zIndex:         99999,
              fontFamily:     'system-ui, -apple-system, sans-serif',
            }}
          >
            <p style={{ fontSize: 56, marginBottom: 20 }}>🗺️</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1A1410', marginBottom: 12 }}>
              BABIMOB nécessite JavaScript
            </h1>
            <p style={{ fontSize: 15, color: '#8B7E6E', maxWidth: 300, lineHeight: 1.6, marginBottom: 24 }}>
              Active JavaScript dans ton navigateur pour accéder à la carte, aux
              itinéraires en temps réel et à la communauté Babi.
            </p>
            <a
              href="https://t.me/babimob_bot"
              style={{
                padding:      '12px 24px',
                borderRadius: 14,
                background:   '#F26C1A',
                color:        '#fff',
                fontWeight:   700,
                fontSize:     14,
                textDecoration: 'none',
              }}
            >
              📱 Utiliser le bot Telegram à la place
            </a>
          </div>
        </noscript>

        {/* PWA Service Worker registration (blob-first, file fallback) + FCP observer */}
        <ServiceWorkerRegistrar />

        {/* Online/offline visual notification */}
        <OfflineBanner />

        {/* ARIA landmark: main application region */}
        <div
          role="main"
          aria-label="Application BABIMOB"
          className="flex-1 flex flex-col"
        >
          {children}
        </div>

        {/* PWA install prompt (Android native + iOS guide) */}
        <InstallPrompt />

        <SpeedInsights />
      </body>
    </html>
  );
}
