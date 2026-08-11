const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

try {
    initializeApp({
        credential: cert(serviceAccount)
    });
} catch (e) {
    if (!/already exists/.test(e.message)) {
        console.error('Firebase initialization error', e.stack);
    }
}

const db = getFirestore();

async function findITR12Products() {
    const productsRef = db.collection('services');
    const snapshot = await productsRef.where('status', '==', 'active').get();
    
    const matches = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        const slug = (data.slug || '').toLowerCase();
        
        if (
            title.includes('itr12') || 
            slug.includes('itr12') || 
            title.includes('individual') || 
            slug.includes('individual') ||
            title.includes('sole proprietor') ||
            slug.includes('sole-proprietor') ||
            title.includes('personal tax') ||
            slug.includes('personal-tax')
        ) {
            matches.push({
                slug: data.slug,
                title: data.title,
                price: data.price
            });
        }
    });

    console.table(matches);
}

findITR12Products().then(() => process.exit(0)).catch(console.error);
