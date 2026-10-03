import fs from 'fs';
import path from 'path';
import { CITIES_DATA } from '../src/lib/cities';
import { industries } from '../src/lib/industries';

const ROOT_DIR = path.resolve(__dirname, '..');

interface TitleFinding {
  source: string;
  route: string;
  renderedTitle: string;
  length: number;
}

const over60List: TitleFinding[] = [];
const allAuditedTitles: TitleFinding[] = [];

// 1. Calculators
const calcDir = path.join(ROOT_DIR, 'src/app/calculators');
if (fs.existsSync(calcDir)) {
  for (const slug of fs.readdirSync(calcDir)) {
    const layoutFile = path.join(calcDir, slug, 'layout.tsx');
    if (fs.existsSync(layoutFile)) {
      const content = fs.readFileSync(layoutFile, 'utf-8');
      const absMatch = content.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]/);
      const plainMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
      const title = absMatch ? absMatch[1] : plainMatch ? plainMatch[1] : '';
      if (title) {
        const item = { source: `src/app/calculators/${slug}/layout.tsx`, route: `/calculators/${slug}`, renderedTitle: title, length: title.length };
        allAuditedTitles.push(item);
        if (title.length > 60) over60List.push(item);
      }
    }
  }
}

// 2. City Pages
for (const [key, city] of Object.entries(CITIES_DATA)) {
  const fullTitle = `${city.metaTitle} | My Accountant`;
  const item = { source: 'src/lib/cities.ts', route: `/accountant-${city.slug}`, renderedTitle: fullTitle, length: fullTitle.length };
  allAuditedTitles.push(item);
  if (fullTitle.length > 60) over60List.push(item);
}

// 3. Industry Pages
for (const [key, ind] of Object.entries(industries)) {
  const title = ind.metaTitle || ind.title;
  const item = { source: 'src/lib/industries.ts', route: `/industries/${key}`, renderedTitle: title, length: title.length };
  allAuditedTitles.push(item);
  if (title.length > 60) over60List.push(item);
}

// 4. Static Service Pages in src/app/
const staticServicePages = [
  'uif-compliance',
  'payroll-administration',
  'paye-compliance',
  'management-accounts',
  'remission-of-fines',
  'sars-turnover-tax-registration',
  'ai-accountant',
  'tax-glossary',
  'outsourcing-vs-hiring',
  'page.tsx', // homepage
];

for (const p of staticServicePages) {
  const filePath = p === 'page.tsx' ? path.join(ROOT_DIR, 'src/app/page.tsx') : path.join(ROOT_DIR, 'src/app', p, 'page.tsx');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const absMatch = content.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]/);
    const plainMatch = content.match(/defaults(?:\s*:\s*Metadata)?\s*=\s*\{[\s\S]*?title:\s*['"`]([^'"`]+)['"`]/) ||
                       content.match(/title:\s*['"`]([^'"`]+)['"`]/);
    let rendered = '';
    if (absMatch) {
      rendered = absMatch[1];
    } else if (plainMatch) {
      rendered = plainMatch[1];
      if (!rendered.endsWith(' | My Accountant') && !content.includes('getStaticPageMetadata')) {
        rendered = `${rendered} | My Accountant`;
      }
    }
    if (rendered) {
      const item = { source: filePath.replace(ROOT_DIR, '').replace(/^\\/, ''), route: p === 'page.tsx' ? '/' : `/${p}`, renderedTitle: rendered, length: rendered.length };
      allAuditedTitles.push(item);
      if (rendered.length > 60) over60List.push(item);
    }
  }
}

console.log(`Total Titles Audited: ${allAuditedTitles.length}`);
console.log(`Titles Exceeding 60 Characters: ${over60List.length}\n`);

console.log('--- TITLES EXCEEDING 60 CHARACTERS ---');
for (const item of over60List) {
  console.log(`[${item.length} chars] ${item.route} (${item.source}): "${item.renderedTitle}"`);
}
