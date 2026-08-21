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

async function checkRecentNotesAndFailedEmails() {
  console.log('=== Checking recent failed emails ===');
  const failedSnap = await db.collection('failedEmails').orderBy('failedAt', 'desc').limit(10).get();
  console.log(`Recent failed emails (${failedSnap.size}):`);
  failedSnap.forEach(d => {
    const data = d.data();
    console.log({
      id: d.id,
      to: data.to,
      subject: data.subject,
      error: data.error,
      failedAt: data.failedAt?.toDate ? data.failedAt.toDate() : data.failedAt
    });
  });

  console.log('\n=== Checking recent notes across orders ===');
  const ordersSnap = await db.collection('orders').orderBy('updatedAt', 'desc').limit(20).get();
  const recentNotes = [];
  ordersSnap.forEach(d => {
    const data = d.data();
    if (data.notes && Array.isArray(data.notes)) {
      data.notes.forEach(n => {
        const noteDate = n.date?.toDate ? n.date.toDate() : new Date(n.date);
        recentNotes.push({
          orderId: d.id,
          originalOrderId: data.originalOrderId,
          customerEmail: data.customerEmail,
          assignedTo: data.assignedTo,
          authorId: n.authorId,
          text: n.text,
          date: noteDate,
          type: n.type,
          isInternal: n.isInternal
        });
      });
    }
  });

  // Sort notes by date desc
  recentNotes.sort((a, b) => b.date - a.date);
  console.log(`Top 10 most recent notes:`);
  recentNotes.slice(0, 10).forEach(n => {
    console.log(`Order #${n.orderId} (${n.date.toISOString()}): "${n.text.substring(0, 60)}" by ${n.authorId} (assigned: ${JSON.stringify(n.assignedTo)})`);
  });
}

checkRecentNotesAndFailedEmails().catch(console.error);
