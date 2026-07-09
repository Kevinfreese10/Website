const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Since we may not have a service account key in the repo, 
// let's check if the project has default credentials or use the env vars
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.error('Failed to initialize admin app:', e);
    process.exit(1);
  }
}

async function run() {
  const db = admin.firestore();
  console.log('Searching for service with slug: company-registration');
  
  const snapshot = await db.collection('services').where('slug', '==', 'company-registration').get();
  
  if (snapshot.empty) {
    console.log('No service found with slug "company-registration".');
    
    // Also check 'new-company-registration' just in case
    const snap2 = await db.collection('services').where('slug', '==', 'new-company-registration').get();
    if (snap2.empty) {
      console.log('No service found with slug "new-company-registration" either.');
      
      // Let's list all slugs to see what exists
      const all = await db.collection('services').get();
      console.log('Existing slugs:', all.docs.map(d => d.data().slug));
      
      return;
    } else {
      console.log(`Found 1 document with slug "new-company-registration". Updating...`);
      for (const doc of snap2.docs) {
        await doc.ref.update({ slug: 'private-company-registration' });
        console.log(`Updated document ${doc.id} slug to private-company-registration`);
      }
    }
  } else {
    console.log(`Found ${snapshot.size} document(s). Updating...`);
    for (const doc of snapshot.docs) {
      await doc.ref.update({ slug: 'private-company-registration' });
      console.log(`Updated document ${doc.id} slug to private-company-registration`);
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
