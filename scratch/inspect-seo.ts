import { getAdminDb } from '../src/lib/firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

async function check() {
  try {
    const db = getAdminDb();
    console.log("Fetching staticSeo documents...");
    const snap = await db.collection('staticSeo').get();
    snap.forEach(doc => {
      console.log(`Document ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log("--------------------");
    });
  } catch (err) {
    console.error(err);
  }
}

check();
