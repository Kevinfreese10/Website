import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { ai } from '../src/ai/genkit';

async function inspectOfficialTemplate() {
  const url = "https://storage.googleapis.com/studio-2604127518-57889.firebasestorage.app/templates%2Faccounting_officer_letter%2FAccounting_Officer_Appointment_Letter.pdf";
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  
  const outDir = path.resolve('c:/myacc/scratch/template_inspection');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'Official_Accounting_Officer_Template.pdf'), buffer);
  console.log('Downloaded official template PDF:', buffer.length, 'bytes');

  const base64 = buffer.toString('base64');
  const prompt = `Please inspect this official Accounting Officer Appointment Letter template PDF in detail.
Extract:
1. Exact wording, paragraphs, structure, letterhead layout, address lines.
2. Placeholders used in the template (e.g., [Company Name], [Reg Number], [Address], etc.).
3. Sign-off, professional body designation, signature styling, and footer details.
4. Provide the complete text word-for-word so we can replicate this exact template perfectly.`;

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: [
      { text: prompt },
      { media: { contentType: 'application/pdf', url: `data:application/pdf;base64,${base64}` } }
    ]
  });

  console.log('=== OFFICIAL TEMPLATE TEXT & STRUCTURE ===');
  console.log(response.text);
}

inspectOfficialTemplate().catch(console.error);
