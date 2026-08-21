import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function verifyVachellia() {
  const db = getAdminDb();
  const clientId = '82do75In0UiRwwJDmvnq';

  const emps = await db.collection('aiPayrollClients').doc(clientId).collection('employees').get();
  console.log(`\n--- Vachellia Employees (${emps.size}) ---`);
  emps.forEach(d => {
    const data = d.data();
    console.log(`[${d.id}] ${data.employeeCode} - ${data.name} ${data.surname}`);
    console.log(`  Job Title: ${data.jobTitle}`);
    console.log(`  Email: ${data.email} | Phone: ${data.cellNumber}`);
    console.log(`  Salary: R ${data.basicSalary.toLocaleString()} | PayType: ${data.payType}`);
    console.log(`  Bank: ${data.bankingDetails?.bankName} (${data.bankingDetails?.accountNumber})`);
  });

  const payslips = await db.collection('aiPayrollClients').doc(clientId).collection('payslips').get();
  console.log(`\n--- Vachellia Payslips (${payslips.size}) ---`);
  payslips.forEach(d => {
    const data = d.data();
    console.log(`[${d.id}] Employee: ${data.employeeName} | Period: ${data.period} | Status: ${data.status}`);
    console.log(`  Gross: R ${data.grossPay} | Deductions: R ${data.totalDeductions} | Net: R ${data.netPay}`);
  });
}

verifyVachellia().catch(console.error);
