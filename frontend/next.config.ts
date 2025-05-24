const isProd = process.env.NODE_ENV === 'production';
const origin = isProd ? 'https://doculock.vercel.app' : 'http://localhost:3000';

const ContentSecurityPolicy = `
  frame-ancestors 'none';
  default-src 'none';
  script-src 'self' ${origin};
  style-src 'self' ${origin};
  img-src 'self' ${origin} data:;
  font-src 'self' ${origin};
  connect-src 'self' ${origin};
`.replace(/\n/g, '');

const securityHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-store',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  poweredByHeader: false,
};

export default nextConfig;
