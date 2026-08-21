import { getAdminDb, getAdminStorage } from '../src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateAccountingOfficerConsentDraft } from '../src/lib/pdf/template-generators';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function redraft10138() {
  const db = getAdminDb();
  const bucket = getAdminStorage().bucket('studio-2604127518-57889.firebasestorage.app');
  const orderId = '10138';

  const orderDoc = await db.collection('orders').doc(orderId).get();
  if (!orderDoc.exists) {
    console.error('Order 10138 not found');
    return;
  }

  const order = { id: orderDoc.id, ...orderDoc.data() } as any;

  // Generate with authentic template engine
  const { buffer, fileName } = await generateAccountingOfficerConsentDraft(order, {
    companyName: 'FLEXIWILL (PTY) LTD',
    regNumber: '2003/002867/07',
    customerName: 'Lethabo Selaelo Ramaphakela',
    idNumber: '9908220104082',
    address: '16 Impala Road, Clayville, 1666',
    taxNumber: '9300000000',
    orderDate: '20 August 2026',
  });

  const localOut = path.resolve('c:/myacc/scratch/order_10138_audit/Accounting_Officer_Appointment_Letter_FLEXIWILL_v2.pdf');
  fs.writeFileSync(localOut, buffer);
  console.log(`Saved local PDF to ${localOut} (${buffer.length} bytes)`);

  // Upload to Firebase Storage
  const storagePath = `orders/10138/generated_drafts/Accounting_Officer_Appointment_Letter_FLEXIWILL.pdf`;
  const fileRef = bucket.file(storagePath);
  await fileRef.save(buffer, {
    metadata: { contentType: 'application/pdf' },
  });
  await fileRef.makePublic().catch(() => {});
  const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  console.log(`Uploaded to Firebase Storage: ${fileUrl}`);

  // Update order in Firestore
  const updatedDrafts = [
    {
      id: `draft_ao_letter_${Date.now()}`,
      templateType: 'accounting_officer_letter',
      title: 'Accounting Officer Consent & Appointment Letter (Reg 67/68)',
      description: 'Formal appointment & consent letter for FLEXIWILL (PTY) LTD (Reg: 2003/002867/07) issued for NCR Credit Provider application in terms of Regulations 67 & 68.',
      fileUrl,
      fileName: 'Accounting_Officer_Appointment_Letter_FLEXIWILL.pdf',
      generatedAt: new Date().toISOString(),
      status: 'draft',
    }
  ];

  // Update checklist step 2 artifactUrl
  const updatedChecklist = (order.checklist || []).map((step: any, idx: number) => {
    if (idx === 1) {
      return {
        ...step,
        status: 'completed',
        artifactUrl: fileUrl,
        artifactName: 'Accounting_Officer_Appointment_Letter_FLEXIWILL.pdf',
        aiNotes: 'Redrafted with authentic NCR statutory template, tabular metadata, and Kevin Freese CBA (SA) digital signature.'
      };
    }
    return step;
  });

  await db.collection('orders').doc(orderId).update({
    companyName: 'FLEXIWILL (PTY) LTD',
    companyRegistrationNumber: '2003/002867/07',
    companyAddress: '16 Impala Road, Clayville, 1666',
    companyRepresentative: 'Lethabo Selaelo Ramaphakela',
    checklist: updatedChecklist,
    generatedDrafts: updatedDrafts,
    updatedAt: new Date().toISOString(),
  });

  console.log('Order 10138 successfully updated with redrafted Appointment Letter!');
}

redraft10138().catch(console.error);
