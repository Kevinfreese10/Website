const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));

if (!admin.apps.length) {
  const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function inspectOrder() {
  const snap = await db.collection('orders').where('orderNumber', '==', 10036).get();
  if (snap.empty) {
    console.log('No order found with orderNumber == 10036');
    return;
  }

  const doc = snap.docs[0];
  const order = doc.data();
  console.log(`Order ID: ${doc.id}, orderNumber: ${order.orderNumber}`);

  console.log('\n--- DOCUMENTS IN ORDER ---');
  (order.documents || []).forEach(d => {
    console.log(`[${d.status}] ${d.name} -> ${d.fileName || 'no file'} (${d.notes || ''})`);
  });

  console.log('\n--- NOTES WITH ATTACHMENTS ---');
  (order.notes || []).forEach(n => {
    if (n.attachments && n.attachments.length > 0) {
      n.attachments.forEach(a => console.log(`Note Attachment by ${n.author?.name || n.authorName}: ${a.name} (${n.content || n.message || ''})`));
    }
  });
}

inspectOrder().catch(console.error);
