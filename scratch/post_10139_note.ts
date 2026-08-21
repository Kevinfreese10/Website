import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { sendEmail } from '../src/lib/email';
import { Order } from '../src/lib/types';

async function postOrder10139Note() {
  const db = getAdminDb();
  const orderId = '10139';
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error(`Order #${orderId} not found`);

  const order = snap.data() as Order;
  const downloadUrl = (order as any).generatedDrafts?.['BEE_Sworn_Affidavit_EME_10139.pdf'] ||
    'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10139%2Fgenerated_drafts%2FBEE_Sworn_Affidavit_EME_10139.pdf?alt=media';

  const noteContent = `Dear Nic & NO404 (PTY) LTD Team,

Your B-BBEE Sworn Affidavit (EME - General) has been audited, drafted, attested, and stamped by our Commissioner of Oaths (Kevin William Freese, CIBA #3561, Ex Officio).

Audited Particulars:
• Enterprise: NO404 (PTY) LTD (Reg: 2025/106479/07)
• Deponent: Roger Brendon Staples (ID: 8303045032083)
• Ownership: 0% Black Owned / 100% White Owned (Level 4 Contributor - 100% Procurement Recognition)
• Financial Year End: 28 February 2026

Please download and review your completed B-BBEE Sworn Affidavit here:
📄 ${downloadUrl}

Next Step:
Please have the deponent (Roger Brendon Staples) sign and date the "Deponent Signature" section on Page 2 for your official records and procurement submissions.

Thank you for choosing My Accountant!`;

  // 1. Post to notes subcollection
  const noteRef = await orderRef.collection('notes').add({
    content: noteContent,
    createdAt: new Date().toISOString(),
    author: 'My Accountant Support',
    type: 'partner', // Visible to client/partner
  });
  console.log(`✓ Added note to orders/${orderId}/notes with id: ${noteRef.id}`);

  // 2. Update order status
  await orderRef.update({
    status: 'Waiting on Customer',
    fulfillmentStatus: 'Waiting on Customer',
    updatedAt: new Date().toISOString(),
  });
  console.log(`✓ Updated Order #${orderId} status to 'Waiting on Customer'.`);
}

postOrder10139Note().catch(console.error);
