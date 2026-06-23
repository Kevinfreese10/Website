import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function readOrder() {
    const db = getAdminDb();
    console.log("Reading order 10009...");
    try {
        const docSnap = await db.collection('debug').doc('env').get();
        if (docSnap.exists) {
            console.log("Debug env found!");
            console.log(JSON.stringify(docSnap.data(), null, 2));
        } else {
            console.log("Debug doc NOT found!");
        }
    } catch (err) {
        console.error("Error reading order:", err);
    }
}

readOrder();
