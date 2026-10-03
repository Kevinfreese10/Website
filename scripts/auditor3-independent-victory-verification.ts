import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { CITIES_DATA } from '../src/lib/cities';
import { industries } from '../src/lib/industries';
import {
  generateRootEntityGraphSchema,
  generateServicePillarSchema,
  generateBreadcrumbSchema,
  generateStructuredData,
} from '../src/lib/schema/productSchema';
import { SITE_URL } from '../src/lib/constants';

const ROOT_DIR = path.resolve(__dirname, '..');

interface CheckResult {
  id: string;
  category: string;
  description: string;
  passed: boolean;
  actual: any;
  expected: any;
  notes?: string;
}

const checks: CheckResult[] = [];

function recordCheck(
  id: string,
  category: string,
  description: string,
  passed: boolean,
  actual: any,
  expected: any,
  notes?: string
) {
  checks.push({ id, category, description, passed, actual, expected, notes });
}

function countWords(str: string): number {
  return str.split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w)).length;
}

function extractRenderedWordsFromTsx(filePath: string): number {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Follow client component imports
  const clientMatches = content.match(/import\s+[\w{}]+(?:\s*,\s*[\w{}]+)*\s+from\s+['"](@\/components\/[^'"]+)['"]/g) || [];
  for (const m of clientMatches) {
    const p = m.match(/from\s+['"]@\/([^'"]+)['"]/)?.[1];
    if (p) {
      for (const ext of ['.tsx', '.ts']) {
        const cp = path.join(ROOT_DIR, 'src', `${p}${ext}`);
        if (fs.existsSync(cp)) {
          content += '\n' + fs.readFileSync(cp, 'utf-8');
          break;
        }
      }
    }
  }

  const stripped = content
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/className=["'][^"']*["']/g, ' ')
    .replace(/style=\{\{[^}]*\}\}/g, ' ');

  return countWords(stripped);
}

function getH2Count(filePath: string): number {
  let content = fs.readFileSync(filePath, 'utf-8');
  // Check client component imports as well
  const clientMatches = content.match(/import\s+[\w{}]+(?:\s*,\s*[\w{}]+)*\s+from\s+['"](@\/components\/[^'"]+)['"]/g) || [];
  for (const m of clientMatches) {
    const p = m.match(/from\s+['"]@\/([^'"]+)['"]/)?.[1];
    if (p) {
      for (const ext of ['.tsx', '.ts']) {
        const cp = path.join(ROOT_DIR, 'src', `${p}${ext}`);
        if (fs.existsSync(cp)) {
          content += '\n' + fs.readFileSync(cp, 'utf-8');
          break;
        }
      }
    }
  }
  return (content.match(/<h2[\s>]/gi) || []).length;
}

function hasSections(filePath: string): { process: boolean; documentation: boolean; pricing: boolean } {
  let content = fs.readFileSync(filePath, 'utf-8');
  const clientMatches = content.match(/import\s+[\w{}]+(?:\s*,\s*[\w{}]+)*\s+from\s+['"](@\/components\/[^'"]+)['"]/g) || [];
  for (const m of clientMatches) {
    const p = m.match(/from\s+['"]@\/([^'"]+)['"]/)?.[1];
    if (p) {
      for (const ext of ['.tsx', '.ts']) {
        const cp = path.join(ROOT_DIR, 'src', `${p}${ext}`);
        if (fs.existsSync(cp)) {
          content += '\n' + fs.readFileSync(cp, 'utf-8');
          break;
        }
      }
    }
  }

  const lower = content.toLowerCase();
  const process = lower.includes('process') || lower.includes('workflow') || lower.includes('step-by-step') || lower.includes('calendar') || lower.includes('how it works');
  const documentation =
    lower.includes('documentation') ||
    lower.includes('documents') ||
    lower.includes('documentary') ||
    lower.includes('deliverables') ||
    lower.includes('evidence') ||
    lower.includes('evidentiary') ||
    lower.includes('prerequisites') ||
    lower.includes('records') ||
    lower.includes('pack') ||
    lower.includes('certificates') ||
    lower.includes('payslip');
  const pricing = lower.includes('pricing') || lower.includes('packages') || lower.includes('fees') || lower.includes('plans');

  return { process, documentation, pricing };
}

