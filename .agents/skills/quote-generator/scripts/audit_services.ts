import { getAdminDb } from '../../../../src/lib/firebase-admin';

async function listAll() {
  const db = getAdminDb();
  const snap = await db.collection('services').get();
  console.log(`Total services in catalog: ${snap.size}`);

  const categories: Record<string, Array<{ title: string; price: number; slug: string }>> = {};

  snap.docs.forEach(d => {
    const data = d.data();
    const cat = data.category || 'Uncategorized';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({
      title: data.title || data.name || 'Untitled',
      price: Number(data.price) || 0,
      slug: data.slug || d.id
    });
  });

  for (const [cat, items] of Object.entries(categories)) {
    console.log(`\n=== Category: ${cat} (${items.length} items) ===`);
    items.forEach(i => console.log(`  • ${i.title.padEnd(45)} | R ${i.price.toLocaleString().padStart(8)} | /products/${i.slug}`));
  }
}

listAll().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
