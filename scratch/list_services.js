const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));

if (!admin.apps.length) {
  const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listServices() {
  const snap = await db.collection('services').get();
  console.log(`Found ${snap.size} services in Firestore:\n`);
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`- [${doc.id}] ${d.name} | Price: R${d.price} | Slug: ${d.slug || ''}`);
  });
}

listServices().catch(console.error);
