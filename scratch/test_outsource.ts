import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function test() {
  const db = getAdminDb();
  const partnerId = 'Fs5UYnpDBFVJfs6j7nMelYDxsnl2';
  const orderId = '10139';

  const partnerDoc = await db.collection('users').doc(partnerId).get();
  console.log('Partner exists:', partnerDoc.exists);
  console.log('Partner creditBalance:', partnerDoc.data()?.creditBalance);
  console.log('Partner email:', partnerDoc.data()?.email);

  const orderDoc = await db.collection('orders').doc(orderId).get();
  console.log('Order exists:', orderDoc.exists);
  const orderData = orderDoc.data();
  console.log('Order data:', orderData);

  const items = orderData?.items || [];
  for (const item of items) {
    const serviceDoc = await db.collection('services').doc(item.id).get();
    console.log(`Service ${item.id} exists:`, serviceDoc.exists);
    if (serviceDoc.exists) {
      console.log('Service data:', serviceDoc.data());
    }
  }
}

test().catch(console.error);
