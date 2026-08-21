import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { ai } from '../src/ai/genkit';
import * as fs from 'fs';

async function verifyGeneratedPdf() {
  const pdfPath = path.resolve('c:/myacc/scratch/order_10138_audit/Accounting_Officer_Appointment_Letter_FLEXIWILL_v2.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const base64 = buffer.toString('base64');

  const prompt = `Inspect this Accountant Appointment Letter.
Verify that all details are accurate:
1. Header: My Accountant brand & contact details
2. Title & Statutory references (Companies Act 71 of 2008 & NCA Regulations 67 & 68)
3. Addressee: FLEXIWILL (PTY) LTD, Reg: 2003/002867/07, Address: 16 Impala Road, Clayville, 1666
4. Practice registration: CIBA CBAP SA #3561 & SAIT
5. Signatory: Kevin Freese CBA (SA) #3561
6. Layout: Single page, clean typography, perfectly balanced margins`;

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: [
      { text: prompt },
      { media: { contentType: 'application/pdf', url: `data:application/pdf;base64,${base64}` } }
    ]
  });

  console.log('=== VERIFICATION RESULT ===');
  console.log(response.text);
}

verifyGeneratedPdf().catch(console.error);
