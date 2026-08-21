import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function check() {
  const db = getAdminDb();
  const logs = await db.collection('users').doc('Fs5UYnpDBFVJfs6j7nMelYDxsnl2').collection('walletLogs').orderBy('date', 'desc').get();
  console.log(`Found ${logs.size} wallet logs for partner:`);
  logs.docs.forEach(d => console.log(d.id, d.data()));
}

check().catch(console.error);
