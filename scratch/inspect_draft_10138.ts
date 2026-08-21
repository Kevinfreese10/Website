import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { ai } from '../src/ai/genkit';
import * as fs from 'fs';

async function inspectDraft() {
  const pdfPath = path.resolve('c:/myacc/scratch/order_10138_audit/Accounting_Officer_Consent_10138.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const base64 = buffer.toString('base64');

  const prompt = `Read this Accounting Officer Consent & Appointment Letter PDF.
List the exact text content, company name, director name, registration number, date, signature, and formatting (e.g. single page, letterhead, statutory citations).`;

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: [
      { text: prompt },
      { media: { contentType: 'application/pdf', url: `data:application/pdf;base64,${base64}` } }
    ]
  });

  console.log('=== DRAFT PDF AUDIT ===');
  console.log(response.text);
}

inspectDraft().catch(console.error);
