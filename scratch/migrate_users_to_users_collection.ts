import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountPath) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY env var is missing.");
    process.exit(1);
}

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccountPath)
    });
}

const db = getFirestore();

async function migrate() {
    const collections = ['aiAccountantClients', 'adminClients', 'partnerClients'];
    const usersCol = db.collection('users');
    let migratedCount = 0;

    for (const colName of collections) {
        console.log(`Scanning collection: ${colName}...`);
        const snap = await db.collection(colName).get();
        console.log(`Found ${snap.size} documents in ${colName}.`);

        for (const doc of snap.docs) {
            const data = doc.data();
            const uid = doc.id;
            
            // Check if email exists
            const email = data.email || data.contactEmail || '';
            if (!email) {
                console.log(`Skipping doc ${uid} - no email found.`);
                continue;
            }

            // Check if already in 'users'
            const userDoc = await usersCol.doc(uid).get();
            if (userDoc.exists) {
                console.log(`User ${uid} (${email}) already exists in 'users'. Skipping.`);
                continue;
            }

            // Create base profile in 'users'
            const baseProfile = {
                id: uid,
                uid: uid,
                name: data.name || data.companyName || 'Client',
                email: email.toLowerCase().trim(),
                contactNumber: data.contactNumber || data.cellNumber || '',
                role: data.role || 'client',
                source: data.source || colName,
                createdAt: data.createdAt || new Date(),
                migratedFrom: colName
            };

            await usersCol.doc(uid).set(baseProfile);
            console.log(`Successfully migrated ${uid} (${email}) to 'users' collection.`);
            migratedCount++;
        }
    }

    console.log(`Migration finished. Migrated ${migratedCount} users.`);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
});
