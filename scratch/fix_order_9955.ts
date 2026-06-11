import * as admin from 'firebase-admin';
import * as fs from 'fs';

const ORDER_ID = '9955';

// Use same discovery logic as firebase-admin.ts
function findServiceAccount(): string | null {
    // 1. Search Downloads folder
    const downloadsPath = 'C:/Users/kev/Downloads';
    if (fs.existsSync(downloadsPath)) {
        const files = fs.readdirSync(downloadsPath);
        const keyFile = files.find(f => f.toLowerCase().includes('studio-2604127518-57889') && f.endsWith('.json'));
        if (keyFile) return `${downloadsPath}/${keyFile}`;
    }
    // 2. Hardcoded fallback
    const hardcoded = 'C:/Users/kev/Downloads/my-accountant-2-64964159-8c80f-firebase-adminsdk-fbsvc-bbe7506850.json';
    if (fs.existsSync(hardcoded)) return hardcoded;
    return null;
}

async function reconcileOrder() {
    const saPath = findServiceAccount();
    if (!saPath) {
        console.error('❌ Could not find Firebase service account JSON in Downloads folder.');
        process.exit(1);
    }
    console.log(`🔑 Using service account: ${saPath}`);
    const credentials = JSON.parse(fs.readFileSync(saPath, 'utf8'));

    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(credentials), projectId: credentials.project_id });
    }
    const db = admin.firestore();

    console.log(`\n🔍 Looking up Order ${ORDER_ID}...`);
    const snapshot = await db.collection('orders').where('id', '==', ORDER_ID).get();

    if (snapshot.empty) {
        console.error(`❌ Order ${ORDER_ID} not found in Firestore.`);
        process.exit(1);
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    console.log(`✅ Found Order ${ORDER_ID}`);
    console.log(`   Status:     ${data.status}`);
    console.log(`   Customer:   ${data.customerName || 'N/A'}`);
    console.log(`   Total:      R${data.total}`);
    console.log(`   itnHistory: ${JSON.stringify(data.itnHistory || [])}`);

    if (data.status === 'Processing') {
        console.log(`\n✅ Order ${ORDER_ID} is already "Processing". No change needed.`);
        process.exit(0);
    }

    console.log(`\n🔄 Updating Order ${ORDER_ID} to "Processing"...`);
    await doc.ref.update({
        status: 'Processing',
        paymentMethod: 'PayFast',
        itnHistory: admin.firestore.FieldValue.arrayUnion({
            status: 'Success',
            message: 'Manually reconciled: Payment confirmed via PayFast sandbox. ITN was not delivered to server because PayFast cannot reach localhost. Fixed by adding NEXT_PUBLIC_APP_URL to .env.local and restarting the dev server.',
            receivedAt: new Date(),
            payload: { merchant_id: '10049800', payment_status: 'COMPLETE', m_payment_id: ORDER_ID }
        }),
        notes: admin.firestore.FieldValue.arrayUnion({
            text: `Order manually reconciled to "Processing" after confirmed PayFast sandbox payment. Root cause: NEXT_PUBLIC_APP_URL was missing in .env.local, so notify_url was sent as "undefined/api/payfast/notify". Now fixed.`,
            date: new Date(),
            authorId: 'system',
            type: 'note',
            subject: null,
            attachments: null,
        })
    });

    console.log(`\n✅ Order ${ORDER_ID} successfully updated to "Processing"!`);
}

reconcileOrder().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
