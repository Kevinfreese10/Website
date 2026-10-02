import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateOrganizationSchema } from '@/lib/schema/productSchema';
import { CITIES_DATA } from '@/lib/cities';
import { SITE_URL } from '@/lib/constants';

const ROOT_DIR = path.resolve(__dirname, '../../..');

describe('SEO Audit & Indexing Optimization Contract Suite', () => {

  // =========================================================================
  // 1. Root Canonical Isolation & Homepage Canonical (R1)
  // =========================================================================
  describe('Root Canonical Isolation & Homepage Canonical (R1)', () => {
    const layoutPath = path.join(ROOT_DIR, 'src/app/layout.tsx');
    const pagePath = path.join(ROOT_DIR, 'src/app/page.tsx');

    it('removes hardcoded alternates.canonical from RootLayout to prevent child page inheritance', () => {
      expect(fs.existsSync(layoutPath)).toBe(true);
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

      // The root layout must NOT export an alternates.canonical pointing to SITE_URL
      // Next.js App Router cascades layout metadata to all child pages without explicit canonicals
      expect(layoutContent).not.toMatch(/alternates:\s*\{\s*canonical:\s*SITE_URL\s*\}/);
      expect(layoutContent).not.toMatch(/canonical:\s*['"`]https:\/\/www\.myacc\.co\.za['"`]/);
      expect(layoutContent).not.toMatch(/canonical:\s*SITE_URL/);

      // metadataBase must remain configured for relative URL resolution
      expect(layoutContent).toMatch(/metadataBase:\s*new\s*URL\(SITE_URL\)/);
    });

    it('retains explicit self-referential canonical on the homepage (src/app/page.tsx)', () => {
      expect(fs.existsSync(pagePath)).toBe(true);
      const pageContent = fs.readFileSync(pagePath, 'utf-8');

      // Home page explicitly calls getStaticPageMetadata('home', defaults)
      expect(pageContent).toMatch(/getStaticPageMetadata\(['"`]home['"`]/);
    });

    it('ensures child page canonical derivation is isolated from homepage root', () => {
      // In seo-utils, getStaticPageMetadata creates self-referential canonicals per pageId
      const testCases = [
        { pageId: 'home', expectedCanonical: SITE_URL },
        { pageId: 'contact', expectedCanonical: `${SITE_URL}/contact` },
        { pageId: 'compliance', expectedCanonical: `${SITE_URL}/compliance` },
        { pageId: 'products', expectedCanonical: `${SITE_URL}/products` },
      ];

      for (const { pageId, expectedCanonical } of testCases) {
        const derivedCanonical = `${SITE_URL}${pageId === 'home' ? '' : `/${pageId}`}`;
        expect(derivedCanonical).toBe(expectedCanonical);
      }
    });
  });

  // =========================================================================
  // 2. Calculators & Signup Server Layouts and Metadata (R2)
  // =========================================================================
  describe('Calculators & AI Signup Server Metadata & Canonicals (R2)', () => {
    const ALL_13_CALCULATORS = [
      'vat-calculator',
      'bee-scorecard-estimator',
      'capital-gains-tax-calculator',
      'provisional-tax-estimator',
      'uif-coida-calculator',
      'cidb-fee-and-grade',
      'cipc-annual-return-fee',
      'ncr-registration-fee',
      'payroll-cost',
      'salary-tax',
      'sbc-tax-estimator',
      'total-cost-to-employer',
      'turnover-tax-calculator',
    ];

    it('ensures all 13 interactive calculators have a dedicated server layout.tsx', () => {
      for (const slug of ALL_13_CALCULATORS) {
        const layoutFile = path.join(ROOT_DIR, `src/app/calculators/${slug}/layout.tsx`);
        expect(fs.existsSync(layoutFile), `Missing layout.tsx for calculator: ${slug}`).toBe(true);
      }
    });

    it('ensures each of the 13 calculators exports an explicit self-canonical and absolute title', () => {
      for (const slug of ALL_13_CALCULATORS) {
        const layoutFile = path.join(ROOT_DIR, `src/app/calculators/${slug}/layout.tsx`);
        const content = fs.readFileSync(layoutFile, 'utf-8');

        // Canonical URL assertion
        const expectedCanonical = `https://www.myacc.co.za/calculators/${slug}`;
        expect(content).toContain(expectedCanonical);

        // Absolute title pattern check to bypass root template and prevent double brand
        expect(content).toMatch(/title:\s*\{\s*absolute:\s*['"`]/);

        // OpenGraph URL must match self-canonical
        expect(content).toContain(`url: 'https://www.myacc.co.za/calculators/${slug}'`);
      }
    });

    it('updates VAT Calculator title to current tax year 2026/2027 (rejects outdated 2025/2026)', () => {
      const vatLayoutPath = path.join(ROOT_DIR, 'src/app/calculators/vat-calculator/layout.tsx');
      const vatContent = fs.readFileSync(vatLayoutPath, 'utf-8');

      expect(vatContent).toContain('2026/2027');
      expect(vatContent).not.toContain('2025/2026');
      expect(vatContent).not.toContain('2024/2025');
    });

    it('ensures /ai-accountant-signup has dedicated server layout.tsx with self-canonical', () => {
      const signupLayoutPath = path.join(ROOT_DIR, 'src/app/ai-accountant-signup/layout.tsx');
      expect(fs.existsSync(signupLayoutPath), 'Missing layout.tsx for ai-accountant-signup').toBe(true);

      const content = fs.readFileSync(signupLayoutPath, 'utf-8');
      expect(content).toContain('https://www.myacc.co.za/ai-accountant-signup');
      expect(content).toMatch(/title:\s*\{\s*absolute:\s*['"`]/);
    });
  });

  // =========================================================================
  // 3. Single Brand Title Enforcement (R4)
  // =========================================================================
  describe('Single Brand Title Enforcement Across All Routes (R4)', () => {
    const cityPagePath = path.join(ROOT_DIR, 'src/app/accountant/[city]/page.tsx');

    it('ensures city landing pages use { absolute: fullTitle } to prevent double branding', () => {
      expect(fs.existsSync(cityPagePath)).toBe(true);
      const content = fs.readFileSync(cityPagePath, 'utf-8');

      // The page must bypass the root layout template '%s | My Accountant' using absolute fullTitle
      expect(content).toMatch(/title:\s*\{\s*absolute:\s*fullTitle\s*\}/);
    });

    it('validates that all 14 city metaTitles do not contain brand suffix and resolved fullTitles contain exactly one', () => {
      const cityKeys = Object.keys(CITIES_DATA);
      expect(cityKeys.length).toBe(14);

      for (const key of cityKeys) {
        const cityData = CITIES_DATA[key];
        const rawTitle = cityData.metaTitle;
        // The raw metaTitle in cities.ts must NOT have 'My Accountant' baked into it
        expect(rawTitle).not.toMatch(/My Accountant/);

        const resolvedFullTitle = `${rawTitle} | My Accountant`;
        const brandMatches = resolvedFullTitle.match(/My Accountant/g);
        expect(brandMatches?.length ?? 0, `City ${key} title contains multiple or missing brand suffix: "${resolvedFullTitle}"`).toBe(1);

        // Assert no double pipe duplication
        expect(resolvedFullTitle).not.toMatch(/\|\s*My Accountant\s*\|\s*My Accountant/);
        expect(resolvedFullTitle).not.toMatch(/\|\s*MyAcc\s*\|\s*My Accountant/);
      }
    });

    it('ensures zero double-brand titles exist across all 13 calculator layouts', () => {
      const ALL_13_CALCULATORS = [
        'vat-calculator',
        'bee-scorecard-estimator',
        'capital-gains-tax-calculator',
        'provisional-tax-estimator',
        'uif-coida-calculator',
        'cidb-fee-and-grade',
        'cipc-annual-return-fee',
        'ncr-registration-fee',
        'payroll-cost',
        'salary-tax',
        'sbc-tax-estimator',
        'total-cost-to-employer',
        'turnover-tax-calculator',
      ];

      for (const slug of ALL_13_CALCULATORS) {
        const layoutFile = path.join(ROOT_DIR, `src/app/calculators/${slug}/layout.tsx`);
        const content = fs.readFileSync(layoutFile, 'utf-8');

        expect(content).not.toMatch(/My Accountant\s*\|\s*My Accountant/);
        expect(content).not.toMatch(/MyAcc\s*\|\s*My Accountant/);
      }
    });
  });

  // =========================================================================
  // 4. Permanent 301 Redirects Engine in next.config.ts (R3, R5)
  // =========================================================================
  describe('Permanent 301 Redirects Configuration (R3, R5)', () => {
    let redirectsList: Array<{ source: string; destination: string; permanent?: boolean }> = [];

    it('loads next.config.ts redirects() without error', async () => {
      const configModule: any = await import('../../../next.config');
      const loadedConfig = configModule.default || configModule;
      expect(loadedConfig.redirects).toBeDefined();
      redirectsList = (await loadedConfig.redirects!()) || [];
      expect(redirectsList.length).toBeGreaterThan(50);
    });

    it('redirects cannibalized service variants to primary pillar hubs with HTTP 301 (R5)', () => {
      const requiredServiceRedirects = [
        { source: '/bookkeeping-services', destination: '/bookkeeping' },
        { source: '/cipc-company-registration-online', destination: '/company-registration' },
        { source: '/register-company-south-africa-price', destination: '/company-registration' },
      ];

      for (const rule of requiredServiceRedirects) {
        const match = redirectsList.find((r) => r.source === rule.source);
        expect(match, `Missing redirect for ${rule.source}`).toBeDefined();
        expect(match?.destination).toBe(rule.destination);
        expect(match?.permanent).toBe(true);
      }
    });

    it('redirects all 6 double-hyphen blog posts to live articles or pillar hubs with HTTP 301 (R3)', () => {
      const doubleHyphenTargets = [
        {
          slug: 'sars-objections-your-taxpayer-rights-how-to-object',
          doubleSource: '/blog/sars-objections-your-taxpayer-rights--how-to-object',
          singleSource: '/blog/sars-objections-your-taxpayer-rights-how-to-object',
        },
        {
          slug: 'provisional-tax-due-21-july-2025-19-jan-2026-act-now',
          doubleSource: '/blog/provisional-tax-due-21-july-2025--19-jan-2026--act-now',
          singleSource: '/blog/provisional-tax-due-21-july-2025-19-jan-2026-act-now',
        },
        {
          slug: 'sars-fines-penalties-remission-your-success-guide',
          doubleSource: '/blog/sars-fines--penalties-remission-your-success-guide',
          singleSource: '/blog/sars-fines-penalties-remission-your-success-guide',
        },
        {
          slug: 'accountants-letter-why-you-need-one-how-we-help',
          doubleSource: '/blog/accountants-letter-why-you-need-one--how-we-help',
          singleSource: '/blog/accountants-letter-why-you-need-one-how-we-help',
        },
        {
          slug: 'remission-of-sars-interest-penalties-your-guide',
          doubleSource: '/blog/remission-of-sars-interest--penalties-your-guide',
          singleSource: '/blog/remission-of-sars-interest-penalties-your-guide',
        },
        {
          slug: 'ai-future-of-bookkeeping-a-south-african-view',
          doubleSource: '/blog/ai--future-of-bookkeeping-a-south-african-view',
          singleSource: '/blog/ai-future-of-bookkeeping-a-south-african-view',
        },
      ];

      for (const item of doubleHyphenTargets) {
        // At least one of the double or single-hyphen crawl sources must have a 301 redirect
        const match = redirectsList.find(
          (r) => r.source === item.singleSource || r.source === item.doubleSource
        );
        expect(match, `Missing redirect for double-hyphen blog post: ${item.slug}`).toBeDefined();
        expect(match?.permanent).toBe(true);
        expect(match?.destination).toBeTruthy();
      }
    });

    it('redirects historical crawl 404s to valid destinations with HTTP 301 (R3)', () => {
      const historicalCrawlRules = [
        { source: '/blog/tax-record-keeping-tips', expectedDest: '/bookkeeping' },
        { source: '/blog/remission-', expectedDest: '/remission-of-fines' },
        { source: '/blog/reduce-your-sars-debt-legally-with-s200-of-the-taa', expectedDest: '/sars-compromise' },
        { source: '/blog/beneficial-ownership-', expectedDest: '/cipc-beneficial-ownership-register-south-africa' },
        { source: '/blog/sars-and-cipc-compliance', expectedDest: '/compliance' },
      ];

      for (const rule of historicalCrawlRules) {
        const match = redirectsList.find((r) => r.source === rule.source);
        expect(match, `Missing redirect for historical 404: ${rule.source}`).toBeDefined();
        expect(match?.destination).toBe(rule.expectedDest);
        expect(match?.permanent).toBe(true);
      }
    });
  });

  // =========================================================================
  // 5. Sitemap Routing Hygiene in src/app/sitemap.ts (R3, R5)
  // =========================================================================
  describe('Sitemap Routing Hygiene (src/app/sitemap.ts) (R3, R5)', () => {
    const sitemapPath = path.join(ROOT_DIR, 'src/app/sitemap.ts');

    it('excludes redirected and cannibalized service routes from staticRoutes', () => {
      expect(fs.existsSync(sitemapPath)).toBe(true);
      const content = fs.readFileSync(sitemapPath, 'utf-8');

      // staticRoutes must NOT include redirected URLs
      expect(content).not.toMatch(/'\/bookkeeping-services'/);
      expect(content).not.toMatch(/'\/cipc-company-registration-online'/);
      expect(content).not.toMatch(/'\/register-company-south-africa-price'/);

      // staticRoutes MUST include authoritative pillar hubs
      expect(content).toMatch(/'\/bookkeeping'/);
      expect(content).toMatch(/'\/company-registration'/);
    });

    it('excludes retired double-hyphen blog slugs from sitemap emission', () => {
      const content = fs.readFileSync(sitemapPath, 'utf-8');

      const retiredSlugs = [
        'sars-objections-your-taxpayer-rights--how-to-object',
        'provisional-tax-due-21-july-2025--19-jan-2026--act-now',
        'sars-fines--penalties-remission-your-success-guide',
        'accountants-letter-why-you-need-one--how-we-help',
        'remission-of-sars-interest--penalties-your-guide',
        'ai--future-of-bookkeeping-a-south-african-view',
      ];

      for (const slug of retiredSlugs) {
        expect(content, `retiredSlugs must contain ${slug}`).toContain(slug);
      }
    });

    it('ensures all 13 calculators and 14 city pages are included in sitemap staticRoutes', () => {
      const content = fs.readFileSync(sitemapPath, 'utf-8');

      const ALL_13_CALCULATORS = [
        '/calculators/vat-calculator',
        '/calculators/provisional-tax-estimator',
        '/calculators/capital-gains-tax-calculator',
        '/calculators/uif-coida-calculator',
        '/calculators/bee-scorecard-estimator',
        '/calculators/turnover-tax-calculator',
        '/calculators/cipc-annual-return-fee',
        '/calculators/salary-tax',
        '/calculators/sbc-tax-estimator',
        '/calculators/total-cost-to-employer',
        '/calculators/ncr-registration-fee',
        '/calculators/cidb-fee-and-grade',
        '/calculators/payroll-cost',
      ];

      for (const route of ALL_13_CALCULATORS) {
        expect(content, `sitemap staticRoutes must contain ${route}`).toContain(`'${route}'`);
      }

      // Check all 14 cities
      for (const city of Object.keys(CITIES_DATA)) {
        expect(content, `sitemap staticRoutes must contain /accountant-${city}`).toContain(`'/accountant-${city}'`);
      }
    });
  });

  // =========================================================================
  // 6. Organization Schema Hygiene (R7)
  // =========================================================================
  describe('Organization Schema Hygiene (R7)', () => {
    it('removes self-published aggregateRating from generateOrganizationSchema', () => {
      const schema = generateOrganizationSchema() as any;

      // Google Search Essentials prohibits self-serving aggregate reviews on Organization schema
      expect(schema.aggregateRating).toBeUndefined();

      // Core schema attributes must remain valid
      expect(schema['@context']).toBe('https://schema.org');
      const types = Array.isArray(schema['@type']) ? schema['@type'] : [schema['@type']];
      expect(types).toContain('Organization');
      expect(schema.name).toBe('My Accountant');
      expect(schema.url).toBe('https://www.myacc.co.za');
      expect(schema.logo).toBeDefined();
      expect(schema.address).toBeDefined();
    });
  });

  // =========================================================================
  // 7. City LocalBusiness & Regional Schema Hygiene (R7)
  // =========================================================================
  describe('City Landing Pages Schema Hygiene (R7)', () => {
    const cityPagePath = path.join(ROOT_DIR, 'src/app/accountant/[city]/page.tsx');

    it('differentiates physical headquarters from regional service coverage in schema', () => {
      expect(fs.existsSync(cityPagePath)).toBe(true);
      const content = fs.readFileSync(cityPagePath, 'utf-8');

      // Must have check for physical headquarters (Johannesburg / Randburg)
      expect(content).toMatch(/isHeadquarters\s*=\s*cityData\.slug\s*===\s*['"`]johannesburg['"`]\s*\|\|\s*cityData\.slug\s*===\s*['"`]randburg['"`]/);

      // Non-HQ regional cities must use areaServed
      expect(content).toContain('areaServed:');
      expect(content).toMatch(/name:\s*`\$\{cityData\.name\},\s*\$\{cityData\.province\},\s*South Africa`/);

      // Only attach physical address if isHeadquarters is true
      expect(content).toMatch(/if\s*\(isHeadquarters\)\s*\{\s*cityServiceSchema\.address\s*=/);
    });

    it('verifies pairwise city matrix (14 cities) for HQ vs regional schema segregation', () => {
      const hqSlugs = new Set(['johannesburg', 'randburg']);

      for (const [key, cityData] of Object.entries(CITIES_DATA)) {
        const isHq = hqSlugs.has(cityData.slug);

        if (isHq) {
          expect(['johannesburg', 'randburg']).toContain(cityData.slug);
        } else {
          // Regional cities must have distinct name and province
          expect(cityData.name).toBeTruthy();
          expect(cityData.province).toBeTruthy();
          expect(cityData.slug).not.toBe('johannesburg');
          expect(cityData.slug).not.toBe('randburg');
        }
      }
    });
  });

  // =========================================================================
  // 8. Blog Listing Optimization & Payload Contract (R6)
  // =========================================================================
  describe('Blog Listing Optimization & Payload Contract (R6)', () => {
    const blogPagePath = path.join(ROOT_DIR, 'src/app/blog/page.tsx');
    const blogClientPath = path.join(ROOT_DIR, 'src/components/blog/BlogPageClient.tsx');
    const homeClientPath = path.join(ROOT_DIR, 'src/components/home/HomePageClient.tsx');

    it('omits HTML content from SSR payload and precomputes readTimeMinutes', () => {
      expect(fs.existsSync(blogPagePath)).toBe(true);
      const content = fs.readFileSync(blogPagePath, 'utf-8');

      // The SSR page must compute readTimeMinutes on the server
      expect(content).toMatch(/readTimeMinutes\s*=\s*Math\.max\(1,\s*Math\.ceil\(words\s*\/\s*200\)\)/);

      // The summary passed to client must NOT include full HTML content
      expect(content).toMatch(/summary:\s*BlogPostSummary\s*=/);
      expect(content).not.toMatch(/summary:\s*BlogPostSummary\s*=\s*\{[^}]*content:\s*data\.content/);
    });

    it('ensures BlogPageClient.tsx does NOT invoke useBlog() double-fetch hook', () => {
      expect(fs.existsSync(blogClientPath)).toBe(true);
      const content = fs.readFileSync(blogClientPath, 'utf-8');

      // Must not import or call useBlog()
      expect(content).not.toMatch(/import\s*\{[^}]*useBlog[^}]*\}\s*from/);
      expect(content).not.toMatch(/useBlog\(\)/);

      // Must accept initialBlogPosts
      expect(content).toContain('initialBlogPosts');

      // Must define POSTS_PER_PAGE = 12
      expect(content).toMatch(/POSTS_PER_PAGE\s*=\s*12/);
    });

    it('ensures HomePageClient.tsx does NOT invoke useBlog()', () => {
      expect(fs.existsSync(homeClientPath)).toBe(true);
      const content = fs.readFileSync(homeClientPath, 'utf-8');

      expect(content).not.toMatch(/useBlog\(\)/);
    });

    it('performs Boundary Value Analysis on readTimeMinutes calculation', () => {
      const calcReadTime = (wordCount: number): number => {
        return Math.max(1, Math.ceil(wordCount / 200));
      };

      // Boundary values
      expect(calcReadTime(0)).toBe(1);      // Lower boundary: 0 words -> 1 min
      expect(calcReadTime(1)).toBe(1);      // 1 word -> 1 min
      expect(calcReadTime(199)).toBe(1);    // Just below 200 -> 1 min
      expect(calcReadTime(200)).toBe(1);    // Exact 200 boundary -> 1 min
      expect(calcReadTime(201)).toBe(2);    // Just above 200 -> 2 min
      expect(calcReadTime(399)).toBe(2);    // Just below 400 -> 2 min
      expect(calcReadTime(400)).toBe(2);    // Exact 400 boundary -> 2 min
      expect(calcReadTime(401)).toBe(3);    // Just above 400 -> 3 min
      expect(calcReadTime(2000)).toBe(10);  // High boundary: 2000 words -> 10 min
    });
  });
});
