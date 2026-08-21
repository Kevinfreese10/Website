const fs = require('fs');
let content = fs.readFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', 'utf8');
content = content.replace(/'ai_processing', 'ai_review']/g, "'ai_processing', 'ai_review', 'ready']");
content = content.replace(/'new', 'ai_processing', 'ai_review']/g, "'new', 'ai_processing', 'ai_review', 'ready']");
content = content.replace(/'new', 'ai_review']/g, "'new', 'ai_review', 'ready']");
fs.writeFileSync('src/components/ai-accountant/BankTransactionsUI.tsx', content);
