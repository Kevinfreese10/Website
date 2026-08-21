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

async function parseAll10135() {
  const dir = path.resolve('scratch/order_10135_audit');
  const files = [
    { name: 'COR14.3.pdf', type: 'CIPC Registration Certificate' },
    { name: 'Peturnia_ID_Document.pdf', type: 'Certified Director ID Copy' },
    { name: 'Peturnia_Mavundlha_PCC.pdf', type: 'Police Clearance Certificate (PCC)' },
    { name: 'Peturnia_Mavundlha_POP.pdf', type: 'Proof of Payment (NCR Application Fee)' },
    { name: 'Peturnia_Mavundlha_Bank_Letter.pdf', type: 'Business Bank Confirmation Letter' },
  ];

  console.log('Analyzing all Order #10135 documents with Gemini Vision...\n');

  for (const f of files) {
    const filePath = path.join(dir, f.name);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const model = google('gemini-2.5-flash');

    const prompt = `You are a compliance and statutory auditor reviewing documents for a South African National Credit Regulator (NCR) Credit Provider Application.
Document Type: ${f.type}
Filename: ${f.name}

Extract ALL statutory and operational data from this document accurately in structured JSON format.
Include:
- Entity Name / Registered Name
- Registration Number
- Director Name(s) and ID Number(s)
- Registered Physical and Postal Address
- Issue / Certification / Statement Date
- Key Reference Numbers (PCC Enquiry No, Bank Account No & Branch, Payment Reference & Amount)
- Validity and Compliance Assessment (e.g., Is ID certified within 3 months? Is PCC within 6 months? Is Bank Letter within 3 months in business name? Is NCR payment R1,800?)

Format your output cleanly.`;

    try {
      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'file', data: fileBuffer, mimeType: 'application/pdf' },
            ],
          },
        ],
      });

      console.log(`=======================================================`);
      console.log(`DOCUMENT: ${f.name} (${f.type})`);
      console.log(`=======================================================`);
      console.log(text);
      console.log('\n');
    } catch (err: any) {
      console.error(`Error parsing ${f.name}:`, err.message);
    }
  }
}

parseAll10135().catch(console.error);
