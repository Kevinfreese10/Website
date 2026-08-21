const path = require('path');
const fs = require('fs');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function searchNCRForm2() {
  console.log('Searching Firestore for NCR Form 2 in orders...');
  
  // 1. Search all orders where service contains NCR
  const ordersSnap = await db.collection('orders').get();
  ordersSnap.forEach(doc => {
    const data = doc.data();
    const notes = data.notes || [];
    notes.forEach(n => {
      if (n.attachments) {
        n.attachments.forEach(a => {
          if (a.name && (a.name.toLowerCase().includes('form 2') || a.name.toLowerCase().includes('form2') || a.name.toLowerCase().includes('ncr form') || a.name.toLowerCase().includes('ncr_form'))) {
            console.log(`Found in Order #${doc.id}: ${a.name} -> ${a.url}`);
          }
        });
      }
      if (n.text && (n.text.toLowerCase().includes('form 2') || n.text.toLowerCase().includes('form2'))) {
        console.log(`Mention in Note Order #${doc.id}: ${n.text.substring(0, 100)}`);
      }
    });
    const uploads = data.documentUploads || [];
    uploads.forEach(u => {
      if (u.fileName && (u.fileName.toLowerCase().includes('form 2') || u.fileName.toLowerCase().includes('form2') || u.fileName.toLowerCase().includes('ncr'))) {
        console.log(`Upload in Order #${doc.id}: ${u.fileName} -> ${u.fileUrl}`);
      }
    });
  });

  // 2. Check local filesystem / Downloads
  const downloadDir = 'C:\\Users\\kev\\Downloads';
  if (fs.existsSync(downloadDir)) {
    const files = fs.readdirSync(downloadDir);
    const ncrFiles = files.filter(f => f.toLowerCase().includes('ncr') || f.toLowerCase().includes('form 2') || f.toLowerCase().includes('form2'));
    console.log('\nMatching files in Downloads:', ncrFiles);
  }
}

searchNCRForm2().catch(console.error);
