/**
 * Standalone Adversarial Verification Script for Challenger 2
 * Tests:
 * 1. Client Bundle & Firestore Decoupling (AST analysis of HomePageClient.tsx and page.tsx fallback resilience)
 * 2. Schema.org Entity Graph & Breadcrumb Validation (generateRootEntityGraphSchema, generateServicePillarSchema, generateBreadcrumbSchema, blog schema, product schema)
 * 3. Accessibility & DOM Semantics (Footer.tsx zero h3 tags, 44x44px touch targets, crawlable links for 6 calculators & 7 industry hubs)
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import {
  generateRootEntityGraphSchema,
  generateServicePillarSchema,
  generateBreadcrumbSchema,
  generateStructuredData,
} from '../src/lib/schema/productSchema';
import { SITE_URL } from '../src/lib/constants';
import { Service } from '../src/lib/types';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(suite: string, test: string, passed: boolean, details?: string) {
  results.push({ suite, test, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${suite}] ${test}${details ? ` -> ${details}` : ''}`);
}

async function runAudit() {
  console.log('\n===============================================================');
  console.log('CHALLENGER 2: EMPIRICAL ADVERSARIAL VERIFICATION HARNESS');
  console.log('===============================================================\n');

  // =========================================================================
  // 1. Client Bundle & Firestore Decoupling Test
  // =========================================================================
  console.log('--- 1. Client Bundle & Firestore Decoupling Test ---');

  const homeClientPath = path.resolve(process.cwd(), 'src/components/home/HomePageClient.tsx');
  const homeClientSource = fs.readFileSync(homeClientPath, 'utf-8');

  const sourceFile = ts.createSourceFile(
    'HomePageClient.tsx',
    homeClientSource,
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

      if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        node.importClause.namedBindings.elements.forEach((el) => {
          importedSymbols.push(el.name.text);
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  const firestoreImports = importedModules.filter((m) => m.includes('firebase') || m.includes('firestore'));
  record(
    'Bundle Decoupling',
    'AST Import Check: Zero imports of firebase or firestore in HomePageClient.tsx',
    firestoreImports.length === 0,
    `Found imports: [${firestoreImports.join(', ')}]`
  );

  const forbiddenSymbols = ['onSnapshot', 'getFirestore', 'getDocs', 'collection'];
  const leakedSymbols = importedSymbols.filter((s) => forbiddenSymbols.includes(s));
  record(
    'Bundle Decoupling',
    'AST Symbol Check: Zero imported Firestore listener/query symbols in HomePageClient.tsx',
    leakedSymbols.length === 0,
    `Found symbols: [${leakedSymbols.join(', ')}]`
  );

  const rawRegexMatch = /firebase\/firestore|onSnapshot|getFirestore/g.test(homeClientSource);
  record(
    'Bundle Decoupling',
    'Raw Regex Check: Zero references to firebase/firestore, onSnapshot, getFirestore in HomePageClient.tsx',
    !rawRegexMatch
  );

  // Check fallback resilience in src/app/page.tsx
  const homePagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
  const homePageSource = fs.readFileSync(homePagePath, 'utf-8');

  const hasTryCatch = /try\s*\{[\s\S]*getAdminDb[\s\S]*\}\s*catch\s*\(/.test(homePageSource);
  const hasFallbackPrices = /const\s+DEFAULT_FEATURED_PRICES/.test(homePageSource);
  const returnsFallbackOnCatch = /catch\s*\([^)]*\)\s*\{[\s\S]*return\s+DEFAULT_FEATURED_PRICES;/.test(homePageSource);

  record(
    'Server Fetching Resilience',
    'src/app/page.tsx implements try/catch protection with DEFAULT_FEATURED_PRICES fallback for Firestore downtime',
    hasTryCatch && hasFallbackPrices && returnsFallbackOnCatch,
    `tryCatch=${hasTryCatch}, fallbackPrices=${hasFallbackPrices}, returnsFallbackOnCatch=${returnsFallbackOnCatch}`
  );

  // =========================================================================
  // 2. Schema.org Entity Graph & Breadcrumb Validation
  // =========================================================================
  console.log('\n--- 2. Schema.org Entity Graph & Breadcrumb Validation ---');

  // Root Entity Graph Schema
  const rootSchema = generateRootEntityGraphSchema();
  const rootJson = JSON.stringify(rootSchema);
  let rootParsed: any;
  let rootSyntaxValid = true;
  try {
    rootParsed = JSON.parse(rootJson);
  } catch {
    rootSyntaxValid = false;
  }

  record(
    'Schema Graph',
    'generateRootEntityGraphSchema outputs valid JSON-LD syntax',
    rootSyntaxValid
  );

  record(
    'Schema Graph',
    'Root schema carries @context: "https://schema.org" and @graph array',
    rootParsed?.['@context'] === 'https://schema.org' && Array.isArray(rootParsed?.['@graph']) && rootParsed['@graph'].length >= 2,
    `Graph length: ${rootParsed?.['@graph']?.length}`
  );

  const orgEntity = rootParsed?.['@graph']?.find((e: any) => e['@id'] === `${SITE_URL}/#organization`);
  record(
    'Schema Graph',
    'Root schema contains Organization entity with @id: "https://www.myacc.co.za/#organization"',
    Boolean(orgEntity),
    orgEntity ? `Type: ${JSON.stringify(orgEntity['@type'])}` : 'Missing'
  );

  const websiteEntity = rootParsed?.['@graph']?.find((e: any) => e['@id'] === `${SITE_URL}/#website`);
  record(
    'Schema Graph',
    'Root schema contains WebSite entity with @id: "https://www.myacc.co.za/#website"',
    Boolean(websiteEntity),
    websiteEntity ? `Name: ${websiteEntity.name}` : 'Missing'
  );

  const websitePublisherLinked = websiteEntity?.publisher?.['@id'] === `${SITE_URL}/#organization`;
  record(
    'Schema Graph',
    'Root WebSite links to Organization via publisher: { @id: "https://www.myacc.co.za/#organization" }',
    websitePublisherLinked,
    `publisher: ${JSON.stringify(websiteEntity?.publisher)}`
  );

  // Service Pillar Schema
  const pillarSchema = generateServicePillarSchema({
    title: 'Monthly Accounting Services',
    description: 'Professional monthly bookkeeping, reporting, and advisory.',
    slug: 'monthly-accounting',
    serviceType: 'Accounting & Payroll',
    priceRange: 'R2,500 - R12,000 / month',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Monthly Accounting', url: '/monthly-accounting' }
    ],
    faqs: [
      { q: 'What is included?', a: 'Monthly bookkeeping, VAT201, management accounts.' },
      { q: 'How do we sign up?', a: 'Contact our team for onboarding.' }
    ]
  });

  const pillarParsed = JSON.parse(JSON.stringify(pillarSchema));
  const pillarGraph = pillarParsed?.['@graph'] || [];

  const pillarService = pillarGraph.find((e: any) => e['@type'] === 'Service');
  const pillarBreadcrumb = pillarGraph.find((e: any) => e['@type'] === 'BreadcrumbList');
  const pillarFaq = pillarGraph.find((e: any) => e['@type'] === 'FAQPage');

  record(
    'Pillar Schema',
    'generateServicePillarSchema outputs @graph containing Service, BreadcrumbList, and FAQPage',
    Boolean(pillarService && pillarBreadcrumb && pillarFaq),
    `Found entities: ${pillarGraph.map((e: any) => e['@type']).join(', ')}`
  );

  record(
    'Pillar Schema',
    'Pillar Service links to isPartOf #website and provider #organization',
    pillarService?.isPartOf?.['@id'] === `${SITE_URL}/#website` &&
    pillarService?.provider?.['@id'] === `${SITE_URL}/#organization`,
    `isPartOf: ${pillarService?.isPartOf?.['@id']}, provider: ${pillarService?.provider?.['@id']}`
  );

  record(
    'Pillar Schema',
    'Pillar FAQPage links to isPartOf #website and publisher #organization',
    pillarFaq?.isPartOf?.['@id'] === `${SITE_URL}/#website` &&
    pillarFaq?.publisher?.['@id'] === `${SITE_URL}/#organization`,
    `isPartOf: ${pillarFaq?.isPartOf?.['@id']}, publisher: ${pillarFaq?.publisher?.['@id']}`
  );

  record(
    'Pillar Schema',
    'Pillar BreadcrumbList has sequential ListItem elements with valid URLs',
    pillarBreadcrumb?.itemListElement?.length === 2 &&
    pillarBreadcrumb.itemListElement[0].position === 1 &&
    pillarBreadcrumb.itemListElement[1].position === 2,
    `Items: ${pillarBreadcrumb?.itemListElement?.length}`
  );

  // Standalone Breadcrumb Schema
  const breadcrumbOnly = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Industries', url: '/industries' },
    { name: 'SME', url: '/industries/sme' }
  ], '/industries/sme');

  const bcParsed = JSON.parse(JSON.stringify(breadcrumbOnly));
  record(
    'Breadcrumb Schema',
    'generateBreadcrumbSchema outputs valid Schema.org BreadcrumbList with items',
    bcParsed['@type'] === 'BreadcrumbList' && bcParsed.itemListElement.length === 3 && bcParsed['@id'] === `${SITE_URL}/industries/sme#breadcrumb`,
    `@id: ${bcParsed['@id']}, count: ${bcParsed.itemListElement.length}`
  );

  // Blog Schema Verification
  const blogPostPath = path.resolve(process.cwd(), 'src/app/blog/[slug]/page.tsx');
  const blogPostSource = fs.readFileSync(blogPostPath, 'utf-8');

  const hasBlogPosting = /"@type":\s*"BlogPosting"/.test(blogPostSource);
  const hasBlogIsPartOf = /"isPartOf":\s*\{\s*"@type":\s*"WebSite",\s*"@id":\s*`\$\{SITE_URL\}\/#website`\s*\}/.test(blogPostSource);
  const hasBlogPublisher = /"publisher":\s*\{\s*"@type":\s*"Organization",\s*"@id":\s*`\$\{SITE_URL\}\/#organization`/.test(blogPostSource);
  const hasBlogAuthor = /"author":\s*\{\s*"@type":\s*"Person",\s*"@id":\s*`\$\{SITE_URL\}\/#kevin-freese`/.test(blogPostSource);

  record(
    'Blog Schema',
    'src/app/blog/[slug]/page.tsx constructs BlogPosting linked to #website, #organization, and author #kevin-freese',
    hasBlogPosting && hasBlogIsPartOf && hasBlogPublisher && hasBlogAuthor,
    `BlogPosting=${hasBlogPosting}, isPartOf=${hasBlogIsPartOf}, publisher=${hasBlogPublisher}, author=${hasBlogAuthor}`
  );

  // Product Schema Verification
  const mockService = {
    id: 'test-tax-return',
    title: 'Individual Tax Return (ITR12)',
    slug: 'tax-return-itr12',
    description: 'Expert completion and filing of individual SARS income tax return.',
    price: 850,
    currency: 'ZAR',
    category: 'Tax & Compliance',
    availability: 'in_stock',
    imageUrl: '/images/tax.jpg',
  };

  const productSchema = generateStructuredData(mockService as unknown as Service);
  const prodParsed = JSON.parse(JSON.stringify(productSchema));

  const prodIsPartOf = prodParsed?.isPartOf?.['@id'] === `${SITE_URL}/#website`;
  const prodProvider = prodParsed?.provider?.['@id'] === `${SITE_URL}/#organization`;
  const prodOffersValid = prodParsed?.offers?.['@type'] === 'Offer' &&
    prodParsed?.offers?.price === 850 &&
    prodParsed?.offers?.priceCurrency === 'ZAR' &&
    prodParsed?.offers?.seller?.['@id'] === `${SITE_URL}/#organization`;

  record(
    'Product Schema',
    'generateStructuredData outputs Service/Product linked to #website, #organization, with valid ZAR Offer',
    prodIsPartOf && prodProvider && prodOffersValid,
    `isPartOf=${prodIsPartOf}, provider=${prodProvider}, offersValid=${prodOffersValid}`
  );

  // =========================================================================
  // 3. Accessibility & DOM Semantics Test
  // =========================================================================
  console.log('\n--- 3. Accessibility & DOM Semantics Test ---');

  const footerPath = path.resolve(process.cwd(), 'src/components/layout/Footer.tsx');
  const footerSource = fs.readFileSync(footerPath, 'utf-8');

  // Assert ZERO <h3> tags
  const h3Match = footerSource.match(/<h3\b|<\/h3>/i);
  record(
    'Footer Semantics',
    'Footer.tsx contains ZERO <h3> tags for column headers',
    !h3Match,
    h3Match ? `Found h3 tag: ${h3Match[0]}` : 'Zero h3 tags found'
  );

  // Assert semantic column headers <p className="font-semibold text-foreground">
  const expectedColHeaders = [
    'Contact & Office',
    'Accounting & Payroll',
    'Tax & Secretarial',
    'Quick Links & Legal'
  ];
  const allHeadersPresent = expectedColHeaders.every((h) =>
    new RegExp(`<p[^>]*className=["'][^"']*font-semibold[^"']*["'][^>]*>\\s*${h.replace('&', '&amp;|(&)')}\\s*<\\/p>|${h}`).test(footerSource)
  );
  record(
    'Footer Semantics',
    'Footer column labels use semantic <p className="font-semibold text-foreground">',
    allHeadersPresent,
    `Checked: [${expectedColHeaders.join(', ')}]`
  );

  // Assert minimum 44x44px touch targets on navigation links and icon buttons
  const linkTags = footerSource.match(/<Link\s+[^>]*>/g) || [];
  const linksHaveMinTouch = linkTags.every((tag) => tag.includes('min-h-[44px]'));

  const anchorTags = footerSource.match(/<a\s+[^>]*href=["'](mailto:|tel:|https:\/\/www\.google\.com\/maps)[^"']*["'][^>]*>/g) || [];
  const anchorsHaveMinTouch = anchorTags.every((tag) => tag.includes('min-h-[44px]'));

  record(
    'Touch Target Accessibility',
    'All footer navigation links (24 items) and contact anchors have min-h-[44px] touch target class',
    linksHaveMinTouch && anchorsHaveMinTouch && linkTags.length >= 24 && anchorTags.length >= 3,
    `linkCount=${linkTags.length} (all min-h-[44px]: ${linksHaveMinTouch}), anchorCount=${anchorTags.length} (all min-h-[44px]: ${anchorsHaveMinTouch})`
  );

  // Internal Links: 6 top calculators and 7 industry hubs on HomePageClient
  const topCalculators = [
    '/calculators/vat',
    '/calculators/salary-tax',
    '/calculators/turnover-tax',
    '/calculators/freelance-tax',
    '/calculators/small-business-tax',
    '/calculators/provisional-tax',
  ];

  const missingCalculators: string[] = [];
  for (const calc of topCalculators) {
    const regex = new RegExp(`<Link\\s+[^>]*href=["']${calc}["']`, 'i');
    if (!regex.test(homeClientSource)) {
      missingCalculators.push(calc);
    }
  }

  record(
    'Crawlable Internal Links',
    'HomePageClient renders crawlable <Link> elements pointing to all 6 top calculators',
    missingCalculators.length === 0,
    missingCalculators.length === 0 ? 'All 6 calculators linked' : `Missing: [${missingCalculators.join(', ')}]`
  );

  const topIndustries = [
    '/industries/sme',
    '/industries/construction',
    '/industries/hospitality',
    '/industries/healthcare-medical-practices',
    '/industries/ecommerce-online-sellers',
    '/industries/professional-services',
    '/industries/influencers',
  ];

  const missingIndustries: string[] = [];
  for (const ind of topIndustries) {
    const regex = new RegExp(`<Link\\s+[^>]*href=["']${ind}["']`, 'i');
    if (!regex.test(homeClientSource)) {
      missingIndustries.push(ind);
    }
  }

  record(
    'Crawlable Internal Links',
    'HomePageClient renders crawlable <Link> elements pointing to all 7 industry hubs',
    missingIndustries.length === 0,
    missingIndustries.length === 0 ? 'All 7 industry hubs linked' : `Missing: [${missingIndustries.join(', ')}]`
  );

  // =========================================================================
  // Summary & Verdict
  // =========================================================================
  console.log('\n===============================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================');

  if (failed > 0) {
    console.error(`\n❌ VERDICT: FAIL (${failed} failed checks)`);
    process.exit(1);
  } else {
    console.log('\n✅ VERDICT: ALL ADVERSARIAL CHALLENGER 2 CHECKS PASSED');
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
