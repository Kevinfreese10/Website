import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function check() {
  const db = getAdminDb();
  
  // Check emails sent to xomenzo@gmail.com
  const emailLogsSnap = await db.collection('email_logs')
    .where('to', '==', 'xomenzo@gmail.com')
    .get()
    .catch(() => null);

  if (emailLogsSnap && !emailLogsSnap.empty) {
    console.log('--- FOUND EMAIL LOGS FOR xomenzo@gmail.com ---');
    emailLogsSnap.forEach(d => console.log(d.id, d.data()));
  } else {
    console.log('No specific email_logs docs query match.');
  }

  // Check recent email_logs
  const recentLogs = await db.collection('email_logs').limit(10).get().catch(() => null);
  if (recentLogs && !recentLogs.empty) {
    console.log('\n--- RECENT EMAIL LOGS IN FIRESTORE ---');
    recentLogs.forEach(d => console.log(d.id, d.data()));
  }
}

check().catch(console.error);
