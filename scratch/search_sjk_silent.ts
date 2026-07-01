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
    if (coll.id === 'processedEmails') continue; // Skip emails to avoid noise for a moment, wait actually I DO want to know if it's there.
    // Actually let's search all, but print less.
    const snapshot = await coll.get();
    let count = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      if (str.includes('sjk')) {
        console.log(`\nMatch in ${coll.id}/${doc.id}`);
        // Try to print useful summary instead of full JSON
        if (data.subject) console.log(`Subject: ${data.subject}`);
        if (data.name) console.log(`Name: ${data.name}`);
        if (data.email) console.log(`Email: ${data.email}`);
        if (data.companyName) console.log(`Company: ${data.companyName}`);
        count++;
      }
    });
    if (count > 0) console.log(`Found ${count} matches in ${coll.id}`);
  }
}

searchAll().catch(console.error);
