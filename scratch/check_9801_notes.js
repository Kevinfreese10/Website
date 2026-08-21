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

async function check9801Notes() {
  const doc = await db.collection('orders').doc('9801').get();
  const data = doc.data();
  console.log('Order 9801 all notes:');
  data.notes.forEach((n, idx) => {
    console.log(`[Note ${idx + 1}] (${n.date?.toDate ? n.date.toDate() : n.date}): authorId: ${n.authorId}, text: "${n.text}"`);
  });
}

check9801Notes().catch(console.error);
