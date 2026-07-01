const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json');

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = getFirestore();

const images = [
    '/blog/tax_compliance.png',
    '/blog/sars_dispute.png',
    '/blog/company_registration.png',
    '/blog/payroll_outsourcing.png'
];

// Simple string hash
function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

async function updateBlogImages() {
    const snapshot = await db.collection('blogPosts').get();
    let updatedCount = 0;

    const batch = db.batch();
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const title = data.title || doc.id;
        
        // Pick an image based on the title hash
        const imgIndex = hashCode(title) % images.length;
        const assignedImage = images[imgIndex];

        batch.update(doc.ref, { imageUrl: assignedImage });
        updatedCount++;
    });

    if (updatedCount > 0) {
        await batch.commit();
        console.log(`Successfully updated ${updatedCount} blog posts with new stock images.`);
    } else {
        console.log("No blog posts found to update.");
    }
}

updateBlogImages().catch(console.error);
