import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, getAdminStorage } from '../src/lib/firebase-admin';
import { sendEmail } from '../src/lib/email';
import { Order } from '../src/lib/types';

async function uploadToStorageWithRetry(localPath: string, destStoragePath: string, maxRetries = 3): Promise<string> {
  const bucketName = 'studio-2604127518-57889.firebasestorage.app';
  const bucket = getAdminStorage().bucket(bucketName);
  const fileBuffer = fs.readFileSync(localPath);
  const file = bucket.file(destStoragePath);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await file.save(fileBuffer, {
        metadata: {
          contentType: 'application/pdf',
        },
      });
      const encodedPath = encodeURIComponent(destStoragePath);
      return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
    } catch (err) {
      console.warn(`Upload attempt ${attempt} failed:`, (err as any)?.message);
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Upload failed');
}

async function run() {
  const orderId = '10139';
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new Error('Order #10139 not found');

  const order = orderSnap.data() as Order;
  const localPdf = path.resolve('scratch/order_10139_audit/BEE_Sworn_Affidavit_EME_10139.pdf');
  const storagePath = `orders/${orderId}/generated_drafts/BEE_Sworn_Affidavit_EME_${orderId}.pdf`;

  console.log(`Uploading BEE Sworn Affidavit to Firebase Storage...`);
  const url = await uploadToStorageWithRetry(localPdf, storagePath);
  console.log(`✓ Uploaded: ${url}`);

  const generatedDrafts: Record<string, string> = (order as any).generatedDrafts || {};
  generatedDrafts[`BEE_Sworn_Affidavit_EME_${orderId}.pdf`] = url;

  // Update order in Firestore
  await orderRef.update({
    generatedDrafts,
    fulfillmentStatus: 'Under Review',
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Updated Firestore Order #10139.');

  // Send review email to Kevin
  const recipients = ['kev@thinkestry.co.za', 'freesekevin@gmail.com'];
  const subject = `[FOR REVIEW] Order #10139 B-BBEE Sworn Affidavit (New Signature) — NO404 (PTY) LTD`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #0F2137; padding: 18px 24px; border-radius: 6px 6px 0 0; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; color: #ffffff;">My Accountant — Order Audit & BEE Document Review</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Order #10139 • NO404 (PTY) LTD (BEE Certificate - EME General)</p>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 14px; line-height: 1.6;">Hi Kevin,</p>
        <p style="font-size: 14px; line-height: 1.6;">
          The B-BBEE Sworn Affidavit (EME - General) has been updated with your new signature positioned on the signature line directly above the Commissioner of Oaths stamp:
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #c5a059; padding: 14px 18px; margin: 18px 0; font-size: 13px;">
          <strong>Audited Entity Details:</strong><br/>
          • <strong>Enterprise Name:</strong> NO404 (PTY) LTD<br/>
          • <strong>Registration Number:</strong> 2025/106479/07<br/>
          • <strong>Deponent:</strong> Roger Brendon Staples (ID: 8303045032083)<br/>
          • <strong>Black Ownership:</strong> 0% (Level 4 Contributor)<br/>
          • <strong>Commissioner:</strong> Kevin William Freese (CIBA #3561 / Ex Officio)
        </div>

        <h3 style="font-size: 14px; margin-top: 20px; color: #0F2137;">Deliverable:</h3>
        <p style="font-size: 13px;">
          📄 <a href="${url}" style="color: #0F2137; font-weight: bold; text-decoration: underline;">BEE_Sworn_Affidavit_EME_10139.pdf</a>
        </p>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          <em>Note: This document has been generated and uploaded to internal storage only. The client/partner has not been emailed.</em>
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 12px 24px; border-radius: 0 0 6px 6px; font-size: 11px; color: #64748b; text-align: center;">
        My Accountant Portal Automation • Audit Reference #${orderId}
      </div>
    </div>
  `;

  const mailResult = await sendEmail({
    to: recipients,
    subject,
    html,
    attachments: [
      {
        filename: `BEE_Sworn_Affidavit_EME_${orderId}.pdf`,
        content: fs.readFileSync(localPdf),
        contentType: 'application/pdf',
      },
    ],
  });

  console.log('\nEmail send result:', mailResult);
  console.log('✓ Sent review email with updated BEE Affidavit to Kevin.');
}

run().catch(console.error);
