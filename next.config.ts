
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  /* Generate a unique build ID based on timestamp to bust CDN and browser caches */
  generateBuildId: async () => {
    return `build-${new Date().getTime()}`;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: "https://www.myacc.co.za",
    // This provides a readable build timestamp for the footer
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },
  async headers() {
    return [
      {
        // Apply no-cache headers to all routes to ensure the latest version is always fetched
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  async redirects() {
    const GLOBAL_OG_URL = 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FLRM285EOq3gwNMKayY6vtzooaC03%2F1778842309292-South%20Africa%E2%80%99s%20Trusted%20Online%20Accounting%20%26%20Tax%20Compliance%20Partner%20(1).png?alt=media&token=f64e0df6-ab06-4ebb-9470-e15c9f827437';
    return [
      {
        source: '/BEI',
        destination: '/become-a-partner',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/',
        permanent: true,
      },
      {
        source: '/og-image.jpg',
        destination: GLOBAL_OG_URL,
        permanent: true,
      },
      {
        source: '/opengraph-image.jpg',
        destination: GLOBAL_OG_URL,
        permanent: true,
      }
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dgram: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        http2: false,
        crypto: false,
        buffer: false,
        events: false,
        "node:buffer": false,
        "node:crypto": false,
        "node:events": false,
        "node:fs": false,
        "node:http2": false,
      };
    }
    return config;
  },
};

export default nextConfig;
