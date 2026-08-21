import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import https from 'https';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function auditOrder10143() {
  const db = getAdminDb();
  const orderId = '10143';
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) {
    console.error(`Order #${orderId} does not exist in Firestore! Checking all recent orders...`);
    const recentSnaps = await db.collection('orders').orderBy('createdAt', 'desc').limit(10).get();
    console.log('Recent orders:', recentSnaps.docs.map(d => ({ id: d.id, ...d.data() })));
    return;
  }

  const orderData = snap.data();
  console.log(`=== ORDER #${orderId} SNAPSHOT ===`);
  console.log(JSON.stringify(orderData, null, 2));

  // Fetch subcollection notes
  const notesSnap = await orderRef.collection('notes').orderBy('createdAt', 'asc').get();
  console.log(`\n=== ORDER #${orderId} NOTES (${notesSnap.size} notes) ===`);
  notesSnap.forEach(doc => {
    console.log(`[${doc.id}] [${doc.data().type || 'general'}] [${doc.data().createdAt}] ${doc.data().author || 'Unknown'}: ${doc.data().content}`);
  });

  // Save audit scratch directory
  const outDir = path.resolve('scratch/order_10143_audit');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, 'order_snapshot.json'), JSON.stringify(orderData, null, 2));

  // Download uploaded documents
  const uploads = (orderData?.documentUploads as any[]) || [];
  console.log(`\n=== ORDER #${orderId} UPLOADS (${uploads.length} items) ===`);
  for (let i = 0; i < uploads.length; i++) {
    const item = uploads[i];
    console.log(`- Item ${i + 1}: ${item.requirementLabel} (fileName: ${item.fileName}, status: ${item.status}) -> ${item.fileUrl}`);
    if (item.fileUrl) {
      const sanitizedName = (item.fileName || `doc_${i + 1}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const destPath = path.join(outDir, sanitizedName);
      try {
        console.log(`  Downloading ${item.fileUrl} to ${destPath}...`);
        await downloadFile(item.fileUrl, destPath);
        console.log(`  ✓ Saved ${sanitizedName} (${fs.statSync(destPath).size} bytes)`);
      } catch (err) {
        console.error(`  ✗ Error downloading ${item.fileUrl}:`, err);
      }
    }
  }
}

auditOrder10143().catch(console.error);
