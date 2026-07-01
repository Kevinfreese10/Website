import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccountKeyPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function checkEmails() {
  const collections = ['emails', 'inboxEmails', 'processedEmails'];
  for (const collName of collections) {
    const snap = await db.collection(collName).get();
    snap.forEach(doc => {
      const data = doc.data();
      const str = JSON.stringify(data).toLowerCase();
      // Look for the exact word 'sjk'
      if (/\bsjk\b/.test(str)) {
        console.log(`\n--- Match in ${collName}/${doc.id} ---`);
        console.log(`Subject: ${data.subject || 'N/A'}`);
        console.log(`To: ${JSON.stringify(data.to)}`);
        
        let text = data.text || data.html || '';
        if (text.length > 500) {
          text = text.substring(0, 500) + '...';
        }
        console.log(`Body: ${text}`);
      }
    });
  }
}
checkEmails().catch(console.error);
