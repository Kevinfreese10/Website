import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function verifyNedbankLetter() {
  const model = google('gemini-2.5-flash');
  const bytes = fs.readFileSync('scratch/order_10143_audit/Accountants_Letter_Income_Confirmation_Alby_Festus_10143.pdf');

  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Inspect this 1-page Accountant Confirmation of Income & Director Drawings Letter for Nedbank. Check: 1. Header layout and professional letterhead. 2. Applicant & Entity details. 3. 3-Month Banking Table (periods, inflows, outflows, total, average). 4. Declaration of R235,000 net drawings. 5. Commissioner Stamp and signature placement. 6. Is everything cleanly fitted on this single page without overflow?',
          },
          { type: 'file', data: bytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== NEDBANK LETTER VERIFICATION ===');
  console.log(text);
}

verifyNedbankLetter().catch(console.error);
