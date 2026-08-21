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

async function inspectShareCertLayout() {
  const fileBuffer = fs.readFileSync('public/templates/Share_Certificate_Professional.pdf');
  const model = google('gemini-2.5-flash');

  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe the complete visual layout, headings, blanks/lines, certificate number box, shareholder name section, number of shares section, signature lines, and exact text of this Share Certificate template so that I can accurately position dynamic text overlay.' },
          { type: 'file', data: fileBuffer, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== SHARE CERTIFICATE TEMPLATE INSPECTION ===');
  console.log(text);
}

inspectShareCertLayout().catch(console.error);
