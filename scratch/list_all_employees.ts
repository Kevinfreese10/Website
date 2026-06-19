import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
    try {
        const db = getAdminDb();
        const clientId = 'Nt6RiGoHounSUkh7JqvV';
        
        console.log("Listing all employees...");
        const snap = await db.collection('aiPayrollClients')
            .doc(clientId)
            .collection('employees')
            .get();
            
        console.log(`Found ${snap.size} employees:`);
        snap.forEach(d => {
            const data = d.data();
            console.log(`- ID: ${d.id}, Code: ${data.employeeCode}, Name: ${data.name} ${data.surname}, Status: ${data.status}`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
