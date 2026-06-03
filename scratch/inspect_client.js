const admin = require('firebase-admin');

async function main() {
    try {
        admin.initializeApp({
            projectId: "studio-2604127518-57889"
        });
        const db = admin.firestore();
        const docRef = db.collection('aiAccountantClients').doc('MVa8u4DGCjfAaSG8ILWr');
        const doc = await docRef.get();
        if (!doc.exists) {
            console.log("No such client doc found!");
            return;
        }
        const data = doc.data();
        console.log("Client Name:", data.name);
        console.log("Disable Global Rules:", data.disableGlobalRules);
        console.log("Is VAT Registered:", data.isVatRegistered);
        
        console.log("\n--- Chart of Accounts ---");
        const coa = data.chartOfAccounts || [];
        coa.forEach(acc => {
            console.log(`ID: ${acc.id} | Section: ${acc.section} | Description: ${acc.description}`);
        });

        // Let's also query some transactions
        const txsSnap = await docRef.collection('transactions')
            .where('bankAccountId', '==', '8400-001')
            .get();
            
        console.log(`\nTotal transactions for 8400-001: ${txsSnap.size}`);
        
        // Let's group by status
        const statusCounts = {};
        txsSnap.docs.forEach(d => {
            const status = d.data().status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log("Status counts:", statusCounts);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
