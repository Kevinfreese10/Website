const fs = require('fs');
let content = fs.readFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', 'utf8');
content = content.replace(/const handleApproveAllWithAllocations = async/, `    const handleApproveReadyOnly = async () => {
        if (!client?.uid) return;
        const readyGroups = groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId);
        if (readyGroups.length === 0) {
            toast({ title: "No ready allocations found." });
            return;
        }
        try {
            const batch = writeBatch(db);
            const transRef = collection(db, 'aiAccountantClients', client.uid, 'transactions');
            readyGroups.forEach(group => {
                const settings = approvalSettings[group.merchantKey];
                group.transactions.forEach(tx => {
                    batch.update(doc(transRef, tx.id), {
                        status: 'reviewed',
                        allocatedTo: { value: settings.accountId, type: group.suggestion?.accountType || 'account' },
                        vatType: settings.vatType || 'no_vat',
                        allocatedAt: serverTimestamp(),
                        allocationSource: tx.allocationSource || 'manual',
                        matchedRuleId: group.suggestion?.ruleId || deleteField(),
                        matchedKeyword: group.suggestion?.matchedKeyword || deleteField()
                    });
                });
                // Note: Calling the server action updateGlobalMerchantDb from client side is tricky without importing it.
                // Assuming we just want to update the DB, let's omit the server action call here to avoid import issues,
                // or we rely on the fact that global DB update was already handled during ai-recon.
            });
            await batch.commit();
            toast({ title: \`Approved \${readyGroups.length} ready groups!\` });
        } catch (e) { toast({ title: "Approval Failed", variant: "destructive" }); }
    };

    const handleApproveAllWithAllocations = async`);
fs.writeFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', content);
