import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function verifyOrder() {
  const db = getAdminDb();
  const d = await db.collection('orders').doc('10139').get();
  console.log('Order #10139 Notes attachments:');
  d.data()?.notes?.forEach((n: any, idx: number) => {
    if (n.attachments) {
      console.log(`Note #${idx} attachments:`, JSON.stringify(n.attachments, null, 2));
    }
  });
}

verifyOrder().catch(console.error);
