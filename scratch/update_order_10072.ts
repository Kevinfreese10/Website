import fs from 'fs';
import { resolve } from 'path';

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

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  
  const docRef = db.collection('orders').doc('10072');
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    console.error('Order 10072 not found');
    return;
  }

  const data = docSnap.data()!;
  console.log('Current order 10072 data:', {
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    endCustomerName: data.endCustomerName,
    endCustomerEmail: data.endCustomerEmail,
    documentContact: data.documentContact
  });

  await docRef.update({
    endCustomerName: data.endCustomerName || data.customerName || 'Zarika Lubbe',
    endCustomerEmail: data.endCustomerEmail || data.customerEmail || 'zarika@zlaccounting.co.za'
  });

  console.log('Successfully updated order 10072 with endCustomerName & endCustomerEmail!');
  
  const updatedSnap = await docRef.get();
  const updatedData = updatedSnap.data()!;
  console.log('Updated order 10072 data:', {
    customerName: updatedData.customerName,
    customerEmail: updatedData.customerEmail,
    endCustomerName: updatedData.endCustomerName,
    endCustomerEmail: updatedData.endCustomerEmail,
    documentContact: updatedData.documentContact
  });
}

main().catch(console.error);
