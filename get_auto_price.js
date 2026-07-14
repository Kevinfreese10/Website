const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

try {
    initializeApp({
        credential: cert(serviceAccount)
    });
} catch (e) {}

const db = getFirestore();

async function getPrice() {
    const snap = await db.collection('services').where('slug', '==', 'sars-auto-assessment-review').get();
    snap.forEach(doc => {
        console.log(`Price: R${doc.data().price}`);
    });
}

getPrice().then(() => process.exit(0)).catch(console.error);
