const fs = require('fs');

async function main() {
    try {
        const transcriptPath = 'C:\\Users\\kev\\.gemini\\antigravity\\brain\\6a0a21fd-c187-4402-bd60-af9e6d2b10b2\\.system_generated\\logs\\transcript.jsonl';
        const content = fs.readFileSync(transcriptPath, 'utf8');
        const lines = content.split('\n');
        
        let userRequestText = "";
        for (const line of lines) {
            if (!line.trim()) continue;
            const parsed = JSON.parse(line);
            if (parsed.type === 'USER_INPUT') {
                userRequestText = parsed.content;
                break;
            }
        }
        
        const reqLines = userRequestText.split('\n');
        console.log("Showing first 40 lines of user input with whitespace inspection:");
        for (let i = 0; i < Math.min(reqLines.length, 40); i++) {
            const line = reqLines[i];
            const hasTab = line.includes('\t');
            const hasMultipleSpaces = line.includes('  ');
            console.log(`Line ${i}: hasTab=${hasTab}, hasMultipleSpaces=${hasMultipleSpaces}, text="${line}"`);
        }
    } catch (e) {
        console.error(e);
    }
}

main();
