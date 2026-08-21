import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkSampleNotes() {
  const db = getAdminDb();
  const orders = ['10136', '10138', '10116', '10036', '10072'];
  
  for (const oId of orders) {
    const snap = await db.collection('orders').doc(oId).collection('notes').limit(2).get();
    if (!snap.empty) {
      console.log(`=== Notes for Order #${oId} ===`);
      snap.docs.forEach(d => {
        console.log(JSON.stringify({ id: d.id, ...d.data() }, null, 2));
      });
      break;
    }
  }
}

checkSampleNotes().catch(console.error);
