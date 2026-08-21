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

async function verifyNewSigPlacement() {
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
            text: 'Inspect Page 2 bottom left of this PDF. Check the Commissioner of Oaths section: Is the new signature placed cleanly on the signature line directly above the Commissioner stamp box without obscuring text awkwardly? Is the stamp box legible and neat?',
          },
          { type: 'file', data: bytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== GEMINI SIGNATURE PLACEMENT VERIFICATION ===');
  console.log(text);
}

verifyNewSigPlacement().catch(console.error);
