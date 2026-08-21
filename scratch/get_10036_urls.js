const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function getDocUrls() {
  const doc = await db.collection('orders').doc('10036').get();
  const data = doc.data();

  console.log('=== UPLOADED DOCUMENTS (DOCUMENT UPLOADS) ===');
  (data.documentUploads || []).forEach(d => {
    console.log(`Label: "${d.requirementLabel}"`);
    console.log(`File Name: ${d.fileName || 'N/A'}`);
    console.log(`URL: ${d.fileUrl || d.textValue || 'N/A'}\n`);
  });

  console.log('=== NOTES ATTACHMENTS (SIGNED & DRAFTED DOCUMENTS) ===');
  (data.notes || []).forEach(n => {
    if (n.attachments && n.attachments.length > 0) {
      n.attachments.forEach(a => {
        console.log(`Name: ${a.name}`);
        console.log(`URL: ${a.url}\n`);
      });
    }
  });
}

getDocUrls().catch(console.error);
