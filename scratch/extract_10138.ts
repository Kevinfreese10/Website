import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { ai } from '../src/ai/genkit';
import * as fs from 'fs';

async function extractFromPdf() {
  const pdfPath = path.resolve('c:/myacc/scratch/order_10138_audit/DISCLOSR_014.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const base64 = buffer.toString('base64');

  const prompt = `You are a compliance officer at My Accountant. Inspect this CIPC Disclosure Certificate / COR14.3 document.
Extract all relevant company and director information accurately in JSON format:
{
  "companyName": "...",
  "registrationNumber": "...",
  "enterpriseStatus": "...",
  "registrationDate": "...",
  "financialYearEnd": "...",
  "registeredAddress": "...",
  "postalAddress": "...",
  "directors": [
    {
      "name": "...",
      "idNumber": "...",
      "status": "Active / Resigned",
      "appointmentDate": "..."
    }
  ],
  "complianceAudit": {
    "isCompliant": true/false,
    "annualReturnStatus": "...",
    "deregistrationRisk": "...",
    "notes": "..."
  }
}`;

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: [
      { text: prompt },
      { media: { contentType: 'application/pdf', url: `data:application/pdf;base64,${base64}` } }
    ]
  });

  console.log('=== EXTRACTED CIPC DISCLOSURE DATA ===');
  console.log(response.text);
}

extractFromPdf().catch(console.error);
