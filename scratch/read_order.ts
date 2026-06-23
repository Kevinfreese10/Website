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
        const orderSnap = await db.collection('orders').doc('10009').get();
        if (orderSnap.exists) {
            console.log("Order 10009 found by ID:");
            console.log(JSON.stringify(orderSnap.data(), null, 2));
            const orderData = orderSnap.data()!;
            
            // Fetch users
            const clientSnap = await db.collection('users').doc(orderData.userId).get();
            console.log("Client user data:");
            console.log(clientSnap.exists ? JSON.stringify(clientSnap.data(), null, 2) : "Not found");
            
            if (orderData.assignedTo && orderData.assignedTo.length > 0) {
                const staffSnap = await db.collection('users').doc(orderData.assignedTo[0]).get();
                console.log("Assigned Staff data:");
                console.log(staffSnap.exists ? JSON.stringify(staffSnap.data(), null, 2) : "Not found");
            }
        } else {
            console.log("Order 10009 not found");
        }

        console.log("\n--- Checking failedEmails collection ---");
        const failedSnap = await db.collection('failedEmails').orderBy('failedAt', 'desc').limit(10).get();
        if (failedSnap.empty) {
            console.log("No failed emails logged.");
        } else {
            failedSnap.forEach(doc => {
                console.log(`Failed Email Doc ID: ${doc.id}`);
                console.log(JSON.stringify(doc.data(), null, 2));
            });
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

readOrder();
