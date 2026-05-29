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
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
  
  const servicesSnapshot = await getDocs(query(collection(db, "services"), orderBy("title")));
  const services = servicesSnapshot.docs.map(doc => doc.data() as Service);
  const serviceRoutes = services.map((service) => ({
    url: `${BASE_URL}/products/${service.slug}`,
    lastModified: new Date(),
  }));

  const franchiseesSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "franchisee")));
  const franchiseeRoutes = franchiseesSnapshot.docs
    .map(doc => doc.data())
    .filter(u => u.franchise?.areaSlug)
    .map(u => ({
      url: `${BASE_URL}/locations/${u.franchise.areaSlug}`,
      lastModified: new Date(),
    }));

  const blogPostsSnapshot = await getDocs(query(collection(db, "blogPosts"), orderBy("date", "desc")));
  const blogPosts = blogPostsSnapshot.docs.map(doc => doc.data() as BlogPost);
  
  const blogPostRoutes = blogPosts.map((post) => {
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

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...franchiseeRoutes,
    ...blogPostRoutes,
  ];
}
