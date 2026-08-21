const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findKevin() {
  const snap = await db.collection('users').where('email', '==', 'kev@thinkestry.co.za').get();
  snap.forEach(doc => {
    console.log('Kevin UID:', doc.id, doc.data());
  });
}

findKevin().catch(console.error);
