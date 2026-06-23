import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  try {
    const db = getAdminDb();
    const ordersSnap = await db.collection('orders').orderBy('date', 'desc').limit(5).get();
    console.log(`Total recent orders retrieved: ${ordersSnap.size}`);
    ordersSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}`);
      console.log(`  Customer: ${data.customerName} (${data.customerEmail})`);
      console.log(`  Total: ${data.total}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Date: ${data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : 'null'}`);
      console.log(`  Source: ${data.source}`);
      console.log(`  Items: ${JSON.stringify(data.items)}`);
    });
  } catch (error: any) {
    console.error('Error:', error);
  }
}

main();
