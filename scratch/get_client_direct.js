const admin = require('firebase-admin');

async function main() {
    try {
        admin.initializeApp({
            projectId: "studio-2604127518-57889"
        });
        const db = admin.firestore();
        const docRef = db.collection('aiAccountantClients').doc('bwDhWbQy71lheSJAoP9r');
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

        console.log("\n--- Allocation Rules ---");
        const rules = data.allocationRules || [];
        rules.forEach(r => {
            console.log(`ID: ${r.id} | Keywords: ${r.keywords.join(', ')} | Target: ${r.accountId} | Type: ${r.accountType}`);
        });

    } catch (e) {
        console.error("Error fetching client doc:", e);
    }
}

main();
