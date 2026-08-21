import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  
  // 1. Get user by email nic@nala-bts.co.za
  const usersSnap = await db.collection('users').where('email', '==', 'nic@nala-bts.co.za').get();
  let partnerId = '';
  usersSnap.forEach(doc => {
    partnerId = doc.id;
  });

  if (!partnerId) {
    console.error('Could not find partner nic@nala-bts.co.za');
    return;
  }

  // 2. Update order 10095 to set resellerId and partnerId
  const orderRef = db.collection('orders').doc('10095');
  await orderRef.update({
    resellerId: partnerId,
    partnerId: partnerId,
    updatedAt: new Date(),
  });

  console.log(`✅ Order 10095 successfully updated with resellerId & partnerId: ${partnerId}`);
}

main().catch(console.error);
