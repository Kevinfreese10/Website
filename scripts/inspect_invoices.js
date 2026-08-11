const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!global._firebaseAdminInitialized) {
  initializeApp({
    credential: cert(serviceAccount)
  });
  global._firebaseAdminInitialized = true;
}

const db = getFirestore();

async function run() {
  const snapshot = await db.collection('aiAccountantClients/TyceuLEcSEXal306jcgS/invoices').get();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Invoice ${doc.id}:`);
    console.log(`  invoiceDate:`, data.invoiceDate ? (data.invoiceDate.toDate ? 'Timestamp' : typeof data.invoiceDate) : 'Missing');
    console.log(`  dueDate:`, data.dueDate ? (data.dueDate.toDate ? 'Timestamp' : typeof data.dueDate) : 'Missing');
    console.log(`  value:`, data.invoiceDate);
  });
}

run().catch(console.error);
