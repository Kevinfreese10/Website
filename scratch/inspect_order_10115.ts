import { config } from 'dotenv';
config({ path: '.env.local' });
import { getAdminDb } from '../src/lib/firebase-admin.ts';

async function main() {
  const adminDb = getAdminDb();
  console.log('--- Inspecting Order #10115 ---');
  
  let orderSnap = await adminDb.collection('orders').doc('10115').get();
  if (!orderSnap.exists) {
    const q = await adminDb.collection('orders').where('id', '==', '10115').get();
    if (!q.empty) {
      orderSnap = q.docs[0];
    } else {
      const q2 = await adminDb.collection('orders').where('originalOrderId', '==', '10115').get();
      if (!q2.empty) {
        orderSnap = q2.docs[0];
      }
    }
  }

  if (!orderSnap.exists) {
    console.log('Order #10115 NOT FOUND by docId/id/originalOrderId. Searching recent orders...');
    const recent = await adminDb.collection('orders').orderBy('createdAt', 'desc').limit(10).get();
    recent.docs.forEach(d => {
      console.log(`Doc ID: ${d.id} | id: ${d.data().id} | originalOrderId: ${d.data().originalOrderId} | customerEmail: ${d.data().customerEmail} | resellerId: ${d.data().resellerId}`);
    });
    return;
  }

  const data = orderSnap.data()!;
  console.log('Order Document ID:', orderSnap.id);
  console.log('Data:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
