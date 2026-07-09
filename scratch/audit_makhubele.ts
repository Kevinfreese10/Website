import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccountKeyPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function check() {
  const clientSnap = await db.collection('aiPayrollClients').get();
  let clientId = '';
  clientSnap.forEach(doc => {
      if (doc.data().name?.includes('Maleha') || doc.data().companyName?.includes('Maleha')) {
          clientId = doc.id;
      }
  });

  if (!clientId) {
      console.log('Client not found');
      return;
  }

  const payslipsRef = db.collection(`aiPayrollClients/${clientId}/payslips`);
  const snap = await payslipsRef.where('period', '==', '29/05/2026').get();
  
  snap.forEach(doc => {
      const data = doc.data();
      if (data.employeeName?.includes('MAKHUBELE') || data.employeeName?.includes('KNOX')) {
          console.log('\n--- Employee:', data.employeeName, '---');
          console.log('Payslip ID:', doc.id);
          console.log('Employee ID:', data.employeeId);
          console.log('Status:', data.status);
          console.log('Gross:', data.grossPay);
          console.log('Earnings:', JSON.stringify(data.earnings, null, 2));
      }
  });
}

check().catch(console.error);
