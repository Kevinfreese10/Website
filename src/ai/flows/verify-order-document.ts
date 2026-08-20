'use server';

/**
 * @fileOverview Multimodal Genkit flow for verifying and extracting client uploaded order documents.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AIDocumentVerification } from '@/lib/types';

const VerifyOrderDocumentInputSchema = z.object({
  fileUrl: z.string().describe('URL to the uploaded document (PDF or Image) or data URI.'),
  requirementLabel: z.string().describe('The requirement name requested from the client, e.g. "Certified South African ID Copy", "Proof of Residence (Utility Bill < 3 Months)".'),
  serviceTitle: z.string().optional().describe('Title of the ordered service, e.g. "Company Registration".'),
  clientName: z.string().optional().describe('The name of the client who ordered the service.'),
});

export type VerifyOrderDocumentInput = z.infer<typeof VerifyOrderDocumentInputSchema>;

const VerifyOrderDocumentOutputSchema = z.object({
  status: z.enum(['verified', 'flagged', 'inconclusive']).describe('Overall verification status.'),
  confidence: z.number().min(0).max(100).describe('Confidence score from 0 to 100.'),
  detectedType: z.string().describe('Detected document classification (e.g., SA Smart ID, Municipal Utility Bill, FNB Bank Statement, CIPC Document).'),
  extractedData: z.record(z.any()).describe('Key extracted entities such as document numbers, dates, party names, and addresses.'),
  issues: z.array(z.string()).describe('List of potential issues or compliance violations found in the document.'),
  summary: z.string().describe('Concise human-readable summary of what was found in the document.'),
  recommendation: z.enum(['approve', 'reject', 'manual_review']).describe('Recommended action for human staff confirmation.'),
  reason: z.string().describe('Clear rationale for the recommended action.'),
});

export type VerifyOrderDocumentOutput = z.infer<typeof VerifyOrderDocumentOutputSchema>;

const verifyOrderDocumentPrompt = ai.definePrompt({
  name: 'verifyOrderDocumentPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: VerifyOrderDocumentInputSchema },
  output: { schema: VerifyOrderDocumentOutputSchema },
  prompt: `You are an expert compliance and KYC verification agent for a South African accounting, tax, and corporate secretarial practice (My Accountant).

Analyze the provided client document against the specified requirement:
- **Requirement Expected**: {{requirementLabel}}
- **Service Being Fulfilled**: {{serviceTitle}}
- **Client Name**: {{clientName}}

Document media:
{{media url=fileUrl}}

Your objectives:
1. **Classify Document**: Accurately determine the exact type of document (e.g., SA Smart ID Card, SA Green Barcoded ID Book, Municipal Rates Account, Bank Statement, CIPC Cor14.3, SARS Notice of Registration).
2. **Extract Key Data**:
   - South African ID / Passport / Registration Numbers
   - Full legal names
   - Document issue date or statement period
   - Physical address (for proof of address)
   - Issuing authority / bank name
3. **Verify Compliance**:
   - Does this document fulfill the requirement "{{requirementLabel}}"?
   - If a Proof of Residence is required, is it dated within the last 3 months?
   - Is the document clear, legible, and uncorrupted?
   - Does the name match or closely correspond to {{clientName}}?
4. **Formulate Recommendation**:
   - **approve**: High confidence (>85%), clear match, valid dates, no critical issues.
   - **reject**: Document is completely wrong type, illegible, severely outdated, or invalid.
   - **manual_review**: Minor discrepancies, ambiguous document, or confidence between 50-85%.

Return your structured analysis according to the output schema.`,
});

const verifyOrderDocumentFlow = ai.defineFlow(
  {
    name: 'verifyOrderDocumentFlow',
    inputSchema: VerifyOrderDocumentInputSchema,
    outputSchema: VerifyOrderDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await verifyOrderDocumentPrompt(input);
    if (!output) {
      throw new Error('AI document verification did not return an analysis.');
    }
    return output;
  }
);

export async function verifyOrderDocument(
  input: VerifyOrderDocumentInput
): Promise<VerifyOrderDocumentOutput> {
  return verifyOrderDocumentFlow(input);
}
