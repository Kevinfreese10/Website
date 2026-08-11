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
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
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
      }
      return {
        url: `${BASE_URL}/products/${service.slug}`,
        ...(lastModifiedDate && { lastModified: lastModifiedDate })
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
    
    blogPostRoutes = blogPosts.map((post) => {
      let lastModifiedDate;
      if (post.date && typeof post.date === 'object' && 'toDate' in post.date) {
          lastModifiedDate = (post.date as any).toDate();
      } else if (typeof post.date === 'string') {
          lastModifiedDate = new Date(post.date);
      } else {
          lastModifiedDate = new Date();
      }
      
      return {
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: lastModifiedDate,
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
