import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function testArrayUndefined() {
  const db = getAdminDb();
  const testRef = db.collection('aiPayrollClients').doc('test_doc').collection('payslips').doc('test_ps');
  
  try {
    await testRef.set({
      earnings: [
        { label: 'Basic Salary', amount: 1000, durationMonths: undefined, taxCategory: undefined }
      ],
      deductions: [
        { label: 'Tax', amount: 0, isStatutory: true, taxCategory: undefined }
      ]
    }, { merge: true });
    console.log('Success without cleaning!');
  } catch (e: any) {
    console.error('ERROR with undefined in array:', e.message);
  }
}

testArrayUndefined().catch(console.error);
