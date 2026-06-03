const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/kev/Downloads/my-accountant-2-64964159-8c80f-firebase-adminsdk-fbsvc-bbe7506850.json');

async function main() {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        const db = admin.firestore();
        const clientsSnap = await db.collection('aiAccountantClients').get();
        console.log(`Total clients in aiAccountantClients: ${clientsSnap.size}`);
        clientsSnap.docs.forEach(doc => {
            console.log(`ID: ${doc.id} | Name: ${doc.data().name}`);
        });

        // Let's also check other collections
        const collections = await db.listCollections();
        console.log("\nCollections in DB:");
        collections.forEach(c => console.log(c.id));

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
