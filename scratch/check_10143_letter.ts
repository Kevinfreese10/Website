import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkOrder10143() {
  const db = getAdminDb();
  const doc = await db.collection('orders').doc('10143').get();

  if (!doc.exists) {
    console.log('Order #10143 NOT FOUND');
    return;
  }

  const data = doc.data()!;
  console.log('Order #10143 Summary:');
  console.log('- Status:', data.status);
  console.log('- FulfillmentStatus:', data.fulfillmentStatus);
  console.log('- Customer:', data.customerName, data.customerEmail);
  console.log('- GeneratedDrafts:', data.generatedDrafts);
  console.log('\n- Notes:');
  (data.notes || []).forEach((n: any, i: number) => {
    console.log(`[Note ${i}] Author: ${n.authorId} | Type: ${n.type} | Subject: ${n.subject}`);
    console.log(`Text preview: ${n.text?.substring(0, 100)}...`);
    if (n.attachments) {
      console.log('Attachments:', JSON.stringify(n.attachments, null, 2));
    }
  });
}

checkOrder10143().catch(console.error);
