import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/signup',
          '/dashboard',
          '/cart',
          '/checkout',
          '/admin'
        ],
      },
    ],
    sitemap: 'https://www.myacc.co.za/sitemap.xml',
  };
}
