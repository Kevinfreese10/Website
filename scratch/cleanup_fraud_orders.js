const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!global._firebaseAdminInitialized) {
  initializeApp({
    credential: cert(serviceAccount)
  });
  global._firebaseAdminInitialized = true;
}

const db = getFirestore();
const auth = getAuth();

const orderIds = ['10104', '10105', '10106', '10107', '10108', '10109'];
const uid = 'UGNd2PyOlTS6aBvbWJvOOwjTh2a2';

async function run() {
  console.log("=== CANCELING SPAM ORDERS ===");
  for (const id of orderIds) {
    const ref = db.collection('orders').doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({
        status: 'Cancelled',
        cancelReason: 'Flagged as spam / fraudulent order creation attempt',
        cancelledAt: new Date()
      });
      console.log(`Order ${id} updated to Cancelled.`);
    } else {
      console.log(`Order ${id} not found.`);
    }
  }

  console.log("\n=== DISABLING AUTH USER ===");
  try {
    await auth.updateUser(uid, { disabled: true });
    console.log(`User ${uid} successfully disabled.`);
  } catch (e) {
    console.log(`Error disabling user ${uid}:`, e.message);
  }
}

run().catch(console.error);
