import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { updatePayslipAction } from '../src/app/actions/payroll-core';
import { getAdminDb } from '../src/lib/firebase-admin';

async function testSave() {
  const db = getAdminDb();
  const clientId = 'Nt6RiGoHounSUkh7JqvV'; // Maleha Construction CC

  // Let's find one draft payslip
  const snap = await db.collection('aiPayrollClients').doc(clientId).collection('payslips')
    .where('status', '==', 'draft')
    .limit(1)
    .get();

  if (snap.empty) {
    console.log('No draft payslip found');
    return;
  }

  const psDoc = snap.docs[0];
  const ps = psDoc.data();
  console.log('Testing update on draft payslip:', psDoc.id, ps.employeeName);

  const res = await updatePayslipAction({
    clientId,
    payslipId: psDoc.id,
    data: {
      ...ps,
      grossPay: ps.grossPay,
      netPay: ps.netPay,
      hoursWorked: 0,
    },
    employeeId: ps.employeeId,
    recurringItems: []
  });

  console.log('Result for existing draft:', res);

  // Now test with payslipId: 'new'
  const newRes = await updatePayslipAction({
    clientId,
    payslipId: 'new',
    data: {
      employeeId: ps.employeeId,
      employeeName: ps.employeeName,
      period: ps.period,
      frequency: ps.frequency || 'Fortnightly',
      earnings: ps.earnings || [],
      deductions: ps.deductions || [],
      contributions: ps.contributions || [],
      fringeBenefits: [],
      grossPay: ps.grossPay || 0,
      totalDeductions: ps.totalDeductions || 0,
      netPay: ps.netPay || 0,
      hoursWorked: 0
    },
    employeeId: ps.employeeId,
    recurringItems: []
  });

  console.log('Result for new payslip:', newRes);
}

testSave().catch(console.error);
