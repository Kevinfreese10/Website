'use server';
/**
 * @fileOverview Layer 2 — AI extraction of FACTS from a client-uploaded order document.
 *
 * This flow never renders a verdict. It returns what the document says (kind, names, numbers,
 * dates, stamps) with a confidence on the kind only. The rules engine in
 * src/lib/verification/rules.ts decides pass/fail from these facts.
 *
 * Model: AGENT_EXTRACTION_MODEL env var, defaulting to the site-wide flash-lite. Scanned IDs and
 * bank letters benefit from a stronger tier; that is Kevin's cost/accuracy call (plan §9 #7).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ExtractedDocumentFactsSchema, type ExtractedDocumentFacts } from '@/lib/verification/facts';

const InputSchema = z.object({
  fileDataUri: z.string().describe("The document as a data URI: 'data:<mimetype>;base64,<data>'"),
  requirementLabel: z.string().describe('What the client was asked to upload.'),
  aiHint: z.string().optional().describe('What a valid document for this requirement usually looks like (from the playbook).'),
  expectedKind: z.string().optional().describe('The documentKind the playbook expects, if any.'),
  today: z.string().describe('Today in YYYY-MM-DD. Needed so dates are never mis-read as future dates.'),
});
export type ExtractOrderDocumentInput = z.infer<typeof InputSchema>;

export const EXTRACTION_MODEL = process.env.AGENT_EXTRACTION_MODEL || 'googleai/gemini-3.5-flash-lite';

export async function extractOrderDocument(input: ExtractOrderDocumentInput): Promise<ExtractedDocumentFacts & { modelName: string }> {
  const mimeType = input.fileDataUri.split(';')[0].split(':')[1] || 'application/pdf';

  const { output } = await ai.generate({
    model: EXTRACTION_MODEL,
    output: { schema: ExtractedDocumentFactsSchema },
    config: { temperature: 0 },
    prompt: [
      {
        text: `You are a meticulous document-reading clerk for a South African accounting practice. Today is ${input.today}.

Read the attached document and report ONLY what it says. You are not asked whether it is acceptable, valid, or correct — another system decides that. Do not include words like "valid", "invalid", "acceptable", "approve" or "reject" anywhere in your output.

Context (for classification only — do not let it bias what you read):
- The client was asked to upload: "${input.requirementLabel}"
${input.expectedKind ? `- The expected document kind is: ${input.expectedKind}` : ''}
${input.aiHint ? `- Guidance on what this kind of document usually looks like: ${input.aiHint}` : ''}

Rules:
1. documentKind: pick the single best match from the allowed list. A bank *transaction statement* is "bank_statement"; a letter from a bank confirming account details is "bank_confirmation" — do not confuse them. A CIPC certificate showing enterprise number and directors is "cor14_3". A green ID book or smart-card ID is "sa_id".
2. names: list every person and company name printed, with the role the document assigns to it (account holder, company, director, individual...). Copy spelling exactly.
3. identifiers: every ID number, passport number, CIPC registration number (format YYYY/NNNNNN/NN), tax/VAT/PAYE reference, account number.
4. dates: every meaningful date as YYYY-MM-DD with its purpose. The certification stamp date (if any) is purpose "certified". The date the document was issued/printed is "issued". Never output a date later than today — if you read one, re-check the digits and note the ambiguity in observations.
5. hasCertificationStamp is true only when a Commissioner of Oaths / SAPS / attorney "certified true copy" stamp is visible. hasStamp is any other official stamp (bank, CIPC). hasDigitalVerificationReference is true for verification codes, QR codes or "verify this document at ..." text.
6. legible: false if a material part (names, numbers, dates) cannot be read.
7. observations: short neutral notes about the document's condition or ambiguities. No opinions.

Return the structured object only.`,
      },
      { media: { url: input.fileDataUri, contentType: mimeType } },
    ],
  });

  if (!output) throw new Error('Extraction returned no output');
  return { ...output, modelName: EXTRACTION_MODEL };
}
