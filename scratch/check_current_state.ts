import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function check() {
  const db = getAdminDb();
  const partnerSnap = await db.collection('users').doc('Fs5UYnpDBFVJfs6j7nMelYDxsnl2').get();
  console.log('Partner Data:', partnerSnap.data());

  const orderSnap = await db.collection('orders').doc('10139').get();
  console.log('Order 10139 Data:', orderSnap.data());
}

check().catch(console.error);
