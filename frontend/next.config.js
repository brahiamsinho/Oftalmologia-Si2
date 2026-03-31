/** @type {import('next').NextConfig} */

const rawApi = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

function buildImageRemotePatterns() {
  if (!rawApi) return [];
  try {
    const u = new URL(rawApi);
    const pattern = {
      protocol: u.protocol.replace(':', ''),
      hostname: u.hostname,
    };
    if (u.port) {
      pattern.port = u.port;
    }
    return [pattern];
  } catch {
    return [];
  }
}

const nextConfig = {
  output: 'standalone',

  env: {
    NEXT_PUBLIC_API_URL: rawApi,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Oftalmología Si2',
  },

  images: {
    remotePatterns: buildImageRemotePatterns(),
  },

  async rewrites() {
    if (!rawApi) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${rawApi}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
