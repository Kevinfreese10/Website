import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkOrder10139() {
  const db = getAdminDb();
  const doc = await db.collection('orders').doc('10139').get();
  if (!doc.exists) {
    console.log('Order #10139 NOT FOUND');
    return;
  }
  console.log('Order #10139 Data:', JSON.stringify(doc.data(), null, 2));
}

checkOrder10139().catch(console.error);
