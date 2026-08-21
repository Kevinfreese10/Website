const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function inspectSettings() {
  const doc = await db.collection('emailSettings').doc('connection').get();
  console.log('emailSettings/connection exists:', doc.exists);
  if (doc.exists) {
    console.log('emailSettings/connection data:', doc.data());
  }

  const usersSnap = await db.collection('users').where('role', '==', 'admin').get();
  usersSnap.forEach(u => {
    console.log(`Admin user ${u.id} (${u.data().email}):`);
    console.log('smtpDetails:', u.data().smtpDetails);
    console.log('imapDetails:', u.data().imapDetails);
  });
}

inspectSettings();
