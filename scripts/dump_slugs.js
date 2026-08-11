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

async function dumpSlugs() {
    const productsRef = db.collection('services');
    const snapshot = await productsRef.get();
    
    console.log(`Found ${snapshot.size} total services`);
    
    snapshot.forEach(doc => {
        console.log(doc.data().slug);
    });
}

dumpSlugs().then(() => process.exit(0)).catch(console.error);
