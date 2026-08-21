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

console.log('Using service account key:', serviceAccountPath);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function inspect() {
  console.log('--- Looking up users ---');
  const winifredSnap = await db.collection('users').where('email', '==', 'winifred@myacc.co.za').get();
  const kevSnap = await db.collection('users').where('email', '==', 'kev@thinkestry.co.za').get();

  if (winifredSnap.empty) {
    console.log('Winifred not found by exact email winifred@myacc.co.za. Searching case-insensitively / all users...');
    const allUsers = await db.collection('users').get();
    allUsers.forEach(d => {
      const u = d.data();
      if (u.email && u.email.toLowerCase().includes('winifred')) {
        console.log('Found user matching winifred:', d.id, u.email, u.name, u.role);
      }
      if (u.email && u.email.toLowerCase().includes('thinkestry')) {
        console.log('Found user matching thinkestry:', d.id, u.email, u.name, u.role);
      }
    });
  } else {
    winifredSnap.forEach(d => {
      console.log('Winifred user found:', d.id, d.data().name, d.data().email, d.data().role);
    });
  }

  if (kevSnap.empty) {
    console.log('Kev not found by exact email kev@thinkestry.co.za');
    const allUsers = await db.collection('users').get();
    allUsers.forEach(d => {
      const u = d.data();
      if (u.email && u.email.toLowerCase().includes('kev')) {
        console.log('Found user matching kev:', d.id, u.email, u.name, u.role);
      }
    });
  } else {
    kevSnap.forEach(d => {
      console.log('Kev user found:', d.id, d.data().name, d.data().email, d.data().role);
    });
  }

  const winifredUid = !winifredSnap.empty ? winifredSnap.docs[0].id : null;
  const kevUid = !kevSnap.empty ? kevSnap.docs[0].id : null;

  console.log('\n--- Checking orders ---');
  if (winifredUid) {
    const ordersSnap = await db.collection('orders').where('assignedTo', 'array-contains', winifredUid).get();
    console.log(`Found ${ordersSnap.size} orders assignedTo array-contains winifredUid (${winifredUid})`);
    ordersSnap.forEach(doc => {
      const data = doc.data();
      console.log(`Order ID: ${doc.id}, OriginalID: ${data.originalOrderId}, Status: ${data.status}, Title/Service: ${data.serviceTitle || data.title}, Customer: ${data.customerEmail || data.userName}, AssignedTo:`, data.assignedTo);
    });

    // Also check if there are tasks assigned to Winifred
    const tasksSnap = await db.collection('tasks').where('assignedTo', 'array-contains', winifredUid).get();
    console.log(`Found ${tasksSnap.size} tasks assignedTo array-contains winifredUid (${winifredUid})`);
    tasksSnap.forEach(doc => {
      const data = doc.data();
      console.log(`Task ID: ${doc.id}, Title: ${data.title}, Status: ${data.status}`);
    });
  }
}

inspect().catch(console.error);
