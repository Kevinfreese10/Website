import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  console.log("Searching for order 9960...");
  
  // Try querying by doc ID '9960' first
  let docRef = db.collection('orders').doc('9960');
  let docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    // If not found by doc ID '9960', try querying where originalOrderId is '9960' or 9960
    console.log("Order document '9960' not found. Querying by originalOrderId...");
    const q1 = await db.collection('orders').where('originalOrderId', '==', '9960').get();
    const q2 = await db.collection('orders').where('originalOrderId', '==', 9960).get();
    const docs = [...q1.docs, ...q2.docs];
    
    if (docs.length > 0) {
      console.log(`Found ${docs.length} document(s) matching originalOrderId 9960:`);
      for (const d of docs) {
        printOrder(d.id, d.data());
      }
    } else {
      console.log("No orders found matching 9960.");
    }
  } else {
    console.log("Found order document by ID '9960':");
    printOrder(docSnap.id, docSnap.data());
  }
}

function printOrder(id: string, data: any) {
  console.log("=========================================");
  console.log(`Document ID: ${id}`);
  console.log(`originalOrderId: ${data.originalOrderId}`);
  console.log(`Customer: ${data.customerName} (${data.customerEmail})`);
  console.log(`Status: ${data.status}`);
  console.log(`Items:`, JSON.stringify(data.items, null, 2));
  console.log(`documentUploads:`, JSON.stringify(data.documentUploads, null, 2));
  console.log("=========================================");
}

main().catch(err => {
  console.error("Error running script:", err);
});
