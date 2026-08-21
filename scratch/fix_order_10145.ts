import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function fixOrder10145() {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc('10145');
  await orderRef.update({
    isOutsourced: true,
    updatedAt: new Date().toISOString(),
  });
  console.log('Order #10145 updated with isOutsourced: true');
}

fixOrder10145().catch(console.error);
