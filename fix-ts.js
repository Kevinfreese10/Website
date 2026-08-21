const fs = require('fs');

// Fix 1: page.tsx exports
function fixPageTsx(path) {
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        content = content.replace(/import BankTransactionsUI from/, 'import { BankTransactionsUI } from');
        fs.writeFileSync(path, content);
    }
}
fixPageTsx('src/app/admin/ai-accountant/[clientId]/bank/transactions/page.tsx');
fixPageTsx('src/app/dashboard/ai-accountant/[clientId]/bank/transactions/page.tsx');

// Fix 2 & 3: BankTransactionsUI.tsx fixes
let uiContent = fs.readFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', 'utf8');

// Fix 3: replace `user?.uid` with `undefined` in child components where `user` is not defined
// The server actions use `getAuthContext` which reads cookies anyway, so requestorId is just a fallback.
uiContent = uiContent.replace(/requestorId: user\?\.uid/g, 'requestorId: undefined');

// Fix 2: add 'ready' and 'server_researching' to ImportedTransaction status type
uiContent = uiContent.replace(/status: 'new' \| 'ai_review' \| 'ai_processing' \| 'reviewed';/g, "status: 'new' | 'ai_review' | 'ai_processing' | 'reviewed' | 'ready' | 'server_researching';");

fs.writeFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', uiContent);
