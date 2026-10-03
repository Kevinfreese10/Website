import fs from 'fs';
import path from 'path';
import { CITIES_DATA } from '../src/lib/cities';
import { industries } from '../src/lib/industries';

const ROOT_DIR = path.resolve(__dirname, '..');

interface AuditResult {
  category: string;
  item: string;
  details: string;
  value: any;
  passed: boolean;
}

const results: AuditResult[] = [];

function record(category: string, item: string, details: string, value: any, passed: boolean) {
  results.push({ category, item, details, value, passed });
}

// 1. Audit the 29 Previously Over-60 Titles
console.log('=== AUDITING 29 PREVIOUSLY FAILING TITLES ===');

// 3 Calculators
const calcChecks = [
  { slug: 'capital-gains-tax-calculator', file: 'src/app/calculators/capital-gains-tax-calculator/layout.tsx' },
  { slug: 'provisional-tax-estimator', file: 'src/app/calculators/provisional-tax-estimator/layout.tsx' },
  { slug: 'sbc-tax-estimator', file: 'src/app/calculators/sbc-tax-estimator/layout.tsx' },
];

for (const c of calcChecks) {
  const fullPath = path.join(ROOT_DIR, c.file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const m = content.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]/) || content.match(/title:\s*['"`]([^'"`]+)['"`]/);
  const title = m ? m[1] : '';
  const len = title.length;
  const passed = len <= 60 && len >= 45;
  record('29-Title-Fix', `/calculators/${c.slug}`, `Rendered title: "${title}" (${len} chars)`, len, passed);
}

// 14 Cities
for (const [key, city] of Object.entries(CITIES_DATA)) {
  const fullTitle = `${city.metaTitle} | My Accountant`;
  const len = fullTitle.length;
  const passed = len <= 60 && len >= 45;
  record('29-Title-Fix', `/accountant-${city.slug}`, `Rendered title: "${fullTitle}" (${len} chars)`, len, passed);
}

// 9 Industries
const indKeys = [
  'construction',
  'hospitality',
  'healthcare-medical-practices',
  'ecommerce-online-sellers',
  'professional-services',
  'influencers',
  'freelancers',
  'restaurants',
  'ecommerce',
];

for (const key of indKeys) {
  const ind = (industries as any)[key];
  const title = ind ? (ind.metaTitle || ind.title) : '';
  const len = title.length;
  const passed = len <= 60 && len >= 45;
  record('29-Title-Fix', `/industries/${key}`, `Rendered title: "${title}" (${len} chars)`, len, passed);
}

// 3 Service Pages
const serviceChecks = [
  { route: '/paye-compliance', file: 'src/app/paye-compliance/page.tsx' },
  { route: '/management-accounts', file: 'src/app/management-accounts/page.tsx' },
  { route: '/remission-of-fines', file: 'src/app/remission-of-fines/page.tsx' },
];

for (const s of serviceChecks) {
  const fullPath = path.join(ROOT_DIR, s.file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const m = content.match(/defaults(?:\s*:\s*Metadata)?\s*=\s*\{[\s\S]*?title:\s*['"`]([^'"`]+)['"`]/) ||
            content.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]/) ||
            content.match(/title:\s*['"`]([^'"`]+)['"`]/);
  let title = m ? m[1] : '';
  // Check if getStaticPageMetadata is used
  // In paye-compliance, management-accounts, remission-of-fines, getStaticPageMetadata('...', defaults) is used.
  // defaults.title is already the absolute title!
  const len = title.length;
  const passed = len <= 60 && len >= 45;
  record('29-Title-Fix', s.route, `Rendered title: "${title}" (${len} chars)`, len, passed);
}

// 2. Audit Target Titles strictly within [45, 58] chars
console.log('=== AUDITING TARGET TITLES [45, 58] ===');
const targetPages = [
  { path: 'src/app/sars-turnover-tax-registration/page.tsx', route: '/sars-turnover-tax-registration' },
  { path: 'src/app/ai-accountant/page.tsx', route: '/ai-accountant' },
  { path: 'src/app/blog/new-vat-registration-thresholds-south-africa-2026/page.tsx', route: '/blog/new-vat-registration-thresholds-south-africa-2026' },
  { path: 'src/app/sars-tax-representative-appointment/page.tsx', route: '/sars-tax-representative-appointment' },
  { path: 'src/app/tax-glossary/page.tsx', route: '/tax-glossary' },
  { path: 'src/app/outsourcing-vs-hiring/page.tsx', route: '/outsourcing-vs-hiring' },
];

for (const tp of targetPages) {
  const content = fs.readFileSync(path.join(ROOT_DIR, tp.path), 'utf-8');
  const absMatch = content.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]/);
  const plainMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
  let rendered = '';
  if (absMatch) {
    rendered = absMatch[1];
  } else if (plainMatch) {
    rendered = plainMatch[1];
    if (!rendered.endsWith(' | My Accountant')) {
      rendered = `${rendered} | My Accountant`;
    }
  }
  const len = rendered.length;
  const passed = len >= 45 && len <= 58;
  record('Target-Titles', tp.route, `Rendered: "${rendered}" (${len} chars)`, len, passed);
}

// 3. Audit Target Meta Descriptions strictly within [140, 158] chars
console.log('=== AUDITING TARGET DESCRIPTIONS [140, 158] ===');
const descChecks = [
  { path: 'src/app/outsourcing-vs-hiring/page.tsx', route: '/outsourcing-vs-hiring' },
  { path: 'src/app/ai-accountant/page.tsx', route: '/ai-accountant' },
  { path: 'src/app/page.tsx', route: '/' },
];

for (const dc of descChecks) {
  const content = fs.readFileSync(path.join(ROOT_DIR, dc.path), 'utf-8');
  const m = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
  const desc = m ? m[1] : '';
  const len = desc.length;
  const passed = len >= 140 && len <= 158;
  record('Target-Descriptions', dc.route, `Description: "${desc}" (${len} chars)`, len, passed);
}

const smeDesc = (industries as any).sme?.metaDescription || (industries as any).sme?.description || '';
record('Target-Descriptions', '/industries/sme', `Description len: ${smeDesc.length}`, smeDesc.length, smeDesc.length >= 140 && smeDesc.length <= 158);

const constrDesc = (industries as any).construction?.metaDescription || (industries as any).construction?.description || '';
record('Target-Descriptions', '/industries/construction', `Description len: ${constrDesc.length}`, constrDesc.length, constrDesc.length >= 140 && constrDesc.length <= 158);

// 4. Content Expansion Word Counts & H2 Counts
console.log('=== AUDITING CONTENT EXPANSION & H2 COUNTS ===');
function extractWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
}

function getPageWordsAndH2(relPath: string): { words: number; h2Count: number } {
  let content = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf-8');
  // Check client components
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

  const h2Count = (content.match(/<h2[\s>]/gi) || []).length;
  const stripped = content
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/className=["'][^"']*["']/g, ' ')
    .replace(/style=\{\{[^}]*\}\}/g, ' ');
  const words = extractWords(stripped);
  return { words, h2Count };
}

const servicePages = [
  { name: 'UIF Compliance', path: 'src/app/uif-compliance/page.tsx', route: '/uif-compliance' },
  { name: 'Payroll Administration', path: 'src/app/payroll-administration/page.tsx', route: '/payroll-administration' },
  { name: 'PAYE Compliance', path: 'src/app/paye-compliance/page.tsx', route: '/paye-compliance' },
  { name: 'Management Accounts', path: 'src/app/management-accounts/page.tsx', route: '/management-accounts' },
  { name: 'Remission of Fines', path: 'src/app/remission-of-fines/page.tsx', route: '/remission-of-fines' },
];

for (const sp of servicePages) {
  const { words, h2Count } = getPageWordsAndH2(sp.path);
  record('Service-Content-Depth', `${sp.route} (words)`, `${words} words (min 750)`, words, words >= 750);
  record('Service-Content-Depth', `${sp.route} (h2)`, `${h2Count} H2s (min 5)`, h2Count, h2Count >= 5);
}

// 7 Industry Profiles
const reqInd = ['sme', 'construction', 'hospitality', 'healthcare-medical-practices', 'ecommerce-online-sellers', 'professional-services', 'influencers'];
function objectWords(obj: any): number {
  let text = '';
  function col(v: any) {
    if (typeof v === 'string') text += ' ' + v;
    else if (Array.isArray(v)) v.forEach(col);
    else if (v && typeof v === 'object') Object.values(v).forEach(col);
  }
  col(obj);
  return extractWords(text);
}

for (const ik of reqInd) {
  const prof = (industries as any)[ik];
  const w = prof ? objectWords(prof) : 0;
  record('Industry-Profile-Depth', `/industries/${ik}`, `${w} words (min 701)`, w, w > 700);
}

// 5. Typo Sanitation
console.log('=== AUDITING TYPO SANITATION ===');
const mgmtAcc = fs.readFileSync(path.join(ROOT_DIR, 'src/app/management-accounts/page.tsx'), 'utf-8');
const hasHashAccounts = mgmtAcc.includes('Management #Accounts');
const mgmtHeadingsHash = (mgmtAcc.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) || []).some((h) => {
  const clean = h.replace(/<[^>]+>/g, '').trim();
  return clean.includes('#');
});
record('Typo-Sanitation', '/management-accounts', 'No # in headings', { hasHashAccounts, mgmtHeadingsHash }, !hasHashAccounts && !mgmtHeadingsHash);

const payrollAcc = fs.readFileSync(path.join(ROOT_DIR, 'src/app/payroll-administration/page.tsx'), 'utf-8');
const hasHashPayroll = payrollAcc.includes('Payroll #Administration');
const payrollHeadingsHash = (payrollAcc.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) || []).some((h) => {
  const clean = h.replace(/<[^>]+>/g, '').trim();
  return clean.includes('#');
});
record('Typo-Sanitation', '/payroll-administration', 'No # in headings', { hasHashPayroll, payrollHeadingsHash }, !hasHashPayroll && !payrollHeadingsHash);

// Summary Output
console.log('\n========================================');
console.log('RETEST HARNESS RESULTS:');
console.log('========================================');
let failedCount = 0;
for (const r of results) {
  if (!r.passed) {
    console.error(`❌ [FAIL] [${r.category}] ${r.item}: ${r.details}`);
    failedCount++;
  } else {
    console.log(`✅ [PASS] [${r.category}] ${r.item}: ${r.details}`);
  }
}

console.log(`\nTotal Checks: ${results.length}, Passed: ${results.length - failedCount}, Failed: ${failedCount}`);
if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('ALL RETEST ASSERTIONS PASSED WITH 100% COMPLIANCE!');
}
