import { getAdminDb } from '../../../../src/lib/firebase-admin';

interface ServiceRecord {
  id: string;
  title: string;
  price: number;
  slug: string;
  category?: string;
  turnaroundTime?: string;
  shortDescription?: string;
  description?: string;
}

async function searchServices(query: string): Promise<ServiceRecord[]> {
  const db = getAdminDb();
  const snap = await db.collection('services').get();

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matched: ServiceRecord[] = [];

  snap.docs.forEach(doc => {
    const data = doc.data();
    const title = String(data.title || data.name || '');
    const slug = String(data.slug || doc.id);
    const category = String(data.category || '');
    const description = String(data.shortDescription || data.description || '');

    const haystack = `${title} ${slug} ${category} ${description}`.toLowerCase();
    const matchesAll = terms.every(t => haystack.includes(t));

    if (matchesAll) {
      matched.push({
        id: doc.id,
        title,
        price: Number(data.price) || 0,
        slug,
        category,
        turnaroundTime: data.turnaroundTime || data.estimatedDays || 'N/A',
        shortDescription: description.slice(0, 120)
      });
    }
  });

  return matched.sort((a, b) => a.title.localeCompare(b.title));
}

async function main() {
  const query = process.argv.slice(2).join(' ').trim();

  if (!query) {
    console.error('Usage: npx tsx scripts/lookup_price.ts <keyword>');
    console.error('Example: npx tsx scripts/lookup_price.ts npc');
    console.error('         npx tsx scripts/lookup_price.ts "vat registration"');
    process.exit(1);
  }

  console.log(`\nSearching Firestore 'services' collection for: "${query}"...\n`);
  const results = await searchServices(query);

  if (results.length === 0) {
    console.log(`❌ No services found matching "${query}".`);
    console.log(`Tip: Try a broader keyword (e.g. 'tax', 'company', 'registration').\n`);
    process.exit(0);
  }

  console.log(`Found ${results.length} matching service(s):\n`);
  console.log('='.repeat(90));
  console.log(
    'TITLE'.padEnd(42) +
    'PRICE (ZAR)'.padEnd(14) +
    'TURNAROUND'.padEnd(16) +
    'URL PATH'
  );
  console.log('-'.repeat(90));

  results.forEach(s => {
    const formattedPrice = `R ${s.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
    const url = `/products/${s.slug}`;
    console.log(
      s.title.slice(0, 40).padEnd(42) +
      formattedPrice.padEnd(14) +
      s.turnaroundTime.slice(0, 14).padEnd(16) +
      url
    );
  });

  console.log('='.repeat(90));
  console.log('\nMandatory Quoting Rule: Quote the EXACT title, price, and URL shown above.\n');
}

main().catch(err => {
  console.error('Fatal error during price lookup:', err);
  process.exit(1);
});
