import { sendEmail } from '../src/lib/email';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('c:/myacc/.env') });

const serviceAccount = JSON.parse(fs.readFileSync('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json', 'utf8'));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function retryFailedEmails() {
  console.log('Fetching recent failed emails from Firestore...');
  const snap = await db.collection('failedEmails')
    .orderBy('failedAt', 'desc')
    .limit(10)
    .get();

  console.log(`Found ${snap.size} failed emails. Retrying with verified system credentials...`);

  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(`\nRetrying [${doc.id}] to: ${data.to}, subject: "${data.subject}"`);
    try {
      const res = await sendEmail({
        to: data.to,
        subject: data.subject,
        html: `<p>Notification from My Accountant:</p><p>${data.subject}</p>`,
      });
      console.log(`✅ Successfully sent! messageId:`, res?.messageId);
      // Delete or mark resolved
      await doc.ref.delete();
    } catch (e: any) {
      console.error(`❌ Still failed:`, e.message);
    }
  }
}

retryFailedEmails();
