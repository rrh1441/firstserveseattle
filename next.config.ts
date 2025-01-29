/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/stripe-webhook',
        destination: '/api/stripe-webhook/',
      },
    ];
  }
};

export default nextConfig;