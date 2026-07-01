import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccountKeyPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function check() {
  const snap = await db.collection('aiAccountantClients').get();
  console.log(`Found ${snap.size} clients in aiAccountantClients`);
  snap.forEach(d => console.log(d.id, d.data().name, d.data().companyName));
}
check().catch(console.error);
