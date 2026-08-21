import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkJeanine() {
  const db = getAdminDb();
  const uDoc = await db.collection('users').doc('D7pYKNKUbkUudXlpBpkWAtvkx5E2').get();
  console.log('User Data:', uDoc.data());

  // Check partnerClients or partnerOrders for this partner
  const pOrders = await db.collection('orders').where('resellerId', '==', 'D7pYKNKUbkUudXlpBpkWAtvkx5E2').get();
  console.log(`\nOrders with resellerId = D7pYKNKUbkUudXlpBpkWAtvkx5E2 (${pOrders.size}):`);
  pOrders.forEach(d => {
    console.log(`- Order #${d.id} | items:`, d.data().items?.map((i: any) => i.title), `| isOutsourced: ${d.data().isOutsourced} | originalOrderId: ${d.data().originalOrderId} | status: ${d.data().status}`);
  });
}

checkJeanine().catch(console.error);
