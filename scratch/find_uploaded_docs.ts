import * as admin from 'firebase-admin';
import * as fs from 'fs';

function findServiceAccount(): string | null {
    const downloadsPath = 'C:/Users/kev/Downloads';
    if (fs.existsSync(downloadsPath)) {
        const files = fs.readdirSync(downloadsPath);
        const keyFile = files.find(f => f.toLowerCase().includes('studio-2604127518-57889') && f.endsWith('.json'));
        if (keyFile) return `${downloadsPath}/${keyFile}`;
    }
    const hardcoded = 'C:/Users/kev/Downloads/my-accountant-2-64964159-8c80f-firebase-adminsdk-fbsvc-bbe7506850.json';
    if (fs.existsSync(hardcoded)) return hardcoded;
    return null;
}

async function run() {
    const saPath = findServiceAccount();
    if (!saPath) {
        console.error('❌ Could not find Firebase service account JSON.');
        process.exit(1);
    }
    const credentials = JSON.parse(fs.readFileSync(saPath, 'utf8'));

    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(credentials), projectId: credentials.project_id });
    }
    const db = admin.firestore();

    console.log('🔍 Searching all orders in Firestore...');
    const snapshot = await db.collection('orders').get();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const dataStr = JSON.stringify(data);
        if (dataStr.toLowerCase().includes('livingston') || 
            dataStr.toLowerCase().includes('pinkfrog') || 
            dataStr.toLowerCase().includes('3069057200') ||
            dataStr.toLowerCase().includes('nala-bts')) {
            
            console.log(`\n========================================`);
            console.log(`MATCH FOUND: Order Document ID: ${doc.id}`);
            console.log(`Customer: ${data.customerName}`);
            console.log(`Email:    ${data.customerEmail}`);
            console.log(`Reseller ID: ${data.resellerId}`);
            console.log(`Original Order ID: ${data.originalOrderId}`);
            console.log(`Status:   ${data.status}`);
            console.log(`Items:`, JSON.stringify(data.items, null, 2));
            console.log(`Document Uploads:`, JSON.stringify(data.documentUploads || [], null, 2));
        }
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
