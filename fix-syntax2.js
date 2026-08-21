const fs = require('fs');

let content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');

content = content.replace(/,\s*,\s*requestorId/g, ',\n    requestorId');
content = content.replace(/;\s*,\s*requestorId\?: string/g, ';\n    requestorId?: string');

fs.writeFileSync('src/app/actions/ai-recon.ts', content);
