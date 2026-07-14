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

async function findAutoAssess() {
    const productsRef = db.collection('services');
    const snapshot = await productsRef.get();
    
    snapshot.forEach(doc => {
        const title = doc.data().title?.toLowerCase() || '';
        const slug = doc.data().slug?.toLowerCase() || '';
        if (title.includes('auto') || slug.includes('auto')) {
            console.log(`Found: ${doc.data().title} -> ${doc.data().slug}`);
        }
    });
}

findAutoAssess().then(() => process.exit(0)).catch(console.error);
