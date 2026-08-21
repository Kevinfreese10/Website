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

async function checkRecentFailures() {
  console.log('=== Checking recent failed emails ===');
  const snap = await db.collection('failedEmails').orderBy('failedAt', 'desc').limit(10).get();
  console.log(`Found ${snap.size} failed emails:`);
  snap.forEach(d => {
    const data = d.data();
    console.log({
      id: d.id,
      to: data.to,
      subject: data.subject,
      error: data.error,
      failedAt: data.failedAt?.toDate ? data.failedAt.toDate() : data.failedAt
    });
  });
}

checkRecentFailures().catch(console.error);
