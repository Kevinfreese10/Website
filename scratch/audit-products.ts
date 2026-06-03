import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { Service } from '../src/lib/types';
import * as fs from 'fs';
import * as path from 'path';

async function auditProducts() {
    console.log("Fetching services...");
    const querySnapshot = await getDocs(collection(db, "services"));
    const services = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Service[];

    console.log(`Fetched ${services.length} services.`);
    
    // We'll write to a JSON file for analysis
    const outputPath = path.join(__dirname, 'services-audit-raw.json');
    fs.writeFileSync(outputPath, JSON.stringify(services, null, 2), 'utf-8');
    console.log(`Saved raw services data to ${outputPath}`);

    // Generate a quick markdown preview of fields
    const summary = services.map(s => {
        return {
            id: s.id,
            slug: s.slug,
            title: s.title,
            category: s.category,
            price: s.price,
            isPriceTbc: s.isPriceTbc || false,
            metaTitle: s.metaTitle || null,
            metaDescription: s.metaDescription || null,
            hasLongDescription: !!s.longDescription,
            whatsIncludedCount: s.whatsIncluded ? s.whatsIncluded.length : 0,
            clientRequirementsCount: s.clientRequirements ? s.clientRequirements.length : 0,
            schemaType: s.schemaType || null,
            enableAggregateRating: s.enableAggregateRating || false,
            aggregateRatingValue: s.aggregateRatingValue || null,
            reviewCount: s.reviewCount || null,
            priceValidUntilOverride: s.priceValidUntilOverride || null,
            seoImageUrl: s.seoImageUrl || null,
            seoImageLabel: s.seoImageLabel || null
        };
    });

    const summaryPath = path.join(__dirname, 'services-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`Saved summary to ${summaryPath}`);
    process.exit(0);
}

auditProducts().catch(err => {
    console.error("Error running audit:", err);
    process.exit(1);
});
