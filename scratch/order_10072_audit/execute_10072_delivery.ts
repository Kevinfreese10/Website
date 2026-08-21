import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, getAdminStorage } from '../../src/lib/firebase-admin';
import { sendEmail } from '../../src/lib/email';
import { Order } from '../../src/lib/types';

async function uploadToStorageWithRetry(localPath: string, destStoragePath: string, maxRetries = 5): Promise<string> {
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
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('Upload failed');
}

async function run() {
  const orderId = '10072';
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new Error('Order #10072 not found');

  const order = orderSnap.data() as Order;
  const dir = path.resolve('scratch/order_10072_audit');

  const poaLocalPath = path.join(dir, 'Power_of_Attorney_COIDA_Kevin_Freese_BUILD_X_HARDWARE_AND_BUILDWARE_CC.pdf');
  const poaFileName = `Power_of_Attorney_COIDA_Kevin_Freese_BUILD_X_${orderId}.pdf`;
  const poaStoragePath = `orders/${orderId}/generated_drafts/${poaFileName}`;

  const cf1bLocalPath = path.join(dir, 'COIDA_CF1B_Application_Form_BUILD_X_HARDWARE_AND_BUILDWARE_CC.pdf');
  const cf1bFileName = `COIDA_CF1B_Application_Form_BUILD_X_${orderId}.pdf`;
  const cf1bStoragePath = `orders/${orderId}/generated_drafts/${cf1bFileName}`;

  console.log(`Uploading Special Power of Attorney to Firebase Storage...`);
  const poaUrl = await uploadToStorageWithRetry(poaLocalPath, poaStoragePath);
  console.log(`✓ POA Uploaded: ${poaUrl}`);

  console.log(`Uploading Form CF-1B to Firebase Storage...`);
  const cf1bUrl = await uploadToStorageWithRetry(cf1bLocalPath, cf1bStoragePath);
  console.log(`✓ CF-1B Uploaded: ${cf1bUrl}`);

  const generatedDrafts: Record<string, string> = (order as any).generatedDrafts || {};
  generatedDrafts[poaFileName] = poaUrl;
  generatedDrafts[cf1bFileName] = cf1bUrl;

  // Update order in Firestore
  await orderRef.update({
    generatedDrafts,
    fulfillmentStatus: 'Under Review',
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Updated Firestore Order #10072.');

  // Send review email to Kevin
  const recipients = ['kev@thinkestry.co.za', 'freesekevin@gmail.com'];
  const subject = `[FOR REVIEW] Order #10072 Form CF-1B & Power of Attorney — BUILD X HARDWARE AND BUILDWARE CC`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #0F2137; padding: 18px 24px; border-radius: 6px 6px 0 0; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; color: #ffffff;">My Accountant — Statutory Lodgement Dossier</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Order #10072 • BUILD X HARDWARE AND BUILDWARE CC (COIDA Nature of Business Change)</p>
      </div>
      
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 14px; line-height: 1.6;">Hi Kevin,</p>
        <p style="font-size: 14px; line-height: 1.6;">
          The statutory pack for <strong>Order #10072 (COIDA Nature of Business Change)</strong> has been drafted and verified against the official Department of Employment and Labour templates for your review:
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #c5a059; padding: 14px 18px; margin: 18px 0; font-size: 13px;">
          <strong>Audited Employer Particulars:</strong><br/>
          • <strong>Enterprise Name:</strong> BUILD X HARDWARE AND BUILDWARE CC<br/>
          • <strong>Registration Number:</strong> 2000/027067/23 | <strong>VAT:</strong> 4700191275<br/>
          • <strong>Compensation Fund Ref:</strong> 990000235838<br/>
          • <strong>Sole Member / Director:</strong> Clyle Kemm (ID: 7209235069083)<br/>
          • <strong>Current Classification:</strong> Building Construction<br/>
          • <strong>Target Subclass:</strong> Subclass 0710 (Commerce / General Retailers & Hardware Merchants)<br/>
          • <strong>Effective Date:</strong> 15 September 2025
        </div>

        <h3 style="font-size: 14px; margin-top: 20px; color: #0F2137;">Draft Deliverables:</h3>
        <p style="font-size: 13px;">
          📄 <a href="${cf1bUrl}" style="color: #0F2137; font-weight: bold; text-decoration: underline;">${cf1bFileName}</a> (Official 3-Page Form CF-1B)<br/>
          📄 <a href="${poaUrl}" style="color: #0F2137; font-weight: bold; text-decoration: underline;">${poaFileName}</a> (Special Power of Attorney)
        </p>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          <em>Note: Both PDFs are attached to this email. Documents have been saved to internal storage for your review before lodging with the Compensation Commissioner.</em>
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
        filename: cf1bFileName,
        content: fs.readFileSync(cf1bLocalPath),
        contentType: 'application/pdf',
      },
      {
        filename: poaFileName,
        content: fs.readFileSync(poaLocalPath),
        contentType: 'application/pdf',
      },
    ],
  });

  console.log('\nEmail send result:', mailResult);
  console.log('✓ Sent review email with attached Form CF-1B and POA to Kevin.');
}

run().catch(console.error);
