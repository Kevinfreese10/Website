import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  const snap = await db.collection('services').get();
  console.log(`Found ${snap.size} services in Firestore:`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id} | Title: "${data.title}" | Price: R${data.price} | Slug: ${data.slug || ''}`);
  });
}

main().catch(console.error);
