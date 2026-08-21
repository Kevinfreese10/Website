import * as fs from 'fs';

const src = 'c:/myacc/.agents/skills/order-audit-and-document-generator/SKILL.md';
const dst = 'C:/Users/kev/.gemini/config/skills/order-audit-and-document-generator/SKILL.md';

fs.copyFileSync(src, dst);
console.log('✓ Updated global skill copy at ' + dst);
