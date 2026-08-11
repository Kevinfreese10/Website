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
  const postsRef = db.collection('blogPosts');
  const snapshot = await postsRef.get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.content) continue;
    
    const linkRegex = /href="([^"]+)"/g;
    let match;
    
    while ((match = linkRegex.exec(data.content)) !== null) {
      if (match[1].includes('myacc.co.za') || match[1].startsWith('/')) {
        console.log(`[${data.slug}]: ${match[1]}`);
      }
    }
  }
}

run().catch(console.error);
