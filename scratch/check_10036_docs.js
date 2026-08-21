const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDocs() {
  const doc = await db.collection('orders').doc('10036').get();
  const data = doc.data();

  console.log('--- ALL ATTACHMENTS IN NOTES ---');
  (data.notes || []).forEach(n => {
    if (n.attachments && n.attachments.length > 0) {
      console.log(`Date: ${n.date} | Author: ${n.authorId}`);
      console.log('Attachments:', JSON.stringify(n.attachments, null, 2));
    }
  });

  console.log('\n--- ALL DOCUMENT UPLOADS ---');
  (data.documentUploads || []).forEach(d => {
    console.log(`Label: "${d.requirementLabel}"`);
    console.log(`  Status: ${d.status} | Type: ${d.type}`);
    console.log(`  File: ${d.fileName || d.fileUrl || d.textValue}`);
  });
}

checkDocs().catch(console.error);
