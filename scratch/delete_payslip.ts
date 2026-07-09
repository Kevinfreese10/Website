import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccountKeyPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function deletePayslip() {
    const clientId = 'Nt6RiGoHounSUkh7JqvV'; // Maleha Construction CC
    const payslipId = 'tru2QkJ0KiNc6jEkeHhy'; // Payslip 2

    const ref = db.collection('aiPayrollClients').doc(clientId).collection('payslips').doc(payslipId);
    await ref.delete();
    console.log(`Successfully deleted payslip ${payslipId} for client ${clientId}`);
}

deletePayslip().catch(console.error);
