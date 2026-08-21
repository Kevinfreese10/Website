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

async function verifyOrder10139Pdf() {
  const model = google('gemini-2.5-flash');
  const bytes = fs.readFileSync('scratch/order_10139_audit/BEE_Sworn_Affidavit_EME_10139.pdf');

  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Verify this completed B-BBEE Sworn Affidavit for NO404 (PTY) LTD. Confirm that all items on Page 1 (Deponent Roger Brendon Staples, ID 8303045032083, Entity NO404 (PTY) LTD, Reg 2025/106479/07, Address, Nature of Business) and Page 2 (0% Black Owned, 0% Female Owned, 0% Designated Groups, breakdown 0%s, FYE 28 February 2026, Level 4 checkbox ticked, Date 21 August 2026) are filled and aligned properly.',
          },
          { type: 'file', data: bytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== VERIFICATION OF ORDER #10139 BEE AFFIDAVIT ===');
  console.log(text);
}

verifyOrder10139Pdf().catch(console.error);
