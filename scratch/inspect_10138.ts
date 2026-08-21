import { getAdminDb } from '../src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function inspectOrder() {
  const db = getAdminDb();
  const orderId = '10138';
  let docSnap = await db.collection('orders').doc(orderId).get();

  if (!docSnap.exists) {
    const q = await db.collection('orders').where('orderNumber', '==', 10138).get();
    if (!q.empty) {
      docSnap = q.docs[0];
    } else {
      const qStr = await db.collection('orders').where('orderNumber', '==', '10138').get();
      if (!qStr.empty) {
        docSnap = qStr.docs[0];
      }
    }
  }

  if (!docSnap || !docSnap.exists) {
    console.error('Order 10138 not found by ID or orderNumber!');
    const recent = await db.collection('orders').orderBy('createdAt', 'desc').limit(10).get();
    console.log('Recent 10 orders:');
    recent.docs.forEach(d => {
      const dat = d.data();
      console.log(`- DocID: ${d.id}, orderNumber: ${dat.orderNumber}, client: ${dat.customerName || dat.userEmail || dat.clientName}, title: ${dat.items?.[0]?.title}`);
    });
    return;
  }

  const order = { id: docSnap.id, ...docSnap.data() };
  console.log('=== ORDER 10138 SNAPSHOT ===');
  console.log('ID:', order.id);
  console.log('Order Number:', (order as any).orderNumber);
  console.log('Status:', (order as any).status);
  console.log('Payment Status:', (order as any).paymentStatus);
  console.log('Client Name:', (order as any).customerName || (order as any).clientName || (order as any).userName);
  console.log('Client Email:', (order as any).customerEmail || (order as any).userEmail);
  console.log('Client Phone:', (order as any).customerPhone || (order as any).phone);
  console.log('Company Name:', (order as any).companyName || (order as any).businessName);
  console.log('Created At:', (order as any).createdAt);
  console.log('Total Price:', (order as any).totalPrice || (order as any).price);
  
  console.log('\n--- ITEMS ---');
  console.log(JSON.stringify((order as any).items, null, 2));

  console.log('\n--- DOCUMENT UPLOADS ---');
  console.log(JSON.stringify((order as any).documentUploads, null, 2));

  console.log('\n--- INFORMATION PROVIDED / INTAKE DATA ---');
  console.log(JSON.stringify((order as any).informationProvided || (order as any).formData || (order as any).intakeData || (order as any).customFields, null, 2));

  console.log('\n--- CHECKLIST (SOP) ---');
  console.log(JSON.stringify((order as any).checklist, null, 2));

  console.log('\n--- GENERATED DRAFTS ---');
  console.log(JSON.stringify((order as any).generatedDrafts, null, 2));

  console.log('\n--- COMMUNICATION HISTORY (NOTES) ---');
  const notesSnap = await db.collection('orders').doc(docSnap.id).collection('notes').orderBy('createdAt', 'asc').get();
  notesSnap.docs.forEach(n => {
    const nd = n.data();
    console.log(`[${nd.createdAt}] (${nd.authorRole || 'staff'} - ${nd.authorName}): ${nd.content || nd.text}`);
    if (nd.attachments && nd.attachments.length > 0) {
      console.log('   Attachments:', nd.attachments);
    }
  });
}

inspectOrder().catch(console.error);
