import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkSampleEmployee() {
  const db = getAdminDb();
  const malehaEmp = await db.collection('aiPayrollClients').doc('PeokcR1lizLH3wusWEHN').collection('employees').get();
  console.log('Sample Employee Data:');
  malehaEmp.forEach(d => {
    console.log(JSON.stringify(d.data(), null, 2));
  });
}

checkSampleEmployee().catch(console.error);
