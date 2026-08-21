import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function updateExistingTopups() {
  const db = getAdminDb();
  const snapshot = await db.collection('orders').get();

  let updatedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const isTopup = Array.isArray(data.items) && data.items.some(i => i.id === 'partner_credit_topup');
    
    if (isTopup && data.status !== 'Completed' && data.status !== 'Cancelled') {
      console.log(`Updating Top-up Order #${doc.id} from "${data.status}" to "Completed"...`);
      await doc.ref.update({
        status: 'Completed',
        fulfillmentStatus: 'Completed',
      });
      updatedCount++;
    }
  }

  console.log(`Finished updating ${updatedCount} top-up orders.`);
}

updateExistingTopups().catch(console.error);
