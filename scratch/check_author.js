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

async function checkUser() {
  const doc = await db.collection('users').doc('hCTT7dPOdbX3Y0ExvLWRwL6sujM2').get();
  if (doc.exists) {
    console.log('User hCTT7dPOdbX3Y0ExvLWRwL6sujM2:', doc.data());
  } else {
    console.log('User not found in users collection. Checking other collections...');
    for (const coll of ['aiAccountantClients', 'adminClients', 'partnerClients']) {
      const snap = await db.collection(coll).doc('hCTT7dPOdbX3Y0ExvLWRwL6sujM2').get();
      if (snap.exists) {
        console.log(`Found in ${coll}:`, snap.data());
      }
    }
  }
}

checkUser().catch(console.error);
