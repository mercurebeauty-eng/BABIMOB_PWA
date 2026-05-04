import type { Metadata, Viewport } from 'next';
import { DM_Sans, Syne, Archivo_Black, Lexend } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import InstallPrompt from '@/components/InstallPrompt';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap'
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap'
});

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-archivo-black',
  display: 'swap'
});

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-lexend',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'BABIMOB — Mobilité Abidjan',
  description:
    'Trouve ton gbaka, ton woro-woro et tes itinéraires à Abidjan. Sur Telegram ou sur le web — au choix.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BABIMOB'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#FF7A00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { XPProvider } from '@/components/providers/XPProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${syne.variable} ${archivoBlack.variable} ${lexend.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <XPProvider>
          {children}
          <NotificationProvider />
          <InstallPrompt />
          <SpeedInsights />
        </XPProvider>
      </body>
    </html>
  );
}
