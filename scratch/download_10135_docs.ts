import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { Order } from '../src/lib/types';
import axios from 'axios';

async function downloadAndInspect10135() {
  const db = getAdminDb();
  const doc = await db.collection('orders').doc('10135').get();
  if (!doc.exists) {
    console.error('Order 10135 not found');
    return;
  }

  const order = doc.data() as Order;
  const outDir = path.resolve(process.cwd(), 'scratch/order_10135_audit');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('--- Order 10135 Notes & History ---');
  (order.notes || []).forEach((n, idx) => {
    console.log(`${idx + 1}. [${n.createdAt || 'N/A'}] ${n.authorName || 'Staff'}: "${n.content || (n as any).note || (n as any).message || ''}"`);
    if (n.attachments && n.attachments.length > 0) {
      console.log(`   Attachments: ${JSON.stringify(n.attachments)}`);
    }
  });

  console.log('\n--- Downloading Uploaded Files ---');
  const uploads = order.documentUploads || [];
  for (const u of uploads) {
    if (u.fileUrl && u.fileUrl.startsWith('http')) {
      const filename = path.basename(new URL(u.fileUrl).pathname.split('/').pop() || 'file.pdf');
      const cleanName = filename.replace(/^.*?_orders%2F10135%2F/, '').replace(/^.*?-/, '');
      const localPath = path.join(outDir, cleanName);
      
      try {
        const res = await axios.get(u.fileUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(localPath, res.data);
        console.log(`✓ Downloaded [${u.requirementLabel || u.id}]: ${cleanName} (${res.data.length} bytes) -> ${localPath}`);
      } catch (err: any) {
        console.error(`✗ Error downloading ${u.fileUrl}:`, err.message);
      }
    }
  }
}

downloadAndInspect10135().catch(console.error);
