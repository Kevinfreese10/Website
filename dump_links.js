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
  let results = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.content) {
      // Regex to find all href="http..."
      const linkRegex = /href="([^"]+)"/g;
      let match;
      while ((match = linkRegex.exec(data.content)) !== null) {
        if (match[1].startsWith('http')) {
          results.push({ id: doc.id, slug: data.slug, link: match[1] });
        }
      }
    }
  });
  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
