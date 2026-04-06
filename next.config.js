/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['deck.gl', '@deck.gl/core', '@deck.gl/layers', '@deck.gl/mapbox', '@deck.gl/react'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/new-condos-:neighborhood', destination: '/areas/:neighborhood' },
    ];
  },
  async redirects() {
    return [
      // Existing redirects
      { source: '/pre-construction', destination: '/new-condos', permanent: true },
      { source: '/pre-construction/:slug', destination: '/properties/:slug', permanent: true },
      { source: '/contact', destination: '/contact-us', permanent: true },

      // Trailing slash cleanup
      { source: '/properties/:slug/', destination: '/properties/:slug', permanent: true },
      { source: '/new-condos/', destination: '/new-condos', permanent: true },
      { source: '/blog/', destination: '/blog', permanent: true },
      { source: '/contact-us/', destination: '/contact-us', permanent: true },
      { source: '/developers/', destination: '/developers', permanent: true },
      { source: '/developers/:slug/', destination: '/developers/:slug', permanent: true },

      // Old WordPress URL patterns → proper destinations
      { source: '/category/:slug', destination: '/blog', permanent: true },
      { source: '/category/:slug/:rest*', destination: '/blog', permanent: true },
      { source: '/tag/:slug', destination: '/blog', permanent: true },
      { source: '/tag/:slug/:rest*', destination: '/blog', permanent: true },
      { source: '/author/:slug', destination: '/blog', permanent: true },
      { source: '/page/:num', destination: '/', permanent: true },
      { source: '/feed', destination: '/', permanent: true },
      { source: '/feed/:rest*', destination: '/', permanent: true },
      { source: '/comments/feed', destination: '/', permanent: true },

      // WordPress admin/content → 404 (redirect to home, Next.js will 404 on missing pages)
      { source: '/wp-admin', destination: '/not-a-page', permanent: false },
      { source: '/wp-admin/:rest*', destination: '/not-a-page', permanent: false },
      { source: '/wp-content/:rest*', destination: '/not-a-page', permanent: false },
      { source: '/wp-includes/:rest*', destination: '/not-a-page', permanent: false },
      { source: '/wp-login.php', destination: '/not-a-page', permanent: false },
      { source: '/wp-json/:rest*', destination: '/not-a-page', permanent: false },
      { source: '/xmlrpc.php', destination: '/not-a-page', permanent: false },

      // WordPress date-based archives
      { source: '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug', destination: '/blog', permanent: true },
      { source: '/:year(\\d{4})/:month(\\d{2})/:slug', destination: '/blog', permanent: true },
      { source: '/:year(\\d{4})/:month(\\d{2})', destination: '/blog', permanent: true },
    ];
  },
};

module.exports = nextConfig;
