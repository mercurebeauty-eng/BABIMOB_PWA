import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import InstallPrompt from '@/components/InstallPrompt';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} scroll-smooth`}>
      <body className="font-sans min-h-screen flex flex-col selection:bg-abidjan-orange/20 selection:text-abidjan-orange">
        {children}
        <InstallPrompt />
        <SpeedInsights />
      </body>
    </html>
  );
}
