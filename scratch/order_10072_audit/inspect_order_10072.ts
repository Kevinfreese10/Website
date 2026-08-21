import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import https from 'https';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../../src/lib/firebase-admin';

async function downloadFile(url: string, dest: string) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location!, (res) => {
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(dest); });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(dest); });
      }
    }).on('error', reject);
  });
}

async function inspectOrder10072() {
  const db = getAdminDb();
  const orderId = '10072';
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order #10072 not found');

  const data = snap.data();
  const dir = path.resolve('scratch/order_10072_audit');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(path.join(dir, 'order_10072_snapshot.json'), JSON.stringify(data, null, 2));
  console.log('✓ Saved order snapshot to scratch/order_10072_audit/order_10072_snapshot.json');

  console.log('\n--- ORDER METADATA ---');
  console.log('Customer Name:', data?.customerName);
  console.log('Customer Email:', data?.customerEmail);
  console.log('Customer Phone:', data?.customerPhone);
  console.log('End Customer Name:', data?.endCustomerName);
  console.log('End Customer Email:', data?.endCustomerEmail);
  console.log('Reseller / Partner ID:', data?.resellerId);
  console.log('Status:', data?.status);
  console.log('Fulfillment Status:', data?.fulfillmentStatus);
  console.log('Items:', JSON.stringify(data?.items, null, 2));

  console.log('\n--- UPLOADS ---');
  const uploads = data?.documentUploads || [];
  for (let i = 0; i < uploads.length; i++) {
    const u = uploads[i];
    console.log(`\nDoc ${i+1}: ${u.title || u.name}`);
    console.log(`  Status: ${u.status}`);
    console.log(`  URL: ${u.url || u.fileUrl}`);
    console.log(`  AI Status: ${u.aiStatus} (${u.aiConfidenceScore}%)`);
    console.log(`  AI Feedback: ${u.aiFeedback}`);

    if (u.url || u.fileUrl) {
      const url = u.url || u.fileUrl;
      const ext = url.includes('.pdf') ? '.pdf' : '.png';
      const cleanTitle = (u.title || u.name || `doc_${i}`).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const filePath = path.join(dir, `${i+1}_${cleanTitle}${ext}`);
      try {
        await downloadFile(url, filePath);
        console.log(`  ✓ Downloaded to: ${filePath}`);
      } catch (err) {
        console.warn(`  Failed to download:`, (err as any)?.message);
      }
    }
  }

  console.log('\n--- COMMUNICATION HISTORY / NOTES ---');
  const notes = data?.notes || [];
  notes.forEach((n: any, i: number) => {
    console.log(`\nNote ${i+1}: [${n.date ? (n.date._seconds ? new Date(n.date._seconds * 1000).toISOString() : n.date) : 'No Date'}] ${n.subject || 'No Subject'} (Author: ${n.authorId})`);
    console.log(`  isInternal: ${n.isInternal}`);
    console.log(`  Text: ${n.text}`);
    if (n.attachments) console.log(`  Attachments:`, n.attachments);
  });
}

inspectOrder10072().catch(console.error);
