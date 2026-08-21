import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';
import { Order, OrderNote } from '../src/lib/types';

const targetOrderIds = [
  '10138',
  '10137',
  '10136',
  '10135',
  '10132',
  '10131',
  '10129',
  '10120',
  '10116',
  '10115',
  '10102',
  '10097',
  '10095',
  '10072',
  '10057',
  '10036',
  '10034',
];

async function inspectNotesField() {
  const db = getAdminDb();
  
  for (const id of targetOrderIds) {
    const snap = await db.collection('orders').doc(id).get();
    if (!snap.exists) continue;

    const data = snap.data() as Order;
    const notes: OrderNote[] = data.notes || [];
    const entity = (data as any).companyName || (data as any).clientEntityName || data.customerName;
    const service = data.items?.map(i => i.title).join(', ') || (data as any).serviceTitle || 'N/A';

    console.log('======================================================================');
    console.log(`ORDER #${id}: ${entity} (${data.customerName})`);
    console.log(`Service: ${service} | Status: ${data.status} | Fulfillment: ${data.fulfillmentStatus || 'N/A'}`);
    console.log(`Assigned/Partner: ${(data as any).partnerId || (data as any).assignedTo || 'N/A'}`);
    console.log(`Document Uploads: ${data.documentUploads?.length || 0}`);
    console.log(`Total Notes: ${notes.length}`);
    console.log('----------------------------------------------------------------------');

    if (notes.length === 0) {
      console.log('No notes in order.notes array.');
    } else {
      notes.forEach((n, idx) => {
        const isInternal = (n as any).isInternal || (n as any).internal || n.authorRole === 'admin' || n.authorRole === 'partner';
        const internalTag = isInternal ? '🔒 [INTERNAL/STAFF]' : '🌐 [CLIENT NOTE]';
        const date = n.createdAt || (n as any).timestamp || 'Unknown Date';
        const author = n.authorName || n.authorEmail || (n as any).sender || 'Unknown';
        const content = (n.content || (n as any).message || (n as any).text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        console.log(`${idx + 1}. ${internalTag} [${date}] ${author} (${n.authorRole || 'N/A'}):`);
        console.log(`   "${content}"`);
        if (n.attachments && n.attachments.length > 0) {
          console.log(`   📎 Attachments: ${n.attachments.map((a: any) => a.name || a.url || a).join(', ')}`);
        }
      });
    }

    // Also check document uploads status
    const uploads = data.documentUploads || [];
    if (uploads.length > 0) {
      console.log('\n--- UPLOADED DOCUMENTS DETAIL ---');
      uploads.forEach((u, uIdx) => {
        console.log(`   ${uIdx + 1}. [${u.status}] ${u.requirementLabel || u.id} -> ${u.fileUrl || u.textValue || 'No file'}`);
      });
    }

    console.log('======================================================================\n');
  }
}

inspectNotesField().catch(console.error);
