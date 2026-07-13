
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
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
    const noCacheHeaders = [
      { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];
    
    return [
      { source: '/admin/:path*', headers: noCacheHeaders },
      { source: '/dashboard/:path*', headers: noCacheHeaders },
      { source: '/login', headers: noCacheHeaders },
      { source: '/signup', headers: noCacheHeaders },
      { source: '/cart', headers: noCacheHeaders },
      { source: '/checkout', headers: noCacheHeaders },
    ];
  },
  async redirects() {
    // GLOBAL_OG_URL matches the GLOBAL_OG_IMAGE constant in src/lib/constants.ts
    const GLOBAL_OG_URL = 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FLRM285EOq3gwNMKayY6vtzooaC03%2F1778852737208-South%20Africa%E2%80%99s%20Trusted%20Online%20Accounting%20%26%20Tax%20Compliance%20Partner%20(2).png?alt=media&token=3e8db3bc-8d7a-44b3-a258-dce170c9076d';
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'myacc.co.za',
          },
        ],
        destination: 'https://www.myacc.co.za/:path*',
        permanent: true,
      },
      {
        source: '/product/:path*',
        destination: '/products/:path*',
        permanent: true,
      },
      {
        source: '/services/:path*',
        destination: '/products/:path*',
        permanent: true,
      },
      {
        source: '/products/vat-returns',
        destination: '/products/periodic-vat-calculation-and-submission',
        permanent: true,
      },
      {
        source: '/products/company-registration',
        destination: '/products/private-company-registration',
        permanent: true,
      },
      {
        source: '/products/cipc-annual-returns',
        destination: '/products/annual-returns',
        permanent: true,
      },
      // NOTE: The /p/:partner/products/:slug route is a live white-label partner page
      // (see src/app/p/[slug]/products/[serviceSlug]/page.tsx). Do NOT redirect it.
      // The redirect below was removed to prevent intercepting those active routes.
      {
        source: '/blog/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
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
        source: '/about-us',
        destination: '/',
        permanent: true,
      },
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/advisory-services',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/compliance-check',
        destination: '/compliance',
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
  turbopack: {},
};

export default nextConfig;
