import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
    try {
        const db = getAdminDb();
        const clientId = 'Nt6RiGoHounSUkh7JqvV';
        const period = '12/06/2026';
        
        console.log(`Searching for Knox payslips for period ${period}...`);
        
        const snap = await db.collection('aiPayrollClients')
            .doc(clientId)
            .collection('payslips')
            .where('period', '==', period)
            .get();
            
        console.log(`Found ${snap.size} payslips in total for this period.`);
        snap.forEach(d => {
            const data = d.data();
            const isKnox = data.employeeName?.includes('KNOX') || 
                           data.employeeName?.includes('MAKHUBELE') || 
                           data.employeeId === 'XKElzMO7FdGlKniX0aZk' || 
                           data.employeeId === 'MAX003';
                           
            if (isKnox) {
                console.log(`Match - Payslip ID: ${d.id}`);
                console.log(`  employeeId: ${data.employeeId}`);
                console.log(`  employeeName: ${data.employeeName}`);
                console.log(`  status: ${data.status}`);
                console.log(`  netPay: ${data.netPay}`);
                console.log(`  grossPay: ${data.grossPay}`);
                console.log(`  updatedAt: ${data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt}`);
            }
        });
        
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
