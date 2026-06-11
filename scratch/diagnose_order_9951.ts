import * as admin from 'firebase-admin';
import * as fs from 'fs';

const ORDER_ID = '9951';

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

    // Try finding by doc ID first, then by 'id' field
    console.log(`\n🔍 Looking up Order by doc ID "${ORDER_ID}"...`);
    const docRef = db.collection('orders').doc(ORDER_ID);
    const docSnap = await docRef.get();

    let data;
    if (docSnap.exists) {
        data = docSnap.data();
        console.log(`✅ Found Order ${ORDER_ID} by doc ID.`);
    } else {
        console.log(`🔍 Looking up Order where id == "${ORDER_ID}"...`);
        const snapshot = await db.collection('orders').where('id', '==', ORDER_ID).get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            data = doc.data();
            console.log(`✅ Found Order ${ORDER_ID} by query.`);
        } else {
            console.error(`❌ Order ${ORDER_ID} not found in Firestore.`);
            process.exit(1);
        }
    }

    console.log('\n--- ORDER DETAILS ---');
    console.log(`Status:     ${data.status}`);
    console.log(`Customer:   ${data.customerName}`);
    console.log(`Email:      ${data.customerEmail}`);
    console.log(`Items:`, JSON.stringify(data.items, null, 2));
    console.log(`Document Uploads:`, JSON.stringify(data.documentUploads || [], null, 2));
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
