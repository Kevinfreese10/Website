const fs = require('fs');
let content = fs.readFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', 'utf8');
content = content.replace(/<Button onClick={\(\) => handleApproveAllWithAllocations\(onlySelectedGroups\)} disabled={allocatedCount === 0} className="bg-green-600 hover:bg-green-700 text-white">/, `
                    <Button onClick={() => handleApproveReadyOnly()} disabled={groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId).length === 0} className="bg-blue-600 hover:bg-blue-700 text-white mr-2">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Ready ({groups.filter(g => g.transactions.some(tx => tx.status === 'ready') && approvalSettings[g.merchantKey]?.accountId).length})
                    </Button>
                    <Button onClick={() => handleApproveAllWithAllocations(onlySelectedGroups)} disabled={allocatedCount === 0} className="bg-green-600 hover:bg-green-700 text-white">`);
fs.writeFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', content);
