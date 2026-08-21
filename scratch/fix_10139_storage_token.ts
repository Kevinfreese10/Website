import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, uploadBufferToStorage } from '../src/lib/firebase-admin';

async function fix10139DownloadUrl() {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc('10139');
  const snap = await orderRef.get();

  if (!snap.exists) {
    console.log('Order #10139 not found');
    return;
  }

  const order = snap.data()!;
  
  // 1. Get the local file buffer or read from storage
  const localPdfPath = path.resolve('scratch/order_10139_audit/BEE_Sworn_Affidavit_EME_10139.pdf');
  let pdfBuffer: Buffer;

  if (fs.existsSync(localPdfPath)) {
    pdfBuffer = fs.readFileSync(localPdfPath);
  } else {
    console.log('Local PDF not found, fetching from existing storage file');
    const { getAdminStorage } = await import('../src/lib/firebase-admin');
    const storage = getAdminStorage();
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-2604127518-57889.firebasestorage.app');
    const file = bucket.file('orders/10139/generated_drafts/BEE_Sworn_Affidavit_EME_10139.pdf');
    const [downloaded] = await file.download();
    pdfBuffer = downloaded;
  }

  // 2. Upload using uploadBufferToStorage which creates a valid token
  const tokenizedUrl = await uploadBufferToStorage(
    pdfBuffer,
    'orders/10139/generated_drafts/BEE_Sworn_Affidavit_EME_10139.pdf',
    'application/pdf'
  );

  console.log('New Tokenized Download URL:', tokenizedUrl);

  // 3. Update the notes array and generatedDrafts on Order #10139
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

  console.log('Successfully updated Order #10139 with tokenized download URL!');
}

fix10139DownloadUrl().catch(console.error);
