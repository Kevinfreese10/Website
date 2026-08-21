import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkVachelliaEmployees() {
  const db = getAdminDb();
  const clientId = '82do75In0UiRwwJDmvnq';
  const cDoc = await db.collection('aiPayrollClients').doc(clientId).get();
  console.log('Client Data:', cDoc.data());

  const empSnap = await db.collection('aiPayrollClients').doc(clientId).collection('employees').get();
  console.log(`\nCurrent employees count in Vachellia (${empSnap.size}):`);
  empSnap.forEach(d => {
    console.log(`- [${d.id}] ${d.data().name} ${d.data().surname} | ID: ${d.data().idNumber} | Salary: ${d.data().basicSalary}`);
  });
}

checkVachelliaEmployees().catch(console.error);
