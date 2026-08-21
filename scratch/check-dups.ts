import { getAdminDb } from '../src/lib/firebase-admin';

async function check() {
  const db = getAdminDb();
  const snap = await db.collection('emails').get();
  console.log('Total emails in DB:', snap.size);
  const subjects: Record<string, any[]> = {};
  snap.docs.forEach(doc => {
    const d = doc.data();
    if (!subjects[d.subject]) subjects[d.subject] = [];
    subjects[d.subject].push(d);
  });
  
  for (const [sub, arr] of Object.entries(subjects)) {
    if (arr.length > 1) {
      console.log('Duplicate subject:', sub, 'Count:', arr.length);
      arr.forEach(a => console.log('  - messageId:', a.messageId, 'threadId:', a.threadId, 'date:', a.date));
    }
  }
}

check().catch(console.error);
