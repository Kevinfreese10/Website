import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

async function updateOrder10139Notes() {
  const db = getAdminDb();
  const orderId = '10139';
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order #10139 not found');

  const orderData = snap.data();
  const downloadUrl = (orderData as any).generatedDrafts?.['BEE_Sworn_Affidavit_EME_10139.pdf'] ||
    'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10139%2Fgenerated_drafts%2FBEE_Sworn_Affidavit_EME_10139.pdf?alt=media';

  const noteText = `Dear Nic & NO404 (PTY) LTD Team,

Your B-BBEE Sworn Affidavit (EME - General) has been audited, drafted, attested, and stamped by our Commissioner of Oaths (Kevin William Freese, CIBA #3561, Ex Officio).

Audited Particulars:
• Enterprise: NO404 (PTY) LTD (Reg: 2025/106479/07)
• Deponent: Roger Brendon Staples (ID: 8303045032083)
• Ownership: 0% Black Owned / 100% White Owned (Level 4 Contributor - 100% Procurement Recognition)
• Financial Year End: 28 February 2026

Please review your completed B-BBEE Sworn Affidavit attached below.

Next Step:
Please have the deponent (Roger Brendon Staples) sign and date the "Deponent Signature" section on Page 2 for your official records and procurement submissions.`;

  const newNote = {
    text: noteText,
    subject: 'B-BBEE Sworn Affidavit (EME General) — Completed & Attested',
    authorId: 'system',
    date: new Date(),
    type: 'note',
    isInternal: false, // Visible to client & partner in Communication History
    attachments: [
      {
        name: 'BEE_Sworn_Affidavit_EME_10139.pdf',
        url: downloadUrl,
      },
    ],
  };

  await orderRef.update({
    notes: FieldValue.arrayUnion(newNote),
    status: 'Waiting on Customer',
    fulfillmentStatus: 'Waiting on Customer',
    updatedAt: new Date().toISOString(),
  });

  console.log('✓ Successfully appended note with attachment to order.notes array for Order #10139!');
}

updateOrder10139Notes().catch(console.error);
