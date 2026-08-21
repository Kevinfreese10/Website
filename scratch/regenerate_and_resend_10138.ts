import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, getAdminStorage } from '../src/lib/firebase-admin';
import { generateAccountingOfficerConsentDraft } from '../src/lib/pdf/template-generators';
import { sendEmail } from '../src/lib/email';
import { Order } from '../src/lib/types';

async function main() {
  const db = getAdminDb();
  const bucket = getAdminStorage().bucket('studio-2604127518-57889.firebasestorage.app');
  const orderId = '10138';

  const orderDoc = await db.collection('orders').doc(orderId).get();
  if (!orderDoc.exists) {
    console.error('Order 10138 not found');
    return;
  }

  const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;

  // Custom extracted info for FLEXIWILL (PTY) LTD
  const flexiwillInfo = {
    companyName: 'FLEXIWILL (PTY) LTD',
    regNumber: '2003/002867/07',
    customerName: 'Lethabo Selaelo Ramaphakela',
    idNumber: '9908220104082',
    address: '16 Impala Road, Clayville, 1666',
    orderDate: '20 August 2026',
  };

  console.log('Generating updated Accounting Officer Appointment Letter with digital signature & registration number...');
  const { buffer, fileName } = await generateAccountingOfficerConsentDraft(orderData, flexiwillInfo);

  // Save locally
  const outDir = path.resolve('c:/myacc/scratch/order_10138_audit');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const localPdfPath = path.join(outDir, fileName);
  fs.writeFileSync(localPdfPath, buffer);
  console.log(`Saved updated PDF locally: ${localPdfPath}`);

  // Upload to Firebase Storage
  const storagePath = `orders/${orderId}/generated_drafts/${fileName}`;
  const fileRef = bucket.file(storagePath);
  await fileRef.save(buffer, {
    metadata: { contentType: 'application/pdf' },
  });
  await fileRef.makePublic().catch(() => {});
  const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  console.log(`Uploaded to Firebase Storage: ${fileUrl}`);

  // Update order document drafts in Firestore
  const draftItem = {
    id: `draft_ao_${Date.now()}`,
    templateType: 'accounting_officer_letter',
    title: 'Accounting Officer Consent & Appointment Letter (Reg 67/68)',
    description: `Formal statutory appointment & consent letter for ${flexiwillInfo.companyName} (Reg: ${flexiwillInfo.regNumber}) issued with verified digital signature.`,
    fileUrl,
    fileName,
    generatedAt: new Date().toISOString(),
    status: 'draft',
    extractedData: flexiwillInfo,
  };

  const existingDrafts = (orderData.generatedDrafts || []).filter(
    (d: any) => d.templateType !== 'accounting_officer_letter' && !d.fileName?.includes('Accounting_Officer')
  );

  await db.collection('orders').doc(orderId).update({
    generatedDrafts: [draftItem, ...existingDrafts],
    updatedAt: new Date().toISOString(),
  });
  console.log('Updated order in Firestore.');

  // Resend email to Kevin
  const recipients = ['kev@thinkestry.co.za', 'freesekevin@gmail.com'];
  const subject = "Updated: Signed Accountant Appointment Letter — Order #10138 (FLEXIWILL (PTY) LTD)";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #0F2137; padding: 18px 24px; border-radius: 6px 6px 0 0; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; color: #ffffff;">My Accountant — Updated Signed Deliverable</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Order #10138 • FLEXIWILL (PTY) LTD</p>
      </div>

      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 14px; margin-top: 0;">Hi Kevin,</p>
        <p style="font-size: 14px; line-height: 1.5;">
          The <strong>Accountant Appointment Letter</strong> for <strong>FLEXIWILL (PTY) LTD</strong> has been updated with the requested details:
        </p>

        <ul style="font-size: 13px; line-height: 1.6; color: #334155;">
          <li><strong>Practice Registration Added:</strong> MY ACCOUNTANT (PTY) LTD (Registration Number: 2020 / 548105 / 07).</li>
          <li><strong>Digital Signature Applied:</strong> Stylized verified signature for Kevin Freese (CBAP SA #3561 • PR-0098553).</li>
          <li><strong>Signature Date:</strong> Dated 20 August 2026.</li>
        </ul>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 18px 0;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0F2137; text-transform: uppercase;">Entity Details</h4>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #64748b; width: 140px;"><strong>Applicant Entity:</strong></td><td style="padding: 4px 0; color: #0f172a;"><strong>FLEXIWILL (PTY) LTD</strong></td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Registration Number:</strong></td><td style="padding: 4px 0; color: #0f172a;">2003/002867/07</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Director:</strong></td><td style="padding: 4px 0; color: #0f172a;">Lethabo Selaelo Ramaphakela (ID: 9908220104082)</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Appointed Officer:</strong></td><td style="padding: 4px 0; color: #0f172a;">Kevin Freese (CIBA CBAP SA #3561 • SARS PR-0098553)</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Signing Practice:</strong></td><td style="padding: 4px 0; color: #0f172a;">My Accountant (Pty) Ltd (Reg: 2020 / 548105 / 07)</td></tr>
          </table>
        </div>

        <div style="margin: 24px 0; text-align: center;">
          <a href="${fileUrl}" 
             style="background-color: #0F2137; color: #ffffff; padding: 11px 22px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Updated PDF in Browser
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-bottom: 0;">
          The updated PDF is also attached to this email for your direct inspection.
        </p>
      </div>
    </div>
  `;

  console.log('Sending email to:', recipients);
  const emailRes = await sendEmail({
    to: recipients,
    subject,
    html,
    fromNameOverride: "My Accountant Operations",
    attachments: [
      {
        filename: fileName,
        content: buffer,
        contentType: 'application/pdf',
      },
    ],
  });

  console.log('Email delivery result:', emailRes);
}

main().catch(console.error);
