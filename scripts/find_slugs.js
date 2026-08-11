const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!global._firebaseAdminInitialized) {
  initializeApp({
    credential: cert(serviceAccount)
  });
  global._firebaseAdminInitialized = true;
}

const db = getFirestore();

async function run() {
  const snapshot = await db.collection('services').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    if(data.slug && data.slug.includes('itr12')) {
        console.log(`Service Slug: ${data.slug}`);
    }
  });
}

run().catch(console.error);
