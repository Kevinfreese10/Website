const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  const downloadsPath = 'C:/Users/kev/Downloads';
  const files = fs.readdirSync(downloadsPath).filter(f => f.startsWith('studio-2604127518-57889-firebase-adminsdk') && f.endsWith('.json'));
  if (files.length > 0) {
    serviceAccountPath = path.join(downloadsPath, files[0]);
  }
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function inspectOrder10127() {
  console.log('=== Inspecting Order 10127 ===');
  const orderRef = db.collection('orders').doc('10127');
  const snap = await orderRef.get();
  if (!snap.exists) {
    console.log('Order 10127 not found');
    return;
  }

  const data = snap.data();
  console.log({
    id: data.id,
    originalOrderId: data.originalOrderId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    assignedTo: data.assignedTo,
    status: data.status,
    notes: data.notes
  });

  console.log('\n=== Checking failedEmails for 10127 ===');
  const failedSnap = await db.collection('failedEmails').where('subject', '==', 'New Note on Order #10127').get();
  failedSnap.forEach(d => {
    console.log('Failed email doc:', d.id, d.data());
  });
}

inspectOrder10127().catch(console.error);
