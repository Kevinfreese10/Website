const fs = require('fs');

let content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');

// Fix the syntax errors caused by the regex
content = content.replace(/\n, requestorId }\: \{/g, ',\n    requestorId\n}: {');
content = content.replace(/\n, requestorId\?\: string \}\)/g, ',\n    requestorId?: string\n})');

// Fix matchTransactionsToHistory
content = content.replace(/bankAccountId: string , requestorId\?\: string \}\)/g, 'bankAccountId: string,\n    requestorId?: string\n})');
content = content.replace(/bankAccountId , requestorId \}\: \{/g, 'bankAccountId,\n    requestorId\n}: {');

// Fix bulkMoveTransactionsToNew
content = content.replace(/transactionIds , requestorId \}\: \{/g, 'transactionIds,\n    requestorId\n}: {');
content = content.replace(/transactionIds: string\[\] , requestorId\?\: string \}\)/g, 'transactionIds: string[],\n    requestorId?: string\n})');

// Some others might have a similar pattern
content = content.replace(/, requestorId \}: \{/g, ',\n    requestorId\n}: {');
content = content.replace(/, requestorId\?\: string \}\)/g, ',\n    requestorId?: string\n})');

fs.writeFileSync('src/app/actions/ai-recon.ts', content);
