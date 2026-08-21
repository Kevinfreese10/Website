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

async function parseCorAndId() {
  const dir = path.resolve('scratch/order_10135_audit');
  const files = ['COR14.3.pdf', 'Peturnia_ID_Document.pdf'];

  for (const f of files) {
    const fileBuffer = fs.readFileSync(path.join(dir, f));
    const model = google('gemini-2.5-flash');

    const { text } = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract Company Name, Enterprise Reg Number, Director Names, Director ID Numbers, Physical Address, Postal Address, Registration Date, and Stamp Certification Date in JSON format.' },
            { type: 'file', data: fileBuffer, mimeType: 'application/pdf' },
          ],
        },
      ],
    });

    console.log(`=== ${f} ===`);
    console.log(text);
  }
}

parseCorAndId().catch(console.error);
