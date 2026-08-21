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
import { PDFDocument } from 'pdf-lib';

async function inspectOrder10139() {
  const model = google('gemini-2.5-flash');

  // 1. Inspect CIPC Disclosure
  const cipcBytes = fs.readFileSync('scratch/order_10139_audit/DISCLOSR.pdf');
  const { text: cipcText } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all details from this CIPC Disclosure document: Company Name, Registration Number, Enterprise Type, Registration Date, Financial Year End, Registered Physical Address, Postal Address, and Active Directors (Full Name, ID Number, Status).' },
          { type: 'file', data: cipcBytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });
  console.log('=== CIPC DISCLOSURE EXTRACTED DETAILS ===');
  console.log(cipcText);

  // 2. Inspect ID Document
  const idBytes = fs.readFileSync('scratch/order_10139_audit/ID_-_Roger_Staples.pdf');
  const { text: idText } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all details from this ID document: Full Name, Surname, ID Number, Date of Birth, Gender, Citizenship / Country of Origin.' },
          { type: 'file', data: idBytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });
  console.log('\n=== ID DOCUMENT EXTRACTED DETAILS ===');
  console.log(idText);

  // 3. Inspect BEE Affidavit Template
  const templateBytes = fs.readFileSync('public/templates/Affidavit-EME-Gen.pdf');
  const templateDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = templateDoc.getForm();
  const fields = form.getFields();
  console.log(`\n=== BEE AFFIDAVIT TEMPLATE (${fields.length} AcroForm fields) ===`);
  fields.forEach(f => {
    console.log(`${f.getName()} (${f.constructor.name})`);
  });

  const { text: templateVisualText } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe the complete visual layout, blanks, checkboxes, and structure of this B-BBEE Exempted Micro Enterprise (EME - General) Sworn Affidavit template so that we can populate every field accurately.' },
          { type: 'file', data: templateBytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });
  console.log('\n=== BEE AFFIDAVIT VISUAL LAYOUT ===');
  console.log(templateVisualText);
}

inspectOrder10139().catch(console.error);
