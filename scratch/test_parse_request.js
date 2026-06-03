const fs = require('fs');

function parseUserRequest(text) {
    const lines = text.split('\n');
    const transactions = [];
    
    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 4) {
            const desc = parts[0].trim();
            const dateStr = parts[1].trim();
            const amountStr = parts[2].trim();
            const category = parts[3].trim();
            
            // Check if dateStr matches DD/MM/YYYY
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (dateRegex.test(dateStr) && amountStr && category) {
                const amount = parseFloat(amountStr.replace(/,/g, ''));
                transactions.push({
                    description: desc,
                    date: dateStr,
                    amount: amount,
                    category: category
                });
            }
        }
    }
    return transactions;
}

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
        
        if (!userRequestText) {
            console.error("User request not found in transcript!");
            return;
        }
        
        const parsedTxs = parseUserRequest(userRequestText);
        console.log("Total parsed user transactions:", parsedTxs.length);
        console.log("First 5 parsed:");
        console.log(JSON.stringify(parsedTxs.slice(0, 5), null, 2));
        console.log("Last 5 parsed:");
        console.log(JSON.stringify(parsedTxs.slice(-5), null, 2));
        
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
