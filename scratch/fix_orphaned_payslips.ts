import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
    try {
        const db = getAdminDb();
        const clientId = 'Nt6RiGoHounSUkh7JqvV';
        
        console.log("Fetching all employees...");
        const empSnap = await db.collection('aiPayrollClients')
            .doc(clientId)
            .collection('employees')
            .get();
            
        const employeeIds = new Set<string>();
        const codeToIdMap: Record<string, string> = {};
        empSnap.forEach(d => {
            employeeIds.add(d.id);
            const data = d.data();
            if (data.employeeCode) {
                codeToIdMap[data.employeeCode] = d.id;
            }
        });
        
        console.log("Fetching all payslips...");
        const psSnap = await db.collection('aiPayrollClients')
            .doc(clientId)
            .collection('payslips')
            .get();
            
        console.log(`Checking ${psSnap.size} payslips for matching employeeIds...`);
        let fixedCount = 0;
        
        for (const doc of psSnap.docs) {
            const data = doc.data();
            const currentEmpId = data.employeeId;
            
            if (!employeeIds.has(currentEmpId)) {
                console.log(`\nFound mismatch! Payslip ID: ${doc.id}`);
                console.log(`  employeeId: ${currentEmpId}`);
                console.log(`  employeeName: ${data.employeeName}`);
                console.log(`  period: ${data.period}`);
                
                // Try to resolve by name or code
                let correctId = '';
                if (data.employeeName?.includes('KNOX') || data.employeeName?.includes('MAKHUBELE')) {
                    correctId = 'XKElzMO7FdGlKniX0aZk'; // KNOX
                } else if (codeToIdMap[currentEmpId]) {
                    correctId = codeToIdMap[currentEmpId];
                } else {
                    // Try code matching from name if code is in map
                    // E.g. search codeToIdMap
                    console.log("  Could not automatically match correct employee ID.");
                }
                
                if (correctId) {
                    console.log(`  -> Correcting employeeId to: ${correctId}`);
                    await doc.ref.update({ employeeId: correctId });
                    fixedCount++;
                }
            }
        }
        
        console.log(`\nDone! Corrected ${fixedCount} payslips.`);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
