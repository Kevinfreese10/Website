const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(fs.readFileSync('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json', 'utf8'));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
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
      failedAt: data.failedAt?.toDate ? data.failedAt.toDate().toISOString() : data.failedAt
    });
  });
}

checkRecentFailures().catch(console.error);
