import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
    try {
        const db = getAdminDb();
        const clientId = 'Nt6RiGoHounSUkh7JqvV';
        
        console.log("Fetching Knox Makhubele's employee doc...");
        const empSnap = await db.collection('aiPayrollClients')
            .doc(clientId)
            .collection('employees')
            .doc('XKElzMO7FdGlKniX0aZk')
            .get();
            
        if (empSnap.exists) {
            console.log("Employee Data:", JSON.stringify(empSnap.data(), null, 2));
        } else {
            console.log("Employee not found by ID XKElzMO7FdGlKniX0aZk");
            // Search by code
            const searchSnap = await db.collection('aiPayrollClients')
                .doc(clientId)
                .collection('employees')
                .where('employeeCode', '==', 'MAK003')
                .get();
            if (!searchSnap.empty) {
                console.log("Employee found by code MAK003:");
                console.log("ID:", searchSnap.docs[0].id);
                console.log("Data:", JSON.stringify(searchSnap.docs[0].data(), null, 2));
            } else {
                console.log("Employee not found by code MAK003");
            }
        }
        
        console.log("\nFetching payslips for Knox...");
        const psSnap = await db.collection('aiPayrollClients')
            .doc(clientId)
            .collection('payslips')
            .where('employeeName', '>=', 'MAKHUBELE')
            .get();
        console.log(`Found ${psSnap.size} payslips matching name >= MAKHUBELE`);
        psSnap.forEach(d => {
            console.log(`- Payslip ID: ${d.id}`);
            console.log("  Data:", JSON.stringify(d.data(), null, 2));
        });
        
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
