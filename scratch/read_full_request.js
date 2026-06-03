const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const transcriptPath = 'C:\\Users\\kev\\.gemini\\antigravity\\brain\\6a0a21fd-c187-4402-bd60-af9e6d2b10b2\\.system_generated\\logs\\transcript.jsonl';
        console.log("Reading transcript from:", transcriptPath);
        
        if (!fs.existsSync(transcriptPath)) {
            console.error("Transcript file not found at:", transcriptPath);
            return;
        }

        const content = fs.readFileSync(transcriptPath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            const parsed = JSON.parse(line);
            if (parsed.type === 'USER_INPUT') {
                console.log("--- FOUND USER INPUT ---");
                console.log(parsed.content);
                console.log("------------------------");
                break; // The first one is the original request
            }
        }
    } catch (e) {
        console.error("Error reading transcript:", e);
    }
}

main();
