import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  console.log("Fetching add-director service...");
  const snap = await db.collection('services').where('slug', '==', 'add-director').get();
  
  if (snap.empty) {
    console.log("No service found with slug add-director!");
    return;
  }
  
  const doc = snap.docs[0];
  const data = doc.data();
  console.log("Service Data:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
