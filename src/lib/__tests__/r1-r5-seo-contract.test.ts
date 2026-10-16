import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { industries } from '@/lib/industries';
import * as productSchema from '@/lib/schema/productSchema';
import { SITE_URL } from '@/lib/constants';

const ROOT_DIR = path.resolve(__dirname, '../../..');

// =============================================================================
// Helper Functions for Content Extraction, Word Counting & Metadata Resolution
// =============================================================================

/**
 * Extracts rendered human-readable words from a TSX source file by stripping imports,
 * JSX tags, styling attributes, and code syntax.
 */
function extractRenderedWords(source: string): number {
  const stripped = source
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/className=["'][^"']*["']/g, ' ')
    .replace(/style=\{\{[^}]*\}\}/g, ' ');
  const words = stripped.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w));
  return words.length;
}

/**
 * Recursively extracts all string values from an object/record and returns the total word count.
 */
function extractObjectWordCount(obj: any): number {
  let combinedText = '';
  function collect(val: any) {
    if (typeof val === 'string') {
      combinedText += ' ' + val;
    } else if (Array.isArray(val)) {
      val.forEach(collect);
    } else if (val && typeof val === 'object') {
      Object.values(val).forEach(collect);
    }
  }
  collect(obj);
  return combinedText
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;
}

/**
 * Loads a page's source code and follows any direct client component imports
 * (e.g. RemissionOfFinesPageClient) to capture complete rendered content.
 */
function getFullPageSource(pageRelPath: string): string {
  const fullPath = path.join(ROOT_DIR, pageRelPath);
  if (!fs.existsSync(fullPath)) return '';
  let content = fs.readFileSync(fullPath, 'utf-8');

  // If the page delegates to a client component in src/components/, concatenate it
  const clientImportMatches = content.match(/import\s+[\w{}]+(?:\s*,\s*[\w{}]+)*\s+from\s+['"](@\/components\/[^'"]+)['"]/g);
  if (clientImportMatches) {
    for (const match of clientImportMatches) {
      const pathMatch = match.match(/from\s+['"]@\/([^'"]+)['"]/);
      if (pathMatch) {
        const compRel = pathMatch[1];
        for (const ext of ['.tsx', '.ts', '']) {
          const compPath = path.join(ROOT_DIR, 'src', `${compRel}${ext}`);
          if (fs.existsSync(compPath)) {
            content += '\n' + fs.readFileSync(compPath, 'utf-8');
            break;
          }
        }
      }
    }
  }
  return content;
}

/**
 * Parses title, isAbsolute flag, and meta description from a page or layout file.
 */
function extractMetadata(filePath: string): { title?: string; isAbsolute?: boolean; description?: string } {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');

  let title: string | undefined;
  let isAbsolute = false;
  let description: string | undefined;

  // Absolute title: title: { absolute: "..." }
  const absoluteTitleMatch = content.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]\s*\}/);
  if (absoluteTitleMatch) {
    title = absoluteTitleMatch[1];
    isAbsolute = true;
  } else {
    // Plain string title: title: "..."
    const plainTitleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
    if (plainTitleMatch) {
      title = plainTitleMatch[1];
      isAbsolute = false;
    }
  }

  // Meta description: description: "..."
  const descMatch = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
  if (descMatch) {
    description = descMatch[1];
  }

  return { title, isAbsolute, description };
}

/**
 * Computes the final rendered HTML title taking into account the root layout template: '%s | My Accountant'.
 */
function computeRenderedTitle(meta: { title?: string; isAbsolute?: boolean }): string {
  if (!meta.title) return '';
  if (meta.isAbsolute) return meta.title;
  if (meta.title.endsWith(' | My Accountant')) return meta.title;
  return `${meta.title} | My Accountant`;
}

// =============================================================================
// R1–R5 Comprehensive SEO Contract Tests
// =============================================================================

