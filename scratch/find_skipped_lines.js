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
        console.log("Analyzing skipped lines in user request:");
        
        let matchCount = 0;
        let skipCount = 0;
        
        for (let i = 0; i < reqLines.length; i++) {
            const line = reqLines[i];
            const parts = line.split('\t');
            if (parts.length >= 3) {
                // Let's check if parts[1] looks like a date
                const dateStr = parts[1].trim();
                const amountStr = parts[2].trim();
                const category = parts[3] ? parts[3].trim() : '';
                
                const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                const isDate = dateRegex.test(dateStr);
                
                if (isDate) {
                    matchCount++;
                } else {
                    skipCount++;
                    if (skipCount <= 30) {
                        console.log(`Skipped line ${i}: isDate=${isDate}, parts=[${parts.map(p => `"${p.trim()}"`).join(', ')}]`);
                    }
                }
            }
        }
        console.log(`Summary: matches=${matchCount}, skipped_with_3_parts=${skipCount}`);
    } catch (e) {
        console.error(e);
    }
}

main();
