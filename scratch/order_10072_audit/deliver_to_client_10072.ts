import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

async function deliverToClient10072() {
  const db = getAdminDb();
  const orderId = '10072';
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Order #10072 not found');

  const orderData = snap.data();
  const drafts = (orderData as any).generatedDrafts || {};

  const cf1bUrl = drafts[`COIDA_CF1B_Application_Form_BUILD_X_${orderId}.pdf`] ||
    'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10072%2Fgenerated_drafts%2FCOIDA_CF1B_Application_Form_BUILD_X_10072.pdf?alt=media';

  const poaUrl = drafts[`Power_of_Attorney_COIDA_Kevin_Freese_BUILD_X_${orderId}.pdf`] ||
    'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10072%2Fgenerated_drafts%2FPower_of_Attorney_COIDA_Kevin_Freese_BUILD_X_10072.pdf?alt=media';

  const noteText = `Dear Zarika & the BUILD X Team,

Thank you for providing the signed Annual Financial Statements and Instruction Letter. We have audited all submitted records and prepared the official statutory application pack for submission to the Compensation Commissioner:

1. **Form CF-1B (Application for Change of Nature of Business / Subclass 0710)**
2. **Special Power of Attorney (COIDA Mandate to Kevin Freese / My Accountant)**

**Action Required from Client:**
Please have the authorised member/director (**Clyle Kemm**) sign the two attached documents:
• **Form CF-1B:** Sign and date **Page 3** under the *"Employer Representative / Delegated Official / Employer"* section.
• **Special Power of Attorney:** Sign and date at the bottom signature line.

Once signed, please upload both documents here in your **Communication History** or reply with the signed copies. We will immediately lodge the complete dossier with the Compensation Fund and track the reclassification to obtain the official 5000-series case reference number.`;

  const newNote = {
    text: noteText,
    subject: 'Action Required: Please Sign & Return Form CF-1B and Special Power of Attorney',
    authorId: 'system',
    date: new Date(),
    type: 'note',
    isInternal: false, // Visible to client & partner
    attachments: [
      {
        name: 'COIDA_CF1B_Application_Form_BUILD_X_10072.pdf',
        url: cf1bUrl,
      },
      {
        name: 'Power_of_Attorney_COIDA_Kevin_Freese_BUILD_X_10072.pdf',
        url: poaUrl,
      },
    ],
  };

  await orderRef.update({
    notes: FieldValue.arrayUnion(newNote),
    status: 'Waiting on Customer',
    fulfillmentStatus: 'Waiting on Customer',
    updatedAt: new Date().toISOString(),
  });

  console.log('✓ Successfully posted statutory deliverables to Communication History for Order #10072 and updated status to Waiting on Customer.');
}

deliverToClient10072().catch(console.error);
