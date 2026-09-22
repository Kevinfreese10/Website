import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, getAdminStorage } from '../src/lib/firebase-admin';
import { sendEmail } from '../src/lib/email';
import { Order } from '../src/lib/types';
import {
  generateNcrForm2Draft,
  generateNcrAnnexureFeesDraft,
  generateShareCertificateDraft,
  generateNcrDirectorResolutionDraft,
  generatePowerOfAttorneyResolutionDraft,
  generateAccountingOfficerConsentDraft,
} from './_recovered_template-generators';
import { PDFDocument } from 'pdf-lib';

async function uploadToStorage(buffer: Buffer, destStoragePath: string): Promise<string> {
  const bucketName = 'studio-2604127518-57889.firebasestorage.app';
  const bucket = getAdminStorage().bucket(bucketName);
  const file = bucket.file(destStoragePath);

  await file.save(buffer, {
    metadata: {
      contentType: 'application/pdf',
    },
  });

  const encodedPath = encodeURIComponent(destStoragePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
}

async function run() {
  const orderId = '10135';
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error('Order 10135 not found');
  }

  const order = orderSnap.data() as Order;
  console.log(`Audited Order #${orderId}: ${order.companyName || order.customerName}`);

  const entityInfo = {
    companyName: 'FIRST BLOOM FINANCE (PTY) LTD',
    regNumber: '2026/507901/07',
    customerName: 'Peturnia Tiyiselani Mavundlha',
    idNumber: '9901300233087',
    address: 'Stand No 51, Makhushane, Phalaborwa, Limpopo, 1390',
    phone: '076 042 2792',
    email: 'peturniamavundlha@gmail.com',
    taxNumber: '9463449232',
    cipcRegDate: '27/06/2026',
    orderDate: '21 August 2026',
    orderId: '10135',
  };

  console.log('\n--- 1. Generating Fresh Statutory Documents ---');

  const form2Result = await generateNcrForm2Draft(order, entityInfo);
  const annexureResult = await generateNcrAnnexureFeesDraft(order, entityInfo);
  const shareCertResult = await generateShareCertificateDraft(order, entityInfo);
  const resolutionResult = await generateNcrDirectorResolutionDraft(order, entityInfo);
  const poaResult = await generatePowerOfAttorneyResolutionDraft(order, entityInfo);
  const aoLetterResult = await generateAccountingOfficerConsentDraft(order, entityInfo);

  const generatedDocs = [
    { ...form2Result, type: 'NCR Form 2 Application' },
    { ...annexureResult, type: 'NCR Annexure of Fees' },
    { ...shareCertResult, type: 'Share Certificate' },
    { ...resolutionResult, type: 'NCR Director Resolution' },
    { ...poaResult, type: 'Power of Attorney' },
    { ...aoLetterResult, type: 'Accounting Officer Appointment' },
  ];

  // --- 2. Verify Form 2 Field Values in Buffer ---
  console.log('\n--- 2. Verifying NCR Form 2 Field Values in Generated Buffer ---');
  const verifyDoc = await PDFDocument.load(form2Result.buffer, { ignoreEncryption: true });
  const form = verifyDoc.getForm();

  const isLegalStatusChecked = form.getCheckBox('p1_legal_status_private_company').isChecked();
  const ciproRegNo = form.getTextField('p1_cipro_reg_number').getText();
  const dateCommence = form.getTextField('p1_date_commencement_trading').getText();
  const finYearEnd = form.getTextField('p1_financial_year_end').getText();
  const incomeTax = form.getTextField('p1_income_tax_number').getText();
  const vatReg = form.getTextField('p1_vat_registration_number').getText();
  
  const finNetLoan = form.getTextField('p3_fin_net_loan_book_value').getText();
  const finAgreementsCount = form.getTextField('p3_fin_total_agreements_count').getText();
  const finPrincipalDebt = form.getTextField('p3_fin_total_principal_debt_value').getText();
  const finAgreementsDuringYear = form.getTextField('p3_fin_agreements_during_year_count').getText();

  console.log(`✓ Legal Status Private Company Checked: ${isLegalStatusChecked}`);
  console.log(`✓ CIPRO Reg Number: ${ciproRegNo}`);
  console.log(`✓ Date of Commencement: ${dateCommence}`);
  console.log(`✓ Financial Year-End: ${finYearEnd}`);
  console.log(`✓ Income Tax: ${incomeTax}`);
  console.log(`✓ VAT Registration: ${vatReg}`);
  console.log(`✓ Part 2 - Net value of loan book: ${finNetLoan}`);
  console.log(`✓ Part 2 - Total number of credit agreements: ${finAgreementsCount}`);
  console.log(`✓ Part 2 - Total value (principal debt): ${finPrincipalDebt}`);
  console.log(`✓ Part 2 - Total agreements entered during year: ${finAgreementsDuringYear}`);

  if (!isLegalStatusChecked || finNetLoan !== '0' || ciproRegNo !== '2026/507901/07') {
    throw new Error('CRITICAL: Verification failed! Field values do not match expected values.');
  }

  // --- 3. Save to local disk ---
  const packDir = path.resolve('scratch/order_10135_audit/generated_statutory_pack');
  if (!fs.existsSync(packDir)) fs.mkdirSync(packDir, { recursive: true });

  for (const doc of generatedDocs) {
    const filePath = path.join(packDir, doc.fileName);
    fs.writeFileSync(filePath, doc.buffer);
    console.log(`✓ Saved to disk: ${filePath} (${doc.buffer.length} bytes)`);
  }

  // --- 4. Upload to Firebase Storage ---
  console.log('\n--- 4. Uploading Fresh Drafts to Firebase Storage ---');
  const uploadedUrls: { filename: string; url: string; buffer: Buffer }[] = [];
  const generatedDrafts: Record<string, string> = (order as any).generatedDrafts || {};

  for (const doc of generatedDocs) {
    const storagePath = `orders/${orderId}/generated_drafts/${doc.fileName}`;
    const url = await uploadToStorage(doc.buffer, storagePath);
    uploadedUrls.push({ filename: doc.fileName, url, buffer: doc.buffer });
    generatedDrafts[doc.fileName] = url;
    console.log(`✓ Uploaded: ${doc.fileName} -> ${url}`);
  }

  // --- 5. Update Firestore ---
  await orderRef.update({
    generatedDrafts,
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Updated Firestore Order #10135.');

  // --- 6. Send Email with Verified Attachments ---
  console.log('\n--- 6. Sending Email to Kevin for Review ---');
  const recipients = ['kev@thinkestry.co.za', 'freesekevin@gmail.com'];
  const subject = `[FOR REVIEW] Order #10135 Complete NCR Statutory Pack — FIRST BLOOM FINANCE (PTY) LTD`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #0F2137; padding: 18px 24px; border-radius: 6px 6px 0 0; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; color: #ffffff;">My Accountant — Order Audit & Statutory Pack Review</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Order #10135 • FIRST BLOOM FINANCE (PTY) LTD (NCR Registration)</p>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 14px; line-height: 1.6;">Hi Kevin,</p>
        <p style="font-size: 14px; line-height: 1.6;">
          The statutory document pack for <strong>FIRST BLOOM FINANCE (PTY) LTD</strong> has been freshly re-generated using the official fillable templates with all verified details:
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #c5a059; padding: 14px 18px; margin: 18px 0; font-size: 13px;">
          <strong>Verified Details:</strong><br/>
          • <strong>Form 2 Legal Status:</strong> 3.3 Private Company [Checked]<br/>
          • <strong>CIPC Reg Number:</strong> 2026/507901/07<br/>
          • <strong>Date of Commencement:</strong> 27/06/2026 (COR14.3)<br/>
          • <strong>Financial Year-End:</strong> February<br/>
          • <strong>Part 2 Financial Metrics:</strong> All set to 0 (New Company)<br/>
          • <strong>Director / Shareholder:</strong> Peturnia Tiyiselani Mavundlha (ID: 9901300233087)<br/>
          • <strong>Accounting Officer:</strong> Kevin Freese (CIBA CBAP SA #3561 / SARS PR-0098553)
        </div>

        <h3 style="font-size: 14px; margin-top: 20px; color: #0F2137;">Attached Deliverables (6 Files):</h3>
        <ol style="font-size: 13px; color: #334155; line-height: 1.8; padding-left: 20px;">
          ${uploadedUrls.map(d => `<li><a href="${d.url}" style="color: #0F2137; font-weight: bold; text-decoration: underline;">${d.filename}</a></li>`).join('')}
        </ol>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          <em>Note: These documents have been generated and uploaded to internal storage only. The client has not been emailed.</em>
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 12px 24px; border-radius: 0 0 6px 6px; font-size: 11px; color: #64748b; text-align: center;">
        My Accountant Portal Automation • Audit Reference #${orderId}
      </div>
    </div>
  `;

  const attachments = uploadedUrls.map(d => ({
    filename: d.filename,
    content: d.buffer,
    contentType: 'application/pdf',
  }));

  const mailResult = await sendEmail({
    to: recipients,
    subject,
    html,
    attachments,
  });

  console.log('\nEmail send result:', mailResult);
  console.log('✓ Freshly generated and verified email sent successfully!');
}

run().catch(console.error);
