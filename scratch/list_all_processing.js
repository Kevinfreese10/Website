const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listAll() {
  const snapshot = await db.collection('orders').where('status', '==', 'Processing').get();
  console.log(`TOTAL PROCESSING ORDERS: ${snapshot.size}`);

  const usersSnap = await db.collection('users').get();
  const userMap = {};
  usersSnap.forEach(doc => {
    const data = doc.data();
    userMap[doc.id] = data.name || data.email || doc.id;
  });

  const orders = [];
  snapshot.forEach(doc => {
    orders.push({ id: doc.id, ...doc.data() });
  });

  orders.sort((a, b) => {
    const dateA = a.date ? (a.date.toDate ? a.date.toDate() : new Date(a.date)) : new Date(0);
    const dateB = b.date ? (b.date.toDate ? b.date.toDate() : new Date(b.date)) : new Date(0);
    return dateA - dateB;
  });

  orders.forEach((o, index) => {
    const assignedNames = (o.assignedTo || []).map(uid => userMap[uid] || uid).join(', ') || 'UNASSIGNED';
    const items = (o.items || []).map(i => i.title || i.name || i.id).join(', ');
    const orderDate = o.date ? (o.date.toDate ? o.date.toDate().toISOString().split('T')[0] : String(o.date).split('T')[0]) : 'N/A';
    const docUploads = o.documentUploads || [];
    const pendingDocs = docUploads.filter(d => d.status === 'pending').length;
    const rejectedDocs = docUploads.filter(d => d.status === 'rejected').length;
    const approvedDocs = docUploads.filter(d => d.status === 'approved').length;
    const lastNote = o.notes && o.notes.length > 0 ? o.notes[o.notes.length - 1] : null;

    console.log(`\n#${index + 1} | ORDER #${o.id} (${orderDate})`);
    console.log(`   Customer:    ${o.customerName} (${o.customerEmail})`);
    if (o.isOutsourced) console.log(`   Outsourced:  Yes (Partner: ${userMap[o.resellerId] || o.resellerId})`);
    console.log(`   Service:     ${items} (Total: R${o.total})`);
    console.log(`   Department:  ${o.department || 'N/A'} | Assigned: ${assignedNames}`);
    console.log(`   Docs Status: ${docUploads.length} uploaded (${approvedDocs} approved, ${pendingDocs} pending review, ${rejectedDocs} rejected)`);
    if (o.dependsOnOrderIds && o.dependsOnOrderIds.length > 0) console.log(`   Prereqs:     Depends on #${o.dependsOnOrderIds.join(', #')}`);
    if (o.blockedOrderIds && o.blockedOrderIds.length > 0) console.log(`   Blocks:      Blocks #${o.blockedOrderIds.join(', #')}`);
    if (lastNote) {
      const noteAuthor = userMap[lastNote.authorId] || lastNote.authorId;
      console.log(`   Last Note:   [${noteAuthor}] "${(lastNote.text || '').replace(/\n+/g, ' ').substring(0, 120)}"`);
    }
  });
}

listAll().catch(console.error);
