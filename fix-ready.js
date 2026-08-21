const fs = require('fs');
let content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');
content = content.replace(/status: 'ai_review',(\s*)smartAllocationResult:/g, (match, p1) => {
    return \status: 'ready',\smartAllocationResult:\;
});
fs.writeFileSync('src/app/actions/ai-recon.ts', content);
