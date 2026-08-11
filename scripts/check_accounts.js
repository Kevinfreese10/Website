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
  const docSnap = await db.collection('aiAccountantClients').doc('TyceuLEcSEXal306jcgS').get();
  if (docSnap.exists) {
    const data = docSnap.data();
    console.log("Client has chartOfAccounts array:", Array.isArray(data.chartOfAccounts));
    if (Array.isArray(data.chartOfAccounts)) {
      const missingDescription = data.chartOfAccounts.filter(acc => !acc.description);
      console.log("Accounts missing description:", missingDescription.length);
      if (missingDescription.length > 0) {
          console.log("Missing description items:", missingDescription);
      }
    }
  } else {
    console.log("Client not found.");
  }
}

run().catch(console.error);
