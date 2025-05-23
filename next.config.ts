/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  /* -------------------------------------------------------------- */
  /*  Rewrites (your existing Stripe webhook rewrite)               */
  /* -------------------------------------------------------------- */
  async rewrites() {
    return [
      {
        source: '/api/stripe-webhook',
        destination: '/api/stripe-webhook/',
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
};

export default nextConfig;