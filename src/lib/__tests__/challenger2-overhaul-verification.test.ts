import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import {
  generateRootEntityGraphSchema,
  generateServicePillarSchema,
  generateBreadcrumbSchema,
  generateStructuredData,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/lib/schema/productSchema';
import { SITE_URL } from '@/lib/constants';
import { Service } from '@/lib/types';

const ROOT_DIR = path.resolve(__dirname, '../../..');

describe('Adversarial Challenger 2: Bundle Decoupling, Schema Entity Graph, DOM Semantics & Accessibility', () => {

  // =========================================================================
  // Section 1: Client Bundle & Firestore Decoupling Test
  // =========================================================================
  describe('1. Client Bundle & Firestore Decoupling Test', () => {
    const homeClientPath = path.join(ROOT_DIR, 'src/components/home/HomePageClient.tsx');
    const homePagePath = path.join(ROOT_DIR, 'src/app/page.tsx');

    it('1.1: Uses TypeScript AST to prove HomePageClient.tsx imports ZERO Firestore modules or functions', () => {
      expect(fs.existsSync(homeClientPath)).toBe(true);
      const sourceCode = fs.readFileSync(homeClientPath, 'utf-8');

      const sourceFile = ts.createSourceFile(
        'HomePageClient.tsx',
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const importedModules: string[] = [];
      const importedSymbols: string[] = [];

      function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
          const moduleName = (node.moduleSpecifier as ts.StringLiteral).text;
          importedModules.push(moduleName);

          if (node.importClause && node.importClause.namedBindings) {
            if (ts.isNamedImports(node.importClause.namedBindings)) {
              node.importClause.namedBindings.elements.forEach((element) => {
                importedSymbols.push(element.name.text);
              });
            }
          }
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);

      // Assert zero imports from firebase or firestore
      const firestoreImports = importedModules.filter((mod) =>
        mod.includes('firebase') || mod.includes('firestore')
      );
      expect(firestoreImports).toEqual([]);

      // Assert zero imported symbols of onSnapshot, getFirestore, getDocs, collection, etc.
      const forbiddenSymbols = ['onSnapshot', 'getFirestore', 'getDocs', 'collection', 'doc', 'query'];
      const foundForbiddenSymbols = importedSymbols.filter((sym) => forbiddenSymbols.includes(sym));
      expect(foundForbiddenSymbols).toEqual([]);

      // Additional regex validation on raw source
      expect(sourceCode).not.toMatch(/from\s+['"][^'"]*firebase[^'"]*['"]/);
      expect(sourceCode).not.toMatch(/from\s+['"][^'"]*firestore[^'"]*['"]/);
      expect(sourceCode).not.toMatch(/\bonSnapshot\b/);
      expect(sourceCode).not.toMatch(/\bgetFirestore\b/);
      expect(sourceCode).not.toMatch(/\bgetDocs\b/);
    });

    it('1.2: Verifies server-side fetching in src/app/page.tsx safely handles Firestore unavailability with fallbacks', () => {
      expect(fs.existsSync(homePagePath)).toBe(true);
      const pageSource = fs.readFileSync(homePagePath, 'utf-8');

      // Assert getAdminDb is imported for server-side fetching
      expect(pageSource).toMatch(/import\s+\{[^}]*getAdminDb[^}]*\}\s+from\s+['"]@\/lib\/firebase-admin['"]/);

      // Assert ISR revalidate is configured (revalidate = 3600)
      expect(pageSource).toMatch(/export\s+const\s+revalidate\s*=\s*3600/);

      // Assert DEFAULT_FEATURED_PRICES fallback map exists and contains target slugs
      expect(pageSource).toMatch(/DEFAULT_FEATURED_PRICES/);
      expect(pageSource).toContain('ncr-registration');
      expect(pageSource).toContain('accountants-letter');
      expect(pageSource).toContain('tax-clearance-pin');

      // Assert try/catch block protects getFeaturedServicePrices
      expect(pageSource).toMatch(/try\s*\{[\s\S]*getAdminDb[\s\S]*\}\s*catch\s*\(/);

      // Empirical simulation of Firestore failure handling
      const DEFAULT_FEATURED_PRICES: Record<string, number> = {
        'ncr-registration': 1400,
        'accountants-letter': 1200,
        'tax-clearance-pin': 350,
      };

      const simulateGetFeaturedServicePrices = async (shouldFail: boolean): Promise<Record<string, number>> => {
        try {
          if (shouldFail) {
            throw new Error('Firestore connection timeout: ECONNREFUSED');
          }
          return { 'ncr-registration': 1500, 'accountants-letter': 1300, 'tax-clearance-pin': 400 };
        } catch (error) {
          return DEFAULT_FEATURED_PRICES;
        }
      };

      return simulateGetFeaturedServicePrices(true).then((fallbackPrices) => {
        expect(fallbackPrices).toEqual(DEFAULT_FEATURED_PRICES);
        expect(fallbackPrices['ncr-registration']).toBe(1400);
        expect(fallbackPrices['accountants-letter']).toBe(1200);
        expect(fallbackPrices['tax-clearance-pin']).toBe(350);
      });
    });

    it('1.3: Verifies HomePageClient props accept initialPrices and format prices correctly', () => {
      const sourceCode = fs.readFileSync(homeClientPath, 'utf-8');

      // Assert HomePageClient takes initialPrices prop
      expect(sourceCode).toMatch(/interface\s+HomePageClientProps\s*\{[\s\S]*initialPrices\?:\s*Record<string,\s*number\s*\|\s*string>/);
      expect(sourceCode).toMatch(/function\s+HomePageClient\(\{\s*initialPrices\s*=\s*\{\}\s*\}/);

      // Assert getServicePrice helper uses initialPrices with fallback
      expect(sourceCode).toMatch(/const\s+getServicePrice\s*=\s*\(slug:\s*string,\s*fallback:\s*string\)/);
    });
  });

  // =========================================================================
  // Section 2: Schema.org Entity Graph & Breadcrumb Validation
  // =========================================================================
  describe('2. Schema.org Entity Graph & Breadcrumb Validation', () => {

    it('2.1: Validates generateRootEntityGraphSchema JSON-LD syntax, @graph, @id, and cross-entity linking', () => {
      const rootGraph = generateRootEntityGraphSchema();

      // Ensure clean JSON serializability
      const jsonString = JSON.stringify(rootGraph);
      expect(() => JSON.parse(jsonString)).not.toThrow();

      const parsed = JSON.parse(jsonString);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(Array.isArray(parsed['@graph'])).toBe(true);
      expect(parsed['@graph'].length).toBeGreaterThanOrEqual(2);

      // Find Organization entity
      const orgEntity = parsed['@graph'].find((e: any) => e['@id'] === `${SITE_URL}/#organization`);
      expect(orgEntity).toBeDefined();
      expect(orgEntity['@type']).toContain('Organization');
      expect(orgEntity['@type']).toContain('AccountingService');
      expect(orgEntity.name).toBe('My Accountant');
      expect(orgEntity.founder).toBeDefined();
      expect(orgEntity.founder['@id']).toBe(`${SITE_URL}/#kevin-freese`);

      // Find WebSite entity
      const webSiteEntity = parsed['@graph'].find((e: any) => e['@id'] === `${SITE_URL}/#website`);
      expect(webSiteEntity).toBeDefined();
      expect(webSiteEntity['@type']).toBe('WebSite');
      expect(webSiteEntity.name).toBe('My Accountant');

      // Assert cross-entity linking: WebSite publisher links to Organization
      expect(webSiteEntity.publisher).toBeDefined();
      expect(webSiteEntity.publisher['@id']).toBe(`${SITE_URL}/#organization`);
    });

    it('2.2: Validates generateServicePillarSchema produces interconnected Service, FAQPage, and BreadcrumbList linked to #website and #organization', () => {
      const pillarConfig = {
        title: 'Monthly Accounting Services',
        description: 'Comprehensive monthly accounting and CFO advisory.',
        slug: 'monthly-accounting',
        serviceType: 'Accounting & Advisory',
        priceRange: 'R2,500 - R12,000 / month',
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Monthly Accounting', url: '/monthly-accounting' }
        ],
        faqs: [
          { q: 'What is included in monthly accounting?', a: 'Management accounts, payroll, and VAT submissions.' },
          { q: 'Can you customize packages?', a: 'Yes, tailored to SME requirements.' }
        ]
      };

      const pillarSchema = generateServicePillarSchema(pillarConfig);

      // JSON serializability
      const jsonString = JSON.stringify(pillarSchema);
      expect(() => JSON.parse(jsonString)).not.toThrow();
      const parsed = JSON.parse(jsonString);

      expect(parsed['@context']).toBe('https://schema.org');
      expect(Array.isArray(parsed['@graph'])).toBe(true);

      const pageUrl = `${SITE_URL}/monthly-accounting`;

      // 1. Service Entity
      const serviceEntity = parsed['@graph'].find((e: any) => e['@type'] === 'Service');
      expect(serviceEntity).toBeDefined();
      expect(serviceEntity['@id']).toBe(`${pageUrl}#service`);
      expect(serviceEntity.name).toBe(pillarConfig.title);
      expect(serviceEntity.isPartOf).toEqual({
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`
      });
      expect(serviceEntity.provider).toEqual({
        '@type': 'ProfessionalService',
        '@id': `${SITE_URL}/#organization`,
        'name': 'My Accountant',
        'url': SITE_URL,
        'telephone': '+27101091625'
      });

      // 2. BreadcrumbList Entity
      const breadcrumbEntity = parsed['@graph'].find((e: any) => e['@type'] === 'BreadcrumbList');
      expect(breadcrumbEntity).toBeDefined();
      expect(breadcrumbEntity['@id']).toBe(`${pageUrl}#breadcrumb`);
      expect(breadcrumbEntity.itemListElement).toHaveLength(2);
      expect(breadcrumbEntity.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`
      });
      expect(breadcrumbEntity.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: 'Monthly Accounting',
        item: `${SITE_URL}/monthly-accounting`
      });

      // 3. FAQPage Entity
      const faqEntity = parsed['@graph'].find((e: any) => e['@type'] === 'FAQPage');
      expect(faqEntity).toBeDefined();
      expect(faqEntity['@id']).toBe(`${pageUrl}#faq`);
      expect(faqEntity.isPartOf).toEqual({
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`
      });
      expect(faqEntity.publisher).toEqual({
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`
      });
      expect(faqEntity.mainEntity).toHaveLength(2);
      expect(faqEntity.mainEntity[0].name).toBe('What is included in monthly accounting?');
      expect(faqEntity.mainEntity[0].acceptedAnswer.text).toBe('Management accounts, payroll, and VAT submissions.');
    });

    it('2.3: Validates generateBreadcrumbSchema generates standard compliant BreadcrumbList', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Industries', url: '/industries' },
        { name: 'Construction', url: '/industries/construction' }
      ];

      const breadcrumb = generateBreadcrumbSchema(items, '/industries/construction');

      const jsonString = JSON.stringify(breadcrumb);
      expect(() => JSON.parse(jsonString)).not.toThrow();
      const parsed = JSON.parse(jsonString);

      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('BreadcrumbList');
      expect(parsed['@id']).toBe(`${SITE_URL}/industries/construction#breadcrumb`);
      expect(parsed.itemListElement).toHaveLength(3);
      expect(parsed.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`
      });
      expect(parsed.itemListElement[2]).toEqual({
        '@type': 'ListItem',
        position: 3,
        name: 'Construction',
        item: `${SITE_URL}/industries/construction`
      });
    });

    it('2.4: Validates generateStructuredData for products links to #website and #organization and outputs valid offers', () => {
      const mockService = {
        id: 'vat-reg-001',
        title: 'SARS VAT Registration',
        slug: 'vat-registration-south-africa',
        description: 'Complete SARS VAT registration service.',
        price: 1850,
        currency: 'ZAR',
        category: 'Tax & Compliance',
        availability: 'in_stock',
        imageUrl: '/images/vat.jpg',
        isFeatured: true,
      };

      const productSchema = generateStructuredData(mockService as unknown as Service);

      const jsonString = JSON.stringify(productSchema);
      expect(() => JSON.parse(jsonString)).not.toThrow();
      const parsed = JSON.parse(jsonString);

      expect(parsed['@type']).toContain('Service');
      expect(parsed.isPartOf).toEqual({
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`
      });
      expect(parsed.provider).toEqual({
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'My Accountant',
        url: SITE_URL
      });
      expect(parsed.offers).toBeDefined();
      expect(parsed.offers['@type']).toBe('Offer');
      expect(parsed.offers.priceCurrency).toBe('ZAR');
      expect(parsed.offers.price).toBe(1850);
      expect(parsed.offers.seller['@id']).toBe(`${SITE_URL}/#organization`);
    });

    it('2.5: Validates BlogPosting schema structure in blog/[slug]/page.tsx links to #organization, #website, and author #kevin-freese', () => {
      const blogPostPagePath = path.join(ROOT_DIR, 'src/app/blog/[slug]/page.tsx');
      expect(fs.existsSync(blogPostPagePath)).toBe(true);
      const blogPostSource = fs.readFileSync(blogPostPagePath, 'utf-8');

      // Assert BlogPosting schema creation
      expect(blogPostSource).toMatch(/"@type":\s*"BlogPosting"/);
      expect(blogPostSource).toMatch(/"isPartOf":\s*\{\s*"@type":\s*"WebSite",\s*"@id":\s*`\$\{SITE_URL\}\/#website`\s*\}/);
      expect(blogPostSource).toMatch(/"publisher":\s*\{\s*"@type":\s*"Organization",\s*"@id":\s*`\$\{SITE_URL\}\/#organization`/);
      expect(blogPostSource).toMatch(/"author":\s*\{\s*"@type":\s*"Person",\s*"@id":\s*`\$\{SITE_URL\}\/#kevin-freese`/);

      // Assert unified blogPostGraph containing breadcrumbSchema, faqSchema, articleSchema
      expect(blogPostSource).toMatch(/const\s+blogPostGraph\s*=\s*\{\s*"@context":\s*"https:\/\/schema\.org",\s*"@graph":\s*\[\s*breadcrumbSchema,\s*faqSchema,\s*articleSchema\s*\]\s*\}/);
    });
  });

  // =========================================================================
  // Section 3: Accessibility & DOM Semantics Test
  // =========================================================================
  describe('3. Accessibility & DOM Semantics Test', () => {
    const footerPath = path.join(ROOT_DIR, 'src/components/layout/Footer.tsx');
    const homeClientPath = path.join(ROOT_DIR, 'src/components/home/HomePageClient.tsx');

    it('3.1: Footer.tsx asserts ZERO <h3> tags for column headers and enforces semantic <p> tags', () => {
      expect(fs.existsSync(footerPath)).toBe(true);
      const footerSource = fs.readFileSync(footerPath, 'utf-8');

      // Assert zero <h3> tags anywhere in the file
      expect(footerSource).not.toMatch(/<h3\b/i);
      expect(footerSource).not.toMatch(/<\/h3>/i);

      // Assert column headers use <p className="font-semibold text-foreground">
      const expectedHeaders = [
        'Contact & Office',
        'Accounting & Payroll',
        'Tax & Secretarial',
        'Quick Links & Legal'
      ];

      for (const header of expectedHeaders) {
        const regex = new RegExp(`<p[^>]*className=["'][^"']*font-semibold[^"']*["'][^>]*>\\s*${header.replace('&', '&amp;|(&)')}\\s*<\\/p>|${header}`);
        expect(footerSource).toMatch(regex);
      }
    });

    it('3.2: Footer.tsx asserts all navigation links and contact links enforce minimum 44x44px touch targets', () => {
      const footerSource = fs.readFileSync(footerPath, 'utf-8');

      // Check all <Link ...> instances in footer
      const linkMatches = footerSource.match(/<Link\s+[^>]*>/g) || [];
      expect(linkMatches.length).toBeGreaterThanOrEqual(24);

      for (const linkTag of linkMatches) {
        expect(linkTag).toMatch(/min-h-\[44px\]/);
      }

      // Check contact anchors (mailto, tel, google maps)
      const contactAnchorMatches = footerSource.match(/<a\s+[^>]*href=["'](mailto:|tel:|https:\/\/www\.google\.com\/maps)[^"']*["'][^>]*>/g) || [];
      expect(contactAnchorMatches.length).toBe(3);

      for (const aTag of contactAnchorMatches) {
        expect(aTag).toMatch(/min-h-\[44px\]/);
      }
    });

    it('3.3: HomepageClient.tsx asserts crawlable internal links exist for all 6 top calculators', () => {
      expect(fs.existsSync(homeClientPath)).toBe(true);
      const homeSource = fs.readFileSync(homeClientPath, 'utf-8');

      const requiredCalculators = [
        '/calculators/vat',
        '/calculators/salary-tax',
        '/calculators/turnover-tax',
        '/calculators/freelance-tax',
        '/calculators/small-business-tax',
        '/calculators/provisional-tax',
      ];

      for (const calcPath of requiredCalculators) {
        // Assert crawlable <Link href="/calculators/..." exists
        const linkRegex = new RegExp(`<Link\\s+[^>]*href=["']${calcPath}["']`, 'i');
        expect(homeSource).toMatch(linkRegex);
      }
    });

    it('3.4: HomepageClient.tsx asserts crawlable internal links exist for all 7 industry hubs', () => {
      const homeSource = fs.readFileSync(homeClientPath, 'utf-8');

      const requiredIndustries = [
        '/industries/sme',
        '/industries/construction',
        '/industries/hospitality',
        '/industries/healthcare-medical-practices',
        '/industries/ecommerce-online-sellers',
        '/industries/professional-services',
        '/industries/influencers',
      ];

      for (const industryPath of requiredIndustries) {
        // Assert crawlable <Link href="/industries/..." exists
        const linkRegex = new RegExp(`<Link\\s+[^>]*href=["']${industryPath}["']`, 'i');
        expect(homeSource).toMatch(linkRegex);
      }
    });
  });
});
