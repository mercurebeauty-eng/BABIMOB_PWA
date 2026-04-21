/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // On désactive ESLint pendant le build Vercel (les peer deps eslint vs
  // eslint-config-next@16 sont en vrac en ce moment). On lint toujours
  // manuellement avec `npm run lint` en local.
  eslint: {
    ignoreDuringBuilds: true
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' }
    ]
  }
};

module.exports = nextConfig;
