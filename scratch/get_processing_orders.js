const path = require('path');
const admin = require(path.resolve('c:/myacc/node_modules/firebase-admin'));
const serviceAccount = require('C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function getProcessingOrders() {
  console.log('Fetching all processing orders...');
  const snapshot = await db.collection('orders').where('status', '==', 'Processing').get();
  
  if (snapshot.empty) {
    console.log('No processing orders found.');
    return;
  }

  console.log(`Found ${snapshot.size} orders in "Processing" status.\n`);

  // Fetch users map for staff and clients
  const usersSnap = await db.collection('users').get();
  const userMap = {};
  usersSnap.forEach(doc => {
    const data = doc.data();
    userMap[doc.id] = data.name || data.email || doc.id;
  });

  const orders = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    orders.push({ id: doc.id, ...data });
  });

  // Sort by date ascending (oldest first) to see overdue/long-pending items
  orders.sort((a, b) => {
    const dateA = a.date ? (a.date.toDate ? a.date.toDate() : new Date(a.date)) : new Date(0);
    const dateB = b.date ? (b.date.toDate ? b.date.toDate() : new Date(b.date)) : new Date(0);
    return dateA - dateB;
  });

  const results = orders.map(o => {
    const assignedNames = (o.assignedTo || []).map(uid => userMap[uid] || uid);
    const items = (o.items || []).map(i => i.title || i.name || i.id).join(', ');
    
    // Check documents status
    const docUploads = o.documentUploads || [];
    const pendingDocs = docUploads.filter(d => d.status === 'pending');
    const rejectedDocs = docUploads.filter(d => d.status === 'rejected');
    const approvedDocs = docUploads.filter(d => d.status === 'approved');

    // Recent notes
    const notes = o.notes || [];
    const lastNote = notes.length > 0 ? notes[notes.length - 1] : null;

    const orderDate = o.date ? (o.date.toDate ? o.date.toDate().toISOString().split('T')[0] : String(o.date).split('T')[0]) : 'N/A';

    return {
      id: o.id,
      originalOrderId: o.originalOrderId,
      date: orderDate,
      customerName: o.customerName || (o.userId ? userMap[o.userId] : 'N/A'),
      customerEmail: o.customerEmail,
      endCustomerName: o.endCustomerName,
      isOutsourced: !!o.isOutsourced,
      reseller: o.resellerId ? userMap[o.resellerId] : undefined,
      department: o.department || 'Unassigned',
      assignedTo: assignedNames.length > 0 ? assignedNames : ['UNASSIGNED'],
      total: o.total,
      items,
      dependsOn: o.dependsOnOrderIds || [],
      blockedOrders: o.blockedOrderIds || [],
      docStats: {
        totalUploaded: docUploads.length,
        pendingReview: pendingDocs.length,
        rejected: rejectedDocs.length,
        approved: approvedDocs.length,
        items: docUploads.map(d => ({ label: d.requirementLabel, status: d.status, reason: d.rejectionReason }))
      },
      lastNote: lastNote ? {
        author: userMap[lastNote.authorId] || lastNote.authorId,
        isInternal: !!lastNote.isInternal,
        text: lastNote.text ? lastNote.text.replace(/\n+/g, ' ').substring(0, 180) : '',
        date: lastNote.date ? (lastNote.date.toDate ? lastNote.date.toDate().toISOString() : lastNote.date) : ''
      } : null,
      notesCount: notes.length
    };
  });

  console.log(JSON.stringify(results, null, 2));
}

getProcessingOrders().catch(console.error);
