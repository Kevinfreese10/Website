import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
});

async function verifyPdfWithVision(filePath: string, label: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            data: fileBuffer,
            mimeType: 'application/pdf',
          },
          {
            type: 'text',
            text: `You are an expert compliance officer verifying a generated document: ${label}.
Check that:
1. All text fields and boxes are neatly aligned without text overlapping any form grid lines or printed labels.
2. All statutory details for BUILD X HARDWARE AND BUILDWARE CC (Reg: 2000/027067/23, CF: 990000235838) are correctly placed.
3. List any formatting flaws or confirm if it looks 100% executive and ready for signing/submission.`,
          },
        ],
      },
    ],
  });
  console.log(`\n================== VERIFICATION: ${label} ==================`);
  console.log(result.text);
}

async function main() {
  const dir = path.resolve('scratch/order_10072_audit');
  await verifyPdfWithVision(path.join(dir, 'Power_of_Attorney_COIDA_Kevin_Freese_BUILD_X_HARDWARE_AND_BUILDWARE_CC.pdf'), 'Special Power of Attorney');
  await verifyPdfWithVision(path.join(dir, 'COIDA_CF1B_Application_Form_BUILD_X_HARDWARE_AND_BUILDWARE_CC.pdf'), 'Official Form CF-1B');
}

main().catch(console.error);
