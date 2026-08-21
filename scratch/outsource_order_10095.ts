import fs from 'fs';
import { resolve } from 'path';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  
  console.log('Updating Order 10095 fulfillment to Outsourced...');

  const orderRef = db.collection('orders').doc('10095');
  const snap = await orderRef.get();

  if (!snap.exists) {
    console.error('Order 10095 does not exist!');
    process.exit(1);
  }

  const currentData = snap.data()!;
  console.log('Current Order 10095 status/isOutsourced:', {
    id: currentData.id,
    status: currentData.status,
    isOutsourced: currentData.isOutsourced,
    resellerId: currentData.resellerId,
    customerName: currentData.customerName,
    customerEmail: currentData.customerEmail,
    endCustomerName: currentData.endCustomerName,
    endCustomerEmail: currentData.endCustomerEmail,
    documentContact: currentData.documentContact
  });

  const note = {
    text: "Order fulfillment set to Outsourced.",
    authorId: "system",
    date: new Date(),
    type: "note",
    subject: null,
    attachments: null
  };

  const updateFields: Record<string, any> = {
    isOutsourced: true,
    status: currentData.status || "Processing",
    notes: FieldValue.arrayUnion(note)
  };

  if (!currentData.endCustomerName) {
    updateFields.endCustomerName = currentData.customerName || 'Jackie Theron';
  }
  if (!currentData.endCustomerEmail) {
    updateFields.endCustomerEmail = currentData.customerEmail || 'nic@nala-bts.co.za';
  }
  if (!currentData.documentContact) {
    updateFields.documentContact = 'client';
  }

  await orderRef.update(updateFields);

  console.log('Successfully updated Order 10095 to Outsourced in Firestore!');

  const updatedSnap = await orderRef.get();
  const updatedData = updatedSnap.data()!;
  console.log('Updated Order 10095 Data summary:');
  console.log({
    id: updatedData.id,
    status: updatedData.status,
    isOutsourced: updatedData.isOutsourced,
    resellerId: updatedData.resellerId,
    documentContact: updatedData.documentContact,
    customerName: updatedData.customerName,
    customerEmail: updatedData.customerEmail,
    endCustomerName: updatedData.endCustomerName,
    endCustomerEmail: updatedData.endCustomerEmail
  });
}

main().catch(console.error);
