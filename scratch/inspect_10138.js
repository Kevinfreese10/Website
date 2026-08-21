const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve('c:/myacc/serviceAccountKey.json');
let app;
if (fs.existsSync(serviceAccountPath)) {
  app = initializeApp({ credential: cert(require(serviceAccountPath)) });
} else {
  app = initializeApp();
}

const db = getFirestore(app);

async function inspectOrder() {
  const orderId = '10138';
  let docSnap = await db.collection('orders').doc(orderId).get();
  
  if (!docSnap.exists) {
    // Try finding by query if doc ID is different
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
    console.error('Order 10138 not found');
    // List recent orders
    const recent = await db.collection('orders').orderBy('createdAt', 'desc').limit(5).get();
    console.log('Recent orders:', recent.docs.map(d => ({ id: d.id, orderNumber: d.data().orderNumber, client: d.data().customerName || d.data().userEmail })));
    return;
  }

  const orderData = docSnap.data();
  console.log('=== ORDER 10138 DATA ===');
  console.log('ID:', docSnap.id);
  console.log('Order Number:', orderData.orderNumber);
  console.log('Status:', orderData.status);
  console.log('Customer Name:', orderData.customerName || orderData.clientName);
  console.log('Customer Email:', orderData.customerEmail || orderData.userEmail);
  console.log('Customer Phone:', orderData.customerPhone || orderData.phone);
  console.log('Company Name:', orderData.companyName || orderData.businessName);
  console.log('Created At:', orderData.createdAt);
  console.log('Total Price:', orderData.totalPrice || orderData.price);
  console.log('Items:', JSON.stringify(orderData.items, null, 2));
  console.log('Document Uploads:', JSON.stringify(orderData.documentUploads, null, 2));
  console.log('Checklist:', JSON.stringify(orderData.checklist, null, 2));
  console.log('Generated Drafts:', JSON.stringify(orderData.generatedDrafts, null, 2));
  console.log('Information Provided / Form Data:', JSON.stringify(orderData.informationProvided || orderData.formData || orderData.intakeData || orderData.customFields, null, 2));

  // Get notes / communication history
  const notesSnap = await db.collection('orders').doc(docSnap.id).collection('notes').orderBy('createdAt', 'asc').get();
  console.log('=== COMMUNICATION HISTORY (NOTES) ===');
  notesSnap.docs.forEach(n => {
    console.log(`[${n.data().createdAt}] (${n.data().authorRole || 'staff'} - ${n.data().authorName}): ${n.data().content || n.data().text}`);
  });
}

inspectOrder().catch(console.error);
