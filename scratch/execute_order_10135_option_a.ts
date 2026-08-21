import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, getAdminStorage } from '../src/lib/firebase-admin';
import { sendEmail } from '../src/lib/email';
import { Order } from '../src/lib/types';

async function uploadToStorage(localPath: string, destStoragePath: string): Promise<string> {
  const bucketName = 'studio-2604127518-57889.firebasestorage.app';
  const bucket = getAdminStorage().bucket(bucketName);
  const fileBuffer = fs.readFileSync(localPath);
  const file = bucket.file(destStoragePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType: 'application/pdf',
    },
  });

  const encodedPath = encodeURIComponent(destStoragePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
}

async function executeOptionA() {
  const orderId = '10135';
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error('Order 10135 not found');
  }

  const order = orderSnap.data() as Order;
  const packDir = path.resolve('scratch/order_10135_audit/generated_statutory_pack');
  const files = fs.readdirSync(packDir).filter(f => f.endsWith('.pdf'));

  console.log(`Uploading ${files.length} statutory documents to Firebase Storage for Order #${orderId}...`);
  const uploadedDocs: { name: string; filename: string; url: string; localPath: string }[] = [];

  for (const filename of files) {
    const localPath = path.join(packDir, filename);
    const storagePath = `orders/${orderId}/generated_drafts/${filename}`;
    const url = await uploadToStorage(localPath, storagePath);
    uploadedDocs.push({
      name: filename.replace(/_/g, ' ').replace(/\.pdf$/, ''),
      filename,
      url,
      localPath,
    });
    console.log(`✓ Uploaded: ${filename} -> ${url}`);
  }

  // Update order generatedDrafts in Firestore
  const generatedDrafts: Record<string, string> = (order as any).generatedDrafts || {};
  uploadedDocs.forEach(d => {
    generatedDrafts[d.filename] = d.url;
  });

  // Update SOP checklist
  const checklist = (order.checklist || []).map(step => {
    if (step.stepNumber === 1 || step.id === 'step-1') {
      return {
        ...step,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      };
    }
    if (step.stepNumber === 2 || step.id === 'step-2') {
      return {
        ...step,
        status: 'completed' as const,
        artifactUrl: uploadedDocs[0]?.url || '',
        completedAt: new Date().toISOString(),
      };
    }
    return step;
  });

  await orderRef.update({
    generatedDrafts,
    checklist,
    fulfillmentStatus: 'In Execution',
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Firestore Order #10135 updated (SOP steps 1 & 2 completed, drafts linked).');

  // Send email to Kevin for internal review
  const recipients = ['kev@thinkestry.co.za', 'freesekevin@gmail.com'];
  const subject = `[FOR REVIEW] Order #10135 Complete NCR Statutory Pack — FIRST BLOOM FINANCE (PTY) LTD`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #0F2137; padding: 18px 24px; border-radius: 6px 6px 0 0; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; color: #ffffff;">My Accountant — Order Audit & Statutory Pack Review</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Order #10135 • FIRST BLOOM FINANCE (PTY) LTD (NCR Registration)</p>
      </div>

      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 14px; margin-top: 0;">Hi Kevin,</p>
        <p style="font-size: 14px; line-height: 1.5;">
          The complete statutory document pack for <strong>Order #10135 (FIRST BLOOM FINANCE (PTY) LTD)</strong> has been compiled and audited against all uploaded KYC documents.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 18px 0;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0F2137; text-transform: uppercase;">Entity & Director Summary</h4>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #64748b; width: 140px;"><strong>Applicant Entity:</strong></td><td style="padding: 4px 0; color: #0f172a;"><strong>FIRST BLOOM FINANCE (PTY) LTD</strong></td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Registration Number:</strong></td><td style="padding: 4px 0; color: #0f172a;">2026/507901/07</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Director / Shareholder:</strong></td><td style="padding: 4px 0; color: #0f172a;">Peturnia Tiyiselani Mavundlha (ID: 9901300233087)</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Registered Address:</strong></td><td style="padding: 4px 0; color: #0f172a;">Stand No 51, Makhushane, Phalaborwa, Limpopo, 1390</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>Bank Details:</strong></td><td style="padding: 4px 0; color: #0f172a;">Standard Bank • Acc: 0000010284230314 • Sandton City</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>PCC Reference:</strong></td><td style="padding: 4px 0; color: #0f172a;">Enquiry No: 2026366679 (Issued: 05/08/2026)</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;"><strong>NCR Application Fee:</strong></td><td style="padding: 4px 0; color: #0f172a;">R1,800.00 Paid (Ref: 202650790107)</td></tr>
          </table>
        </div>

        <h4 style="margin: 18px 0 8px 0; font-size: 13px; color: #0F2137; text-transform: uppercase;">Generated Statutory Documents (${uploadedDocs.length})</h4>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
          ${uploadedDocs.map(d => `
            <div style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
              📄 <a href="${d.url}" style="color: #2563eb; font-weight: bold; text-decoration: none; font-size: 13px;">${d.filename}</a>
            </div>
          `).join('')}
        </div>

        <p style="font-size: 13px; color: #334155;">
          All 6 PDF deliverables are attached directly to this email for your offline inspection.
        </p>

        <p style="font-size: 12px; color: #dc2626; background-color: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 4px; margin-top: 20px;">
          <strong>Security Protocol:</strong> In accordance with your instruction, the client has NOT been emailed, and Communication History has not been updated yet.
        </p>
      </div>
    </div>
  `;

  const attachments = uploadedDocs.map(d => ({
    filename: d.filename,
    content: fs.readFileSync(d.localPath),
    contentType: 'application/pdf',
  }));

  console.log('Sending email with 6 attached PDFs to:', recipients);
  const emailRes = await sendEmail({
    to: recipients,
    subject,
    html,
    attachments,
    fromNameOverride: 'My Accountant Operations',
  });

  console.log('Email send result:', emailRes);
  console.log('\n✓ Option A executed successfully!');
}

executeOptionA().catch(console.error);
