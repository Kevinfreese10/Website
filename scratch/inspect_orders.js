const admin = require('firebase-admin');

async function main() {
    try {
        admin.initializeApp({
            projectId: "studio-2604127518-57889"
        });
        const db = admin.firestore();
        const ordersSnap = await db.collection('orders')
            .orderBy('date', 'desc')
            .limit(20)
            .get();

        console.log(`Retrieved ${ordersSnap.size} recent orders:\n`);
        
        ordersSnap.docs.forEach(doc => {
            const data = doc.data();
            console.log(`Order ID: ${data.id} (Doc ID: ${doc.id})`);
            console.log(`  Date: ${data.date}`);
            console.log(`  Status: ${data.status}`);
            console.log(`  Customer: ${data.customerName || data.endCustomerName} (${data.customerEmail || data.endCustomerEmail})`);
            console.log(`  Total: ${data.clientTotal || data.total}`);
            console.log(`  Items: ${JSON.stringify(data.items)}`);
            
            if (data.itnHistory && data.itnHistory.length > 0) {
                console.log(`  ITN History:`);
                data.itnHistory.forEach((itn, idx) => {
                    console.log(`    [${idx}] Received At: ${itn.receivedAt ? itn.receivedAt.toDate().toISOString() : 'unknown'}`);
                    console.log(`        Status: ${itn.status}`);
                    console.log(`        Message: ${itn.message}`);
                    if (itn.payload) {
                        console.log(`        Payload keys: ${Object.keys(itn.payload).join(', ')}`);
                        if (itn.payload.payment_status) {
                            console.log(`        payment_status: ${itn.payload.payment_status}`);
                        }
                    }
                });
            } else {
                console.log(`  ITN History: None`);
            }
            console.log("------------------------------------------");
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
