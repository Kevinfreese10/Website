const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function extractFullDetails() {
  const doc = await db.collection('orders').doc('10036').get();
  const data = doc.data();

  console.log('=== ORDER 10036 CLIENT & COMPANY DETAILS ===');
  console.log('Customer Name:', data.customerName);
  console.log('Customer Email:', data.customerEmail);
  console.log('Customer Phone:', data.customerPhone);
  console.log('User ID:', data.userId);

  // Check user profile
  if (data.userId) {
    const userDoc = await db.collection('users').doc(data.userId).get();
    if (userDoc.exists) {
      console.log('\n--- User Profile in users collection ---');
      console.log(JSON.stringify(userDoc.data(), null, 2));
    }
  }

  // Check all uploaded docs values
  console.log('\n--- Document Uploads Detail ---');
  (data.documentUploads || []).forEach(d => {
    console.log(`${d.requirementLabel}: ${d.textValue || d.fileName || d.fileUrl}`);
  });
}

extractFullDetails().catch(console.error);
