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
  
  const docSnap = await db.collection('orders').doc('10072').get();
  const orderData = docSnap.data();
  console.log('--- Order 10072 ---');
  console.log(orderData);

  if (orderData?.resellerId) {
    const resellerSnap = await db.collection('users').doc(orderData.resellerId).get();
    console.log('--- Reseller / Partner User ---');
    console.log(resellerSnap.exists ? resellerSnap.data() : 'Reseller doc not found in users');
    const resellerPartnerSnap = await db.collection('resellers').doc(orderData.resellerId).get();
    console.log('--- Reseller / Partner doc ---');
    console.log(resellerPartnerSnap.exists ? resellerPartnerSnap.data() : 'Reseller doc not found in resellers');
  }

  if (orderData?.userId) {
    const userSnap = await db.collection('users').doc(orderData.userId).get();
    console.log('--- Order userId Doc ---');
    console.log(userSnap.exists ? userSnap.data() : 'User doc not found');
  }
}

main().catch(console.error);
