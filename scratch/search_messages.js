const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const dir = 'C:\\Users\\kev\\.gemini\\antigravity\\brain\\6a0a21fd-c187-4402-bd60-af9e6d2b10b2\\.system_generated\\messages';
        const files = fs.readdirSync(dir);
        console.log("Searching", files.length, "files...");
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const fullPath = path.join(dir, file);
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('ACKERMANS CERES')) {
                console.log(`FOUND IN FILE: ${file} (Size: ${content.length} bytes)`);
                // Let's print a small snippet of it
                console.log(content.slice(0, 500));
            }
        }
    } catch (e) {
        console.error(e);
    }
}

main();