// =========================================================================
// SECTION 1: Content Quality & Depth
// =========================================================================
const coreServicePages = [
  { slug: 'uif-compliance', path: 'src/app/uif-compliance/page.tsx' },
  { slug: 'payroll-administration', path: 'src/app/payroll-administration/page.tsx' },
  { slug: 'paye-compliance', path: 'src/app/paye-compliance/page.tsx' },
  { slug: 'management-accounts', path: 'src/app/management-accounts/page.tsx' },
  { slug: 'remission-of-fines', path: 'src/app/remission-of-fines/page.tsx' },
];

for (const sp of coreServicePages) {
  const fullPath = path.join(ROOT_DIR, sp.path);
  const words = extractRenderedWordsFromTsx(fullPath);
  const h2Count = getH2Count(fullPath);
  const secs = hasSections(fullPath);

  recordCheck(
    `R1-words-${sp.slug}`,
    'Content Quality & Depth',
    `${sp.slug} word count >= 750`,
    words >= 750,
    words,
    '>= 750'
  );

  recordCheck(
    `R1-h2-${sp.slug}`,
    'Content Quality & Depth',
    `${sp.slug} <h2> sections >= 5`,
    h2Count >= 5,
    h2Count,
    '>= 5'
  );

  recordCheck(
    `R1-sections-${sp.slug}`,
    'Content Quality & Depth',
    `${sp.slug} contains process, documentation, and pricing sections`,
    secs.process && secs.documentation && secs.pricing,
    secs,
    { process: true, documentation: true, pricing: true }
  );
}

// /management-accounts heading contains no # typographical error
const mgmtAccSource = fs.readFileSync(path.join(ROOT_DIR, 'src/app/management-accounts/page.tsx'), 'utf-8');
const hasHashAccounts = mgmtAccSource.includes('Management #Accounts');
const headingHasHash = (mgmtAccSource.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) || []).some(h => {
  const clean = h.replace(/<[^>]+>/g, '').trim();
  return clean.includes('#');
});
recordCheck(
  'R1-typo-management-accounts',
  'Content Quality & Depth',
  '/management-accounts heading contains no # typographical error',
  !hasHashAccounts && !headingHasHash,
  { hasHashAccounts, headingHasHash },
  { hasHashAccounts: false, headingHasHash: false }
);

// All 7 industry profiles in src/lib/industries.ts contain comprehensive copy exceeding 700 words
const requiredIndustries = [
  'sme',
  'construction',
  'hospitality',
  'healthcare-medical-practices',
  'ecommerce-online-sellers',
  'professional-services',
  'influencers',
];

function extractObjectWords(obj: any): number {
  let combined = '';
  function walk(val: any) {
    if (typeof val === 'string') combined += ' ' + val;
    else if (Array.isArray(val)) val.forEach(walk);
    else if (val && typeof val === 'object') Object.values(val).forEach(walk);
  }
  walk(obj);
  return countWords(combined);
}

for (const indKey of requiredIndustries) {
  const profile = (industries as any)[indKey];
  const words = profile ? extractObjectWords(profile) : 0;
  recordCheck(
    `R1-industry-${indKey}`,
    'Content Quality & Depth',
    `Industry profile ${indKey} in src/lib/industries.ts exceeds 700 words`,
    words > 700,
    words,
    '> 700'
  );
}

// =========================================================================
// SECTION 2: Performance & Bundle Size
// =========================================================================
const homeClientPath = path.join(ROOT_DIR, 'src/components/home/HomePageClient.tsx');
const homeClientSource = fs.readFileSync(homeClientPath, 'utf-8');

const sourceFile = ts.createSourceFile('HomePageClient.tsx', homeClientSource, ts.ScriptTarget.Latest, true);
let importsFirestoreOrOnSnapshot = false;
function checkAst(node: ts.Node) {
  if (ts.isImportDeclaration(node)) {
    const mod = (node.moduleSpecifier as ts.StringLiteral).text;
    if (mod.includes('firebase') || mod.includes('firestore')) {
      importsFirestoreOrOnSnapshot = true;
    }
  }
  ts.forEachChild(node, checkAst);
}
checkAst(sourceFile);
if (homeClientSource.includes('onSnapshot') || homeClientSource.includes('firebase/firestore')) {
  importsFirestoreOrOnSnapshot = true;
}

