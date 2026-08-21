const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function inspectOlder() {
  const snapshot = await db.collection('orders').where('status', '==', 'Processing').get();
  const usersSnap = await db.collection('users').get();
  const userMap = {};
  usersSnap.forEach(doc => {
    const data = doc.data();
    userMap[doc.id] = data.name || data.email || doc.id;
  });

  const orders = [];
  snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
  orders.sort((a, b) => {
    const dateA = a.date ? (a.date.toDate ? a.date.toDate() : new Date(a.date)) : new Date(0);
    const dateB = b.date ? (b.date.toDate ? b.date.toDate() : new Date(b.date)) : new Date(0);
    return dateA - dateB;
  });

  console.log('=== OLDER PROCESSING ORDERS (Orders 1 to 30) ===\n');
  orders.slice(0, 30).forEach((o, index) => {
    const assignedNames = (o.assignedTo || []).map(uid => userMap[uid] || uid).join(', ') || 'UNASSIGNED';
    const items = (o.items || []).map(i => i.title || i.name || i.id).join(', ');
    const orderDate = o.date ? (o.date.toDate ? o.date.toDate().toISOString().split('T')[0] : String(o.date).split('T')[0]) : 'N/A';
    const docUploads = o.documentUploads || [];
    const pendingDocs = docUploads.filter(d => d.status === 'pending').length;
    const approvedDocs = docUploads.filter(d => d.status === 'approved').length;
    const lastNote = o.notes && o.notes.length > 0 ? o.notes[o.notes.length - 1] : null;
    const noteSnippet = lastNote ? `[${userMap[lastNote.authorId] || lastNote.authorId}] ${(lastNote.text || '').replace(/\n+/g, ' ').substring(0, 100)}` : 'No notes';

    console.log(`${(index + 1).toString().padStart(2)} | #${o.id} | ${orderDate} | ${o.customerName || 'N/A'} | ${items} | Assigned: ${assignedNames} | Docs: ${approvedDocs}/${docUploads.length} Appr | Last: ${noteSnippet}`);
  });
}

inspectOlder().catch(console.error);
