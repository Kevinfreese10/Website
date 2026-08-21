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

async function printDetails() {
  const model = google('gemini-2.5-flash');

  const cipcBytes = fs.readFileSync('scratch/order_10139_audit/DISCLOSR.pdf');
  const { text: cipcText } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract in JSON format: { companyName, regNumber, enterpriseType, regDate, financialYearEnd, address, activeDirectors: [{ name, idNumber, status }] } from this CIPC document.' },
          { type: 'file', data: cipcBytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== EXTRACTED CIPC JSON ===');
  console.log(cipcText);

  const idBytes = fs.readFileSync('scratch/order_10139_audit/ID_-_Roger_Staples.pdf');
  const { text: idText } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract in JSON format: { fullName, surname, idNumber, dateOfBirth, gender, citizenship } from this ID document.' },
          { type: 'file', data: idBytes, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== EXTRACTED ID JSON ===');
  console.log(idText);
}

printDetails().catch(console.error);
