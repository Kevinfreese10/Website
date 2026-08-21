import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

async function postTaxClearanceNote() {
  const orderId = '10135';
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) {
    throw new Error(`Order #${orderId} not found in Firestore.`);
  }

  const orderData = snap.data() || {};
  console.log(`Auditing Order #${orderId} (${orderData.companyName || orderData.customerName})...`);

  const clientNote = {
    text: `Dear Peturnia,\n\nThank you for providing the initial company documents for FIRST BLOOM FINANCE (PTY) LTD.\n\nTo complete and finalize your NCR Form 2 statutory application pack, we require your official SARS Tax Clearance Certificate or SARS Tax Compliance Status PIN.\n\nThis is a mandatory requirement by the National Credit Regulator (NCR), as the entity's official SARS Income Tax Reference Number and VAT status must be confirmed directly from SARS records before submission.\n\nPlease upload your SARS Tax Clearance PIN or Certificate here in your portal at your earliest convenience so we can finalize and submit your application.\n\nKind regards,\nMy Accountant Compliance Team`,
    authorId: 'admin',
    date: new Date(),
    type: 'note',
    isInternal: false,
    subject: 'Action Required: SARS Tax Clearance PIN / Certificate Required for NCR Registration',
    attachments: null,
  };

  const internalNote = {
    text: `[AUDIT GATEWAY - 21 Aug 2026] Order audited. Official templates integrated (Form 2, Annexure of Fees, Share Certificate, TP-POA, AO Appointment Letter). Drafting halted at mandatory prerequisite gate pending client's SARS Tax Clearance PIN/Certificate. Client notification posted to Communication History.`,
    authorId: 'admin',
    date: new Date(),
    type: 'note',
    isInternal: true,
    subject: 'NCR Audit Gate: Blocked on SARS Tax Clearance',
    attachments: null,
  };

  // Update order notes array and set fulfillment status to Waiting on Customer
  await orderRef.update({
    notes: FieldValue.arrayUnion(clientNote, internalNote),
    fulfillmentStatus: 'Waiting on Customer',
    status: 'Waiting for Information',
    updatedAt: new Date().toISOString(),
  });

  console.log(`✓ Successfully posted client note and internal audit note to Order #${orderId} Communication History.`);
  console.log(`✓ Order #${orderId} status set to 'Waiting on Customer' / 'Waiting for Information'.`);
}

postTaxClearanceNote().catch(console.error);
