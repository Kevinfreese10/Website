import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
        initializeApp({
            credential: cert(JSON.parse(serviceAccountJson)),
            projectId: "studio-2604127518-57889"
        });
    } else {
        const downloadsPath = 'C:/Users/kev/Downloads';
        if (fs.existsSync(downloadsPath)) {
            const files = fs.readdirSync(downloadsPath);
            const keyFile = files.find(f => f.toLowerCase().includes('studio-2604127518-57889') && f.endsWith('.json'));
            if (keyFile) {
                const credentials = JSON.parse(fs.readFileSync(`${downloadsPath}/${keyFile}`, 'utf8'));
                initializeApp({
                    credential: cert(credentials),
                    projectId: "studio-2604127518-57889"
                });
                console.log("Initialized Firebase Admin using Downloads key file.");
            } else {
                initializeApp({
                    projectId: "studio-2604127518-57889"
                });
            }
        } else {
            initializeApp({
                projectId: "studio-2604127518-57889"
            });
        }
    }
}

const db = getFirestore();

async function applyGrandfathering() {
    console.log("Fetching all partner users...");
    const snapshot = await db.collection('users')
        .where('role', '==', 'partner')
        .get();
        
    console.log(`Found ${snapshot.docs.length} partners.`);
    
    const now = new Date();
    const grandfatheredUntil = new Date();
    grandfatheredUntil.setMonth(now.getMonth() + 3); // 3 months from now
    
    let migratedCount = 0;
    
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.partnerTier) {
            console.log(`Migrating partner: ${data.companyName || data.name} (${doc.id})`);
            await doc.ref.update({
                partnerTier: 'growth',
                partnerSubscription: {
                    status: 'active',
                    currentPeriodStart: FieldValue.serverTimestamp(),
                    currentPeriodEnd: Timestamp.fromDate(grandfatheredUntil),
                    grandfatheredUntil: Timestamp.fromDate(grandfatheredUntil),
                    aiCompanyLimit: 5,
                    aiPayrollLimit: 5,
                    staffSeatLimit: 3,
                }
            });
            migratedCount++;
        }
    }
    
    console.log(`Successfully migrated ${migratedCount} partners to 3-month grandfathered Growth tier!`);
}

applyGrandfathering().catch(console.error);
