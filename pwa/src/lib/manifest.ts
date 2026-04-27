// Single source of truth for the PWA manifest — inlined as data URI in <head>
// to eliminate the HTTP request to /manifest.json entirely.
export const MANIFEST_DATA = {
  name:             'BABIMOB — Mobilité Abidjan',
  short_name:       'BABIMOB',
  description:      'Gbaka, woro-woro et itinéraires en temps réel à Abidjan.',
  start_url:        '/app',
  display:          'standalone',
  background_color: '#FDFBF7',
  theme_color:      '#FF7A00',
  orientation:      'portrait-primary',
  lang:             'fr',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  categories: ['travel', 'navigation', 'utilities'],
  shortcuts: [
    { name: 'Carte',     url: '/app',          description: 'Ouvrir la carte' },
    { name: "C'comment", url: '/app/ccomment', description: "Voir l'activité locale" },
  ],
} as const;

export function getManifestDataURI(): string {
  const json = JSON.stringify(MANIFEST_DATA);
  const b64  = Buffer.from(json).toString('base64');
  return `data:application/manifest+json;base64,${b64}`;
}
