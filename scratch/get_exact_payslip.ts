import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
    try {
        const db = getAdminDb();
        const clientId = 'Nt6RiGoHounSUkh7JqvV';
        const payslipId = 'IOMNIUzEdVaKymtPigBv';
        
        console.log(`Fetching payslip ${payslipId}...`);
        const snap = await db.collection('aiPayrollClients')
            .doc(clientId)
            .collection('payslips')
            .doc(payslipId)
            .get();
            
        if (snap.exists) {
            console.log("Payslip Data:", JSON.stringify(snap.data(), null, 2));
        } else {
            console.log("Payslip not found!");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
