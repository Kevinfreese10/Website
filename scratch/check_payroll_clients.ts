import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkPayrollClients() {
  const db = getAdminDb();
  const snap = await db.collection('aiPayrollClients').get();
  console.log(`Total aiPayrollClients: ${snap.size}`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`Client ID: ${doc.id} | Name: "${data.name}" | sharedWith:`, data.sharedWith);
  });
}

checkPayrollClients().catch(console.error);
