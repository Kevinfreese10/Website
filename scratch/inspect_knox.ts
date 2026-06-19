import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
    try {
        const db = getAdminDb();
        const clientId = 'Nt6RiGoHounSUkh7JqvV';
        
        console.log("Fetching all payslips for period 12/06/2026...");
        const snap = await db.collection('aiPayrollClients')
            .doc(clientId)
            .collection('payslips')
            .where('period', '==', '12/06/2026')
            .get();
            
        console.log(`Found ${snap.size} payslips for period 12/06/2026:`);
        snap.forEach(d => {
            const data = d.data();
            console.log(`- ID: ${d.id}, Employee: ${data.employeeName}, Status: ${data.status}`);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
