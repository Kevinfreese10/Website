import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function fetchOrder10139() {
  const db = getAdminDb();
  const snap = await db.collection('orders').doc('10139').get();
  
  if (!snap.exists) {
    console.error('Order #10139 not found in Firestore!');
    return;
  }

  const data = snap.data();
  console.log('=== ORDER #10139 SNAPSHOT ===');
  console.log(JSON.stringify({
    id: snap.id,
    customerName: data?.customerName,
    customerEmail: data?.customerEmail,
    customerPhone: data?.customerPhone,
    businessName: data?.businessName,
    companyName: data?.companyName,
    registrationNumber: data?.registrationNumber,
    service: data?.service,
    items: data?.items,
    status: data?.status,
    fulfillmentStatus: data?.fulfillmentStatus,
    documentUploads: data?.documentUploads,
    uploads: data?.uploads,
    customFields: data?.customFields,
    formValues: data?.formValues,
    notesCount: (data?.notes || []).length,
    notes: data?.notes,
  }, null, 2));

  // Save snapshot to scratch
  const outDir = path.resolve('scratch/order_10139_audit');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'order_snapshot.json'), JSON.stringify(data, null, 2));
  console.log(`\nSaved order snapshot to scratch/order_10139_audit/order_snapshot.json`);
}

fetchOrder10139().catch(console.error);
