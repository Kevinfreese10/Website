import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkOrderNotes() {
  const db = getAdminDb();
  const notesSnap = await db.collection('orders').doc('10135').collection('notes').orderBy('createdAt', 'desc').get();
  
  console.log(`=== ORDER #10135 NOTES (${notesSnap.size} notes) ===`);
  notesSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`[${data.type || 'NOTE'}] ${data.createdAt} - Author: ${data.author || data.createdBy}`);
    console.log(`Content: ${data.text || data.content}`);
    console.log('---');
  });
}

checkOrderNotes().catch(console.error);
