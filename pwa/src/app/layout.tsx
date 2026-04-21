import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'BABIMOB — Mobilité Abidjan',
  description: 'Gbaka, woro-woro et itinéraires temps réel à Abidjan.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BABIMOB'
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#1746D1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
