import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccountPath = 'C:/Users/kev/Downloads/studio-2604127518-57889-firebase-adminsdk-fbsvc-683caead48.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Service key not found at", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

try {
    initializeApp({ credential: cert(serviceAccount) });
} catch (e) {
    // Ignore already exists
}

const db = getFirestore();

async function auditProductSchemaMetadata() {
    console.log("Fetching services/products from Firestore...");
    const snap = await db.collection('services').get();
    
    if (snap.empty) {
        console.log("No services found.");
        return;
    }

    console.log(`Found ${snap.size} services. Checking Google Merchant Center & Schema fields...`);
    
    const results = [];
    snap.docs.forEach(doc => {
        const data = doc.data();
        results.push({
            id: doc.id,
            title: data.title || '',
            slug: data.slug || '',
            status: data.status || 'inactive',
            currency: data.currency || null,
            availability: data.availability || null,
            condition: data.condition || null,
            brand: data.brand || null,
            product_type: data.product_type || null,
            google_product_category: data.google_product_category || null,
            schemaType: data.schemaType || null,
            reviewCount: data.reviewCount !== undefined ? data.reviewCount : null,
            aggregateRatingValue: data.aggregateRatingValue !== undefined ? data.aggregateRatingValue : null,
        });
    });

    // Check count of populated fields
    let totalCurrency = 0;
    let totalAvailability = 0;
    let totalCondition = 0;
    let totalSchemaType = 0;
    let totalRating = 0;

    results.forEach(r => {
        if (r.currency) totalCurrency++;
        if (r.availability) totalAvailability++;
        if (r.condition) totalCondition++;
        if (r.schemaType) totalSchemaType++;
        if (r.aggregateRatingValue !== null) totalRating++;
    });

    console.log("\n--- AUDIT SUMMARY ---");
    console.log(`Total Services/Products: ${results.length}`);
    console.log(`Has currency: ${totalCurrency}`);
    console.log(`Has availability: ${totalAvailability}`);
    console.log(`Has condition: ${totalCondition}`);
    console.log(`Has schemaType: ${totalSchemaType}`);
    console.log(`Has rating: ${totalRating}`);
    console.log("\nSample documents populated fields:");
    console.table(results.slice(0, 10));
}

auditProductSchemaMetadata().then(() => process.exit(0)).catch(console.error);
