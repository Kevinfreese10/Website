import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const privateDisallows = [
    '/login',
    '/signup',
    '/dashboard',
    '/cart',
    '/checkout',
    '/admin',
    '/partner/',     // Authenticated partner portal — not indexable
    '/reseller/',    // Reseller portal — not indexable
    '/p/',           // Partner/vendor pages — not indexable
  ];

  const aiBots = [
    'ClaudeBot',
    'GPTBot',
    'OAI-SearchBot',
    'PerplexityBot',
    'Google-Extended',
    'Applebot-Extended',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/partner-signup',
          '/become-a-partner',
        ],
        disallow: privateDisallows,
      },
      ...aiBots.map((bot) => ({
        userAgent: bot,
        allow: ['/'],
        disallow: privateDisallows,
      })),
    ],
    sitemap: 'https://www.myacc.co.za/sitemap.xml',
  };
}
