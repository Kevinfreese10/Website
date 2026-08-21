import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generatePayslipPdfPage } from '../src/lib/payslipPdf';
import { getAdminDb } from '../src/lib/firebase-admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testPayslipPdf() {
  const db = getAdminDb();
  const clientId = '82do75In0UiRwwJDmvnq'; // VACHELLIA INVESTMENTS

  const clientSnap = await db.collection('aiPayrollClients').doc(clientId).get();
  const client = { id: clientSnap.id, ...clientSnap.data() } as any;

  const empsSnap = await db.collection('aiPayrollClients').doc(clientId).collection('employees').get();
  const payslipsSnap = await db.collection('aiPayrollClients').doc(clientId).collection('payslips').get();

  for (const empDoc of empsSnap.docs) {
    const emp = { id: empDoc.id, ...empDoc.data() } as any;
    const psDoc = payslipsSnap.docs.find(d => d.data().employeeId === emp.id);
    if (!psDoc) continue;
    const payslip = { id: psDoc.id, ...psDoc.data() } as any;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    generatePayslipPdfPage(doc, payslip, emp, client);

    const outDir = path.resolve('scratch/payslip_preview');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, `Payslip_${emp.employeeCode}_${emp.surname}.pdf`);
    fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
    console.log(`Saved PDF to: ${outPath}`);
  }
}

testPayslipPdf().catch(console.error);
