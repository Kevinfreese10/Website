import { getAdminDb } from '../src/lib/firebase-admin';

async function run() {
    const db = getAdminDb();
    const clients = await db.collection('aiPayrollClients').get();
    for (const client of clients.docs) {
        const payslips = await db.collection(`aiPayrollClients/${client.id}/payslips`).where('employeeName', 'in', ['Tiaan Muller', 'Rochelle Allie']).get();
        if (!payslips.empty) {
            console.log(`Found payslips in client ${client.id}`);
            payslips.forEach(doc => {
                const d = doc.data();
                if (d.period === 'July 2026' || d.period === 'Jul 2026') {
                    console.log('---', d.employeeName, '---');
                    console.log('PAYE:', d.paye);
                    console.log('Gross:', d.grossEarnings);
                    console.log('Net:', d.netPay);
                    console.log('Earnings:', d.earnings);
                    console.log('Deductions:', d.deductions);
                }
            });
            const emps = await db.collection(`aiPayrollClients/${client.id}/employees`).where('name', 'in', ['Tiaan Muller', 'Rochelle Allie']).get();
            emps.forEach(doc => {
                const d = doc.data();
                console.log('--- Employee Profile:', d.name, '---');
                console.log('ID Number:', d.idNumber);
                console.log('Medical:', d.medicalAidMembers, d.medicalAidDependents);
                console.log('Join:', d.joinDate);
            })
        }
    }
}

run().catch(console.error);
