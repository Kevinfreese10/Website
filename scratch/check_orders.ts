import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function check() {
  const db = getAdminDb();
  const snapshot = await db.collection('orders')
    .orderBy('date', 'desc')
    .limit(10)
    .get();

  console.log('Recent 10 orders:');
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Order ID: ${doc.id}, customerName: ${data.customerName || data.endCustomerName}, resellerId: ${data.resellerId}, total: ${data.total}, isOutsourced: ${data.isOutsourced}, status: ${data.status}`);
    console.log('Items:', JSON.stringify(data.items));
  }
}

check().catch(console.error);
