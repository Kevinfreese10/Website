import { getAdminDb } from '../src/lib/firebase-admin';

async function checkTitleMetrics() {
  const db = getAdminDb();
  const snap = await db.collection('blogPosts').get();

  let maxMetaTitleLen = 0;
  let minMetaTitleLen = 999;
  let maxRenderedTitleLen = 0;
  let hasSuffixInFirestoreCount = 0;

  const titleRows: { slug: string; metaTitle: string; stripped: string; rendered: string; metaLen: number; renderedLen: number }[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const metaTitle = data.metaTitle || '';
    const rawTitle = metaTitle || `${data.title} | My Accountant`;
    const stripped = rawTitle.endsWith(' | My Accountant')
      ? rawTitle.slice(0, -' | My Accountant'.length)
      : rawTitle;
    const rendered = `${stripped} | My Accountant`;

    if (metaTitle.endsWith(' | My Accountant')) {
      hasSuffixInFirestoreCount++;
    }

    if (metaTitle.length > maxMetaTitleLen) maxMetaTitleLen = metaTitle.length;
    if (metaTitle.length < minMetaTitleLen) minMetaTitleLen = metaTitle.length;
    if (rendered.length > maxRenderedTitleLen) maxRenderedTitleLen = rendered.length;

    titleRows.push({
      slug: data.slug || doc.id,
      metaTitle,
      stripped,
      rendered,
      metaLen: metaTitle.length,
      renderedLen: rendered.length,
    });
  }

  console.log(`Total Posts: ${titleRows.length}`);
  console.log(`Min metaTitle length: ${minMetaTitleLen}`);
  console.log(`Max metaTitle length: ${maxMetaTitleLen}`);
  console.log(`Posts with ' | My Accountant' suffix in Firestore metaTitle: ${hasSuffixInFirestoreCount}`);
  console.log(`Max rendered <title> length with root template: ${maxRenderedTitleLen}`);

  // Sort by rendered length desc
  titleRows.sort((a, b) => b.renderedLen - a.renderedLen);
  console.log('\nTop 5 longest rendered <title>s:');
  for (const r of titleRows.slice(0, 5)) {
    console.log(`- ${r.slug}: metaLen=${r.metaLen}, renderedLen=${r.renderedLen} -> "${r.rendered}"`);
  }

  // Check OpenGraph title: OpenGraph uses rawTitle
  console.log('\nOpenGraph title inspection:');
  console.log(`OG Title max length: ${maxMetaTitleLen} chars (strict <= 59 chars)`);
}

checkTitleMetrics().catch(console.error);
