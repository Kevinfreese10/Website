import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkMetadata() {
  const db = getAdminDb();
  const snapshot = await db.collection('services').get();
  console.log(`Checking ${snapshot.size} services...`);
  
  let missingBothCount = 0;
  let missingMetaCount = 0;
  let totalCount = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const slug = data.slug;
    const title = data.title;
    const hasMetaDesc = !!data.metaDescription && data.metaDescription.trim().length > 0;
    const hasDesc = !!data.description && data.description.trim().length > 0;

    totalCount++;
    if (!hasMetaDesc && !hasDesc) {
      console.log(`[CRITICAL] Both missing: "${title}" (slug: ${slug})`);
      missingBothCount++;
    } else if (!hasMetaDesc) {
      console.log(`[WARN] Meta missing (uses desc fallback): "${title}" (slug: ${slug})`);
      missingMetaCount++;
    }
  });

  console.log(`\nSummary:`);
  console.log(`Total Services: ${totalCount}`);
  console.log(`Missing both metaDescription and description: ${missingBothCount}`);
  console.log(`Missing metaDescription (but has description): ${missingMetaCount}`);
}

checkMetadata().catch(console.error);
