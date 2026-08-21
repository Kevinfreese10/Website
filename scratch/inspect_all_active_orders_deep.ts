import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb } from '../src/lib/firebase-admin';

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

async function inspectOrderDeep(orderId: string) {
  const db = getAdminDb();
  const doc = await db.collection('orders').doc(orderId).get();
  if (!doc.exists) {
    return { orderId, exists: false };
  }

  const data = doc.data() || {};
  const notesSnap = await db.collection('orders').doc(orderId).collection('notes').orderBy('createdAt', 'asc').get();
  
  const notes = notesSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));

  return {
    orderId,
    exists: true,
    status: data.status,
    fulfillmentStatus: data.fulfillmentStatus || 'N/A',
    client: data.customerName || 'N/A',
    email: data.customerEmail || 'N/A',
    company: data.companyName || data.clientEntityName || 'N/A',
    service: data.items?.map((i: any) => i.title).join(', ') || data.serviceTitle || 'N/A',
    partnerId: data.partnerId || 'N/A',
    partnerNotes: data.partnerNotes || data.internalNotes || [],
    notesCount: notes.length,
    notes: notes.map((n: any) => ({
      sender: n.sender || n.authorName || 'System',
      role: n.senderRole || n.authorRole || (n.isInternal ? 'internal' : 'client'),
      isInternal: n.isInternal ?? false,
      date: n.createdAt || n.timestamp || 'N/A',
      message: n.message || n.text || n.content || '',
      attachments: n.attachments || [],
    })),
    uploadsCount: data.documentUploads?.length || 0,
    checklistSummary: (data.checklist || []).map((s: any) => `[${s.status}] ${s.title}`),
    hasDrafts: !!data.generatedDrafts,
    updatedAt: data.updatedAt,
  };
}

async function main() {
  console.log('Fetching deep context and Communication History for all priority orders...\n');
  
  for (const id of targetOrderIds) {
    const res = await inspectOrderDeep(id);
    if (!res.exists) continue;

    console.log('======================================================================');
    console.log(`ORDER #${res.orderId}: ${res.company} (${res.client}) | ${res.service}`);
    console.log(`Status: ${res.status} | Fulfillment: ${res.fulfillmentStatus} | Partner: ${res.partnerId}`);
    console.log(`Uploads: ${res.uploadsCount} | SOP Steps: ${res.checklistSummary.length}`);
    console.log(`Checklist: ${res.checklistSummary.join(' -> ')}`);
    console.log(`\n--- COMMUNICATION HISTORY & INTERNAL/PARTNER NOTES (${res.notesCount} notes) ---`);
    
    if (res.notes.length === 0) {
      console.log('No notes logged in Communication History.');
    } else {
      res.notes.forEach((n, idx) => {
        const tag = n.isInternal ? '🔒 [INTERNAL STAFF/PARTNER NOTE]' : '🌐 [CLIENT-FACING NOTE]';
        const msgSnippet = n.message.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`${idx + 1}. ${tag} [${n.date}] from ${n.sender} (${n.role}):`);
        console.log(`   "${msgSnippet.substring(0, 300)}${msgSnippet.length > 300 ? '...' : ''}"`);
        if (n.attachments && n.attachments.length > 0) {
          console.log(`   📎 Attachments: ${n.attachments.map((a: any) => a.name || a.url).join(', ')}`);
        }
      });
    }
    console.log('======================================================================\n');
  }
}

main().catch(console.error);
