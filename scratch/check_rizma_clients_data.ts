import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkClientDetails() {
  const db = getAdminDb();
  const clientIds = ['Nt6RiGoHounSUkh7JqvV', 'PeokcR1lizLH3wusWEHN'];

  for (const cid of clientIds) {
    const cDoc = await db.collection('aiPayrollClients').doc(cid).get();
    console.log(`\n=== Client ID: ${cid} (${cDoc.data()?.name}) ===`);
    console.log('firstProcessingMonth:', cDoc.data()?.firstProcessingMonth);
    console.log('payrollFrequency:', cDoc.data()?.payrollFrequency);

    const empsSnap = await db.collection('aiPayrollClients').doc(cid).collection('employees').get();
    console.log(`Employees (${empsSnap.size}):`);
    empsSnap.forEach(e => {
      console.log(`  - Employee: ${e.id} | ${e.data().name} ${e.data().surname} | payType: ${e.data().payType} | basic: ${e.data().basicSalary} | hourly: ${e.data().hourlyRate}`);
    });

    const psSnap = await db.collection('aiPayrollClients').doc(cid).collection('payslips').get();
    console.log(`Payslips (${psSnap.size}):`);
    psSnap.forEach(p => {
      console.log(`  - Payslip: ${p.id} | empId: ${p.data().employeeId} | empName: ${p.data().employeeName} | period: ${p.data().period} | status: ${p.data().status}`);
    });
  }
}

checkClientDetails().catch(console.error);
