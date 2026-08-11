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
    
    let content = data.content;
    let modified = false;

    // Search for broken links that contain the partial strings from the PDF
    const linkRegex = /href="([^"]+)"/g;
    let match;
    const links = [];
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    for (const link of links) {
      if (link.includes('</div')) {
        console.log(`Replacing ${link} in ${data.slug}`);
        content = content.replace(`href="${link}"`, `href="https://www.myacc.co.za/blog"`);
        modified = true;
      }
      if (link.includes('al-income-tax')) {
        console.log(`Replacing ${link} in ${data.slug}`);
        content = content.replace(`href="${link}"`, `href="https://www.myacc.co.za/products/individual-income-tax-return-itr12-simple"`);
        modified = true;
      }
      if (link.includes('n-preparation')) {
        console.log(`Replacing ${link} in ${data.slug}`);
        content = content.replace(`href="${link}"`, `href="https://www.myacc.co.za/products"`);
        modified = true;
      }
      if (link.includes('-keeping-tips')) {
        console.log(`Replacing ${link} in ${data.slug}`);
        content = content.replace(`href="${link}"`, `href="https://www.myacc.co.za/products/monthly-bookkeeping-services"`);
        modified = true;
      }
    }
    
    if (modified) {
      await postsRef.doc(doc.id).update({ content });
      console.log(`Updated post: ${data.slug}`);
    }
  }
}

run().catch(console.error);
