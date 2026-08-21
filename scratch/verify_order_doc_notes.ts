import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function verifyOrderDocNotes() {
  const db = getAdminDb();
  const snap = await db.collection('orders').doc('10135').get();
  const data = snap.data() || {};
  
  console.log(`Order Status: ${data.status}`);
  console.log(`Fulfillment Status: ${data.fulfillmentStatus}`);
  console.log(`Total Notes in array: ${(data.notes || []).length}`);
  (data.notes || []).forEach((n: any, idx: number) => {
    console.log(`\n--- Note #${idx + 1} [Internal: ${n.isInternal}] ---`);
    console.log(`Subject: ${n.subject}`);
    console.log(`Date: ${n.date}`);
    console.log(`Text: ${n.text}`);
  });
}

verifyOrderDocNotes().catch(console.error);
