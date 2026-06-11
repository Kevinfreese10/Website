import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getAdminDb } from '../src/lib/firebase-admin';

async function listServices() {
  const db = getAdminDb();
  const snapshot = await db.collection('services').get();
  console.log(`Found ${snapshot.size} services in Firestore:`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- Title: "${data.title}" | Slug: "${data.slug}" | Price: R${data.price}`);
  });
}

listServices().catch(console.error);
