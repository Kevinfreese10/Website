import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, getAdminStorage } from '../../../../src/lib/firebase-admin';
import { sendEmail } from '../../../../src/lib/email';
import { Order } from '../../../../src/lib/types';

async function uploadToStorage(localPath: string, destStoragePath: string): Promise<string> {
  const bucket = getAdminStorage().bucket();
  const fileBuffer = fs.readFileSync(localPath);
  const file = bucket.file(destStoragePath);
  
  await file.save(fileBuffer, {
    metadata: {
      contentType: 'application/pdf',
    },
  });

  const bucketName = bucket.name;
  const encodedPath = encodeURIComponent(destStoragePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
}

async function deliverCmd(orderId: string, options: { forcePost?: boolean; forceEmail?: boolean; approveAndPost?: boolean }) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();
  
  if (!orderDoc.exists) {
    throw new Error(`Order #${orderId} not found.`);
  }

  const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
  const auditDir = path.resolve(process.cwd(), `scratch/order_${orderId}_audit`);
  
  if (!fs.existsSync(auditDir)) {
    throw new Error(`Audit directory not found: ${auditDir}. Run audit_order.ts generate first.`);
  }

  const files = fs.readdirSync(auditDir).filter(f => f.endsWith('.pdf'));
  if (files.length === 0) {
    throw new Error(`No PDF files found in ${auditDir} to upload.`);
  }

  console.log(`Uploading ${files.length} document(s) for Order #${orderId}...`);
  const uploadedUrls: { name: string; url: string; localPath: string }[] = [];

  for (const filename of files) {
    const localPath = path.join(auditDir, filename);
    const storagePath = `orders/${orderId}/generated_drafts/${filename}`;
    const url = await uploadToStorage(localPath, storagePath);
    uploadedUrls.push({ name: filename, url, localPath });
    console.log(`Uploaded: ${filename} -> ${url}`);
  }

  // Update order document with drafts
  const existingDrafts = (order as any).generatedDrafts || {};
  for (const item of uploadedUrls) {
    existingDrafts[item.name] = item.url;
  }

  // Update SOP checklist step 2 or matching step
  const checklist = order.checklist || [];
  const updatedChecklist = checklist.map(step => {
    if (step.id === 'step-2' || step.stepNumber === 2 || step.title.toLowerCase().includes('draft') || step.title.toLowerCase().includes('accounting officer')) {
      return {
        ...step,
        status: 'completed' as const,
        artifactUrl: uploadedUrls[0].url,
        completedAt: new Date().toISOString(),
      };
    }
    return step;
  });

  await orderRef.update({
    generatedDrafts: existingDrafts,
    checklist: updatedChecklist,
    updatedAt: new Date().toISOString(),
  });

  console.log(`Updated Firestore document and SOP checklist for Order #${orderId}.`);

  // Calculate average AI confidence from uploaded KYC docs
  const uploads = order.documentUploads || [];
  const confidences = uploads
    .filter(u => u.aiVerification && typeof u.aiVerification.confidence === 'number')
    .map(u => u.aiVerification!.confidence);
  
  const avgConfidence = confidences.length > 0 
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 95; // Default if manually verified

  const shouldAutoPost = (avgConfidence >= 90 || options.forcePost || options.approveAndPost) && !options.forceEmail;

  if (shouldAutoPost) {
    console.log(`\nDelivery Routing: AUTO-POST (Confidence: ${avgConfidence}% >= 90% or approved)`);
    
    // Post note to Communication History
    const notesRef = db.collection('orders').doc(orderId).collection('notes');
    const docLinks = uploadedUrls.map(u => `<p>📄 <a href="${u.url}" target="_blank" style="color: #2563eb; font-weight: bold;">${u.name}</a></p>`).join('\n');
    
    await notesRef.add({
      sender: 'My Accountant Operations',
      senderRole: 'admin',
      message: `Statutory deliverables and appointment documents have been generated, audited, and attached for your records.<br/><br/>${docLinks}`,
      isInternal: false,
      attachments: uploadedUrls.map(u => ({ name: u.name, url: u.url })),
      createdAt: new Date().toISOString(),
    });

    console.log(`Successfully posted note with deliverables to Communication History for Order #${orderId}.`);
  } else {
    console.log(`\nDelivery Routing: EMAIL KEVIN FOR REVIEW (Confidence: ${avgConfidence}% < 90%)`);
    
    const subject = `[FOR REVIEW] Order #${orderId} Deliverable Audit (${(order as any).companyName || order.customerName})`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #0F2137; padding: 16px 20px; border-radius: 6px 6px 0 0; color: #ffffff;">
          <h3 style="margin: 0; color: #ffffff;">My Accountant — Order Audit Deliverable Review</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Order #${orderId} • Confidence: ${avgConfidence}%</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Hi Kevin,</p>
          <p>The statutory deliverable(s) for <strong>Order #${orderId} (${(order as any).companyName || order.customerName})</strong> have been generated and require your review.</p>
          <div style="background-color: #f8fafc; padding: 14px; border: 1px solid #e2e8f0; border-radius: 6px; margin: 16px 0;">
            ${uploadedUrls.map(u => `<p style="margin: 4px 0;">📄 <a href="${u.url}" style="color: #2563eb; font-weight: bold;">${u.name}</a></p>`).join('')}
          </div>
          <p style="font-size: 12px; color: #64748b;"><em>Communication History has not been updated. Run with --approve-and-post after reviewing to publish to client.</em></p>
        </div>
      </div>
    `;

    const attachments = uploadedUrls.map(u => ({
      filename: u.name,
      content: fs.readFileSync(u.localPath),
      contentType: 'application/pdf',
    }));

    await sendEmail({
      to: ['info@myacc.co.za'],
      subject,
      html,
      attachments,
      fromNameOverride: 'My Accountant Operations',
    });

    console.log(`Review email sent to info@myacc.co.za.`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const orderIdIdx = args.indexOf('--order-id');
  const orderId = orderIdIdx !== -1 ? args[orderIdIdx + 1] : undefined;

  if (!orderId) {
    console.error('Usage: npx tsx scripts/deliver_order.ts --order-id <ID> [--force-post] [--force-email] [--approve-and-post]');
    process.exit(1);
  }

  const forcePost = args.includes('--force-post');
  const forceEmail = args.includes('--force-email');
  const approveAndPost = args.includes('--approve-and-post');

  await deliverCmd(orderId, { forcePost, forceEmail, approveAndPost });
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
