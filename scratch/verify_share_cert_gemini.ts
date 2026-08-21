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

async function verifyGeneratedCert() {
  const fileBuffer = fs.readFileSync('scratch/order_10135_audit/Share_Certificate_Professional_10135.pdf');
  const model = google('gemini-2.5-flash');

  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Verify this generated Share Certificate. Does it match the professional executive landscape certificate with gold borders, official seal, Certificate No, Number of Shares, company details, and shareholder Peturnia Tiyiselani Mavundlha?' },
          { type: 'file', data: fileBuffer, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== VERIFICATION OF GENERATED SHARE CERTIFICATE ===');
  console.log(text);
}

verifyGeneratedCert().catch(console.error);
