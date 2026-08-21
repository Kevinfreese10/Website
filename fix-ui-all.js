const fs = require('fs');

let content = fs.readFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', 'utf8');

// 1. Rename to BankTransactionsUI
content = content.replace(/export default function BankTransactionsPage/, 'export function BankTransactionsUI');

// 2. Add requestorId to all server functions (rewrite_ui.js logic)
const funcs = [
    'extractStatementChunk',
    'prepareAiAccountantAnalysis',
    'runAiAccountantAnalysis',
    'moveTransactionToNew',
    'bulkMoveTransactionsToNew',
    'researchMerchantWithAi',
    'updateGlobalMerchantDb',
    'resetAiAccountantAnalysis',
    'reanalyzeAndRegroupTransactions',
    'proposeRegroups',
    'applyRegroups',
    'proposeAiRegroups',
    'analyzeClientCommentAndSuggest',
    'matchTransactionsToSuppliers',
    'finalizeChatAllocation',
    'analyzeSpreadsheetAllocationsAction',
    'applySpreadsheetAllocationsAction',
    'matchTransactionsToHistory'
];

for (const func of funcs) {
    const regex = new RegExp(`(${func}\\s*\\(\\s*\\{)`, 'g');
    content = content.replace(regex, `$1 requestorId: user?.uid,`);
}

// 3. Add Approve Ready logic (fix-ui-buttons.js)
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
            });
            await batch.commit();
            toast({ title: \`Approved \${readyGroups.length} ready groups!\` });
        } catch (e) { toast({ title: "Approval Failed", variant: "destructive" }); }
    };

    const handleApproveAllWithAllocations = async`);

// 4. Add the HTML for Approve Ready button (fix-ui-buttons-html.js)
content = content.replace(/<Button onClick={\(\) => handleApproveAllWithAllocations\(onlySelectedGroups\)} disabled={allocatedCount === 0} className="bg-green-600 hover:bg-green-700 text-white">/, `
                    <Button onClick={() => handleApproveReadyOnly()} disabled={groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId).length === 0} className="bg-blue-600 hover:bg-blue-700 text-white mr-2">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Ready ({groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId).length})
                    </Button>
                    <Button onClick={() => handleApproveAllWithAllocations(onlySelectedGroups)} disabled={allocatedCount === 0} className="bg-green-600 hover:bg-green-700 text-white">`);

fs.writeFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', content);
