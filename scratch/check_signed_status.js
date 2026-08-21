const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));

if (!admin.apps.length) {
  const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkSignatures() {
  const doc = await db.collection('orders').doc('10036').get();
  const order = doc.data();

  console.log('Order #10036 items:');
  (order.items || []).forEach(item => {
    console.log(`- ${item.name} (${item.status})`);
  });

  console.log('\nUploaded documents in documentRequirements:');
  const reqs = order.documentRequirements || [];
  reqs.forEach(r => {
    console.log(`- [${r.status}] ${r.name} (${r.fileName || 'no file'})`);
  });

  console.log('\nNotes with attachments:');
  (order.notes || []).forEach(n => {
    if (n.attachmentName) {
      console.log(`- ${n.authorName}: ${n.attachmentName} (${n.text})`);
    }
  });
}

checkSignatures().catch(console.error);
