import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkOrder() {
  const db = getAdminDb();
  const orderDoc = await db.collection('orders').doc('10145').get();

  if (!orderDoc.exists) {
    console.log('Order #10145 DOES NOT EXIST in Firestore orders collection.');
    // Check if there are other orders around 10140-10150
    const recentOrders = await db.collection('orders').orderBy('id', 'desc').limit(15).get();
    console.log('\nRecent Orders in Firestore:');
    recentOrders.forEach(d => {
      console.log(`- Order #${d.id} | Status: ${d.data().status} | Customer: ${d.data().customerName} | Partner: ${d.data().partnerId || d.data().resellerId || 'Direct'} | Dept: ${d.data().department}`);
    });
    return;
  }

  console.log('Order #10145 Data:', JSON.stringify(orderDoc.data(), null, 2));
}

checkOrder().catch(console.error);
