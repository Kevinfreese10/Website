import admin from 'firebase-admin';
import * as fs from 'fs';

const serviceAccountPath = 'C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function getOrderDetails() {
  const doc = await db.collection('orders').doc('9854').get();
  if (!doc.exists) {
    console.log('Order 9854 not found');
    return;
  }
  const d = doc.data();
  console.log('Order ID: 9854');
  console.log('Status:', d.status);
  console.log('Customer Details:');
  console.log('  Name:', d.customerName || d.billing?.firstName + ' ' + d.billing?.lastName || d.customer?.name);
  console.log('  Email:', d.customerEmail || d.billing?.email);
  console.log('  Phone:', d.customerPhone || d.billing?.phone);
  console.log('Company:', d.companyName || d.company?.name);
  console.log('Items / Services:', JSON.stringify(d.items || d.line_items || []));
  console.log('Date Created:', d.dateCreated || d.createdAt);
  console.log('Form Data / Details:', JSON.stringify(d.formData || {}));
}

getOrderDetails().catch(console.error);
