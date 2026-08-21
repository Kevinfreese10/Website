const fs = require('fs');

let content = fs.readFileSync('src/app/actions/ai-recon.ts', 'utf8');

content = content.replace(/,,/g, ',');
content = content.replace(/;,/g, ';');

fs.writeFileSync('src/app/actions/ai-recon.ts', content);
