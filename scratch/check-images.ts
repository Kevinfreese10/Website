import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  console.log("Fetching all services...");
  const snap = await db.collection('services').get();
  
  let withImage = 0;
  let total = snap.size;
  snap.docs.forEach(doc => {
    const data = doc.data();
    if (data.image || data.imageUrl || data.seoImageUrl) {
      withImage++;
      console.log(data.slug, data.image, data.imageUrl, data.seoImageUrl);
    }
  });
  console.log(`Total services: ${total}, with image: ${withImage}`);
}

main().catch(console.error);
