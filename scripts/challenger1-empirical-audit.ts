import fs from 'fs';
import path from 'path';
import { industries } from '../src/lib/industries';
import { CITIES_DATA } from '../src/lib/cities';

const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to extract words
function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;
}

function extractRenderedWords(source: string): number {
  const stripped = source
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/className=["'][^"']*["']/g, ' ')
    .replace(/style=\{\{[^}]*\}\}/g, ' ');
  return countWords(stripped);
}

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
  return countWords(combinedText);
}

function getFullPageSource(pageRelPath: string): string {
  const fullPath = path.join(ROOT_DIR, pageRelPath);
  if (!fs.existsSync(fullPath)) return '';
  let content = fs.readFileSync(fullPath, 'utf-8');

  // Follow client imports
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
 * Extracts and computes the rendered title for a Next.js App Router file.
 */
function extractAndComputeRenderedTitle(filePath: string): {
  rawTitle?: string;
  isAbsolute: boolean;
  usesStaticSeoHelper: boolean;
  renderedTitle: string;
  description?: string;
} {
  if (!fs.existsSync(filePath)) return { isAbsolute: false, usesStaticSeoHelper: false, renderedTitle: '' };
  const content = fs.readFileSync(filePath, 'utf-8');

  let rawTitle: string | undefined;
  let isAbsolute = false;
  let usesStaticSeoHelper = false;
  let description: string | undefined;

  // Check if getStaticPageMetadata is used
  const usesStaticPageMetadata = content.includes('getStaticPageMetadata(');
  if (usesStaticPageMetadata) {
    usesStaticSeoHelper = true;
    isAbsolute = true; // getStaticPageMetadata always returns { absolute: title }
  }

  // Absolute title: title: { absolute: "..." }
  const absoluteTitleMatch = content.match(/title:\s*\{\s*absolute:\s*['"`]([^'"`]+)['"`]\s*\}/);
  if (absoluteTitleMatch) {
    rawTitle = absoluteTitleMatch[1];
    isAbsolute = true;
  } else {
    // Plain string title: title: "..."
    // If inside defaults object for getStaticPageMetadata, e.g. defaults: Metadata = { title: "..." }
    const defaultsTitleMatch = content.match(/defaults(?:\s*:\s*Metadata)?\s*=\s*\{[\s\S]*?title:\s*['"`]([^'"`]+)['"`]/);
    if (defaultsTitleMatch) {
      rawTitle = defaultsTitleMatch[1];
    } else {
      const plainTitleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
      if (plainTitleMatch) {
        rawTitle = plainTitleMatch[1];
      }
    }
  }

  const descMatch = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
  if (descMatch) {
    description = descMatch[1];
  }

  // Compute rendered title
  let renderedTitle = '';
  if (rawTitle) {
    if (isAbsolute) {
      renderedTitle = rawTitle;
    } else {
      // Plain string title with root layout template '%s | My Accountant'
      if (rawTitle.endsWith(' | My Accountant')) {
        // If it already ends with ' | My Accountant', Next.js template would duplicate it unless absolute
        renderedTitle = `${rawTitle} | My Accountant`;
      } else {
        renderedTitle = `${rawTitle} | My Accountant`;
      }
    }
  }

  return { rawTitle, isAbsolute, usesStaticSeoHelper, renderedTitle, description };
}

async function runAudit() {
  console.log('================================================================');
  console.log('CHALLENGER 1 EMPIRICAL AUDIT SUITE FOR SITE-WIDE OVERHAUL');
  console.log('================================================================\n');

  let allPassed = true;
  const failureReasons: string[] = [];

  // ===========================================================================
  // TEST 1: Word Count & Section Stress Test
  // ===========================================================================
  console.log('--- TEST 1: Word Count & Section Stress Test ---');
  const servicePages = [
    { name: 'UIF Compliance', path: 'src/app/uif-compliance/page.tsx', route: '/uif-compliance' },
    { name: 'Payroll Administration', path: 'src/app/payroll-administration/page.tsx', route: '/payroll-administration' },
    { name: 'PAYE Compliance', path: 'src/app/paye-compliance/page.tsx', route: '/paye-compliance' },
    { name: 'Management Accounts', path: 'src/app/management-accounts/page.tsx', route: '/management-accounts' },
    { name: 'Remission of Fines', path: 'src/app/remission-of-fines/page.tsx', route: '/remission-of-fines' },
  ];

  for (const page of servicePages) {
    const fullSource = getFullPageSource(page.path);
    const wordCount = extractRenderedWords(fullSource);
    const h2Matches = fullSource.match(/<h2[\s>]/gi) || [];
    const h2Count = h2Matches.length;

    console.log(`[Service Page] ${page.name} (${page.route}):`);
    console.log(`  - Rendered Words: ${wordCount} (Required >= 750)`);
    console.log(`  - <h2> Sections: ${h2Count} (Required >= 5)`);

    if (wordCount < 750) {
      const err = `FAIL: ${page.name} word count ${wordCount} is below required 750!`;
      console.error(`  ❌ ${err}`);
      failureReasons.push(err);
      allPassed = false;
    } else {
      console.log(`  ✅ Word count check PASSED`);
    }

    if (h2Count < 5) {
      const err = `FAIL: ${page.name} <h2> count ${h2Count} is below required 5!`;
      console.error(`  ❌ ${err}`);
      failureReasons.push(err);
      allPassed = false;
    } else {
      console.log(`  ✅ <h2> count check PASSED`);
    }
  }

  const industryKeys = [
    'sme',
    'construction',
    'hospitality',
    'healthcare-medical-practices',
    'ecommerce-online-sellers',
    'professional-services',
    'influencers',
  ] as const;

  console.log('\n[Industry Profiles Word Counts]');
  for (const key of industryKeys) {
    const profile = (industries as Record<string, any>)[key];
    if (!profile) {
      const err = `FAIL: Industry profile '${key}' missing in src/lib/industries.ts!`;
      console.error(`  ❌ ${err}`);
      failureReasons.push(err);
      allPassed = false;
      continue;
    }
    const profileWordCount = extractObjectWordCount(profile);
    console.log(`[Industry Profile] ${key}:`);
    console.log(`  - Profile Object Words: ${profileWordCount} (Required > 700)`);

    if (profileWordCount <= 700) {
      const err = `FAIL: Industry profile '${key}' word count ${profileWordCount} is <= 700!`;
      console.error(`  ❌ ${err}`);
      failureReasons.push(err);
      allPassed = false;
    } else {
      console.log(`  ✅ Industry profile word count check PASSED`);
    }
  }

  // ===========================================================================
  // TEST 2: Typographical & Character Artifact Test (# in headings)
  // ===========================================================================
  console.log('\n--- TEST 2: Typographical & Character Artifact Test ---');
  console.log('Scanning all .tsx and .ts files under src/app/ and src/components/ for "#" inside <h1, <h2, <h3 tags...');

  function scanDirForHeadingsWithHash(dir: string, results: { file: string; line: number; match: string }[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirForHeadingsWithHash(fullPath, results);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const headingRegex = /<h([1-3])(\s+[^>]*)?>([\s\S]*?)<\/h\1>/gi;
        let match;
        while ((match = headingRegex.exec(content)) !== null) {
          const innerContent = match[3];
          const textOnly = innerContent.replace(/<[^>]+>/g, '').trim();
          if (textOnly.includes('#')) {
            const upToMatch = content.slice(0, match.index);
            const lineNum = upToMatch.split('\n').length;
            results.push({
              file: path.relative(ROOT_DIR, fullPath),
              line: lineNum,
              match: match[0],
            });
          }
        }
      }
    }
  }

  const headingArtifacts: { file: string; line: number; match: string }[] = [];
  scanDirForHeadingsWithHash(path.join(ROOT_DIR, 'src/app'), headingArtifacts);
  scanDirForHeadingsWithHash(path.join(ROOT_DIR, 'src/components'), headingArtifacts);

  console.log(`Total heading tags with '#' in content: ${headingArtifacts.length}`);
  for (const item of headingArtifacts) {
    console.log(`  Found in ${item.file}:${item.line} -> ${item.match.slice(0, 100)}`);
    // Check if this is an issue
    // E.g. wallet-actions.ts email HTML "Order #${orderId}"
    if (!item.file.includes('wallet-actions.ts')) {
      const err = `FAIL: Illegal '#' character in heading in ${item.file}:${item.line}`;
      failureReasons.push(err);
      allPassed = false;
    }
  }
  if (headingArtifacts.length === 0 || (headingArtifacts.length === 1 && headingArtifacts[0].file.includes('wallet-actions.ts'))) {
    console.log('  ✅ Zero user-facing heading tags with illegal "#" character found!');
  }

  // ===========================================================================
  // TEST 3: Title & Description Mathematical Boundary Test
  // ===========================================================================
  console.log('\n--- TEST 3: Title & Description Mathematical Boundary Test ---');

  // A: Target Titles: Must be between 45 and 58 characters
  const targetPages = [
    { path: 'src/app/sars-turnover-tax-registration/page.tsx', route: '/sars-turnover-tax-registration' },
    { path: 'src/app/ai-accountant/page.tsx', route: '/ai-accountant' },
    { path: 'src/app/blog/new-vat-registration-thresholds-south-africa-2026/page.tsx', route: '/blog/new-vat-registration-thresholds-south-africa-2026' },
    { path: 'src/app/sars-tax-representative-appointment/page.tsx', route: '/sars-tax-representative-appointment' },
    { path: 'src/app/tax-glossary/page.tsx', route: '/tax-glossary' },
    { path: 'src/app/outsourcing-vs-hiring/page.tsx', route: '/outsourcing-vs-hiring' },
  ];

  console.log('[Target Page Titles in [45, 58] chars]');
  for (const target of targetPages) {
    const fullPath = path.join(ROOT_DIR, target.path);
    if (!fs.existsSync(fullPath)) {
      const err = `Target file not found: ${target.path}`;
      failureReasons.push(err);
      allPassed = false;
      continue;
    }
    const meta = extractAndComputeRenderedTitle(fullPath);
    const renderedTitle = meta.renderedTitle;
    const len = renderedTitle.length;
    console.log(`  ${target.route}: "${renderedTitle}" (${len} chars)`);

    if (len < 45 || len > 58) {
      const err = `FAIL: Target title for ${target.route} length ${len} is out of [45, 58] bounds!`;
      console.error(`  ❌ ${err}`);
      failureReasons.push(err);
      allPassed = false;
    } else {
      console.log(`  ✅ Within [45, 58] chars`);
    }
  }

  // B: All 13 Calculator Layouts
  console.log('\n[13 Interactive Calculator Layouts Title Lengths]');
  const calcDir = path.join(ROOT_DIR, 'src/app/calculators');
  if (fs.existsSync(calcDir)) {
    const calcFolders = fs.readdirSync(calcDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const folder of calcFolders) {
      const layoutPath = path.join(calcDir, folder.name, 'layout.tsx');
      if (fs.existsSync(layoutPath)) {
        const meta = extractAndComputeRenderedTitle(layoutPath);
        console.log(`  /calculators/${folder.name}: "${meta.renderedTitle}" (${meta.renderedTitle.length} chars)`);
        if (meta.renderedTitle.length > 60) {
          const err = `FAIL: Calculator ${folder.name} rendered title length ${meta.renderedTitle.length} > 60: "${meta.renderedTitle}"`;
          failureReasons.push(err);
          allPassed = false;
          console.error(`  ❌ ${err}`);
        } else {
          console.log(`  ✅ <= 60 chars`);
        }
      } else {
        const err = `FAIL: Missing layout.tsx for calculator ${folder.name}`;
        failureReasons.push(err);
        allPassed = false;
      }
    }
  }

  // C: All 14 City Landing Pages
  console.log('\n[14 City Landing Pages Title Lengths]');
  for (const [key, city] of Object.entries(CITIES_DATA)) {
    const fullTitle = `${city.metaTitle} | My Accountant`;
    console.log(`  /accountant-${city.slug}: "${fullTitle}" (${fullTitle.length} chars)`);
    if (fullTitle.length > 60) {
      const err = `FAIL: City ${key} title length ${fullTitle.length} > 60: "${fullTitle}"`;
      failureReasons.push(err);
      allPassed = false;
      console.error(`  ❌ ${err}`);
    } else {
      console.log(`  ✅ <= 60 chars`);
    }
  }

  // D: All 7 Industry Pages
  console.log('\n[7 Industry Pages Title Lengths]');
  for (const [key, ind] of Object.entries(industries)) {
    const title = ind.metaTitle || ind.title;
    console.log(`  /industries/${key}: "${title}" (${title.length} chars)`);
    if (title.length > 60) {
      const err = `FAIL: Industry ${key} title length ${title.length} > 60: "${title}"`;
      failureReasons.push(err);
      allPassed = false;
      console.error(`  ❌ ${err}`);
    } else {
      console.log(`  ✅ <= 60 chars`);
    }
  }

  // E: Core 5 Service Pages
  console.log('\n[Core 5 Service Pages Title Lengths]');
  for (const page of servicePages) {
    const fullPath = path.join(ROOT_DIR, page.path);
    const meta = extractAndComputeRenderedTitle(fullPath);
    console.log(`  ${page.route}: "${meta.renderedTitle}" (${meta.renderedTitle.length} chars)`);
    if (meta.renderedTitle.length > 60) {
      const err = `FAIL: Service page ${page.route} title length ${meta.renderedTitle.length} > 60: "${meta.renderedTitle}"`;
      failureReasons.push(err);
      allPassed = false;
      console.error(`  ❌ ${err}`);
    } else {
      console.log(`  ✅ <= 60 chars`);
    }
  }

  // F: No star symbol (★) in homepage title or metadata
  console.log('\n[Homepage Title & Metadata Symbol Hygiene (No ★)]');
  const homePath = path.join(ROOT_DIR, 'src/app/page.tsx');
  const homeMeta = extractAndComputeRenderedTitle(homePath);
  console.log(`  Homepage default title: "${homeMeta.renderedTitle}" (${homeMeta.renderedTitle.length} chars)`);
  console.log(`  Homepage default description: "${homeMeta.description}"`);

  if (homeMeta.renderedTitle && homeMeta.renderedTitle.includes('★')) {
    const err = 'FAIL: Homepage title contains star symbol (★)!';
    failureReasons.push(err);
    allPassed = false;
    console.error(`  ❌ ${err}`);
  } else {
    console.log('  ✅ Homepage default title does not contain ★');
  }

  if (homeMeta.renderedTitle.length > 60) {
    const err = `FAIL: Homepage title length ${homeMeta.renderedTitle.length} > 60!`;
    failureReasons.push(err);
    allPassed = false;
    console.error(`  ❌ ${err}`);
  } else {
    console.log(`  ✅ Homepage title <= 60 chars`);
  }

  // G: Meta Descriptions strictly within [140, 158] chars
  console.log('\n[Meta Descriptions Strictly in [140, 158] chars]');
  const descChecks = [
    { name: '/outsourcing-vs-hiring', path: 'src/app/outsourcing-vs-hiring/page.tsx' },
    { name: '/ai-accountant', path: 'src/app/ai-accountant/page.tsx' },
    { name: 'homepage (src/app/page.tsx)', path: 'src/app/page.tsx' },
  ];

  for (const check of descChecks) {
    const meta = extractAndComputeRenderedTitle(path.join(ROOT_DIR, check.path));
    const desc = meta.description || '';
    const len = desc.length;
    console.log(`  ${check.name}: length = ${len}`);
    if (len < 140 || len > 158) {
      const err = `FAIL: ${check.name} meta description length ${len} out of [140, 158] bounds! ("${desc}")`;
      failureReasons.push(err);
      allPassed = false;
      console.error(`  ❌ ${err}`);
    } else {
      console.log(`  ✅ ${check.name} description in [140, 158]`);
    }
  }

  const smeDesc = industries.sme?.metaDescription || industries.sme?.description || '';
  console.log(`  /industries/sme: length = ${smeDesc.length}`);
  if (smeDesc.length < 140 || smeDesc.length > 158) {
    const err = `FAIL: /industries/sme description length ${smeDesc.length} out of [140, 158] bounds!`;
    failureReasons.push(err);
    allPassed = false;
    console.error(`  ❌ ${err}`);
  } else {
    console.log(`  ✅ /industries/sme description in [140, 158]`);
  }

  const constructionDesc = industries.construction?.metaDescription || industries.construction?.description || '';
  console.log(`  /industries/construction: length = ${constructionDesc.length}`);
  if (constructionDesc.length < 140 || constructionDesc.length > 158) {
    const err = `FAIL: /industries/construction description length ${constructionDesc.length} out of [140, 158] bounds!`;
    failureReasons.push(err);
    allPassed = false;
    console.error(`  ❌ ${err}`);
  } else {
    console.log(`  ✅ /industries/construction description in [140, 158]`);
  }

  // Summary
  console.log('\n================================================================');
  if (allPassed) {
    console.log('FINAL AUDIT RESULT: ALL EMPIRICAL TESTS PASSED! ✅');
  } else {
    console.log('FINAL AUDIT RESULT: FAILURES DETECTED! ❌');
    for (const reason of failureReasons) {
      console.log(`  - ${reason}`);
    }
  }
  console.log('================================================================');
}

runAudit().catch(console.error);
