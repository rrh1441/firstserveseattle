/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  /* -------------------------------------------------------------- */
  /*  Rewrites (your existing Stripe webhook rewrite & PostHog rewrites) */
  /* -------------------------------------------------------------- */
  async rewrites() {
    return [
      {
        source: '/api/stripe-webhook',
        destination: '/api/stripe-webhook/',
      },
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },

  /* -------------------------------------------------------------- */
  /*  Headers – ensure sw-kill.js is never cached                   */
  /* -------------------------------------------------------------- */
  async headers() {
    return [
      {
        source: '/sw-kill.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
