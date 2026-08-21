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

async function verifyAlignedLayout() {
  const model = google('gemini-2.5-flash');
  const bytes = fs.readFileSync('scratch/order_10139_audit/test_perfect_sig_align.pdf');

  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Inspect the bottom section of Page 2 in this PDF. Check that: 1. There is no raw black line sticking out next to the Commissioner signature. 2. The Commissioner signature is cleanly centered directly above the Commissioner of Oaths stamp box. 3. The whole bottom area (Deponent signature on the right, Commissioner signature & stamp on the left) looks professional, balanced, and publication-ready.',
          },
          { type: 'file', data: bytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== ALIGNED LAYOUT VERIFICATION ===');
  console.log(text);
}

verifyAlignedLayout().catch(console.error);
