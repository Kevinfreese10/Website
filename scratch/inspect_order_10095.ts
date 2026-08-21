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
    console.log('Partner User ID for nic@nala-bts.co.za:', partnerId);
    console.log('Partner role:', doc.data().role);
  });

  // 2. Get order 10095
  const orderDoc = await db.collection('orders').doc('10095').get();
  if (orderDoc.exists) {
    const o = orderDoc.data()!;
    console.log('\nOrder 10095 details:');
    console.log('order.id:', o.id);
    console.log('order.userId:', o.userId);
    console.log('order.resellerId:', o.resellerId);
    console.log('order.partnerId:', o.partnerId);
    console.log('order.customerEmail:', o.customerEmail);
    console.log('order.endCustomerEmail:', o.endCustomerEmail);
  }
}

main().catch(console.error);
