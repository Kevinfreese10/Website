import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function listPayrollClients() {
  const db = getAdminDb();
  const clientsSnap = await db.collection('aiPayrollClients').get();
  console.log(`Total AI Payroll Clients in Firestore: ${clientsSnap.size}`);
  clientsSnap.forEach(d => {
    const data = d.data();
    console.log(`- [${d.id}] ${data.name || data.companyName} | Freq: ${data.payrollFrequency} | Period: ${data.firstProcessingMonth} | CreatedBy: ${data.createdBy}`);
  });
}

listPayrollClients().catch(console.error);
