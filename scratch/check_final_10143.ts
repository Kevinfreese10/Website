import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkFinal() {
  const db = getAdminDb();
  const d = await db.collection('orders').doc('10143').get();
  console.log('Order #10143 Note 5 attachment:', JSON.stringify(d.data()?.notes?.[5]?.attachments, null, 2));
}

checkFinal().catch(console.error);
