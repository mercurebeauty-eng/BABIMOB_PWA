const withPWA = require('@ducanh2912/next-pwa').default({
  dest:        'public',
  disable:     process.env.NODE_ENV === 'development',
  // Manual registration via ServiceWorkerRegistrar (blob-first, file fallback)
  register:    false,
  skipWaiting: true,
  workboxOptions: {
    runtimeCaching: [
      // Cache-first: CartoDB map tiles (30 days)
      {
        urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*\.png/,
        handler:    'CacheFirst',
        options: {
          cacheName:          'cartodb-tiles',
          expiration:         { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse:  { statuses: [0, 200] },
        },
      },
      // Cache-first: Google Fonts (1 year)
      {
        urlPattern: /^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/i,
        handler:    'CacheFirst',
        options: {
          cacheName:  'google-fonts',
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      // Cache-first: Next.js immutable static assets
      {
        urlPattern: /^\/_next\/static\/.*/,
        handler:    'CacheFirst',
        options: {
          cacheName:  'next-static',
          expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      // Network-first: Supabase REST / Auth / Storage API
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|auth|storage|functions)\/.*/i,
        handler:    'NetworkFirst',
        options: {
          cacheName:             'supabase-api',
          networkTimeoutSeconds: 5,
          expiration:            { maxEntries: 50, maxAgeSeconds: 60 * 5 },
          cacheableResponse:     { statuses: [0, 200] },
        },
      },
      // Network-first: OpenTripPlanner / GTFS
      {
        urlPattern: /.*\/otp\/.*/,
        handler:    'NetworkFirst',
        options: {
          cacheName:             'otp-api',
          networkTimeoutSeconds: 10,
          cacheableResponse:     { statuses: [0, 200] },
        },
      },
      // Network-first: Overpass API (OSM POIs)
      {
        urlPattern: /^https:\/\/overpass-api\.de\/.*/,
        handler:    'NetworkFirst',
        options: {
          cacheName:             'overpass-api',
          networkTimeoutSeconds: 8,
          cacheableResponse:     { statuses: [0, 200] },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  async headers() {
    return [
      {
        // Allow the file-based SW to control the full origin scope
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control',          value: 'no-cache, no-store, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        // Security headers for all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
