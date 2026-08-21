import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  
  console.log("Searching for order #10102 in Firestore...");
  
  // Try direct doc id
  const docIdsToTry = ['10102', 'order_10102', '#10102', 'order-10102'];
  for (const id of docIdsToTry) {
    const snap = await db.collection('orders').doc(id).get();
    if (snap.exists) {
      console.log(`Found order by ID: ${id}`);
      console.log(JSON.stringify(snap.data(), null, 2));
      return;
    }
  }

  // Try querying by orderNumber or number or id
  const querySnap = await db.collection('orders')
    .where('orderNumber', 'in', ['10102', 10102, '#10102'])
    .get();

  if (!querySnap.empty) {
    querySnap.forEach(doc => {
      console.log(`Found order by query (doc ID: ${doc.id}):`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
    return;
  }

  // Try searching all recent orders
  const allOrdersSnap = await db.collection('orders')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  console.log(`Checking last ${allOrdersSnap.size} orders...`);
  let found = false;
  allOrdersSnap.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data);
    if (doc.id.includes('10102') || str.includes('10102')) {
      console.log(`Matched order doc ID: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
      found = true;
    }
  });

  if (!found) {
    console.log("Order 10102 not found in last 50 orders. Listing some order numbers:");
    allOrdersSnap.docs.slice(0, 10).forEach(d => {
      const data = d.data();
      console.log(`- Doc ID: ${d.id}, orderNumber: ${data.orderNumber || data.id || 'N/A'}, status: ${data.status}`);
    });
  }
}

main().catch(console.error);
