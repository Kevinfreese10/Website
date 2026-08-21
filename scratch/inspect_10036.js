const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function inspectOrder10036() {
  const doc = await db.collection('orders').doc('10036').get();
  if (!doc.exists) {
    console.log('Order #10036 not found.');
    return;
  }

  const usersSnap = await db.collection('users').get();
  const userMap = {};
  usersSnap.forEach(u => {
    userMap[u.id] = u.data().name || u.data().email || u.id;
  });

  const data = doc.data();
  console.log('====================================================');
  console.log(`ORDER #${doc.id} FULL DETAILS`);
  console.log('====================================================');
  console.log('Status:          ', data.status);
  console.log('Date:            ', data.date ? (data.date.toDate ? data.date.toDate().toISOString() : data.date) : 'N/A');
  console.log('Customer Name:   ', data.customerName);
  console.log('Customer Email:  ', data.customerEmail);
  console.log('Customer Phone:  ', data.customerPhone);
  console.log('Payment Method:  ', data.paymentMethod);
  console.log('Total Amount:    ', `R${data.total}`);
  console.log('Department:      ', data.department);
  console.log('Assigned To:     ', (data.assignedTo || []).map(id => userMap[id] || id).join(', '));
  console.log('Items:           ', JSON.stringify(data.items, null, 2));
  console.log('Depends On:      ', data.dependsOnOrderIds || []);
  console.log('Blocked Orders:  ', data.blockedOrderIds || []);

  console.log('\n----------------------------------------------------');
  console.log(`DOCUMENT UPLOADS (${(data.documentUploads || []).length} items):`);
  console.log('----------------------------------------------------');
  (data.documentUploads || []).forEach((doc, idx) => {
    console.log(`[#${idx + 1}] Status: ${doc.status.toUpperCase()} | Label: "${doc.requirementLabel}"`);
    console.log(`     Type: ${doc.type} | Value/File: ${doc.fileUrl || doc.textValue || doc.fileName || 'N/A'}`);
    if (doc.rejectionReason) console.log(`     Rejection Reason: ${doc.rejectionReason}`);
  });

  console.log('\n----------------------------------------------------');
  console.log(`NOTES / COMMUNICATION HISTORY (${(data.notes || []).length} notes):`);
  console.log('----------------------------------------------------');
  (data.notes || []).forEach((n, idx) => {
    const author = userMap[n.authorId] || n.authorId;
    const date = n.date ? (n.date.toDate ? n.date.toDate().toISOString() : n.date) : 'N/A';
    const type = n.isInternal ? '[🔒 INTERNAL]' : '[PUBLIC]';
    console.log(`\nNote #${idx + 1} | ${type} | ${date} | Author: ${author}`);
    console.log(`Content:\n${n.text}`);
    if (n.attachments && n.attachments.length > 0) {
      console.log(`Attachments: ${JSON.stringify(n.attachments)}`);
    }
  });

  console.log('\n----------------------------------------------------');
  console.log(`AUDIT LOG (${(data.auditLog || []).length} entries):`);
  console.log('----------------------------------------------------');
  (data.auditLog || []).forEach((a, idx) => {
    console.log(`[#${idx + 1}] ${a.timestamp} | Action: ${a.action} | Performed By: ${a.performedByName || a.performedBy}`);
    console.log(`     Details: ${a.details || ''} | Prev: ${a.previousValue || ''} -> New: ${a.newValue || ''}`);
  });
}

inspectOrder10036().catch(console.error);
