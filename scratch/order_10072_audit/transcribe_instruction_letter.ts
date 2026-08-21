import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
});

async function inspectLetterText() {
  const dir = path.resolve('scratch/order_10072_audit');
  const fileBuffer = fs.readFileSync(path.join(dir, '1_Signed_Instruction_Letter.pdf'));
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            data: fileBuffer,
            mimeType: 'application/pdf',
          },
          {
            type: 'text',
            text: 'Transcribe the exact full text of this entire instruction letter verbatim.',
          },
        ],
      },
    ],
  });
  console.log('TRANSCRIPTION OF INSTRUCTION LETTER:\n');
  console.log(result.text);
}

inspectLetterText().catch(console.error);
