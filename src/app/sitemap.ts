import fs from 'fs';
import path from 'path';
import { BlogPost, Service } from '@/lib/types';
import { MetadataRoute } from 'next';
import { getAdminDb, serializeDbData } from '@/lib/firebase-admin';
import { CATEGORIES_LIST } from '@/lib/categories';
import { industries } from '@/lib/industries';

const BASE_URL = 'https://www.myacc.co.za';
const FALLBACK_LAST_MODIFIED = new Date('2026-10-07T00:00:00.000Z');

function getRouteLastModified(route: string): Date {
  try {
    const cleanRoute = route === '/' ? '' : route.replace(/^\//, '');
    const candidates = [
      path.join(process.cwd(), 'src', 'app', cleanRoute, 'page.tsx'),
      route.startsWith('/industries/')
        ? path.join(process.cwd(), 'src', 'lib', 'industries.ts')
        : '',
      route.startsWith('/products/category/')
        ? path.join(process.cwd(), 'src', 'lib', 'categories.ts')
        : '',
      route.startsWith('/accountant-')
        ? path.join(process.cwd(), 'src', 'lib', 'cities.ts')
        : '',
    ].filter(Boolean);

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.mtime && !Number.isNaN(stat.mtime.getTime())) {
          return stat.mtime;
        }
      }
    }
  } catch {
    // Fallback to deterministic release date when filesystem stats are unavailable
  }
  return FALLBACK_LAST_MODIFIED;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const industryRoutes = Object.keys(industries)
    .filter((k) => k !== 'ecommerce' && k !== 'restaurants')
    .map((slug) => `/industries/${slug}`);

  const staticBlogRoutes = [
    '/blog/sole-proprietor-vs-pty-ltd',
    '/blog/two-pot-retirement-tax-rules-2026',
    '/blog/accountant-vs-bookkeeper-guide',
    '/blog/cc-vs-pty-ltd-conversion',
    '/blog/cgt-annual-exclusion-increase-2026',
    '/blog/crypto-asset-tax-reporting-sars-2026',
    '/blog/turnover-tax-vs-company-tax',
    '/blog/vat-registration-threshold-sme-2026',
  ];

  const staticRoutePaths = [
    '/',
    '/about',
    '/blog',
    '/calculators',
    '/industries',
    '/compliance',
    '/contact',
    '/popia',
    '/refund-policy',
    '/terms',
    '/partner-signup',
    '/products',
    '/become-a-partner',
    '/ai-accountant',
    '/sars-compromise',
    '/sars-disputes',
    '/remission-of-fines',
    '/liquidations',
    '/bookkeeping-services-johannesburg',
    '/xero-accountant-south-africa',
    '/sage-accountant-south-africa',
    '/zoho-accountant-south-africa',
    '/pastel-accountant-south-africa',
    '/outsourced-payroll-fees-sa',
    '/fractional-cfo-services-south-africa',
    '/movie-film-production-accounting-south-africa',
    '/movie-film-production-accountant-randburg',
    '/calculators/cipc-annual-return-fee',
    '/calculators/salary-tax',
    '/calculators/sbc-tax-estimator',
    '/calculators/total-cost-to-employer',
    '/calculators/ncr-registration-fee',
    '/calculators/cidb-fee-and-grade',
    '/calculators/payroll-cost',
    '/sars-tax-refund',
    '/monthly-accounting',
    '/annual-financial-statements',
    '/management-accounts',
    '/monthly-payroll',
    '/paye-compliance',
    '/uif-compliance',
    '/payroll-administration',
    '/accounting-services-south-africa',
    '/tax-services-south-africa',
    '/accountant-johannesburg',
    '/accountant-pretoria',
    '/accountant-cape-town',
    '/accountant-durban',
    '/accountant-randburg',
    '/tax-compliance',
    '/tax-consulting',
    '/tax-returns',
    '/individual-tax-returns',
    '/tax-planning',
    '/provisional-tax',
    '/payroll-services',
    '/bookkeeping',
    '/financial-advisory',
    '/company-registration',
    '/company-secretarial-services-south-africa',
    '/cipc-beneficial-ownership-register-south-africa',
    '/vat-registration-south-africa',
    '/coida-letter-of-good-standing',
    '/compliance-services',
    '/sme-accounting',
    '/trust-services',
    '/specialist-services',
    // SARS Online Query System (SOQS) SEO Pages
    '/sars-online-query-system-guide',
    '/sars-turnover-tax-registration',
    '/sars-tax-number-query',
    '/sars-tax-compliance-status-pin',
    '/sars-notice-of-registration-it150',
    '/sars-statement-of-account-request',
    '/sars-auto-assessment-status-check',
    '/sars-tax-return-status-dashboard',
    '/sars-payment-reference-number-prn',
    '/sars-tax-directive-status',
    '/sars-outstanding-debt-query',
    '/sars-outstanding-returns-query',
    '/sars-supporting-documents-upload-guide',
    '/sars-payment-allocation-query',
    '/sars-trust-registration-online',
    '/sars-deceased-estate-reporting',
    '/sars-tax-representative-appointment',
    '/sars-customs-code-request',
    '/sars-customs-rla-status',
    '/sars-customs-rla-supporting-documents',
    '/sars-diesel-refund-scheme-registration',
    '/sars-large-business-lbi-query',
    '/sars-donations-tax-it144-declaration',
    '/sars-withholding-tax-royalties-wtr01',
    '/sars-vat-vendor-search-verification',
    '/sars-report-digital-fraud',
    '/sars-report-employee-corruption',
    '/nbc-provident-fund-guide',
    // Tax Hubs & Resources
    '/freelancer-gig-economy-tax-hub',
    '/tax-deadlines-calendar-2026',
    '/tax-glossary',
    '/case-studies',
    '/reviews',
    '/outsourcing-vs-hiring',
    // Calculators
    '/calculators/vat-calculator',
    '/calculators/provisional-tax-estimator',
    '/calculators/capital-gains-tax-calculator',
    '/calculators/uif-coida-calculator',
    '/calculators/bee-scorecard-estimator',
    '/calculators/turnover-tax-calculator',
    // Industry Guides (dynamic from @/lib/industries)
    ...industryRoutes,
    // Static Canonical Blog Posts
    ...staticBlogRoutes,
    // Local SEO Pages
    '/accountant-sandton',
    '/accountant-fourways',
    '/accountant-bryanston',
    '/accountant-centurion',
    '/accountant-port-elizabeth-gqeberha',
    '/accountant-bloemfontein',
    '/accountant-east-london',
    '/accountant-nelspruit',
    '/accountant-stellenbosch',
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticRoutePaths.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: getRouteLastModified(route),
    changeFrequency: (route === '/' || route === '/products' || route === '/blog' ? 'daily' : route.startsWith('/blog/') ? 'monthly' : 'weekly') as any,
    priority:
      route === '/'
        ? 1.0
        : route.startsWith('/calculators') || route.startsWith('/accountant')
        ? 0.9
        : route.startsWith('/blog/')
        ? 0.75
        : 0.8,
  }));

  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminDb();
    const servicesSnapshot = await db.collection('services').orderBy('title').get();
    const services = servicesSnapshot.docs.map((doc) => serializeDbData(doc.data()) as Service);
    serviceRoutes = services.map((service: any) => {
      let lastModifiedDate: Date = FALLBACK_LAST_MODIFIED;
      const dateField = service.updatedAt || service.createdAt;
      if (dateField) {
        const parsed =
          typeof dateField === 'object' && 'toDate' in dateField
            ? dateField.toDate()
            : new Date(dateField);
        if (!Number.isNaN(parsed.getTime())) {
          lastModifiedDate = parsed;
        }
      }
      const cleanSlug = (service.slug || '').replace(/--+/g, '-');
      return {
        url: `${BASE_URL}/products/${cleanSlug}`,
        lastModified: lastModifiedDate,
        changeFrequency: 'weekly' as any,
        priority: 0.8,
      };
    });
  } catch (error) {
    console.error('Error fetching services for sitemap:', error);
  }

  let blogPostRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminDb();
    const blogPostsSnapshot = await db.collection('blogPosts').orderBy('date', 'desc').get();
    const blogPosts = blogPostsSnapshot.docs.map((doc) => serializeDbData(doc.data()) as BlogPost);

    const retiredSlugs = new Set([
      // Legacy doorway pages
      'my-accoutant-sa-best-accountants-your-financial-partner',
      'my-accountant-the-best-accountants-in-cape-town',
      'find-the-best-accountant-near-me-my-accountant-guide',
      'my-accountant-your-best-accountant-in-randburg',
      'why-my-accountant-is-the-best-in-sa-your-financial-partner',
      'my-accountant-midrands-top-choice-for-financial-excellence',
      'my-accountant-the-best-accountant-in-johannesburg',
      'find-the-best-accountant-in-roodepoort-my-accountant',
      'my-accountant-the-best-accountant-in-sandton',
      'my-accountant-best-accountants-in-durban-explored',
      'my-accountant-sas-best-accounting--tax-firm-guide',
      // Redirected double-hyphen / obsolete posts (R3)
      'sars-objections-your-taxpayer-rights--how-to-object',
      'sars-objections-your-taxpayer-rights-how-to-object',
      'provisional-tax-due-21-july-2025--19-jan-2026--act-now',
      'provisional-tax-due-21-july-2025-19-jan-2026-act-now',
      'sars-fines--penalties-remission-your-success-guide',
      'sars-fines-penalties-remission-your-success-guide',
      'accountants-letter-why-you-need-one--how-we-help',
      'accountants-letter-why-you-need-one-how-we-help',
      'remission-of-sars-interest--penalties-your-guide',
      'remission-of-sars-interest-penalties-your-guide',
      'ai--future-of-bookkeeping-a-south-african-view',
      'ai-future-of-bookkeeping-a-south-african-view',
      // Consolidated / redirected blog posts
      'ncr-registration-your-essential-guide-in-south-africa',
      'new-vat-registration-thresholds-south-africa-2026',
    ]);

    blogPostRoutes = blogPosts
      .filter((post) => {
        const slug = (post.slug || '').replace(/--+/g, '-');
        return (
          !retiredSlugs.has(post.slug || '') &&
          !retiredSlugs.has(slug) &&
          !slug.includes('my-accoutant-sa-best-accountants')
        );
      })
      .map((post) => {
        let lastModifiedDate: Date = FALLBACK_LAST_MODIFIED;
        if (post.date && typeof post.date === 'object' && 'toDate' in post.date) {
          lastModifiedDate = (post.date as any).toDate();
        } else if (typeof post.date === 'string') {
          const parsed = new Date(post.date);
          if (!Number.isNaN(parsed.getTime())) {
            lastModifiedDate = parsed;
          }
        }

        const cleanSlug = (post.slug || '').replace(/--+/g, '-');
        return {
          url: `${BASE_URL}/blog/${cleanSlug}`,
          lastModified: lastModifiedDate,
          changeFrequency: 'monthly' as any,
          priority: 0.7,
        };
      });
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  const categoryLastMod = getRouteLastModified('/products/category/tax');
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES_LIST.map((cat) => ({
    url: `${BASE_URL}/products/category/${cat.slug}`,
    lastModified: categoryLastMod,
    changeFrequency: 'weekly' as any,
    priority: 0.85,
  }));

  // Combine all routes and deduplicate by URL
  const allRoutes = [...staticRoutes, ...categoryRoutes, ...serviceRoutes, ...blogPostRoutes];
  const uniqueRoutes = Array.from(new Map(allRoutes.map((r) => [r.url, r])).values());
  return uniqueRoutes;
}
