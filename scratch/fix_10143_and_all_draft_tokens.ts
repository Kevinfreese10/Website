import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, getAdminStorage, uploadBufferToStorage } from '../src/lib/firebase-admin';

async function fixDraftTokensWithRetry() {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc('10143');
  const snap = await orderRef.get();
  if (!snap.exists) {
    console.log('Order #10143 not found');
    return;
  }

  const order = snap.data()!;
  const fileName = 'Accountants_Letter_Income_Confirmation_Alby_Festus_10143.pdf';
  const storagePath = `orders/10143/generated_drafts/${fileName}`;

  let pdfBuffer: Buffer | null = null;
  const localPath = path.resolve(`scratch/order_10143_audit/${fileName}`);
  if (fs.existsSync(localPath)) {
    pdfBuffer = fs.readFileSync(localPath);
  }

  if (!pdfBuffer) {
    console.error('Local buffer not found!');
    return;
  }

  let tokenizedUrl = '';
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}...`);
      tokenizedUrl = await uploadBufferToStorage(pdfBuffer, storagePath, 'application/pdf');
      console.log('Success! Token URL:', tokenizedUrl);
      break;
    } catch (e: any) {
      console.error(`Attempt ${attempt} error:`, e.message);
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  if (!tokenizedUrl) throw new Error('Upload failed after 8 attempts');

  const updatedNotes = (order.notes || []).map((n: any) => {
    if (n.attachments && Array.isArray(n.attachments)) {
      return {
        ...n,
        attachments: n.attachments.map((att: any) => {
          if (att.name === fileName || att.url?.includes(fileName)) {
            return { ...att, url: tokenizedUrl };
          }
          return att;
        }),
      };
    }
    return n;
  });

  const updatedDrafts = { ...(order.generatedDrafts || {}) };
  updatedDrafts[fileName] = tokenizedUrl;

  await orderRef.update({
    notes: updatedNotes,
    generatedDrafts: updatedDrafts,
    updatedAt: new Date().toISOString(),
  });

  console.log('Order #10143 successfully updated with token download URL!');
}

fixDraftTokensWithRetry().catch(console.error);
