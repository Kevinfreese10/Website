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
          '/admin',
          '/partner',      // Authenticated partner portal — not indexable
          '/reseller/',    // Reseller portal — not indexable
          '/p/',           // Partner/vendor pages — not indexable
        ],
      },
    ],
    sitemap: 'https://www.myacc.co.za/sitemap.xml',
  };
}
