import { collection, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BlogPost, Service } from '@/lib/types';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.myacc.co.za';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const staticRoutes = [
    '/',
    '/blog',
    '/cart',
    '/checkout',
    '/compliance',
    '/contact',
    '/login',
    '/popia',
    '/refund-policy',
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
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
  
  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const servicesSnapshot = await getDocs(query(collection(db, "services"), orderBy("title")));
    const services = servicesSnapshot.docs.map(doc => doc.data() as Service);
    serviceRoutes = services.map((service) => ({
      url: `${BASE_URL}/products/${service.slug}`,
      lastModified: new Date(),
    }));
  } catch (error) {
    console.error("Error fetching services for sitemap:", error);
  }

  let franchiseeRoutes: MetadataRoute.Sitemap = [];
  try {
    const franchiseesSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "franchisee")));
    franchiseeRoutes = franchiseesSnapshot.docs
      .map(doc => doc.data())
      .filter(u => u.franchise?.areaSlug)
      .map(u => ({
        url: `${BASE_URL}/locations/${u.franchise.areaSlug}`,
        lastModified: new Date(),
      }));
  } catch (error) {
    console.error("Error fetching franchisees for sitemap:", error);
  }

  let blogPostRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogPostsSnapshot = await getDocs(query(collection(db, "blogPosts"), orderBy("date", "desc")));
    const blogPosts = blogPostsSnapshot.docs.map(doc => doc.data() as BlogPost);
    
    blogPostRoutes = blogPosts.map((post) => {
      let lastModifiedDate;
      if (post.date && typeof post.date === 'object' && 'toDate' in post.date) {
          lastModifiedDate = (post.date as unknown as Timestamp).toDate();
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

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...franchiseeRoutes,
    ...blogPostRoutes,
  ];
}
