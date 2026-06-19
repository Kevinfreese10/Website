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

async function searchUser() {
    console.log("Listing all partner users...");
    const snapshot = await db.collection('users')
        .where('role', '==', 'partner')
        .get();
        
    for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log(`- ${data.companyName} | ${data.name || data.contactPerson} | ${data.email} | ${doc.id}`);
    }
}

searchUser().catch(console.error);
