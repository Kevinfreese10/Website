import { getAdminDb } from '../src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

async function run() {
  try {
    // Load local env file
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
    
    console.log('Using Firebase project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    const adminDb = getAdminDb();
    
    // 1. Wipe all tasks
    const tasksSnap = await adminDb.collection('tasks').get();
    const taskBatch = adminDb.batch();
    tasksSnap.forEach(doc => {
      taskBatch.delete(doc.ref);
    });
    await taskBatch.commit();
    console.log(`Deleted ${tasksSnap.size} tasks.`);
    
    // 2. Wipe all emails
    const emailsSnap = await adminDb.collection('emails').get();
    let emailBatch = adminDb.batch();
    let count = 0;
    for (const doc of emailsSnap.docs) {
      emailBatch.delete(doc.ref);
      count++;
      if (count % 400 === 0) {
        await emailBatch.commit();
        emailBatch = adminDb.batch();
      }
    }
    if (count % 400 !== 0) {
      await emailBatch.commit();
    }
    console.log(`Deleted ${emailsSnap.size} emails.`);
    
    // 3. Reset lastSync
    await adminDb.collection('emailSettings').doc('lastSync').delete();
    console.log('Reset emailSettings/lastSync.');
    
    // 4. Update emailSettings/connection
    await adminDb.collection('emailSettings').doc('connection').set({
      imapHost: 'mail.thinkestry.co.za',
      imapPort: 993,
      imapUser: 'kev@thinkestry.co.za',
      imapPass: 'KhaiFreese10$',
      smtpHost: 'mail.thinkestry.co.za',
      smtpPort: 465,
      smtpUser: 'kev@thinkestry.co.za',
      smtpPass: 'KhaiFreese10$'
    }, { merge: true });
    console.log('Updated emailSettings/connection for kev@thinkestry.co.za.');
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to wipe data and update settings:', err);
    process.exit(1);
  }
}

run();