describe('R1-R5 SEO & Platform Overhaul Contract Test Suite', () => {

  // ===========================================================================
  // Tier 1: Content Depth & Industry Profiles Contracts (R1)
  // ===========================================================================
  describe('Tier 1: Content Depth & Statutory Compliance Contracts', () => {
    const TARGET_CORE_PAGES = [
      { name: 'UIF Compliance', path: 'src/app/uif-compliance/page.tsx' },
      { name: 'Payroll Administration', path: 'src/app/payroll-administration/page.tsx' },
      { name: 'PAYE Compliance', path: 'src/app/paye-compliance/page.tsx' },
      { name: 'Management Accounts', path: 'src/app/management-accounts/page.tsx' },
      { name: 'Remission of Fines', path: 'src/app/remission-of-fines/page.tsx' },
    ];

    describe('Core Service Pages Content Depth (>= 750 words, >= 5 <h2> sections)', () => {
      TARGET_CORE_PAGES.forEach(({ name, path: pageRelPath }) => {
        it(`${name} (${pageRelPath}) contains at least 750 rendered words and at least 5 <h2> sections`, () => {
          const fullPath = path.join(ROOT_DIR, pageRelPath);
          expect(fs.existsSync(fullPath), `File not found: ${pageRelPath}`).toBe(true);

          const fullSource = getFullPageSource(pageRelPath);

          // 1. Heading count: at least 5 <h2> sections
          const h2Matches = fullSource.match(/<h2[\s>]/gi) || [];
          expect(
            h2Matches.length,
            `Expected ${name} to contain at least 5 <h2> sections, found ${h2Matches.length}`
          ).toBeGreaterThanOrEqual(5);

          // 2. Word count: at least 750 rendered words
          const wordCount = extractRenderedWords(fullSource);
          expect(
            wordCount,
            `Expected ${name} to contain at least 750 rendered words, found ${wordCount}`
          ).toBeGreaterThanOrEqual(750);
        });
      });
    });

    describe('Industry Profiles in src/lib/industries.ts (> 700 words each)', () => {
      const REQUIRED_INDUSTRIES = [
        'sme',
        'construction',
        'hospitality',
        'healthcare-medical-practices',
        'ecommerce-online-sellers',
        'professional-services',
        'influencers',
      ] as const;

      REQUIRED_INDUSTRIES.forEach((industryKey) => {
        it(`industry profile '${industryKey}' exists and contains comprehensive copy exceeding 700 words`, () => {
          const profile = (industries as Record<string, any>)[industryKey];
          expect(profile, `Missing industry profile for key: '${industryKey}' in src/lib/industries.ts`).toBeDefined();

          const wordCount = extractObjectWordCount(profile);
          expect(
            wordCount,
            `Industry '${industryKey}' copy contains ${wordCount} words, expected > 700 words`
          ).toBeGreaterThan(700);
        });
      });
    });
  });

  // ===========================================================================
  // Tier 2: JavaScript Bundle Weight & Head Resource Hints Contracts (R2)
  // ===========================================================================
  describe('Tier 2: Bundle Weight & Performance Optimization Contracts', () => {
    const homeClientPath = path.join(ROOT_DIR, 'src/components/home/HomePageClient.tsx');
    const layoutPath = path.join(ROOT_DIR, 'src/app/layout.tsx');
    const appShellPath = path.join(ROOT_DIR, 'src/components/layout/AppShell.tsx');

    it('HomePageClient.tsx does NOT import firebase/firestore or onSnapshot', () => {
      expect(fs.existsSync(homeClientPath)).toBe(true);
      const homeSource = fs.readFileSync(homeClientPath, 'utf-8');

      // Must not import client Firestore SDK
      expect(homeSource).not.toMatch(/from\s+['"]firebase\/firestore['"]/);
      expect(homeSource).not.toMatch(/\bonSnapshot\b/);
      expect(homeSource).not.toMatch(/\bgetFirestore\b/);
      expect(homeSource).not.toMatch(/\bcollection\s*\(\s*db/);

      // Must accept initialPrices server props
      expect(homeSource).toMatch(/initialPrices/);
    });

    it('AppShell.tsx defers mounting of WebsiteAIWidget until idle or user interaction', () => {
      expect(fs.existsSync(appShellPath)).toBe(true);
      const appShellSource = fs.readFileSync(appShellPath, 'utf-8');

      // Must not mount synchronously during initial hydration (e.g. setMounted(true) on first render)
      // Must implement interaction or idle callback mechanism
      const hasIdleOrInteraction =
        appShellSource.includes('requestIdleCallback') ||
        appShellSource.includes('pointerdown') ||
        appShellSource.includes('isWidgetReady') ||
        appShellSource.includes('triggerMount') ||
        appShellSource.includes('setTimeout');
      expect(hasIdleOrInteraction, 'AppShell must defer WebsiteAIWidget mounting').toBe(true);
    });

    it('src/app/layout.tsx contains preconnect and dns-prefetch hints for Google Tag Manager and TrustIndex', () => {
      expect(fs.existsSync(layoutPath)).toBe(true);
      const layoutSource = fs.readFileSync(layoutPath, 'utf-8');

      // Check preconnect & dns-prefetch for Google Tag Manager
      const hasGtmPreconnect = /<link\s+[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/www\.googletagmanager\.com["']/i.test(layoutSource) ||
        /<link\s+[^>]*href=["']https:\/\/www\.googletagmanager\.com["'][^>]*rel=["']preconnect["']/i.test(layoutSource);
      const hasGtmDnsPrefetch = /<link\s+[^>]*rel=["']dns-prefetch["'][^>]*href=["']https:\/\/www\.googletagmanager\.com["']/i.test(layoutSource) ||
        /<link\s+[^>]*href=["']https:\/\/www\.googletagmanager\.com["'][^>]*rel=["']dns-prefetch["']/i.test(layoutSource);

      expect(hasGtmPreconnect, 'layout.tsx must contain preconnect for googletagmanager.com').toBe(true);
      expect(hasGtmDnsPrefetch, 'layout.tsx must contain dns-prefetch for googletagmanager.com').toBe(true);

      // Check preconnect & dns-prefetch for TrustIndex
      const hasTrustIndexPreconnect = /<link\s+[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/cdn\.trustindex\.io["']/i.test(layoutSource) ||
        /<link\s+[^>]*href=["']https:\/\/cdn\.trustindex\.io["'][^>]*rel=["']preconnect["']/i.test(layoutSource);
      const hasTrustIndexDnsPrefetch = /<link\s+[^>]*rel=["']dns-prefetch["'][^>]*href=["']https:\/\/cdn\.trustindex\.io["']/i.test(layoutSource) ||
        /<link\s+[^>]*href=["']https:\/\/cdn\.trustindex\.io["'][^>]*rel=["']dns-prefetch["']/i.test(layoutSource);

      expect(hasTrustIndexPreconnect, 'layout.tsx must contain preconnect for cdn.trustindex.io').toBe(true);
      expect(hasTrustIndexDnsPrefetch, 'layout.tsx must contain dns-prefetch for cdn.trustindex.io').toBe(true);
    });
  });

  // ===========================================================================
  // Tier 2: Metadata Length Calibration & SERP Optimization Contracts (R3)
  // ===========================================================================
  describe('Tier 2: Metadata Calibration & SERP Optimization Contracts', () => {
    describe('Rendered HTML Page Title Lengths (strictly <= 60 characters)', () => {
      const TARGET_TITLE_PAGES = [
        { path: 'src/app/sars-turnover-tax-registration/page.tsx', name: 'Turnover Tax Registration' },
        { path: 'src/app/ai-accountant/page.tsx', name: 'AI Accountant' },
        { path: 'src/app/blog/vat-registration-threshold-sme-2026/page.tsx', name: 'New VAT Thresholds Blog' },
        { path: 'src/app/sars-tax-representative-appointment/page.tsx', name: 'SARS Tax Representative Appointment' },
        { path: 'src/app/outsourcing-vs-hiring/page.tsx', name: 'Outsourcing vs Hiring' },
        { path: 'src/app/tax-glossary/page.tsx', name: 'Tax Glossary' },
      ];

      TARGET_TITLE_PAGES.forEach(({ path: pageRelPath, name }) => {
        it(`${name} rendered HTML title does not exceed 60 characters`, () => {
          const fullPath = path.join(ROOT_DIR, pageRelPath);
          expect(fs.existsSync(fullPath), `File not found: ${pageRelPath}`).toBe(true);

          const meta = extractMetadata(fullPath);
          expect(meta.title, `Missing title in ${pageRelPath}`).toBeDefined();

          const renderedTitle = computeRenderedTitle(meta);
          expect(
            renderedTitle.length,
            `Rendered title "${renderedTitle}" for ${name} (${renderedTitle.length} chars) exceeds 60 characters`
          ).toBeLessThanOrEqual(60);
        });
      });
    });

    describe('Homepage Title Symbol Hygiene (No star ★ symbol)', () => {
      it('homepage default title does NOT contain star symbol (★)', () => {
        const homePagePath = path.join(ROOT_DIR, 'src/app/page.tsx');
        expect(fs.existsSync(homePagePath)).toBe(true);
        const homeMeta = extractMetadata(homePagePath);

        if (homeMeta.title) {
          expect(homeMeta.title).not.toContain('★');
        }

        // Also check SEO update script if present
        const updateSeoPath = path.join(ROOT_DIR, 'src/scripts/update_seo.ts');
        if (fs.existsSync(updateSeoPath)) {
          const updateSeoSource = fs.readFileSync(updateSeoPath, 'utf-8');
          const homeMetaMatch = updateSeoSource.match(/doc\(['"`]home['"`]\)\.set\(\{[\s\S]*?metaTitle:\s*['"`]([^'"`]+)['"`]/);
          if (homeMetaMatch) {
            expect(homeMetaMatch[1], 'staticSeo/home in update_seo.ts must not contain ★').not.toContain('★');
          }
        }
      });
    });

    describe('Meta Descriptions Calibration (strictly 140–158 characters)', () => {
      it('/outsourcing-vs-hiring meta description is strictly within 140-158 characters', () => {
        const meta = extractMetadata(path.join(ROOT_DIR, 'src/app/outsourcing-vs-hiring/page.tsx'));
        expect(meta.description).toBeDefined();
        expect(meta.description!.length).toBeGreaterThanOrEqual(140);
        expect(meta.description!.length).toBeLessThanOrEqual(158);
      });

      it('/ai-accountant meta description is strictly within 140-158 characters', () => {
        const meta = extractMetadata(path.join(ROOT_DIR, 'src/app/ai-accountant/page.tsx'));
        expect(meta.description).toBeDefined();
        expect(meta.description!.length).toBeGreaterThanOrEqual(140);
        expect(meta.description!.length).toBeLessThanOrEqual(158);
      });

      it('/industries/sme description is strictly within 140-158 characters', () => {
        const smeProfile = industries.sme as any;
        expect(smeProfile).toBeDefined();
        const desc = smeProfile.metaDescription || smeProfile.description;
        expect(desc, 'Missing description for SME industry').toBeDefined();
        expect(desc.length).toBeGreaterThanOrEqual(140);
        expect(desc.length).toBeLessThanOrEqual(158);
      });

      it('/industries/construction description is strictly within 140-158 characters', () => {
        const constructionProfile = industries.construction as any;
        expect(constructionProfile).toBeDefined();
        const desc = constructionProfile.metaDescription || constructionProfile.description;
        expect(desc, 'Missing description for Construction industry').toBeDefined();
        expect(desc.length).toBeGreaterThanOrEqual(140);
        expect(desc.length).toBeLessThanOrEqual(158);
      });

      it('homepage default meta description is strictly within 140-158 characters', () => {
        const homeMeta = extractMetadata(path.join(ROOT_DIR, 'src/app/page.tsx'));
        expect(homeMeta.description, 'Missing default description in src/app/page.tsx').toBeDefined();
        expect(homeMeta.description!.length).toBeGreaterThanOrEqual(140);
        expect(homeMeta.description!.length).toBeLessThanOrEqual(158);
      });
    });

    describe('Short Titles Expansion (titles under 30 characters expanded to descriptive length)', () => {
      it('/tax-glossary title is expanded to at least 45 characters on rendered HTML', () => {
        const meta = extractMetadata(path.join(ROOT_DIR, 'src/app/tax-glossary/page.tsx'));
        expect(meta.title).toBeDefined();
        const renderedTitle = computeRenderedTitle(meta);
        expect(
          renderedTitle.length,
          `Tax glossary rendered title "${renderedTitle}" (${renderedTitle.length} chars) should be >= 45 and <= 60 chars`
        ).toBeGreaterThanOrEqual(45);
        expect(renderedTitle.length).toBeLessThanOrEqual(60);
      });
    });
  });

  // ===========================================================================
  // Tier 3: Schema.org Entity Graph & Semantic Markup Contracts (R4 & R5)
  // ===========================================================================
  describe('Tier 3: Schema & Semantics Contracts', () => {
    it('generateRootEntityGraphSchema in src/lib/schema/productSchema.ts outputs a single unified @graph with #organization and #website', () => {
      const generateRootGraph = (productSchema as any).generateRootEntityGraphSchema;
      expect(
        typeof generateRootGraph,
        'productSchema must export generateRootEntityGraphSchema function'
      ).toBe('function');

      const schema = generateRootGraph();
      expect(schema['@context']).toBe('https://schema.org');
      expect(Array.isArray(schema['@graph'])).toBe(true);

      const graph = schema['@graph'] as any[];
      expect(graph.length).toBeGreaterThanOrEqual(2);

      // Verify #organization node
      const orgNode = graph.find(
        (node) =>
          (typeof node['@id'] === 'string' && node['@id'].endsWith('#organization')) ||
          (Array.isArray(node['@type']) ? node['@type'].includes('Organization') : node['@type'] === 'Organization')
      );
      expect(orgNode, 'Root graph must contain an Organization node with @id #organization').toBeDefined();
      expect(orgNode['@id']).toContain('#organization');

      // Verify #website node
      const webSiteNode = graph.find(
        (node) =>
          (typeof node['@id'] === 'string' && node['@id'].endsWith('#website')) ||
          node['@type'] === 'WebSite'
      );
      expect(webSiteNode, 'Root graph must contain a WebSite node with @id #website').toBeDefined();
      expect(webSiteNode['@id']).toContain('#website');

      // Verify link from website to organization publisher
      if (webSiteNode.publisher) {
        expect(webSiteNode.publisher['@id'] || webSiteNode.publisher).toContain('#organization');
      }
    });

    it('src/app/layout.tsx imports and renders the unified root entity graph', () => {
      const layoutPath = path.join(ROOT_DIR, 'src/app/layout.tsx');
      expect(fs.existsSync(layoutPath)).toBe(true);
      const layoutSource = fs.readFileSync(layoutPath, 'utf-8');

      expect(layoutSource).toMatch(/generateRootEntityGraphSchema/);
    });

    it('Footer.tsx column labels do NOT use <h3> tags to maintain semantic heading hierarchy', () => {
      const footerPath = path.join(ROOT_DIR, 'src/components/layout/Footer.tsx');
      expect(fs.existsSync(footerPath)).toBe(true);
      const footerSource = fs.readFileSync(footerPath, 'utf-8');

      // Ensure footer does not contain <h3> tags for column labels
      expect(
        footerSource,
        'Footer column headers must not use <h3> elements'
      ).not.toMatch(/<h3[^>]*>(?:Contact & Office|Accounting & Payroll|Tax & Secretarial|Quick Links & Legal)<\/h3>/i);

      // Verify zero <h3> tags in the footer component entirely
      expect(footerSource).not.toMatch(/<h3[\s>]/i);
    });

    it('BreadcrumbList schema generation is present and functional in schema module', () => {
      const generateBreadcrumb = (productSchema as any).generateBreadcrumbSchema;
      const generateServicePillar = (productSchema as any).generateServicePillarSchema;

      // Either standalone generateBreadcrumbSchema or pillar breadcrumb generator must exist
      const hasBreadcrumbGenerator =
        typeof generateBreadcrumb === 'function' ||
        typeof generateServicePillar === 'function';
      expect(hasBreadcrumbGenerator, 'BreadcrumbList schema generator must be available').toBe(true);

      if (typeof generateBreadcrumb === 'function') {
        const breadcrumbData = generateBreadcrumb([
          { name: 'Home', url: '/' },
          { name: 'Calculators', url: '/calculators' },
          { name: 'VAT Calculator', url: '/calculators/vat-calculator' },
        ]);
        expect(breadcrumbData['@type']).toBe('BreadcrumbList');
        expect(Array.isArray(breadcrumbData.itemListElement)).toBe(true);
        expect(breadcrumbData.itemListElement.length).toBe(3);
        expect(breadcrumbData.itemListElement[0].position).toBe(1);
        expect(breadcrumbData.itemListElement[0].name).toBe('Home');
      }
    });
  });

  // ===========================================================================
  // Tier 4: Typographical Integrity & Heading Sanitation Contracts
  // ===========================================================================
  describe('Tier 4: Typographical & Heading Sanitation Contracts', () => {
    it('src/app/management-accounts/page.tsx does NOT contain the # typographical character in headings', () => {
      const pagePath = path.join(ROOT_DIR, 'src/app/management-accounts/page.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
      const content = fs.readFileSync(pagePath, 'utf-8');

      // Check specific known typo: "Management #Accounts"
      expect(content).not.toContain('Management #Accounts');

      // Check that no heading tag (<h1, <h2, <h3) contains a '#' character
      const headingMatches = content.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) || [];
      for (const heading of headingMatches) {
        expect(
          heading,
          `Heading in management-accounts/page.tsx contains illegal '#' character: ${heading}`
        ).not.toContain('#');
      }
    });

    it('src/app/payroll-administration/page.tsx does NOT contain the # typographical character in headings', () => {
      const pagePath = path.join(ROOT_DIR, 'src/app/payroll-administration/page.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
      const content = fs.readFileSync(pagePath, 'utf-8');

      // Check specific known typo: "Payroll #Administration"
      expect(content).not.toContain('Payroll #Administration');

      // Check that no heading tag (<h1, <h2, <h3) contains a '#' character
      const headingMatches = content.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) || [];
      for (const heading of headingMatches) {
        expect(
          heading,
          `Heading in payroll-administration/page.tsx contains illegal '#' character: ${heading}`
        ).not.toContain('#');
      }
    });
  });
});
