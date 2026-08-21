import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function check10102() {
  const db = getAdminDb();
  const d = await db.collection('orders').doc('10102').get();
  console.log('Order #10102:', d.data());
}

check10102().catch(console.error);
