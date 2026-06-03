import { generateSocialAds } from '../src/ai/flows/generate-social-ad';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runTest() {
  console.log("Starting test for social ad generation flow...");
  console.log("GEMINI_API_KEY exists in process.env:", !!process.env.GEMINI_API_KEY);
  
  const testInput = {
    products: [
      {
        id: "accountant_letter",
        productName: "Accountant's Letter",
        price: 950,
        turnaroundTime: "1-2 days",
        description: "An official letter from a registered accountant for proof of income, visa applications, or tenders.",
        category: "ACCOUNTING SERVICES",
        url: "https://www.myacc.co.za/products/accountant-letter"
      }
    ],
    tone: "professional" as const
  };

  try {
    const result = await generateSocialAds(testInput);
    console.log("SUCCESS! Output returned from AI:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("FAILED! Caught error in test script:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  }
}

runTest();
