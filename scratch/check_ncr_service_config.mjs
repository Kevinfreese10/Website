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

async function checkFirestore() {
  console.log('--- Checking services collection for NCR ---');
  const servicesSnap = await db.collection('services').get();
  servicesSnap.forEach(doc => {
    const d = doc.data();
    if (d.title && d.title.toLowerCase().includes('ncr')) {
      console.log('Service:', d.title, '| Price:', d.price, '| Description:', d.description || d.shortDescription);
      console.log('Requirements / Included:', JSON.stringify(d.requirements || d.includes || d.features || []));
    }
  });

  console.log('\n--- Checking recent NCR orders for notes/share certificates ---');
  const ordersSnap = await db.collection('orders').get();
  const ncrOrders = [];
  ordersSnap.forEach(doc => {
    const d = doc.data();
    const str = JSON.stringify(d).toLowerCase();
    if (str.includes('ncr registration') || str.includes('ncr application')) {
      ncrOrders.push({ id: doc.id, d });
    }
  });

  console.log(`Found ${ncrOrders.length} NCR orders.`);
  for (const o of ncrOrders.slice(0, 10)) {
    console.log(`\nOrder #${o.id} - ${o.d.customerName || o.d.billing?.firstName}:`);
    const notes = o.d.notes || [];
    notes.forEach(n => {
      const text = (n.text || n.subject || '').toLowerCase();
      if (text.includes('share') || text.includes('certificate') || text.includes('annex') || text.includes('resolution') || text.includes('draft')) {
        console.log(`  - Note by ${n.authorId || 'system'}: ${n.text || n.subject} (Attachments: ${JSON.stringify((n.attachments||[]).map(a=>a.name))})`);
      }
    });
  }
}

checkFirestore().catch(console.error);
