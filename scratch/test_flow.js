const { websiteQAndA } = require('../src/ai/flows/website-q-and-a');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testFlow() {
    console.log("Testing websiteQAndA order generation flow...");
    try {
        const input = {
            question: "I want to proceed with ordering. Here are my details: First Name: John, Surname: Doe, Email: john.doe.test@gmail.com, Cell Number: 0821234567. I confirm I have all prerequisites and agree to the refund policy.",
            history: [
                { role: "user", content: "How much is Tax Clearance Pin?" },
                { role: "bot", content: "We can certainly assist with your Tax Clearance Pin. The cost for this service is R350, and we typically have it sorted for you within 1-2 working days." },
            ]
        };

        const result = await websiteQAndA(input);
        console.log("\n--- RESULT ---");
        console.log("Answer:", result.answer);
        console.log("Confidence:", result.confidence);
        console.log("OrderId:", result.orderId);
        console.log("OrderTrigger:", JSON.stringify(result.orderTrigger, null, 2));
    } catch (error) {
        console.error("Test failed with error:", error);
    }
}

testFlow();
