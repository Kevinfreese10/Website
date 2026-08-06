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
  
  console.log('Outsourcing Order 10072 to main store and setting paymentMethod to Cash...');

  const orderRef = db.collection('orders').doc('10072');
  const snap = await orderRef.get();

  if (!snap.exists) {
    console.error('Order 10072 does not exist!');
    process.exit(1);
  }

  const note = {
    text: "Order outsourced to My Accountant main store. Partner paid cash.",
    authorId: "system",
    date: new Date(),
    type: "note",
    subject: null,
    attachments: null
  };

  await orderRef.update({
    isOutsourced: true,
    paymentMethod: "Cash",
    status: "Processing",
    notes: FieldValue.arrayUnion(note)
  });

  console.log('Successfully updated Order 10072 in Firestore!');

  const updatedSnap = await orderRef.get();
  console.log('Updated Order Data:');
  console.log(JSON.stringify(updatedSnap.data(), null, 2));
}

main().catch(console.error);
