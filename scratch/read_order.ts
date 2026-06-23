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
        const docSnap = await db.collection('orders').doc('10009').get();
        if (docSnap.exists) {
            console.log("Order found!");
            console.log(JSON.stringify(docSnap.data(), null, 2));
        } else {
            console.log("Order 10009 NOT found in 'orders' collection!");
        }
    } catch (err) {
        console.error("Error reading order:", err);
    }
}

readOrder();