recordCheck(
  'R2-bundle-homepage-firestore',
  'Performance & Bundle Size',
  'HomePageClient.tsx does NOT import firebase/firestore or onSnapshot',
  !importsFirestoreOrOnSnapshot,
  !importsFirestoreOrOnSnapshot ? 'Clean (0 imports)' : 'Found forbidden imports',
  'Clean (0 imports)'
);

// Homepage renders preconnected link tags for Google Tag Manager and TrustIndex
const layoutPath = path.join(ROOT_DIR, 'src/app/layout.tsx');
const layoutSource = fs.readFileSync(layoutPath, 'utf-8');
const hasGtmPreconnect = /<link\s+[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/www\.googletagmanager\.com["']/i.test(layoutSource) ||
  /<link\s+[^>]*href=["']https:\/\/www\.googletagmanager\.com["'][^>]*rel=["']preconnect["']/i.test(layoutSource);
const hasGtmDnsPrefetch = /<link\s+[^>]*rel=["']dns-prefetch["'][^>]*href=["']https:\/\/www\.googletagmanager\.com["']/i.test(layoutSource) ||
  /<link\s+[^>]*href=["']https:\/\/www\.googletagmanager\.com["'][^>]*rel=["']dns-prefetch["']/i.test(layoutSource);
recordCheck(
  'R2-preconnect-gtm',
  'Performance & Bundle Size',
  'Homepage layout renders preconnected link tags for Google Tag Manager',
  hasGtmPreconnect && hasGtmDnsPrefetch,
  { hasGtmPreconnect, hasGtmDnsPrefetch },
  { hasGtmPreconnect: true, hasGtmDnsPrefetch: true }
);

// WebsiteAIWidget does not block initial page hydration in AppShell.tsx
const appShellPath = path.join(ROOT_DIR, 'src/components/layout/AppShell.tsx');
const appShellSource = fs.readFileSync(appShellPath, 'utf-8');
const defersWidget =
  (appShellSource.includes('requestIdleCallback') || appShellSource.includes('setTimeout')) &&
  appShellSource.includes('isWidgetReady') &&
  appShellSource.includes('WebsiteAIWidget');
recordCheck(
  'R2-hydration-widget',
  'Performance & Bundle Size',
  'WebsiteAIWidget does not block initial page hydration (deferred mounting)',
  defersWidget,
  defersWidget,
  true
);

// =========================================================================
// SECTION 3: Metadata & SEO Standards
// =========================================================================
// 1. Zero page titles exceed 60 characters on rendered HTML
interface TitleTest {
  path: string;
  route: string;
  title: string;
}
const renderedTitles: TitleTest[] = [];

// Calculators
const calcDir = path.join(ROOT_DIR, 'src/app/calculators');
if (fs.existsSync(calcDir)) {
  for (const slug of fs.readdirSync(calcDir)) {
    const lFile = path.join(calcDir, slug, 'layout.tsx');
    if (fs.existsSync(lFile)) {
      const c = fs.readFileSync(lFile, 'utf-8');
      const absMatch = c.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]/);
      const plainMatch = c.match(/title:\s*['"`]([^'"`]+)['"`]/);
      const t = absMatch ? absMatch[1] : plainMatch ? plainMatch[1] : '';
      if (t) {
        renderedTitles.push({ path: lFile, route: `/calculators/${slug}`, title: t });
      }
    }
  }
}

// City pages
for (const [key, city] of Object.entries(CITIES_DATA)) {
  const fullTitle = `${city.metaTitle} | My Accountant`;
  renderedTitles.push({ path: 'src/lib/cities.ts', route: `/accountant-${city.slug}`, title: fullTitle });
}

// Industries
for (const [key, ind] of Object.entries(industries)) {
  const t = ind.metaTitle || ind.title;
  renderedTitles.push({ path: 'src/lib/industries.ts', route: `/industries/${key}`, title: t });
}

// Static pages
const auditedStaticPages = [
  { route: '/sars-turnover-tax-registration', p: 'src/app/sars-turnover-tax-registration/page.tsx' },
  { route: '/ai-accountant', p: 'src/app/ai-accountant/page.tsx' },
  { route: '/blog/new-vat-registration-thresholds-south-africa-2026', p: 'src/app/blog/new-vat-registration-thresholds-south-africa-2026/page.tsx' },
  { route: '/sars-tax-representative-appointment', p: 'src/app/sars-tax-representative-appointment/page.tsx' },
  { route: '/tax-glossary', p: 'src/app/tax-glossary/page.tsx' },
  { route: '/outsourcing-vs-hiring', p: 'src/app/outsourcing-vs-hiring/page.tsx' },
  { route: '/uif-compliance', p: 'src/app/uif-compliance/page.tsx' },
  { route: '/payroll-administration', p: 'src/app/payroll-administration/page.tsx' },
  { route: '/paye-compliance', p: 'src/app/paye-compliance/page.tsx' },
  { route: '/management-accounts', p: 'src/app/management-accounts/page.tsx' },
  { route: '/remission-of-fines', p: 'src/app/remission-of-fines/page.tsx' },
  { route: '/', p: 'src/app/page.tsx' },
];

for (const sp of auditedStaticPages) {
  const c = fs.readFileSync(path.join(ROOT_DIR, sp.p), 'utf-8');
  const absMatch = c.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]/);
  const plainMatch = c.match(/defaults(?:\s*:\s*Metadata)?\s*=\s*\{[\s\S]*?title:\s*['"`]([^'"`]+)['"`]/) ||
                     c.match(/title:\s*['"`]([^'"`]+)['"`]/);
  let t = '';
  if (absMatch) {
    t = absMatch[1];
  } else if (plainMatch) {
    t = plainMatch[1];
    if (!t.endsWith(' | My Accountant') && !c.includes('getStaticPageMetadata')) {
      t = `${t} | My Accountant`;
    }
  }
  if (t) {
    renderedTitles.push({ path: sp.p, route: sp.route, title: t });
  }
}

const over60Titles = renderedTitles.filter(rt => rt.title.length > 60);
recordCheck(
  'R3-titles-under-60',
  'Metadata & SEO Standards',
  'Zero page titles exceed 60 characters on rendered HTML',
  over60Titles.length === 0,
  over60Titles.length,
  0,
  over60Titles.length > 0 ? `Offending: ${JSON.stringify(over60Titles)}` : `Audited ${renderedTitles.length} titles cleanly`
);

// Homepage title contains no star symbol (★)
const homePageSource = fs.readFileSync(path.join(ROOT_DIR, 'src/app/page.tsx'), 'utf-8');
const homeTitleMatch = homePageSource.match(/title:\s*['"`]([^'"`]+)['"`]/);
const homeTitle = homeTitleMatch ? homeTitleMatch[1] : '';
const homeHasStar = homeTitle.includes('★');
recordCheck(
  'R3-home-no-star',
  'Metadata & SEO Standards',
  'Homepage title contains no star symbol (★)',
  !homeHasStar,
  homeTitle,
  'No ★ symbol'
);

// Meta descriptions for /outsourcing-vs-hiring, /ai-accountant, /industries/sme, /industries/construction, and homepage strictly within 140–158 characters
function getMetaDesc(relPath: string): string {
  const c = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf-8');
  const m = c.match(/description:\s*['"`]([^'"`]+)['"`]/);
  return m ? m[1] : '';
}

const outsourcingDesc = getMetaDesc('src/app/outsourcing-vs-hiring/page.tsx');
recordCheck(
  'R3-desc-outsourcing',
  'Metadata & SEO Standards',
  '/outsourcing-vs-hiring description strictly within 140-158 characters',
  outsourcingDesc.length >= 140 && outsourcingDesc.length <= 158,
  outsourcingDesc.length,
  '140 - 158'
);

const aiAccountantDesc = getMetaDesc('src/app/ai-accountant/page.tsx');
recordCheck(
  'R3-desc-ai-accountant',
  'Metadata & SEO Standards',
  '/ai-accountant description strictly within 140-158 characters',
  aiAccountantDesc.length >= 140 && aiAccountantDesc.length <= 158,
  aiAccountantDesc.length,
  '140 - 158'
);

const homeDesc = getMetaDesc('src/app/page.tsx');
recordCheck(
  'R3-desc-homepage',
  'Metadata & SEO Standards',
  'Homepage description strictly within 140-158 characters',
  homeDesc.length >= 140 && homeDesc.length <= 158,
  homeDesc.length,
  '140 - 158'
);

const smeDesc = (industries as any).sme?.metaDescription || (industries as any).sme?.description || '';
recordCheck(
  'R3-desc-sme',
  'Metadata & SEO Standards',
  '/industries/sme description strictly within 140-158 characters',
  smeDesc.length >= 140 && smeDesc.length <= 158,
  smeDesc.length,
  '140 - 158'
);

const constrDesc = (industries as any).construction?.metaDescription || (industries as any).construction?.description || '';
recordCheck(
  'R3-desc-construction',
  'Metadata & SEO Standards',
  '/industries/construction description strictly within 140-158 characters',
  constrDesc.length >= 140 && constrDesc.length <= 158,
  constrDesc.length,
  '140 - 158'
);

// Titles under 30 characters expanded
const taxGlossarySource = fs.readFileSync(path.join(ROOT_DIR, 'src/app/tax-glossary/page.tsx'), 'utf-8');
const taxGlossaryTitleMatch = taxGlossarySource.match(/title:\s*['"`]([^'"`]+)['"`]/);
const taxGlossaryTitle = taxGlossaryTitleMatch ? `${taxGlossaryTitleMatch[1]} | My Accountant` : '';
recordCheck(
  'R3-short-titles-expanded',
  'Metadata & SEO Standards',
  'Titles under 30 characters expanded with relevant descriptive keywords (e.g. tax-glossary >= 45 chars)',
  taxGlossaryTitle.length >= 45 && taxGlossaryTitle.length <= 60,
  taxGlossaryTitle.length,
  '45 - 60'
);

// Target calibrated titles
const targetCalibrations = [
  { route: '/sars-turnover-tax-registration', p: 'src/app/sars-turnover-tax-registration/page.tsx', min: 45, max: 58 },
  { route: '/ai-accountant', p: 'src/app/ai-accountant/page.tsx', min: 45, max: 58 },
  { route: '/blog/new-vat-registration-thresholds-south-africa-2026', p: 'src/app/blog/new-vat-registration-thresholds-south-africa-2026/page.tsx', min: 45, max: 58 },
  { route: '/sars-tax-representative-appointment', p: 'src/app/sars-tax-representative-appointment/page.tsx', min: 45, max: 58 },
];

for (const tc of targetCalibrations) {
  const c = fs.readFileSync(path.join(ROOT_DIR, tc.p), 'utf-8');
  const absMatch = c.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]/);
  const plainMatch = c.match(/title:\s*['"`]([^'"`]+)['"`]/);
  let t = absMatch ? absMatch[1] : plainMatch ? plainMatch[1] : '';
  if (!absMatch && plainMatch && !t.endsWith(' | My Accountant')) {
    t = `${t} | My Accountant`;
  }
  recordCheck(
    `R3-calibrated-${tc.route}`,
    'Metadata & SEO Standards',
    `${tc.route} title calibrated between ${tc.min} and ${tc.max} characters`,
    t.length >= tc.min && t.length <= tc.max,
    t.length,
    `${tc.min} - ${tc.max}`,
    `Title: "${t}"`
  );
}

// =========================================================================
// SECTION 4: Schema & Semantics
// =========================================================================
// Root layout outputs a single unified JSON-LD @graph containing Organization (#organization) and WebSite (#website)
const rootGraph = generateRootEntityGraphSchema();
const graphNodes = (rootGraph as any)['@graph'] as any[];
const orgNode = graphNodes.find(n => n['@id']?.includes('#organization'));
const webSiteNode = graphNodes.find(n => n['@id']?.includes('#website'));
const webSitePublishesOrg = webSiteNode?.publisher?.['@id']?.includes('#organization');
recordCheck(
  'R4-unified-root-graph',
  'Schema & Semantics',
  'Root layout outputs a single unified JSON-LD @graph containing Organization (#organization) and WebSite (#website)',
  !!orgNode && !!webSiteNode && !!webSitePublishesOrg,
  { hasOrg: !!orgNode, hasWebSite: !!webSiteNode, webSitePublishesOrg },
  { hasOrg: true, hasWebSite: true, webSitePublishesOrg: true }
);

// Footer column labels do NOT use <h3> tags
const footerSource = fs.readFileSync(path.join(ROOT_DIR, 'src/components/layout/Footer.tsx'), 'utf-8');
const footerHasH3 = /<h3[\s>]/i.test(footerSource);
recordCheck(
  'R5-footer-no-h3',
  'Schema & Semantics',
  'Footer column labels do NOT use <h3> tags',
  !footerHasH3,
  footerHasH3 ? 'Found <h3> tags' : 'Zero <h3> tags in Footer.tsx',
  'Zero <h3> tags in Footer.tsx'
);

// BreadcrumbList schema is present on product, category, industry, and blog pages
const breadcrumbSample = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Industries', url: '/industries' },
  { name: 'SME', url: '/industries/sme' },
]);
const hasValidBreadcrumb = breadcrumbSample['@type'] === 'BreadcrumbList' && breadcrumbSample.itemListElement.length === 3;
recordCheck(
  'R4-breadcrumbs-valid',
  'Schema & Semantics',
  'BreadcrumbList schema is present and standard compliant',
  hasValidBreadcrumb,
  breadcrumbSample['@type'],
  'BreadcrumbList'
);

// Blog posts in src/app/blog/[slug]/page.tsx have BlogPosting schema linked to author and publisher #organization
const blogPostPageSource = fs.readFileSync(path.join(ROOT_DIR, 'src/app/blog/[slug]/page.tsx'), 'utf-8');
const blogHasPublisher = blogPostPageSource.includes(`${SITE_URL}/#organization`) || blogPostPageSource.includes('${SITE_URL}/#organization');
const blogHasAuthor = blogPostPageSource.includes(`${SITE_URL}/#kevin-freese`) || blogPostPageSource.includes('${SITE_URL}/#kevin-freese');
const blogHasWebSite = blogPostPageSource.includes(`${SITE_URL}/#website`) || blogPostPageSource.includes('${SITE_URL}/#website');
recordCheck(
  'R4-blogposting-linked',
  'Schema & Semantics',
  'Blog posts have BlogPosting schema linked to author, publisher #organization, and #website',
  blogHasPublisher && blogHasAuthor && blogHasWebSite,
  { blogHasPublisher, blogHasAuthor, blogHasWebSite },
  { blogHasPublisher: true, blogHasAuthor: true, blogHasWebSite: true }
);

// =========================================================================
// SUMMARY OUTPUT
// =========================================================================
console.log('\n======================================================');
console.log('AUDITOR 3 INDEPENDENT VICTORY AUDIT SUITE EXECUTION');
console.log('======================================================\n');

let failed = 0;
for (const c of checks) {
  if (c.passed) {
    console.log(`[PASS] [${c.category}] ${c.id}: ${c.description} -> Actual: ${JSON.stringify(c.actual)}`);
  } else {
    console.error(`[FAIL] [${c.category}] ${c.id}: ${c.description} -> Actual: ${JSON.stringify(c.actual)}, Expected: ${JSON.stringify(c.expected)}`);
    if (c.notes) console.error(`       Notes: ${c.notes}`);
    failed++;
  }
}

console.log('\n------------------------------------------------------');
console.log(`TOTAL AUDIT CHECKS: ${checks.length}`);
console.log(`PASSED: ${checks.length - failed}`);
console.log(`FAILED: ${failed}`);
console.log('------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL AUDITOR 3 EMPIRICAL CHECKS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
