import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    projectId: 'studio-2604127518-57889'
  });
}

const db = getFirestore();

async function inspectOrder() {
  console.log("Looking up order 10102...");
  const orderDoc = await db.collection('orders').doc('10102').get();
  if (orderDoc.exists) {
    console.log("Order 10102 data:", JSON.stringify(orderDoc.data(), null, 2));
  } else {
    console.log("Order 10102 not found by doc id, searching query...");
    const snap = await db.collection('orders').where('id', '==', '10102').get();
    if (!snap.empty) {
      console.log("Found order by id field:", JSON.stringify(snap.docs[0].data(), null, 2));
    }
  }

  console.log("\nLooking up user jeanine@jgaccounting.co.za...");
  const userSnap = await db.collection('users').where('email', '==', 'jeanine@jgaccounting.co.za').get();
  if (!userSnap.empty) {
    userSnap.forEach(doc => {
      console.log("User doc:", doc.id, JSON.stringify(doc.data(), null, 2));
    });
  } else {
    console.log("User not found in users collection by email.");
  }
}

inspectOrder().catch(console.error);
