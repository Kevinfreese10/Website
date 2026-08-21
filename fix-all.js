const fs = require('fs');
let content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');

// Replace the loop in runAiAccountantAnalysis to include global DB and ready status
const newLoop = `            if (match) {
                batch.update(d.ref, {
                    ...result,
                    status: 'ready',
                    smartAllocationResult: {
                        accountId: match.accountId,
                        accountType: match.accountType || 'account',
                        vatType: match.vatType,
                        confidence: 100,
                        summary: \`Match found for rule keyword.\`,
                        ruleId: match.id,
                        matchedKeyword: match.keywords.find(kw => result.cleanDescription.includes(kw.toUpperCase()))
                    },
                    allocationSource: 'rule'
                });
            } else {
                const historyMatch = bestHistoryMap.get(result.merchantKey);
                if (historyMatch) {
                    batch.update(d.ref, {
                        ...result,
                        status: 'ready',
                        smartAllocationResult: {
                            accountId: historyMatch.allocatedTo.value,
                            accountType: historyMatch.allocatedTo.type || 'account',
                            vatType: historyMatch.vatType || 'no_vat',
                            confidence: 95,
                            summary: \`Matched with past transaction allocation history.\`
                        },
                        allocationSource: 'history'
                    });
                } else {
                    batch.update(d.ref, {
                        ...result,
                        status: 'ai_review',
                        allocationSource: 'none'
                    });
                }
            }
        }
        await batch.commit();

        const noneSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
            .where('bankAccountId', '==', bankAccountId)
            .where('status', '==', 'ai_review')
            .where('allocationSource', '==', 'none')
            .get();
            
        if (!noneSnap.empty) {
            const globalBatch = adminDb.batch();
            for (const d of noneSnap.docs) {
                const tx = d.data();
                const merchantKey = tx.merchantKey || BankCleaner.process(tx.description).merchantKey;
                if (merchantKey) {
                    const globalDoc = await adminDb.collection('globalMerchantDb').doc(merchantKey).get();
                    if (globalDoc.exists) {
                        const globalData = globalDoc.data();
                        globalBatch.update(d.ref, {
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
                }
            }
            await globalBatch.commit();
        }
    }
}`;

content = content.replace(/            if \(match\) {[\s\S]*?await batch\.commit\(\);\n    }\n}/, newLoop);

// Also add RAG to researchMerchantWithAi
const newResearch = `export async function researchMerchantWithAi({ clientId, transactionIds, description, chartOfAccounts, isVatRegistered, isExpense }: any) {
    try {
        const adminDb = getAdminDb();
        let contextualEvidence = '';
        if (clientId) {
            const pastSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').where('status', 'in', ['allocated', 'reviewed']).orderBy('allocatedAt', 'desc').limit(50).get();
            const pastTxs = pastSnap.docs.map(d => d.data());
            const similar = pastTxs.filter(t => {
                const d1 = (t.description || '').toLowerCase();
                const d2 = (description || '').toLowerCase();
                return d1.includes(d2) || d2.includes(d1);
            }).slice(0, 5);
            if (similar.length > 0) {
                contextualEvidence = 'Past similar transactions:\\n' + similar.map(t => \`- \${t.date}: \${t.description} -> Allocated to: \${t.allocatedTo?.value} (VAT: \${t.vatType})\`).join('\\n');
            }
        }

        const { suggestTransactionAllocation } = await import('@/ai/flows/suggest-transaction-allocation');
        const res = await suggestTransactionAllocation({
            description,
            chartOfAccounts,
            isVatRegistered,
            contextualEvidence
        });`;

content = content.replace(/export async function researchMerchantWithAi\(\{ clientId, transactionIds, description, chartOfAccounts, isVatRegistered, isExpense \}: any\) {\n    try {\n        const { suggestTransactionAllocation } = await import\('@\/ai\/flows\/suggest-transaction-allocation'\);\n        const res = await suggestTransactionAllocation\({\n            description,\n            chartOfAccounts,\n            isVatRegistered\n        }\);/, newResearch);

fs.writeFileSync('src/app/actions/ai-recon.ts', content);
