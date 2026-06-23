import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function checkStaff() {
    const db = getAdminDb();
    try {
        const staffSnap = await db.collection('users').doc('LRM285EOq3gwNMKayY6vtzooaC03').get();
        if (staffSnap.exists) {
            console.log("Staff LRM285EOq3gwNMKayY6vtzooaC03 found:");
            console.log(JSON.stringify(staffSnap.data(), null, 2));
        } else {
            console.log("Staff not found in users collection!");
        }

        const clientSnap = await db.collection('users').doc('hCTT7dPOdbX3Y0ExvLWRwL6sujM2').get();
        if (clientSnap.exists) {
            console.log("Client hCTT7dPOdbX3Y0ExvLWRwL6sujM2 found:");
            console.log(JSON.stringify(clientSnap.data(), null, 2));
        } else {
            console.log("Client not found in users collection!");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

checkStaff();
