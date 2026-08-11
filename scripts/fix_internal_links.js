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
    
    const replacements = [
      { from: 'href="https://www.myacc.co.za/blog/</div', to: 'href="https://www.myacc.co.za/blog/"' },
      { from: 'href="https://www.myacc.co.za/blog/personal-income-tax"', to: 'href="https://www.myacc.co.za/products/individual-income-tax-return-itr12-simple"' },
      { from: 'href="https://www.myacc.co.za/blog/tax-return-preparation"', to: 'href="https://www.myacc.co.za/products"' },
      { from: 'href="https://www.myacc.co.za/blog/bookkeeping-tips"', to: 'href="https://www.myacc.co.za/products/monthly-bookkeeping-services"' },
      { from: 'href="https://www.myacc.co.za/blog/record-keeping-tips"', to: 'href="https://www.myacc.co.za/products/monthly-bookkeeping-services"' },
      { from: 'href="https://www.myacc.co.za/blog/provisional-income-tax"', to: 'href="https://www.myacc.co.za/products/provisional-tax-returns-irp6"' },
    ];
    
    for (const { from, to } of replacements) {
      if (content.includes(from)) {
        console.log(`Replacing in ${data.slug}: ${from} -> ${to}`);
        content = content.split(from).join(to);
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
