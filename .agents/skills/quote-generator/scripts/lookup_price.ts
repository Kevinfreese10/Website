import { getAdminDb } from '../../../../src/lib/firebase-admin';

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
  'tax rep': ['tax-representative-appointment', 'sars-login-assistance-troubleshooting'],
  'efiling': ['tax-representative-appointment', 'sars-login-assistance-troubleshooting'],
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
    if (cleanQuery === aliasKey || terms.includes(aliasKey) || cleanQuery.includes(aliasKey)) {
      targetSlugs.forEach(s => aliasMatchedSlugs.add(s));
    }
  }

  const results: ServiceRecord[] = [];

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

    let matchType: ServiceRecord['matchedBy'] | null = null;

    if (titleLower === cleanQuery || slugLower === cleanQuery) {
      matchType = 'exact';
    } else if (aliasMatchedSlugs.has(slug) || aliasMatchedSlugs.has(doc.id)) {
      matchType = 'alias';
    } else if (terms.every(t => titleLower.includes(t))) {
      matchType = 'title';
    } else if (terms.every(t => haystack.includes(t))) {
      matchType = 'description';
    } else if (terms.some(t => titleLower.includes(t))) {
      matchType = 'title';
    }

    if (matchType) {
      results.push({
        id: doc.id,
        title,
        price: Number(data.price) || 0,
        slug,
        category,
        turnaroundTime: data.turnaroundTime || data.estimatedDays || 'N/A',
        shortDescription: description.slice(0, 140),
        matchedBy: matchType
      });
    }
  });

  // Sort priority: exact > alias > title > description
  const rank: Record<string, number> = {
    exact: 4,
    alias: 3,
    title: 2,
    description: 1,
    category: 1
  };

  return results.sort((a, b) => {
    const rankDiff = (rank[b.matchedBy || 'description'] || 0) - (rank[a.matchedBy || 'description'] || 0);
    if (rankDiff !== 0) return rankDiff;
    return a.title.localeCompare(b.title);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');
  const catIdx = args.indexOf('--category');
  const categoryFilter = catIdx !== -1 && catIdx + 1 < args.length ? args[catIdx + 1] : undefined;

  const queryTerms = args.filter(a => a !== '--json' && a !== '--category' && a !== categoryFilter);
  const query = queryTerms.join(' ').trim();

  if (!query) {
    console.error('Usage: npx tsx scripts/lookup_price.ts <keyword> [--json] [--category <cat>]');
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
    const formattedPrice = `R ${s.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
    const url = `/products/${s.slug}`;
    console.log(
      s.title.slice(0, 40).padEnd(42) +
      formattedPrice.padEnd(14) +
      (s.turnaroundTime || 'N/A').slice(0, 14).padEnd(16) +
      (s.matchedBy || '').padEnd(10) +
      url
    );
  });

  console.log('='.repeat(94));
  console.log('\nMandatory Quoting Rule: Quote the EXACT title, price, and URL shown above.\n');
}

if (require.main === module || (process.argv[1] && process.argv[1].endsWith('lookup_price.ts'))) {
  main().catch(err => {
    console.error('Fatal error during price lookup:', err);
    process.exit(1);
  });
}
