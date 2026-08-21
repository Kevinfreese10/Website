const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  const downloadsPath = 'C:/Users/kev/Downloads';
  const files = fs.readdirSync(downloadsPath).filter(f => f.startsWith('studio-2604127518-57889-firebase-adminsdk') && f.endsWith('.json'));
  if (files.length > 0) {
    serviceAccountPath = path.join(downloadsPath, files[0]);
  }
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

const WINIFRED_UID = 'UZULuL0Hlncga10rqeiM9g2jeEh1';
const KEV_UID = 'LRM285EOq3gwNMKayY6vtzooaC03';

async function executeReassignment() {
  console.log(`Starting reassignment from Winifred (${WINIFRED_UID}) to Kev (${KEV_UID})...`);

  // 1. Fetch all orders
  const ordersSnap = await db.collection('orders').where('assignedTo', 'array-contains', WINIFRED_UID).get();
  console.log(`Found ${ordersSnap.size} orders to reassign.`);

  const BATCH_SIZE = 300;
  let batch = db.batch();
  let opCount = 0;
  let totalBatchesCommitted = 0;

  for (const doc of ordersSnap.docs) {
    const data = doc.data();
    const currentAssigned = Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo];
    
    // Replace Winifred with Kev
    const newAssigned = currentAssigned.map(uid => uid === WINIFRED_UID ? KEV_UID : uid);
    // Deduplicate
    const uniqueAssigned = Array.from(new Set(newAssigned));

    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'REASSIGN_STAFF',
      performedBy: KEV_UID,
      performedByName: 'Kevin Freese',
      timestamp: new Date().toISOString(),
      previousValue: 'Winifred Beukes',
      newValue: 'Kevin Freese',
      details: 'Reassigned staff from winifred@myacc.co.za to kev@thinkestry.co.za',
    };

    const auditLog = [...(data.auditLog || []), auditEntry];

    batch.update(doc.ref, {
      assignedTo: uniqueAssigned,
      auditLog,
      updatedAt: new Date().toISOString()
    });

    opCount++;
    if (opCount >= BATCH_SIZE) {
      await batch.commit();
      totalBatchesCommitted++;
      console.log(`Committed batch ${totalBatchesCommitted} (${opCount} orders)`);
      batch = db.batch();
      opCount = 0;
    }
  }

  // 2. Fetch and reassign tasks
  const tasksSnap = await db.collection('tasks').where('assignedTo', 'array-contains', WINIFRED_UID).get();
  console.log(`Found ${tasksSnap.size} tasks to reassign.`);

  for (const doc of tasksSnap.docs) {
    const data = doc.data();
    const currentAssigned = Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo];
    const newAssigned = currentAssigned.map(uid => uid === WINIFRED_UID ? KEV_UID : uid);
    const uniqueAssigned = Array.from(new Set(newAssigned));

    batch.update(doc.ref, {
      assignedTo: uniqueAssigned,
      updatedAt: new Date().toISOString()
    });
    opCount++;
  }

  if (opCount > 0) {
    await batch.commit();
    totalBatchesCommitted++;
    console.log(`Committed final batch ${totalBatchesCommitted} (${opCount} items)`);
  }

  console.log('--- Verifying results ---');
  const winifredOrdersAfter = await db.collection('orders').where('assignedTo', 'array-contains', WINIFRED_UID).get();
  const kevOrdersAfter = await db.collection('orders').where('assignedTo', 'array-contains', KEV_UID).get();
  const winifredTasksAfter = await db.collection('tasks').where('assignedTo', 'array-contains', WINIFRED_UID).get();
  const kevTasksAfter = await db.collection('tasks').where('assignedTo', 'array-contains', KEV_UID).get();

  console.log(`Winifred orders remaining: ${winifredOrdersAfter.size}`);
  console.log(`Kev total orders assigned: ${kevOrdersAfter.size}`);
  console.log(`Winifred tasks remaining: ${winifredTasksAfter.size}`);
  console.log(`Kev total tasks assigned: ${kevTasksAfter.size}`);
  console.log('Reassignment completed successfully.');
}

executeReassignment().catch(console.error);
