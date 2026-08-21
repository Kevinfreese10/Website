import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../../src/lib/firebase-admin';

async function updateOrderStatusCompleted() {
  const db = getAdminDb();
  const orderId = '10143';
  const orderRef = db.collection('orders').doc(orderId);
  
  await orderRef.update({
    status: 'Completed',
    fulfillmentStatus: 'Completed',
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log('✓ Successfully updated Order #10143 status to Completed in Firestore.');
}

updateOrderStatusCompleted().catch(console.error);
