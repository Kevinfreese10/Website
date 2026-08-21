import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function check() {
  const db = getAdminDb();
  const snap = await db.collection('users').where('email', '==', 'rizma@myacc.co.za').get();
  if (snap.empty) {
    console.log('User rizma@myacc.co.za not found in users collection');
    return;
  }
  snap.forEach(doc => {
    console.log('User ID:', doc.id);
    console.log('User Data:', JSON.stringify(doc.data(), null, 2));
  });
}

check().catch(console.error);
