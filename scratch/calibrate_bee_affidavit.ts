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

async function verifyBeeAffidavit() {
  const model = google('gemini-2.5-flash');
  const bytes = fs.readFileSync('scratch/order_10139_audit/BEE_Affidavit_EME_NO404_Test.pdf');

  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Inspect this filled B-BBEE Sworn Affidavit PDF across both pages. For each populated item, check if the text aligns with the dotted/solid blank lines and table cells: 1. Full name & Surname (ROGER BRENDON STAPLES), 2. Identity number (8303045032083), 3. Enterprise details table on Page 1 (Enterprise Name, Trading Name, Reg Number, Address, Type of Entity, Nature of Business), 4. Page 2 percentages (0% Black Owned, 0% Female Owned, 0% Designated Groups, breakdown percentages), 5. Financial Year End date (28 February 2026), 6. Level Contributor table checkbox (is the X inside the box for "Less than 51% Black Owned"?), 7. Deponent Date (21 August 2026). Provide specific coordinate adjustments if any text is misaligned (too high/low/left/right).',
          },
          { type: 'file', data: bytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== BEE AFFIDAVIT VISUAL CALIBRATION REPORT ===');
  console.log(text);
}

verifyBeeAffidavit().catch(console.error);
