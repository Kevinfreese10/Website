import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function check() {
  const db = getAdminDb();
  const doc = await db.collection('orders').doc('10136').get();
  if (!doc.exists) {
    console.log('Order 10136 not found');
    return;
  }
  const data = doc.data();
  console.log('--- ORDER 10136 DETAILS ---');
  console.log('Order ID: 10136');
  console.log('Status:', data?.status);
  console.log('Fulfillment Status:', data?.fulfillmentStatus);
  console.log('Customer Email:', data?.customerEmail);
  console.log('End Customer Email:', data?.endCustomerEmail);
  console.log('Customer Name:', data?.customerName);
  console.log('Reseller ID:', data?.resellerId);
  console.log('Updated At:', data?.updatedAt);
  console.log('\n--- AUDIT LOG (Last 5) ---');
  console.log(JSON.stringify(data?.auditLog?.slice(-5), null, 2));
  console.log('\n--- COMMUNICATION HISTORY (Last 5) ---');
  console.log(JSON.stringify(data?.communicationHistory?.slice(-5), null, 2));
  console.log('\n--- NOTES (Last 5) ---');
  console.log(JSON.stringify(data?.notes?.slice(-5), null, 2));

  // Check email settings/logs in Firestore if any
  const emailLogsSnap = await db.collection('orders').doc('10136').collection('emails').get().catch(() => null);
  if (emailLogsSnap && !emailLogsSnap.empty) {
    console.log('\n--- SUBCOLLECTION EMAILS ---');
    emailLogsSnap.forEach(d => console.log(d.id, d.data()));
  }
}

check().catch(console.error);
