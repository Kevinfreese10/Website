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
import { generateNcrForm2Draft } from '../src/lib/pdf/template-generators';

async function testForm2VisualInspection() {
  const mockOrder: any = {
    id: '10135',
    service: 'NCR Registration',
    companyName: 'FIRST BLOOM FINANCE (PTY) LTD',
    customerName: 'Peturnia Tiyiselani Mavundlha',
    idNumber: '9901300233087',
    registrationNumber: '2026/507901/07',
    registeredAddress: 'Stand No 51, Makhushane, Phalaborwa, Limpopo, 1390',
    phone: '076 042 2792',
    email: 'peturniamavundlha@gmail.com',
    createdAt: '2026-08-21T00:00:00.000Z',
    cipcRegDate: '27/06/2026',
    orderDate: '21 August 2026',
  };

  const { buffer, fileName } = await generateNcrForm2Draft(mockOrder);
  const outPath = path.join('scratch/order_10135_audit', fileName);
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved Form 2 to ${outPath} (${buffer.length} bytes)`);

  const model = google('gemini-2.5-flash');
  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Inspect the generated NCR Form 2 PDF carefully across all pages. Verify that: 1. Legal Status 3.3 Private Company is ticked. 2. CIPRO reg number, date of commencement of trading, financial year end (February), income tax, and addresses are populated from COR14.3. 3. PART 2 FINANCIAL INFORMATION on Page 3 is populated with 0 for all 4 items (net value of loan book, number of agreements, value of debt, number entered during year). 4. Auditor Kevin Freese / CIBA SA #3561 is populated. 5. Disqualification questions on p6 & p7 are checked No, and SAPS permission is checked Yes.',
          },
          { type: 'file', data: buffer, mimeType: 'application/pdf' },
        ],
      },
    ],
  });

  console.log('=== FORM 2 GEMINI VERIFICATION ===');
  console.log(text);
}

testForm2VisualInspection().catch(console.error);
