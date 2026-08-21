const fs = require('fs');
const path = require('path');

const filepath = path.join('c:', 'myacc', 'src', 'components', 'ai-accountant', 'BankTransactionsUI.tsx');
let content = fs.readFileSync(filepath, 'utf8');

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
    'matchTransactionsToHistory',
    'suggestTransactionAllocationWeb' // wait, this was in the regex earlier, I should check if it needs requestorId too? The instructions say "every data-mutating exported function in src/app/actions/ai-recon.ts". suggestTransactionAllocationWeb is not in ai-recon.ts.
];

for (const func of funcs) {
    const regex = new RegExp(`(${func}\\s*\\(\\s*\\{)`, 'g');
    content = content.replace(regex, `$1 requestorId: user?.uid,`);
}

fs.writeFileSync(filepath, content);
console.log('Done modifying BankTransactionsUI.tsx');
