const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json'); // assuming it exists or use default

initializeApp();
const db = getFirestore();

async function run() {
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
                    console.log('ID:', d.idNumber);
                }
            });
        }
    }
}

run().catch(console.error);
