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
  const snap = await postsRef.where('slug', '==', 'tenders-do-you-need-csd-registration-in-sa').get();
  
  if (!snap.empty) {
    const doc = snap.docs[0];
    let content = doc.data().content;
    const linkRegex = /href="([^"]+)"/g;
    let match;
    let modified = false;
    while ((match = linkRegex.exec(content)) !== null) {
      if (match[1].includes('&lt;')) {
        console.log(`Found encoded malformed link: ${match[1]}`);
        content = content.replace(`href="${match[1]}"`, `href="/blog"`);
        modified = true;
      }
    }
    if (modified) {
      await postsRef.doc(doc.id).update({ content });
      console.log("Fixed encoded div link!");
    }
  }
}

run().catch(console.error);
