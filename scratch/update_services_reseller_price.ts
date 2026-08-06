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

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  console.log('Updating all services resellerPrice in Firestore to 20% discount (0.80 multiplier)...');

  const snap = await db.collection('services').get();
  let count = 0;
  const batchSize = 400;
  let batch = db.batch();
  let opCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const retailPrice = data.price || 0;
    const newResellerPrice = Math.round(retailPrice * 0.80 * 100) / 100;

    batch.update(docSnap.ref, {
      resellerPrice: newResellerPrice,
      availability: 'in_stock',
      condition: 'new'
    });
    count++;
    opCount++;

    if (opCount >= batchSize) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  console.log(`Successfully updated ${count} services to 20% wholesale discount!`);
}

main().catch(console.error);
