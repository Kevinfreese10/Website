import { ai } from '../src/ai/genkit';

async function test() {
  console.log("Starting Genkit test...");
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
  
  try {
    const response = await ai.generate({
      prompt: "Hello, reply with one word: 'Success'.",
    });
    console.log("Response:", response.text);
  } catch (error: any) {
    console.error("Genkit error caught:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
  }
}

test();
