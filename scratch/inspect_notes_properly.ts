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

async function inspectNotesProperly() {
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
    console.log(`Service: ${service} | Status: ${data.status}`);

    const last3 = notes.slice(-3);
    last3.forEach((n: any, idx: number) => {
      const text = n.note || n.text || n.content || n.message || JSON.stringify(n);
      const author = n.authorName || n.authorEmail || n.authorRole || 'Staff';
      const isInternal = n.isInternal ? '[INTERNAL STAFF NOTE]' : '[COMMUNICATION HISTORY]';
      const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`  ${idx + 1}. ${isInternal} ${author}: "${cleanText.substring(0, 300)}"`);
      if (n.attachments && n.attachments.length > 0) {
        console.log(`     📎 Attachments: ${n.attachments.map((a: any) => typeof a === 'string' ? a : a.name || a.url).join(', ')}`);
      }
    });
  }
}

inspectNotesProperly().catch(console.error);
