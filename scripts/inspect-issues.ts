import { getAdminDb } from '../src/lib/firebase-admin';

async function inspect() {
  const db = getAdminDb();
  console.log('--- Inspecting duplicate slug: beneficial-ownership-declaration-your-sa-guide ---');
  const snap = await db.collection('blogPosts').where('slug', '==', 'beneficial-ownership-declaration-your-sa-guide').get();
  console.log('Matching documents count:', snap.size);
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log({
      docId: doc.id,
      dataId: d.id,
      slug: d.slug,
      title: d.title,
      metaTitle: d.metaTitle,
      relatedProducts: d.relatedProducts,
      date: d.date?.toDate ? d.date.toDate().toISOString() : d.date,
    });
  }

  // Also let's check all slugs to see if any other duplicates exist
  const allBlogs = await db.collection('blogPosts').get();
  const slugMap = new Map<string, string[]>();
  for (const doc of allBlogs.docs) {
    const s = doc.data().slug || doc.id;
    if (!slugMap.has(s)) slugMap.set(s, []);
    slugMap.get(s)!.push(doc.id);
  }
  console.log('\nAll duplicate slugs in blogPosts:');
  for (const [slug, ids] of slugMap.entries()) {
    if (ids.length > 1) {
      console.log(`  Slug "${slug}" shared by doc IDs:`, ids);
    }
  }

  console.log('\n--- Inspecting NHaTQqDokqYz1STpfFX9 HTML content ---');
  const postDoc = await db.collection('blogPosts').doc('NHaTQqDokqYz1STpfFX9').get();
  if (postDoc.exists) {
    const data = postDoc.data()!;
    console.log('Title:', data.title);
    console.log('Slug:', data.slug);
    const c = data.content || '';
    console.log('Content length:', c.length);

    const olOpen = (c.match(/<ol[^>]*>/gi) || []).length;
    const olClose = (c.match(/<\/ol>/gi) || []).length;
    const ulOpen = (c.match(/<ul[^>]*>/gi) || []).length;
    const ulClose = (c.match(/<\/ul>/gi) || []).length;
    const liOpen = (c.match(/<li[^>]*>/gi) || []).length;
    const liClose = (c.match(/<\/li>/gi) || []).length;

    console.log({ olOpen, olClose, ulOpen, ulClose, liOpen, liClose });

    const olIdx = c.indexOf('<ol');
    if (olIdx !== -1) {
      console.log('\nSnippet around <ol>:\n', c.substring(Math.max(0, olIdx - 20), Math.min(c.length, olIdx + 500)));
    }
  }
}

inspect().catch(console.error);
