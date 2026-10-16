import { getAdminDb } from '../../../../src/lib/firebase-admin';
import { serviceWarnings } from '../../../../src/lib/quote-agent/catalog';

export interface ServiceRecord {
  id: string;
  title: string;
  price: number;
  slug: string;
  category?: string;
  turnaroundTime?: string;
  shortDescription?: string;
  description?: string;
  matchedBy?: 'exact' | 'title' | 'alias' | 'description' | 'category';
  suggestedAddons?: string[];
  url: string;
  isPriceTbc: boolean;
  available: boolean;
  priceValidUntil?: string;
  whatsIncluded: string[];
  clientRequirements: string[];
  prerequisites: string[];
  requiredServices: Array<{ title: string; price: number; slug: string }>;
  warnings: string[];
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(v => (typeof v === 'string' ? v : v && typeof v === 'object' ? (v as any).label || (v as any).text || (v as any).title || '' : ''))
    .map(s => String(s).trim())
    .filter(Boolean);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Whole-word/phrase match so short aliases ('vat', 'pty', 'pin', 'import') don't fire inside 'private', 'empty', 'shipping', 'important'.
export function aliasMatches(query: string, aliasKey: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(aliasKey)}($|[^a-z0-9])`).test(query);
}

// Master Synonym & Alias Dictionary for South African Accounting, Tax, & Compliance
export const SERVICE_ALIASES: Record<string, string[]> = {
  // NCCA & Contract Cleaning
  'cleaning': ['ncca-registration-services', 'nbc-provident-fund-company-registration'],
  'cleaner': ['ncca-registration-services', 'nbc-provident-fund-company-registration'],
  'ncca': ['ncca-registration-services', 'nbc-provident-fund-company-registration'],
  'bccci': ['nbc-provident-fund-company-registration', 'ncca-registration-services'],
  'contract cleaning': ['ncca-registration-services', 'nbc-provident-fund-company-registration'],

  // COIDA / Compensation Fund / Good Standing
  'coida': ['coida-registration', 'coida-renewal', 'uif-registration', 'coida-nature-of-business-change'],
  'letter of good standing': ['coida-renewal', 'coida-registration'],
  'good standing': ['coida-renewal', 'coida-registration', 'tax-clearance-pin'],
  'workmans comp': ['coida-registration', 'coida-renewal'],
  'compensation commissioner': ['coida-registration', 'coida-renewal'],
  'compensation fund': ['coida-registration', 'coida-renewal'],

  // Tax Clearance & TCS
  'tax clearance': ['tax-clearance-pin', 'tax-clearance-certificate', 'tax-representative-appointment'],
  'tcs': ['tax-clearance-pin', 'tax-clearance-certificate'],
  'pin': ['tax-clearance-pin'],
  'tcc': ['tax-clearance-certificate', 'tax-clearance-pin'],

  // VAT
  'vat': ['vat-registration', 'vat201-for-trading-companies', 'vat201-return-submission-nil', 'periodic-vat-calculation-and-submission', 'vat-deregistration'],
  'vat201': ['vat201-for-trading-companies', 'vat201-return-submission-nil'],
  'vat return': ['vat201-for-trading-companies', 'vat201-return-submission-nil'],

  // SARS Profile & Tax Representative
  'tax rep': ['tax-representative-appointment'],
  'efiling': ['tax-representative-appointment', 'retrieve-existing-sars-tax-number'],

  // Income Tax Returns
  'itr14': ['itr14-company-income-tax-return-trading-entities', 'company-income-tax-return-itr14-nil'],
  'company tax return': ['itr14-company-income-tax-return-trading-entities', 'company-income-tax-return-itr14-nil'],
  'itr12': ['individual-income-tax-return-itr12-simple', 'complex-individual-income-tax-return-itr12', 'sole-proprietor-income-tax-return-itr12'],
  'personal tax': ['individual-income-tax-return-itr12-simple', 'complex-individual-income-tax-return-itr12'],
  'irp6': ['provisional-tax-return-irp6-trading', 'provisional-tax-return-irp6-nil'],
  'provisional tax': ['provisional-tax-return-irp6-trading', 'provisional-tax-return-irp6-nil', 'provisional-tax-calculation'],
  'registered representative': ['tax-representative-appointment'],

  // Customs / Import / Export
  'customs': ['import-licence', 'export-licence', 'customs-certificate-of-origin', 'remover-of-goods-in-bond-licence-application', 'clearing-agent-licence'],
  'import': ['import-licence', 'export-licence'],
  'export': ['export-licence', 'import-licence', 'customs-certificate-of-origin'],
  'import export': ['import-licence', 'export-licence', 'customs-certificate-of-origin'],

  // NCR & Credit Provider
  'ncr': ['ncr-registration', 'ncr-form-39-annual-compliance-submission', 'ncr-form-40-application-compliance'],
  'credit provider': ['ncr-registration', 'ncr-form-40-application-compliance'],
  'money lender': ['ncr-registration', 'ncr-form-40-application-compliance'],

  // CIDB / Construction
  'cidb': ['cidb-registration', 'cidb-annual-renewal', 'cidb-3-year-renewal', 'cidb-upgrades-grades-2-9'],
  'construction': ['cidb-registration', 'nhbrc-registration', 'electrical-contractor-registration-doel'],
  'builder': ['nhbrc-registration', 'cidb-registration'],
  'nhbrc': ['nhbrc-registration'],

  // Entity Registrations
  'company': ['private-company-registration', 'tender-ready-company-registration-package', 'external-company-registration'],
  'pty': ['private-company-registration', 'tender-ready-company-registration-package'],
  'npc': ['non-profit-company-registration', 'npo-registration', 'pbo-registration'],
  'npo': ['npo-registration', 'non-profit-company-registration', 'pbo-registration'],
  'pbo': ['pbo-registration', 'non-profit-company-registration'],
  'foreign': ['external-company-registration', 'registered-office-address-12-month-retainer', 'tax-representative-appointment'],
  'external company': ['external-company-registration', 'registered-office-address-12-month-retainer'],

  // Annual Financial Statements (AFS)
  'afs': ['annual-financial-statements-non-vat-registered', 'annual-financial-statements-for-vat-registered-businesses', 'annual-financial-statements-draft-and-sign-off-only'],
  'financials': ['annual-financial-statements-non-vat-registered', 'annual-financial-statements-for-vat-registered-businesses', 'management-accounts'],
  'financial statements': ['annual-financial-statements-non-vat-registered', 'annual-financial-statements-for-vat-registered-businesses'],

  // Accounting & Retainers
  'accounting': ['annual-financial-statements-non-vat-registered', 'management-accounts', 'provisional-tax-calculation'],
  'bookkeeping': ['periodic-vat-calculation-and-submission', 'management-accounts', 'annual-financial-statements-non-vat-registered'],

  // Payroll / EMP201 / UIF
  'payroll': ['emp201-submission-for-trading-companies', 'paye-registration', 'emp501-annual-reconciliation-for-trading-companies', 'uif-registration'],
  'uif': ['uif-registration', 'coida-registration', 'paye-registration'],
  'paye': ['paye-registration', 'emp201-submission-for-trading-companies'],

  // Property & Transport
  'property': ['property-practitioners-ppra-firm-registration'],
  'ppra': ['property-practitioners-ppra-firm-registration'],
  'estate agent': ['property-practitioners-ppra-firm-registration'],
  'transport': ['transport-operating-licence-application-form-1b', 'cross-border-road-transport-permit', 'traffic-register-number-trn'],
  'prdp': ['transport-operating-licence-application-form-1b', 'traffic-register-number-trn'],

  // Privacy & Governance
  'popi': ['popia-compliance-governance-pack', 'popia-information-officer-registration', 'paia-annual-report-submission'],
  'popia': ['popia-compliance-governance-pack', 'popia-information-officer-registration'],
  'paia': ['paia-annual-report-submission', 'popia-compliance-governance-pack'],
  'csos': ['csos-scheme-support-annual-return'],

  // Licences
  'liquor': ['liquor-licence-application-pack', 'food-business-certificate-of-acceptability-coa'],
  'firearm': ['firearm-application-pack-saps-517-271'],
  'food': ['food-business-certificate-of-acceptability-coa'],
  'solar': ['solar-sseg-grid-tie-registration']
};

export async function searchServices(query: string, options: { category?: string } = {}): Promise<ServiceRecord[]> {
  const db = getAdminDb();
  const snap = await db.collection('services').get();

  const cleanQuery = query.toLowerCase().trim();
  const terms = cleanQuery.split(/\s+/).filter(Boolean);

  // Check alias hits
  const aliasMatchedSlugs = new Set<string>();
  for (const [aliasKey, targetSlugs] of Object.entries(SERVICE_ALIASES)) {
    if (aliasMatches(cleanQuery, aliasKey)) {
      targetSlugs.forEach(s => aliasMatchedSlugs.add(s));
    }
  }

  const byId = new Map(snap.docs.map(d => [d.id, d.data()]));
  const results: Array<ServiceRecord & { score: number }> = [];
  const today = new Date().toISOString().slice(0, 10);

  snap.docs.forEach(doc => {
    const data = doc.data();
    const title = String(data.title || data.name || '');
    const slug = String(data.slug || doc.id);
    const category = String(data.category || '');
    const description = String(data.shortDescription || data.description || '');

    if (options.category && !category.toLowerCase().includes(options.category.toLowerCase())) {
      return;
    }

    const titleLower = title.toLowerCase();
    const slugLower = slug.toLowerCase();
    const descLower = description.toLowerCase();
    const catLower = category.toLowerCase();
    const haystack = `${titleLower} ${slugLower} ${catLower} ${descLower}`;

    // Score: exact (5) > every term in title (4) > alias (3) > every term anywhere (2) > some term in title (1)
    let matchType: ServiceRecord['matchedBy'] | null = null;
    let score = 0;

    // Terms must start a word ('vat' must not match 'private')
    const hasWord = (text: string, t: string) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}`).test(text);

    if (titleLower === cleanQuery || slugLower === cleanQuery) {
      matchType = 'exact'; score = 5;
    } else if (terms.every(t => hasWord(titleLower, t))) {
      matchType = 'title'; score = 4;
    } else if (aliasMatchedSlugs.has(slug) || aliasMatchedSlugs.has(doc.id)) {
      matchType = 'alias'; score = 3;
    } else if (terms.every(t => hasWord(haystack, t))) {
      matchType = 'description'; score = 2;
    } else if (terms.some(t => t.length > 2 && hasWord(titleLower, t))) {
      matchType = 'title'; score = 1;
    }

    if (!matchType) return;

    const price = Number(data.price) || 0;
    const isPriceTbc = data.isPriceTbc === true;
    const available = !data.availability || data.availability === 'in_stock';
    const priceValidUntil = data.priceValidUntilOverride ? String(data.priceValidUntilOverride) : undefined;
    const requiredServices = (Array.isArray(data.requiredProductIds) ? data.requiredProductIds : [])
      .map((id: string) => byId.get(id))
      .filter(Boolean)
      .map((r: any) => ({ title: String(r.title || r.name || ''), price: Number(r.price) || 0, slug: String(r.slug || '') }));

    // Shared with the cloud quote agent so both refuse exactly the same prices.
    const warnings: string[] = serviceWarnings(data, today);

    results.push({
      id: doc.id,
      title,
      price,
      slug,
      url: `https://www.myacc.co.za/products/${slug}`,
      category,
      turnaroundTime: data.turnaroundTime || data.estimatedDays || 'N/A',
      shortDescription: description.slice(0, 140),
      matchedBy: matchType,
      isPriceTbc,
      available,
      priceValidUntil,
      whatsIncluded: toTextList(data.whatsIncluded),
      clientRequirements: toTextList(data.clientRequirements),
      prerequisites: toTextList(data.prerequisites),
      requiredServices,
      warnings,
      score
    });
  });

  // Weak partial-title hits are only useful when nothing better matched
  const best = Math.max(0, ...results.map(r => r.score));
  return results
    .filter(r => best < 3 || r.score > 1)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .map(({ score, ...r }) => r);
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');
  const catIdx = args.indexOf('--category');
  const categoryFilter = catIdx !== -1 && catIdx + 1 < args.length ? args[catIdx + 1] : undefined;

  const queryTerms = args.filter((a, i) => a !== '--json' && a !== '--detail' && a !== '--category' && !(catIdx !== -1 && i === catIdx + 1));
  const showDetail = args.includes('--detail');
  const query = queryTerms.join(' ').trim();

  if (!query) {
    console.error('Usage: npx tsx scripts/lookup_price.ts <keyword> [--json] [--detail] [--category <cat>]');
    console.error('Examples:');
    console.error('  npx tsx scripts/lookup_price.ts cleaning');
    console.error('  npx tsx scripts/lookup_price.ts "letter of good standing"');
    console.error('  npx tsx scripts/lookup_price.ts vat --json');
    process.exit(1);
  }

  const results = await searchServices(query, { category: categoryFilter });

  if (isJson) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`\nSearching Firestore 'services' collection for: "${query}"...\n`);

  if (results.length === 0) {
    console.log(`❌ No services found matching "${query}".`);
    console.log(`Tip: Try synonyms (e.g. 'coida', 'tax', 'clearance', 'vat', 'company', 'ncca').\n`);
    process.exit(0);
  }

  console.log(`Found ${results.length} matching service(s):\n`);
  console.log('='.repeat(94));
  console.log(
    'TITLE'.padEnd(42) +
    'PRICE (ZAR)'.padEnd(14) +
    'TURNAROUND'.padEnd(16) +
    'MATCH'.padEnd(10) +
    'URL PATH'
  );
  console.log('-'.repeat(94));

  results.forEach(s => {
    const formattedPrice = s.isPriceTbc ? 'TBC' : `R ${s.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const url = `/products/${s.slug}`;
    console.log(
      s.title.slice(0, 40).padEnd(42) +
      formattedPrice.padEnd(14) +
      (s.turnaroundTime || 'N/A').slice(0, 14).padEnd(16) +
      (s.matchedBy || '').padEnd(10) +
      url
    );
    s.warnings.forEach(w => console.log(`    ⚠️  ${w}`));
    if (showDetail) {
      if (s.requiredServices.length) console.log(`    Requires: ${s.requiredServices.map(r => `${r.title} (R ${r.price})`).join('; ')}`);
      if (s.prerequisites.length) console.log(`    Prerequisites: ${s.prerequisites.join('; ')}`);
      if (s.whatsIncluded.length) console.log(`    Included: ${s.whatsIncluded.join('; ')}`);
      if (s.clientRequirements.length) console.log(`    Client must provide: ${s.clientRequirements.join('; ')}`);
    }
  });

  console.log('='.repeat(94));
  console.log('\nMandatory Quoting Rule: Quote the EXACT title, price, and URL shown above. Never quote a line with a ⚠️ warning.');
  if (!showDetail) console.log('Re-run with --detail for required services, inclusions and client requirements.\n');
}

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('lookup_price.ts'))) {
  main().catch(err => {
    console.error('Fatal error during price lookup:', err);
    process.exit(1);
  });
}
