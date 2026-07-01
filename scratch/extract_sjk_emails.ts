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
  const snap = await db.collection('emails').get();
  snap.forEach(doc => {
    const data = doc.data();
    const str = JSON.stringify(data).toLowerCase();
    if (str.includes('sjk physiotherapy')) {
      console.log(`\n--- Email Match: ${doc.id} ---`);
      console.log(`Subject: ${data.subject || 'N/A'}`);
      console.log(`To: ${JSON.stringify(data.to)}`);
      // truncate text if it's too long
      const text = data.text || data.html || '';
      if (text.length > 500) {
        console.log(`Body (truncated): ${text.substring(0, 500)}...`);
      } else {
        console.log(`Body: ${text}`);
      }
    }
  });
}
checkEmails().catch(console.error);
