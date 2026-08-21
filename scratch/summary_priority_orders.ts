import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

const targetOrderIds = [
  '10136',
  '10135',
  '10131',
  '10129',
  '10120',
  '10116',
  '10102',
  '10097',
  '10095',
  '10072',
  '10057',
  '10036',
];

async function printOrderContextSummary() {
  const db = getAdminDb();
  for (const id of targetOrderIds) {
    const snap = await db.collection('orders').doc(id).get();
    if (!snap.exists) continue;
    const data = snap.data() || {};
    const notes = data.notes || [];
    const entity = (data as any).companyName || (data as any).clientEntityName || data.customerName;
    const service = data.items?.map((i: any) => i.title).join(', ') || (data as any).serviceTitle || 'N/A';

    console.log(`\n======================================================`);
    console.log(`ORDER #${id} | ${entity} (${data.customerName})`);
    console.log(`Service: ${service} | Status: ${data.status} | Fulfillment: ${data.fulfillmentStatus || 'N/A'}`);
    console.log(`Uploads Count: ${data.documentUploads?.length || 0} | Notes Count: ${notes.length}`);
    
    // Print last 5 notes
    const recentNotes = notes.slice(-5);
    if (recentNotes.length > 0) {
      console.log('Recent Communication & Staff/Partner Notes:');
      recentNotes.forEach((n: any, idx: number) => {
        const msg = (n.content || n.message || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const author = n.authorName || n.authorEmail || n.sender || 'Staff';
        const date = n.createdAt || n.timestamp || '';
        const isInt = n.isInternal ? '[INTERNAL]' : '[CLIENT]';
        console.log(`  ${idx + 1}. ${isInt} [${date}] ${author}: "${msg.substring(0, 200)}"`);
        if (n.attachments && n.attachments.length > 0) {
          console.log(`     📎 Attachments: ${n.attachments.map((a: any) => a.name || a.url || a).join(', ')}`);
        }
      });
    } else {
      console.log('No notes in history.');
    }
  }
}

printOrderContextSummary().catch(console.error);
