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
  const snap = await payslipsRef.where('period', '==', '29/05/2026').where('status', '==', 'finalized').get();
  
  const empCount: Record<string, number> = {};
  snap.forEach(doc => {
      const data = doc.data();
      empCount[data.employeeName] = (empCount[data.employeeName] || 0) + 1;
  });
  
  for (const [name, count] of Object.entries(empCount)) {
      if (count > 1) {
          console.log(`${name} has ${count} finalized payslips.`);
      }
  }
}

check().catch(console.error);
