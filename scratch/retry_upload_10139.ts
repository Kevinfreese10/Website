import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, uploadBufferToStorage } from '../src/lib/firebase-admin';

async function retryFix() {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc('10139');
  const snap = await orderRef.get();
  const order = snap.data()!;

  const localPdfPath = path.resolve('scratch/order_10139_audit/BEE_Sworn_Affidavit_EME_10139.pdf');
  const pdfBuffer = fs.readFileSync(localPdfPath);

  let tokenizedUrl = '';
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}...`);
      tokenizedUrl = await uploadBufferToStorage(
        pdfBuffer,
        'orders/10139/generated_drafts/BEE_Sworn_Affidavit_EME_10139.pdf',
        'application/pdf'
      );
      console.log('Upload success! URL:', tokenizedUrl);
      break;
    } catch (e: any) {
      console.error(`Attempt ${attempt} failed:`, e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!tokenizedUrl) throw new Error('Failed to upload after 5 attempts');

  const updatedNotes = (order.notes || []).map((n: any) => {
    if (n.attachments && Array.isArray(n.attachments)) {
      return {
        ...n,
        attachments: n.attachments.map((att: any) => {
          if (att.name === 'BEE_Sworn_Affidavit_EME_10139.pdf' || att.url?.includes('BEE_Sworn_Affidavit_EME_10139.pdf')) {
            return {
              ...att,
              url: tokenizedUrl,
            };
          }
          return att;
        }),
      };
    }
    return n;
  });

  await orderRef.update({
    notes: updatedNotes,
    'generatedDrafts.BEE_Sworn_Affidavit_EME_10139.pdf': tokenizedUrl,
    updatedAt: new Date().toISOString(),
  });

  console.log('Order #10139 updated with public download token URL!');
}

retryFix().catch(console.error);
