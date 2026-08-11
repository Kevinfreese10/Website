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

async function getDetails() {
    const slugs = [
        'individual-income-tax-return-itr12-simple',
        'complex-individual-income-tax-return-itr12-filing',
        'complex-individual-income-tax-return-itr12',
        'sole-proprietor-income-tax-return-itr12',
        'income-tax-return-for-sole-proprietors-itr12'
    ];
    
    const results = [];
    for (const slug of slugs) {
        const snap = await db.collection('services').where('slug', '==', slug).get();
        snap.forEach(doc => {
            const data = doc.data();
            results.push({
                slug: data.slug,
                title: data.title,
                price: data.price,
                status: data.status
            });
        });
    }
    
    console.table(results);
}

getDetails().then(() => process.exit(0)).catch(console.error);
