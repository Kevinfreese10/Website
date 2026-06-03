const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const dir = 'C:\\Users\\kev\\.gemini\\antigravity\\brain\\6a0a21fd-c187-4402-bd60-af9e6d2b10b2\\.system_generated\\tasks';
        const files = fs.readdirSync(dir);
        console.log("Searching", files.length, "task logs...");
        
        for (const file of files) {
            if (!file.endsWith('.log')) continue;
            const fullPath = path.join(dir, file);
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('ACKERMANS')) {
                console.log(`FOUND IN LOG: ${file} (Size: ${content.length} bytes)`);
                // Print a small snippet
                console.log(content.slice(0, 800));
            }
        }
    } catch (e) {
        console.error(e);
    }
}

main();
