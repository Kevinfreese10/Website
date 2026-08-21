import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { transitionOrderStatusAtomic } from '../../src/app/actions/order-admin-actions';

async function completeOrder10143() {
  const db = getAdminDb();
  const orderId = '10143';
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order #10143 not found');

  const orderData = snap.data();
  const downloadUrl = (orderData as any).generatedDrafts?.['Accountants_Letter_Income_Confirmation_Alby_Festus_10143.pdf'] ||
    'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10143%2Fgenerated_drafts%2FAccountants_Letter_Income_Confirmation_Alby_Festus_10143.pdf?alt=media';

  const noteText = `Dear Alby,

Please find attached your official **Accountant’s Confirmation of Income & Director Drawings Letter** addressed to **Nedbank Limited** (Credit Assessment & Underwriting Department) in support of your Revolving Credit Facility application.

**Audited & Confirmed Particulars:**
• **Applicant:** Mr. Alby Festus (ID: 0409016640180)
• **Operating Entities:** GLOWGRID STUDIO (PTY) LTD & CONFIDENT GROUP (PTY) LTD
• **Verified Banking:** RMB Private Bank Fusion Account #63034793364
• **3-Month Verified Net Income (excl. interbank transfers):** R 861,007.00
• **Average Monthly Net Inflow / Earnings:** R 287,002.33 / month
• **Confirmed Declared Monthly Drawings / Income:** R 235,000.00 / month

The letter has been prepared on our My Accountant executive letterhead, digitally signed with our Chartered Business Accountant in Practice (SA) CIBA credentials (#3561), and is ready for submission to Nedbank.

Thank you for choosing My Accountant. Please don't hesitate to reach out if Nedbank requires any additional attestation.`;

  const newNote = {
    text: noteText,
    subject: "Accountant's Confirmation of Income & Director Drawings Letter — Completed",
    authorId: 'system',
    date: new Date(),
    type: 'note',
    isInternal: false, // Client visible
    attachments: [
      {
        name: 'Accountants_Letter_Income_Confirmation_Alby_Festus_10143.pdf',
        url: downloadUrl,
      },
    ],
  };

  // 1. Post to Communication History
  await orderRef.update({
    notes: FieldValue.arrayUnion(newNote),
    fulfillmentStatus: 'Completed',
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Appended note with attachment to order.notes for Order #10143.');

  // 2. Transition status to Completed
  const performer = {
    id: 'system',
    name: 'Kevin Freese (Admin)',
  };

  const res = await transitionOrderStatusAtomic(orderId, 'Completed', performer, {
    bypassChecks: true,
    bypassReason: 'Document delivered to client Communication History upon Kevin review.',
  });

  console.log('✓ Order status transition result:', res);
}

completeOrder10143().catch(console.error);
