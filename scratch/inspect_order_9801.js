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

async function inspectOrder9801() {
  console.log('=== Inspecting Order 9801 ===');
  const orderRef = db.collection('orders').doc('9801');
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    console.log('Order 9801 not found by doc id 9801. Searching by originalOrderId or order id in all orders...');
    const q1 = await db.collection('orders').where('id', '==', '9801').get();
    const q2 = await db.collection('orders').where('originalOrderId', '==', '9801').get();
    console.log(`Found ${q1.size} by id, ${q2.size} by originalOrderId`);
    q1.forEach(d => console.log('q1 match:', d.id, d.data()));
    q2.forEach(d => console.log('q2 match:', d.id, d.data()));
    return;
  }

  const data = orderSnap.data();
  console.log('Order 9801 data:');
  console.log({
    id: data.id,
    originalOrderId: data.originalOrderId,
    userId: data.userId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    assignedTo: data.assignedTo,
    status: data.status,
    notesCount: data.notes?.length,
  });

  console.log('\nNotes on Order 9801:');
  if (data.notes) {
    data.notes.forEach((n, idx) => {
      console.log(`[Note ${idx + 1}] authorId: ${n.authorId}, text: "${n.text}", date: ${n.date?.toDate ? n.date.toDate() : n.date}, type: ${n.type}`);
    });
  }
}

inspectOrder9801().catch(console.error);
