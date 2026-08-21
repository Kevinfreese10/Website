const admin = require('firebase-admin');
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function getFailedEmails() {
  const snapshot = await db.collection('failedEmails').orderBy('failedAt', 'desc').limit(5).get();
  if (snapshot.empty) {
    console.log('No failed emails found.');
    return;
  }
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

getFailedEmails();
