const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({ projectId: 'demo-myacc' });
const db = admin.firestore();

async function run() {
    console.log("Searching for partner2...");
    const snapshot = await db.collection('users').where('email', '==', 'partner2@erioh.co.za').get();
    if (snapshot.empty) {
        console.log("No user found");
        process.exit(1);
    }
    const doc = snapshot.docs[0];
    await doc.ref.update({
        status: 'Active',
        'partnerSubscription.status': 'trialing'
    });
    console.log("Updated user status to Active!");
    process.exit(0);
}
run().catch(console.error);
