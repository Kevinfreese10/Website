import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccountKeyPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function searchAll() {
  console.log("Fetching all collections...");
  const collections = await db.listCollections();
  
  for (const coll of collections) {
    console.log(`Searching ${coll.id}...`);
    const snapshot = await coll.get();
    let count = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (str.includes('sjk')) {
        console.log(`\nMatch in collection: ${coll.id}, ID: ${doc.id}`);
        console.log(JSON.stringify(data, null, 2));
        count++;
      }
    });
    if (count > 0) console.log(`Found ${count} matches in ${coll.id}`);
  }
}

searchAll().catch(console.error);
