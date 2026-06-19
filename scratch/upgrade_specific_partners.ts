import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

const emailsToUpgrade = ['george@accountonme.co.za', 'nic@nala-bts.co.za'];

async function upgradePartners() {
    for (const email of emailsToUpgrade) {
        console.log(`Searching for user with email: ${email}`);
        // Do case-insensitive comparison in-memory for safety
        const snapshot = await db.collection('users')
            .where('role', '==', 'partner')
            .get();
            
        const matchingDocs = snapshot.docs.filter(doc => doc.data().email?.toLowerCase() === email.toLowerCase());
            
        if (matchingDocs.length === 0) {
            console.log(`No user found with email: ${email}`);
            continue;
        }
        
        for (const doc of matchingDocs) {
            const data = doc.data();
            console.log(`Upgrading ${data.name || data.companyName || email} to growth tier...`);
            
            const grandfatheredUntil = new Date();
            grandfatheredUntil.setMonth(grandfatheredUntil.getMonth() + 3); // 3 months free
            
            await doc.ref.update({
                partnerTier: 'growth',
                partnerSubscription: {
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: grandfatheredUntil,
                    grandfatheredUntil: grandfatheredUntil,
                    aiCompanyLimit: 5,
                    aiPayrollLimit: 5,
                    staffSeatLimit: 3,
                }
            });
            console.log(`Successfully upgraded ${email} to growth tier.`);
        }
    }
}

upgradePartners().catch(console.error);
