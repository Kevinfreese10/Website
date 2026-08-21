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

async function inspectPdf(filePath: string, prompt: string) {
  const fileBuffer = fs.readFileSync(filePath);
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
            text: prompt,
          },
        ],
      },
    ],
  });
  return result.text;
}

async function audit10072Pdfs() {
  const dir = path.resolve('scratch/order_10072_audit');

  console.log('\n======================================================');
  console.log('1. AUDITING INSTRUCTION LETTER (1_Signed_Instruction_Letter.pdf)');
  console.log('======================================================');
  const letterSummary = await inspectPdf(
    path.join(dir, '1_Signed_Instruction_Letter.pdf'),
    `You are an expert South African compliance auditor inspecting a COIDA Nature of Business Change instruction letter.
Analyze this document thoroughly and extract:
1. Entity Name & Registration Number
2. COIDA Registration Number (Compensation Fund Number)
3. Letterhead details (Address, Tel, VAT)
4. Current Nature of Business vs Proposed / Requested Nature of Business
5. Signatory Name, Title, and whether it is physically/digitally SIGNED and DATED.
6. Is this letter complete and compliant for submission to the Compensation Commissioner?`
  );
  console.log(letterSummary);

  console.log('\n======================================================');
  console.log('2. AUDITING ANNUAL FINANCIAL STATEMENTS (6_doc_5.pdf)');
  console.log('======================================================');
  const afsSummary = await inspectPdf(
    path.join(dir, '6_doc_5.pdf'),
    `You are an expert South African compliance auditor inspecting Annual Financial Statements (AFS) for a COIDA nature of business change application.
Analyze this document thoroughly and report:
1. Entity Name, Registration Number, and Financial Year End period covered.
2. Principal business activity / nature of business described in the AFS (Directors' Report / Accounting Officer report / Notes).
3. Total Revenue / Turnover and Net Profit/Loss.
4. SIGNATURE VERIFICATION: Are the Approval of Financial Statements / Accounting Officer's Report / Director's Report SIGNED and DATED by the director/member and the accounting officer? List which pages have signatures.`
  );
  console.log(afsSummary);

  console.log('\n======================================================');
  console.log('3. AUDITING LETTER OF GOOD STANDING (4_doc_3.pdf)');
  console.log('======================================================');
  const logsSummary = await inspectPdf(
    path.join(dir, '4_doc_3.pdf'),
    `Analyze this Compensation Fund Letter of Good Standing / COIDA document.
Extract:
1. Employer Name
2. Compensation Fund / COIDA Reference Number
3. Validity Period / Issue Date / Expiry Date
4. Assessment status / Good Standing Status`
  );
  console.log(logsSummary);

  console.log('\n======================================================');
  console.log('4. AUDITING BUSINESS PREMISES PICTURES (7_doc_6.pdf)');
  console.log('======================================================');
  const picsSummary = await inspectPdf(
    path.join(dir, '7_doc_6.pdf'),
    `Analyze these business photos.
1. How many photos are provided?
2. What type of business operations are shown (inside/outside, equipment, stock, premises, signage)?
3. Does it match the requested nature of business (e.g. Hardware / Buildware / Retail)?`
  );
  console.log(picsSummary);
}

audit10072Pdfs().catch(console.error);
