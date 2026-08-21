const fs = require('fs');
let content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');

const newBulk = `    const adminDb = getAdminDb();
    const chunks = [];
    for (let i = 0; i < transactionIds.length; i += 400) {
        chunks.push(transactionIds.slice(i, i + 400));
    }
    
    await Promise.allSettled(chunks.map(async (chunk) => {
        const batch = adminDb.batch();
        const refs = chunk.map(id => adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id));
        const snaps = await adminDb.getAll(...refs);

        snaps.forEach(snap => {
            if (!snap.exists) return;
            const data = snap.data();
            const processed = BankCleaner.process(data?.description || '');
            batch.update(snap.ref, {
                status: 'new',
                allocatedTo: FieldValue.delete(),
                vatType: FieldValue.delete(),
                smartAllocationResult: FieldValue.delete(),
                allocationSource: FieldValue.delete(),
                merchantKey: processed.merchantKey,
                cleanDescription: processed.cleanDescription,
            });
        });

        await batch.commit();
    }));
    
    return { count: transactionIds.length };
}`;

content = content.replace(/    const adminDb = getAdminDb\(\);[\s\S]*?    return \{ count: transactionIds\.length \};\n\}/, newBulk);

fs.writeFileSync('src/app/actions/ai-recon.ts', content);
