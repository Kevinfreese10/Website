import { BlogPost, Service } from '@/lib/types';
import { MetadataRoute } from 'next';
import { getAdminDb, serializeDbData } from '@/lib/firebase-admin';

const BASE_URL = 'https://www.myacc.co.za';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const staticRoutes = [
    '/',
    '/blog',
    '/compliance',
    '/contact',
    '/popia',
    '/refund-policy',
    '/terms',
    '/partner-signup',
    '/products',
    '/become-a-partner',
    '/ai-accountant-signup',
    '/ai-accountant',
    '/sars-compromise',
    '/sars-disputes',
    '/remission-of-fines',
    '/liquidations',
    '/bookkeeping-services',
    '/tax-consultant',
    '/cipc-company-registration-online',
    '/bookkeeping-services-johannesburg',
    '/register-company-south-africa-price',
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
    '/industries/sme',
    '/industries/construction',
    '/monthly-accounting',
    '/annual-financial-statements',
    '/management-accounts',
    '/monthly-payroll',
    '/paye-compliance',
    '/uif-compliance',
    '/payroll-administration',
    '/accounting-services-south-africa',
    '/tax-services-south-africa',
    '/small-business-accounting-south-africa',
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
    '/tax-disputes',
    '/provisional-tax',
    '/payroll-services',
    '/bookkeeping',
    '/financial-statements',
    '/financial-advisory',
    '/company-registration',
    '/compliance-services',
    '/sme-accounting',
    '/trust-services',
    '/specialist-services',
    // SARS Online Query System (SOQS) SEO Pages
    '/sars-online-query-system-guide',
    '/sars-turnover-tax-registration',
    '/sars-tax-number-query',
    '/sars-tax-compliance-status-pin',
    '/sars-verify-tax-compliance-status',
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
    // Industry Guides
    '/industries/ecommerce-online-sellers',
    '/industries/healthcare-medical-practices',
    '/industries/hospitality',
    '/industries/professional-services',
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
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '/' || route === '/products' || route === '/blog' ? 'daily' : 'weekly') as any,
    priority: route === '/' ? 1.0 : route.startsWith('/calculators') || route.startsWith('/accountant') ? 0.9 : 0.8,
  }));
  
  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminDb();
    const servicesSnapshot = await db.collection("services").orderBy("title").get();
    const services = servicesSnapshot.docs.map(doc => serializeDbData(doc.data()) as Service);
    serviceRoutes = services.map((service: any) => {
      let lastModifiedDate = undefined;
      const dateField = service.updatedAt || service.createdAt;
      if (dateField) {
        lastModifiedDate = typeof dateField === 'object' && 'toDate' in dateField ? dateField.toDate() : new Date(dateField);
      } else {
        lastModifiedDate = new Date();
      }
      // Normalize double-hyphens in slugs if any
      const cleanSlug = (service.slug || '').replace(/--+/g, '-');
      return {
        url: `${BASE_URL}/products/${cleanSlug}`,
        lastModified: lastModifiedDate,
        changeFrequency: 'weekly' as any,
        priority: 0.8,
      };
    });
  } catch (error) {
    console.error("Error fetching services for sitemap:", error);
  }

  let blogPostRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminDb();
    const blogPostsSnapshot = await db.collection("blogPosts").orderBy("date", "desc").get();
    const blogPosts = blogPostsSnapshot.docs.map(doc => serializeDbData(doc.data()) as BlogPost);
    
    blogPostRoutes = blogPosts
      .filter((post) => {
        // Exclude typo / redirect slugs from sitemap so crawlers only index authoritative URLs
        const slug = post.slug || '';
        return !slug.includes('my-accoutant-sa-best-accountants');
      })
      .map((post) => {
        let lastModifiedDate;
        if (post.date && typeof post.date === 'object' && 'toDate' in post.date) {
            lastModifiedDate = (post.date as any).toDate();
        } else if (typeof post.date === 'string') {
            lastModifiedDate = new Date(post.date);
        } else {
            lastModifiedDate = new Date();
        }
        
        const cleanSlug = (post.slug || '').replace(/--+/g, '-');
        return {
            url: `${BASE_URL}/blog/${cleanSlug}`,
            lastModified: lastModifiedDate,
            changeFrequency: 'monthly' as any,
            priority: 0.7,
        }
      });
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error);
  }

  // Combine all routes and deduplicate by URL
  const allRoutes = [...staticRoutes, ...serviceRoutes, ...blogPostRoutes];
  const uniqueRoutes = Array.from(new Map(allRoutes.map(r => [r.url, r])).values());
  return uniqueRoutes;
}
