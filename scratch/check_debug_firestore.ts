import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkDebug() {
    const db = getAdminDb();
    try {
        const snap = await db.collection('debug').doc('env').get();
        if (snap.exists) {
            console.log("Debug document exists!");
            console.log(JSON.stringify(snap.data(), null, 2));
        } else {
            console.log("Debug document does NOT exist yet in Firestore!");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

checkDebug();
