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

async function search() {
  console.log('Searching orders for Lesiba Financial Services...');
  
  const ordersSnap = await db.collection('orders').get();
  console.log(`Total orders in DB: ${ordersSnap.size}`);
  
  const matches = [];
  ordersSnap.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data).toLowerCase();
    if (str.includes('lesiba') || str.includes('financial services')) {
      if (str.includes('lesiba')) {
        matches.push({ id: doc.id, data });
      }
    }
  });
  
  console.log(`Found ${matches.length} matching orders:`);
  for (const m of matches) {
    console.log('-------------------------------------------');
    console.log(`Order ID: ${m.id}`);
    console.log(`Customer Name: ${m.data.customerName || m.data.customer?.name || m.data.billing?.firstName || ''}`);
    console.log(`Customer Email: ${m.data.customerEmail || m.data.customer?.email || m.data.billing?.email || ''}`);
    console.log(`Customer Phone: ${m.data.customerPhone || m.data.customer?.phone || m.data.billing?.phone || ''}`);
    console.log(`Company Name: ${m.data.companyName || m.data.company?.name || ''}`);
    console.log(`Service / Items:`, JSON.stringify(m.data.items || m.data.line_items || m.data.service || m.data.orderItems || []));
    console.log(`Status: ${m.data.status}`);
    console.log(`Created: ${m.data.createdAt || m.data.dateCreated || m.data.created || ''}`);
    console.log(`Notes / Form Data:`, JSON.stringify(m.data.formData || m.data.notes || m.data.customFields || {}));
  }
}

search().catch(console.error);
