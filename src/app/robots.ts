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
          '/p/',           // White-label partner storefronts — not canonical content
          '/partner-invite/', // Partner invite flows — not indexable
          '/reseller/',    // Reseller portal — not indexable
        ],
      },
    ],
    sitemap: 'https://www.myacc.co.za/sitemap.xml',
  };
}
