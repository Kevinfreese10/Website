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

const WINIFRED_UID = 'UZULuL0Hlncga10rqeiM9g2jeEh1';
const KEV_UID = 'LRM285EOq3gwNMKayY6vtzooaC03';

async function checkAll() {
  console.log('=== Checking all collections for Winifred ===');
  
  // 1. Orders (array-contains)
  const ordersSnap1 = await db.collection('orders').where('assignedTo', 'array-contains', WINIFRED_UID).get();
  console.log(`Orders with assignedTo array-contains: ${ordersSnap1.size}`);

  // 2. Orders (string equality just in case)
  const ordersSnap2 = await db.collection('orders').where('assignedTo', '==', WINIFRED_UID).get();
  console.log(`Orders with assignedTo string match: ${ordersSnap2.size}`);

  // 3. Tasks (array-contains)
  const tasksSnap1 = await db.collection('tasks').where('assignedTo', 'array-contains', WINIFRED_UID).get();
  console.log(`Tasks with assignedTo array-contains: ${tasksSnap1.size}`);

  // 4. Tasks (string equality)
  const tasksSnap2 = await db.collection('tasks').where('assignedTo', '==', WINIFRED_UID).get();
  console.log(`Tasks with assignedTo string match: ${tasksSnap2.size}`);

  // 5. Emails
  const emailsSnap = await db.collection('emails').where('assignedTo', '==', WINIFRED_UID).get();
  console.log(`Emails with assignedTo string match: ${emailsSnap.size}`);

  // Status breakdown of orders
  const statusCounts = {};
  ordersSnap1.forEach(doc => {
    const s = doc.data().status || 'Unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  console.log('Orders status breakdown:', statusCounts);
}

checkAll().catch(console.error);
