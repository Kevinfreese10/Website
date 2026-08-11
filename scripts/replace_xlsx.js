const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'src'));
let changedCount = 0;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes("'xlsx'")) {
        const newContent = content.replace(/from\s+'xlsx'/g, "from 'xlsx-js-style'");
        if (newContent !== content) {
            fs.writeFileSync(file, newContent, 'utf8');
            changedCount++;
            console.log(`Updated ${file}`);
        }
    }
});

console.log(`Replaced in ${changedCount} files.`);
