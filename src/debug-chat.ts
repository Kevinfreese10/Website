import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getAdminDb } from './lib/firebase-admin';

async function debug() {
  const db = getAdminDb();
  
  console.log("=== Checking Order 9960 ===");
  const orderRef = db.collection('orders').doc('9960');
  const orderSnap = await orderRef.get();
  if (orderSnap.exists) {
    const orderData = orderSnap.data() || {};
    console.log("Order items:", JSON.stringify(orderData.items, null, 2));
    console.log("Order documentUploads:", JSON.stringify(orderData.documentUploads, null, 2));
  } else {
    console.log("Order 9960 not found.");
  }
}

debug().catch(console.error);
