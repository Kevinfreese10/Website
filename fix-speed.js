const fs = require('fs');
let content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');

const newGlobalDbLoop = `        if (!noneSnap.empty) {
            const globalBatch = adminDb.batch();
            const docsToFetch = noneSnap.docs
                .map(d => {
                    const tx = d.data();
                    const merchantKey = tx.merchantKey || BankCleaner.process(tx.description).merchantKey;
                    return { doc: d, merchantKey };
                })
                .filter(item => item.merchantKey);
                
            // Fetch in parallel batches
            for (let i = 0; i < docsToFetch.length; i += 50) {
                const chunk = docsToFetch.slice(i, i + 50);
                const results = await Promise.allSettled(chunk.map(item => adminDb.collection('globalMerchantDb').doc(item.merchantKey).get()));
                
                chunk.forEach((item, idx) => {
                    const res = results[idx];
                    if (res.status === 'fulfilled' && res.value.exists) {
                        const globalData = res.value.data();
                        globalBatch.update(item.doc.ref, {
                            status: 'ready',
                            smartAllocationResult: {
                                accountId: globalData.accountId,
                                accountType: globalData.accountType || 'account',
                                vatType: globalData.vatType || 'no_vat',
                                confidence: 85,
                                summary: \`Matched from global AI brain.\`
                            },
                            allocationSource: 'global_ai'
                        });
                    }
                });
            }
            await globalBatch.commit();
        }`;
        
content = content.replace(/        if \(\!noneSnap\.empty\) \{[\s\S]*?await globalBatch\.commit\(\);\n        \}/, newGlobalDbLoop);

fs.writeFileSync('src/app/actions/ai-recon.ts', content);
