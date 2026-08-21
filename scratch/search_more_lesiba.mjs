import admin from 'firebase-admin';
import * as fs from 'fs';

const serviceAccountPath = 'C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function searchMore() {
  const ordersSnap = await db.collection('orders').get();
  const found = [];
  ordersSnap.forEach(doc => {
    const d = doc.data();
    const str = JSON.stringify(d).toLowerCase();
    if (str.includes('chrisselolo') || str.includes('selolo') || str.includes('lesiba')) {
      found.push({ id: doc.id, d });
    }
  });
  console.log(`Found ${found.length} orders related to Selolo / Lesiba:`);
  for (const f of found) {
    console.log(`- Order #${f.id} | Status: ${f.d.status} | Customer: ${f.d.customerName || f.d.billing?.firstName} | Email: ${f.d.customerEmail || f.d.billing?.email}`);
  }
}

searchMore().catch(console.error);
