const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
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

const auth = getAuth();

async function checkAuth() {
  const user = await auth.getUser('UZULuL0Hlncga10rqeiM9g2jeEh1');
  console.log('Firebase Auth record for Winifred:');
  console.log({
    uid: user.uid,
    email: user.email,
    disabled: user.disabled,
    tokensValidAfterTime: user.tokensValidAfterTime,
  });
}

checkAuth().catch(console.error);
