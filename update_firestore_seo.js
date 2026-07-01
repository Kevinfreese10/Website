const admin = require('firebase-admin');

// Initialize Firebase Admin (assuming default credentials or GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

async function updateSEO() {
    console.log('Starting SEO updates...');

    // 1. Homepage SEO (in staticSeo collection)
    await db.collection('staticSeo').doc('home').set({
        metaTitle: "My Accountant | SA's Top Online Accounting Firm ★ 200+ Reviews",
        metaDescription: "Professional accounting, tax, SARS & CIPC services online. Trusted by 10,000+ SA businesses. Book your free consultation today."
    }, { merge: true });
    console.log('Updated homepage SEO');

    // 2. Blog: Start a Business
    const blogSnap = await db.collection('blogPosts').where('slug', '==', 'start-a-business-in-sa').get();
    if (!blogSnap.empty) {
        await blogSnap.docs[0].ref.update({
            metaTitle: "Start a Business in SA for Under R500 (2026 Guide)",
            metaDescription: "Everything you need to register & launch a business in South Africa for less than R500. Step-by-step process with costs breakdown."
        });
        console.log('Updated blog: start-a-business-in-sa');
    } else {
        // Might be a different slug, let's just log
        console.log('Could not find blog: start-a-business-in-sa');
    }

    // 3. Products: NCR Registration
    const ncrSnap = await db.collection('services').where('slug', '==', 'ncr-registration').get();
    if (!ncrSnap.empty) {
        await ncrSnap.docs[0].ref.update({
            metaTitle: "NCR Registration South Africa — From R1,400 | My Accountant",
            metaDescription: "Register with the National Credit Regulator in 15-20 days. Full application, CIPC vetting & NCR liaison included. Apply online now."
        });
        console.log('Updated service: ncr-registration');
    }

    // 4. Products: Accountants Letter
    const accLetterSnap = await db.collection('services').where('slug', '==', 'accountants-letter').get();
    if (!accLetterSnap.empty) {
        await accLetterSnap.docs[0].ref.update({
            metaTitle: "Accountant's Letter South Africa — R450 | My Accountant",
            metaDescription: "Get a professional accountant's confirmation letter within 3-5 days. CIBA & SAIT registered. Accepted by landlords, banks & immigration."
        });
        console.log('Updated service: accountants-letter');
    }

    console.log('SEO updates complete.');
}

updateSEO().catch(console.error);
