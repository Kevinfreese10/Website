
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
      { source: '/partner/:path*', headers: noCacheHeaders },
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
      },
      {
        source: '/kevin-freese.jpg',
        destination: 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/assets%2Fkevin-freese.jpg?alt=media&token=302e6739686d626639646b66396d746c3131673134',
        permanent: false,
      },
      {
        source: '/images/kevin.jpeg',
        destination: 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/assets%2Fkevin-desk.jpeg?alt=media&token=302e7761676c767178706e76716d746c3131696630',
        permanent: false,
      },

      // ===== SEO DEAD SLUG REDIRECTS (from 4xx crawl audit) =====
      // --- Tax Compliance cluster → /tax-compliance ---
      { source: '/products/tax-compliance', destination: '/tax-compliance', permanent: true },
      { source: '/products/tax-compliance-services', destination: '/tax-compliance', permanent: true },
      { source: '/products/tax-compliance-service', destination: '/tax-compliance', permanent: true },
      { source: '/products/tax-compliance-consulting', destination: '/tax-compliance', permanent: true },
      { source: '/products/tax-compliance-resolution', destination: '/tax-compliance', permanent: true },
      { source: '/products/tax-compliance-review', destination: '/tax-compliance', permanent: true },
      { source: '/products/tax-compliance-certificate-assistance', destination: '/products/tax-clearance-certificate', permanent: true },
      { source: '/products/sars-compliance', destination: '/tax-compliance', permanent: true },
      { source: '/products/sars-compliance-check', destination: '/tax-compliance', permanent: true },
      { source: '/products/sars-compliance-checks', destination: '/tax-compliance', permanent: true },
      { source: '/products/sars-compliance-service', destination: '/tax-compliance', permanent: true },
      { source: '/products/sars-compliance-services', destination: '/tax-compliance', permanent: true },

      // --- Tax Consulting cluster → /tax-consulting ---
      { source: '/products/tax-consulting', destination: '/tax-consulting', permanent: true },
      { source: '/products/tax-consulting-services', destination: '/tax-consulting', permanent: true },
      { source: '/products/tax-consulting-and-compliance', destination: '/tax-consulting', permanent: true },
      { source: '/products/tax-advisory-services', destination: '/tax-consulting', permanent: true },
      { source: '/products/tax-consultation', destination: '/tax-consulting', permanent: true },
      { source: '/products/tax-consultation-service', destination: '/tax-consulting', permanent: true },
      { source: '/products/tax-consultation-services', destination: '/tax-consulting', permanent: true },

      // --- Tax Returns cluster → /tax-returns ---
      { source: '/products/tax-returns', destination: '/tax-returns', permanent: true },
      { source: '/products/tax-return-submission-service', destination: '/tax-returns', permanent: true },
      { source: '/products/tax-services', destination: '/tax-returns', permanent: true },
      { source: '/products/individual-tax-returns', destination: '/products/individual-income-tax-return-itr12-simple', permanent: true },
      { source: '/products/individual-tax-services', destination: '/products/individual-income-tax-return-itr12-simple', permanent: true },
      { source: '/products/personal-tax-returns', destination: '/products/individual-income-tax-return-itr12-simple', permanent: true },
      { source: '/products/personal-tax-services', destination: '/products/individual-income-tax-return-itr12-simple', permanent: true },
      { source: '/products/company-tax-returns', destination: '/products/itr14-company-income-tax-return-trading-entities', permanent: true },
      { source: '/products/company-tax-filing', destination: '/products/itr14-company-income-tax-return-trading-entities', permanent: true },
      { source: '/products/company-tax-services', destination: '/products/itr14-company-income-tax-return-trading-entities', permanent: true },
      { source: '/products/business-tax-services', destination: '/products/itr14-company-income-tax-return-trading-entities', permanent: true },

      // --- Tax Planning cluster → /tax-planning ---
      { source: '/products/tax-planning', destination: '/tax-planning', permanent: true },
      { source: '/products/international-tax-planning', destination: '/tax-planning', permanent: true },
      { source: '/products/tax-health-check', destination: '/tax-planning', permanent: true },

      // --- Tax Disputes cluster → /tax-disputes ---
      { source: '/products/sars-dispute-resolution', destination: '/sars-disputes', permanent: true },
      { source: '/products/tax-dispute-resolution', destination: '/sars-disputes', permanent: true },
      { source: '/products/tax-objections-appeals', destination: '/tax-disputes', permanent: true },
      { source: '/products/sars-audit-support', destination: '/tax-disputes', permanent: true },

      // --- Provisional Tax cluster → /provisional-tax ---
      { source: '/products/provisional-tax', destination: '/provisional-tax', permanent: true },
      { source: '/products/provisional-tax-assistance', destination: '/provisional-tax', permanent: true },
      { source: '/products/provisional-tax-service', destination: '/provisional-tax', permanent: true },

      // --- Payroll cluster → /payroll-services ---
      { source: '/products/payroll', destination: '/payroll-services', permanent: true },
      { source: '/products/payroll-services', destination: '/payroll-services', permanent: true },
      { source: '/products/payroll-management', destination: '/payroll-services', permanent: true },
      { source: '/products/payroll-outsourcing-service', destination: '/payroll-services', permanent: true },

      // --- Bookkeeping cluster → /bookkeeping ---
      { source: '/products/bookkeeping', destination: '/bookkeeping', permanent: true },
      { source: '/products/bookkeeping-services', destination: '/bookkeeping', permanent: true },
      { source: '/products/bookkeeping-payroll', destination: '/bookkeeping', permanent: true },

      // --- Financial Statements cluster → /financial-statements ---
      { source: '/products/financial-statements', destination: '/financial-statements', permanent: true },
      { source: '/products/financial-reporting', destination: '/financial-statements', permanent: true },
      { source: '/products/financial-reporting-services', destination: '/financial-statements', permanent: true },
      { source: '/products/annual-financial-statements', destination: '/annual-financial-statements', permanent: true },

      // --- Financial Advisory cluster → /financial-advisory ---
      { source: '/products/financial-advisory', destination: '/financial-advisory', permanent: true },
      { source: '/products/financial-advisory-services', destination: '/financial-advisory', permanent: true },
      { source: '/products/financial-consulting', destination: '/financial-advisory', permanent: true },
      { source: '/products/financial-planning', destination: '/financial-advisory', permanent: true },
      { source: '/products/cfo-services', destination: '/fractional-cfo-services-south-africa', permanent: true },
      { source: '/products/debt-restructuring-advisory', destination: '/financial-advisory', permanent: true },
      { source: '/products/estate-planning', destination: '/financial-advisory', permanent: true },
      { source: '/products/loan-application-support', destination: '/financial-advisory', permanent: true },

      // --- Company Registration cluster → /company-registration ---
      { source: '/products/company-registration-service', destination: '/products/private-company-registration', permanent: true },
      { source: '/products/company-secretarial', destination: '/company-registration', permanent: true },
      { source: '/products/company-secretarial-services', destination: '/company-registration', permanent: true },
      { source: '/products/secretarial-services', destination: '/company-registration', permanent: true },
      { source: '/products/company-profile-development', destination: '/company-registration', permanent: true },
      { source: '/products/company-deregistration-reinstatement', destination: '/products/company-reinstatement', permanent: true },
      { source: '/products/cipc-company-reinstatement-service', destination: '/products/company-reinstatement', permanent: true },
      { source: '/products/cipc-compliance-services', destination: '/compliance-services', permanent: true },

      // --- Compliance cluster → /compliance-services ---
      { source: '/products/compliance', destination: '/compliance-services', permanent: true },
      { source: '/products/compliance-services', destination: '/compliance-services', permanent: true },
      { source: '/products/compliance-consultation', destination: '/compliance-services', permanent: true },
      { source: '/products/compliance-consulting', destination: '/compliance-services', permanent: true },
      { source: '/products/business-compliance', destination: '/compliance-services', permanent: true },

      // --- SME Accounting cluster → /sme-accounting ---
      { source: '/products/sme-accounting', destination: '/sme-accounting', permanent: true },
      { source: '/products/sme-accounting-services', destination: '/sme-accounting', permanent: true },
      { source: '/products/sme-solutions', destination: '/sme-accounting', permanent: true },
      { source: '/products/sme-tax-advisory', destination: '/sme-accounting', permanent: true },
      { source: '/products/sme-tax-services', destination: '/sme-accounting', permanent: true },
      { source: '/products/sme-tax-solutions', destination: '/sme-accounting', permanent: true },
      { source: '/products/small-business-accounting', destination: '/small-business-accounting-south-africa', permanent: true },
      { source: '/products/small-business-accounting-services', destination: '/small-business-accounting-south-africa', permanent: true },
      { source: '/products/small-business-tax-services', destination: '/sme-accounting', permanent: true },

      // --- Trust Services cluster → /trust-services ---
      { source: '/products/trust-registration', destination: '/trust-services', permanent: true },
      { source: '/products/trust-registration-services', destination: '/trust-services', permanent: true },
      { source: '/products/trust-formation', destination: '/trust-services', permanent: true },
      { source: '/products/trust-administration', destination: '/trust-services', permanent: true },

      // --- Specialist Services cluster → /specialist-services ---
      { source: '/products/npo-financial-management', destination: '/specialist-services', permanent: true },
      { source: '/products/csd-registration-support', destination: '/products/csd-registration', permanent: true },
      { source: '/products/customs-clearance-support', destination: '/specialist-services', permanent: true },
      { source: '/products/customs-consulting', destination: '/specialist-services', permanent: true },
      { source: '/products/tender-consulting-services', destination: '/products/tender-ready-company-registration-package', permanent: true },
      { source: '/products/bee-consulting', destination: '/products/bee-certificate', permanent: true },
      { source: '/products/b-bbee-advisory-service', destination: '/products/bee-certificate', permanent: true },
      { source: '/products/audit-services', destination: '/specialist-services', permanent: true },
      { source: '/products/audit-assurance-services', destination: '/specialist-services', permanent: true },
      { source: '/products/business-rescue', destination: '/liquidations', permanent: true },
      { source: '/products/tax-representative-service', destination: '/products/tax-representative-appointment', permanent: true },
      { source: '/products/vat-registration-service', destination: '/products/vat-registration', permanent: true },
      { source: '/products/accounting-solutions', destination: '/accounting-services-south-africa', permanent: true },
      { source: '/products/advisory', destination: '/financial-advisory', permanent: true },
      { source: '/products/annual-return-filing', destination: '/products/annual-returns', permanent: true },
      { source: '/products/annual-returns-service', destination: '/products/annual-returns', permanent: true },
      { source: '/products/business-advisory', destination: '/financial-advisory', permanent: true },
      { source: '/products/business-advisory-services', destination: '/financial-advisory', permanent: true },

      // --- Double-hyphen URL fixes ---
      { source: '/products/ncr-form-40-application--compliance', destination: '/products/ncr-form-40-application-compliance', permanent: true },
      { source: '/products/sars-login-assistance--troubleshooting', destination: '/products/sars-login-assistance-troubleshooting', permanent: true },
      { source: '/products/bei-setup--demonstration', destination: '/become-a-partner', permanent: true },

      // --- Duplicate & Typo Blog Consolidation (Doorway Page & Keyword Cannibalization Fixes) ---
      { source: '/blog/my-accoutant-sa-best-accountants-your-financial-partner', destination: '/monthly-accounting', permanent: true },
      { source: '/blog/my-accountant-sas-best-accounting--tax-firm-guide', destination: '/monthly-accounting', permanent: true },
      { source: '/blog/why-my-accountant-is-the-best-in-sa-your-financial-partner', destination: '/monthly-accounting', permanent: true },
      { source: '/blog/find-the-best-accountant-near-me-my-accountant-guide', destination: '/', permanent: true },
      { source: '/blog/my-accountant-the-best-accountant-in-johannesburg', destination: '/accountant-johannesburg', permanent: true },
      { source: '/blog/my-accountant-midrands-top-choice-for-financial-excellence', destination: '/accountant-johannesburg', permanent: true },
      { source: '/blog/find-the-best-accountant-in-roodepoort-my-accountant', destination: '/accountant-johannesburg', permanent: true },
      { source: '/blog/my-accountant-the-best-accountant-in-sandton', destination: '/accountant-sandton', permanent: true },
      { source: '/blog/my-accountant-your-best-accountant-in-randburg', destination: '/accountant-randburg', permanent: true },
      { source: '/blog/my-accountant-the-best-accountant-in-pretoria', destination: '/accountant-pretoria', permanent: true },
      { source: '/blog/my-accountant-the-best-accountant-in-cape-town', destination: '/accountant-cape-town', permanent: true },
      { source: '/blog/my-accountant-the-best-accountants-in-cape-town', destination: '/accountant-cape-town', permanent: true },
      { source: '/blog/my-accountant-the-best-accountant-in-durban', destination: '/accountant-durban', permanent: true },
      { source: '/blog/my-accountant-best-accountants-in-durban-explored', destination: '/accountant-durban', permanent: true },
      { source: '/blog/my-accountant-the-best-accountant-in-centurion', destination: '/accountant-centurion', permanent: true },
      { source: '/blog/my-accountant-the-best-accountant-in-fourways', destination: '/accountant-fourways', permanent: true },
      { source: '/blog/my-accountant-the-best-accountant-in-bryanston', destination: '/accountant-bryanston', permanent: true },

      // --- Top-level orphan redirects ---
      { source: '/small-business-accounting', destination: '/small-business-accounting-south-africa', permanent: true },
      { source: '/tax-consultation', destination: '/tax-consulting', permanent: true },
      { source: '/articles/directors-duties', destination: '/blog', permanent: true },

      // --- City landing pages: canonical form is the hyphenated /accountant-<city> URL.
      // Redirect the old slash form so nav/sitemap/canonical all agree on one URL. ---
      { source: '/accountant/:city', destination: '/accountant-:city', permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Map SEO-friendly /accountant-<city> URLs to the dynamic route /accountant/[city]
      { source: '/accountant-:city', destination: '/accountant/:city' },
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
