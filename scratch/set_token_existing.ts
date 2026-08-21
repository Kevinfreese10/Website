import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminStorage, getAdminDb } from '../src/lib/firebase-admin';

async function updateFileToken() {
  const db = getAdminDb();
  const storage = getAdminStorage();
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-2604127518-57889.firebasestorage.app';
  const bucket = storage.bucket(bucketName);
  const file = bucket.file('orders/10139/generated_drafts/BEE_Sworn_Affidavit_EME_10139.pdf');

  const token = 'myacc-bee-affidavit-10139-token';
  
  // Set metadata with download token
  await file.setMetadata({
    metadata: {
      firebaseStorageDownloadTokens: token,
    },
  });

  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent('orders/10139/generated_drafts/BEE_Sworn_Affidavit_EME_10139.pdf')}?alt=media&token=${token}`;
  console.log('Generated Token URL:', downloadUrl);

  const orderRef = db.collection('orders').doc('10139');
  const snap = await orderRef.get();
  const order = snap.data()!;

  const updatedNotes = (order.notes || []).map((n: any) => {
    if (n.attachments && Array.isArray(n.attachments)) {
      return {
        ...n,
        attachments: n.attachments.map((att: any) => {
          if (att.name === 'BEE_Sworn_Affidavit_EME_10139.pdf' || att.url?.includes('BEE_Sworn_Affidavit_EME_10139.pdf')) {
            return {
              ...att,
              url: downloadUrl,
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
    'generatedDrafts.BEE_Sworn_Affidavit_EME_10139.pdf': downloadUrl,
    updatedAt: new Date().toISOString(),
  });

  console.log('Order #10139 updated with token download URL successfully!');
}

updateFileToken().catch(console.error);
