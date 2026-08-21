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
  
  console.log('Searching for Order 10095...');
  
  const docRef = db.collection('orders').doc('10095');
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    console.log('Found order by doc ID 10095:');
    console.log(JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log('Doc 10095 not found by direct ID. Querying collection...');
    const q1 = await db.collection('orders').where('id', '==', '10095').get();
    if (!q1.empty) {
      q1.forEach(d => {
        console.log(`Found order in query id=='10095' (doc ${d.id}):`);
        console.log(JSON.stringify(d.data(), null, 2));
      });
    } else {
      const q2 = await db.collection('orders').where('id', '==', 10095).get();
      if (!q2.empty) {
        q2.forEach(d => {
          console.log(`Found order in query id==10095 (doc ${d.id}):`);
          console.log(JSON.stringify(d.data(), null, 2));
        });
      } else {
        console.log('Order 10095 not found by query.');
      }
    }
  }
}

main().catch(console.error);
