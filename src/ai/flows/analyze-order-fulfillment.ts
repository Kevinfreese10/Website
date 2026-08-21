'use server';

/**
 * @fileOverview Multimodal Genkit flow for comprehensive Order Auditing, SOP Statutory Deliverable
 * Determination, Communication History Analysis, and Proactive Next-Step Recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeOrderFulfillmentInputSchema = z.object({
  orderId: z.string().describe('Unique order ID.'),
  customerName: z.string().describe('Customer or director name.'),
  customerEmail: z.string().describe('Customer email address.'),
  services: z.array(z.object({
    id: z.string(),
    title: z.string(),
    price: z.number().optional(),
    turnaround: z.string().optional(),
  })).describe('List of ordered services in this order dossier.'),
  documents: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.string().optional(),
    status: z.string().optional(),
    fileUrl: z.string().optional(),
    textValue: z.string().optional(),
    notAvailableReason: z.string().optional(),
    aiVerification: z.any().optional(),
  })).describe('All client document uploads, text inputs, and their AI audit outcomes.'),
  communicationHistory: z.string().optional().describe('Full message and note transcript from Order Communication History.'),
  checklist: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    artifactUrl: z.string().optional(),
    artifactName: z.string().optional(),
  })).optional().describe('SOP fulfillment steps and their current states.'),
  generatedDrafts: z.array(z.object({
    id: z.string(),
    title: z.string(),
    templateType: z.string(),
    status: z.string(),
    fileUrl: z.string().optional(),
  })).optional().describe('Statutory drafts already generated for this order.'),
  currentDate: z.string().describe('Today\'s date in ISO format (YYYY-MM-DD).'),
});

export type AnalyzeOrderFulfillmentInput = z.infer<typeof AnalyzeOrderFulfillmentInputSchema>;

const AnalyzeOrderFulfillmentOutputSchema = z.object({
  fulfillmentHealthScore: z.number().min(0).max(100).describe('Compliance & fulfillment health score from 0 to 100.'),
  overallState: z.enum([
    'ready_to_lodge',
    'awaiting_documents',
    'in_review',
    'blocked',
    'drafts_ready',
    'complete',
  ]).describe('Current macro state of the order.'),
  summary: z.string().describe('Concise executive overview of order status, findings, and current blocker or readiness.'),
  lodgementReadiness: z.boolean().describe('True if all required documents and statutory drafts are complete and ready for filing or client delivery.'),
  communicationInsights: z.array(z.string()).describe('Key findings, customer requests, or explanations extracted from Communication History.'),
  aiRecommendations: z.array(z.string()).describe('Prioritized, actionable recommendations for staff/consultants to process and finalize the order.'),
  sopDeliverables: z.array(z.object({
    templateId: z.string(),
    title: z.string(),
    description: z.string(),
    isGenerated: z.boolean(),
    fileUrl: z.string().optional(),
  })).describe('Exact statutory templates and deliverables mandated by the product SOP for this order.'),
  missingItems: z.array(z.string()).describe('List of missing documents, unverified items, or outstanding statutory requirements.'),
  nextActionLabel: z.string().describe('Short label for the highest priority next action button (e.g. "Generate SOP Drafts", "Review Generated Drafts", "Request Missing ID", "Finalize Order").'),
  nextActionType: z.enum([
    'generate_drafts',
    'request_documents',
    'client_followup',
    'finalize_order',
    'review_drafts',
  ]).describe('Type of next action to trigger in UI.'),
});

export type AnalyzeOrderFulfillmentOutput = z.infer<typeof AnalyzeOrderFulfillmentOutputSchema> & {
  reviewedAt?: string;
};

const analyzeOrderFulfillmentPrompt = ai.definePrompt({
  name: 'analyzeOrderFulfillmentPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: AnalyzeOrderFulfillmentInputSchema },
  output: { schema: AnalyzeOrderFulfillmentOutputSchema },
  prompt: `You are the Lead Order Fulfillment Director and Senior Compliance Specialist at My Accountant (a premier South African accounting, corporate secretarial, and tax advisory firm).

Your mission is to perform an exhaustive, expert audit of Order #{{orderId}} to guide the consulting staff in reviewing documents, managing communication, generating statutory drafts, and finalizing the order seamlessly.

---
### **TODAY'S DATE**: {{currentDate}}

---
### **1. ORDER DOSSIER & SERVICES:**
- **Customer / Contact**: {{customerName}} ({{customerEmail}})
- **Ordered Services**:
{{#each services}}
  * **{{title}}** (ID: {{id}}{{#if price}}, Price: R{{price}}{{/if}}{{#if turnaround}}, SLA: {{turnaround}}{{/if}})
{{/each}}

---
### **2. CLIENT DOCUMENTS & AI VERIFICATIONS:**
{{#if documents.length}}
{{#each documents}}
  - **Requirement**: "{{label}}" (Type: {{type}}, Status: {{status}})
    {{#if fileUrl}}* Uploaded File: {{fileUrl}}{{/if}}
    {{#if textValue}}* Text Value: "{{textValue}}"{{/if}}
    {{#if notAvailableReason}}* Client Note for Missing Doc: "{{notAvailableReason}}"{{/if}}
    {{#if aiVerification}}
      * AI Review: [{{aiVerification.recommendation}}] ({{aiVerification.confidence}}% confidence) - {{aiVerification.summary}}
      {{#if aiVerification.issues.length}}
        * Issues: {{#each aiVerification.issues}}{{this}}; {{/each}}
      {{/if}}
    {{else}}
      * AI Review: Pending Verification
    {{/if}}
{{/each}}
{{else}}
  No document requirements configured or uploaded yet.
{{/if}}

---
### **3. ORDER COMMUNICATION HISTORY & CHAT ATTACHMENTS:**
{{#if communicationHistory}}
{{{communicationHistory}}}
{{else}}
  No previous communication history notes recorded.
{{/if}}

---
### **4. CURRENT SOP CHECKLIST & DRAFTS:**
- **Fulfillment Steps**:
{{#each checklist}}
  * [{{status}}] {{title}} {{#if artifactName}}— Deliverable: {{artifactName}}{{/if}}
{{/each}}

- **Generated Statutory Drafts**:
{{#if generatedDrafts.length}}
{{#each generatedDrafts}}
  * [{{status}}] {{title}} (Type: {{templateType}}) — {{fileName}}
{{/each}}
{{else}}
  None generated yet.
{{/if}}

---
### **CORE FULFILLMENT RULES & PRODUCT SOP DELIVERABLES:**

1. **BEE Sworn Affidavit / Certificate Orders**:
   - **Mandatory SOP Deliverable**: \`bee_affidavit\` ("B-BBEE Sworn Affidavit — Exempted Micro Enterprise (EME)").
   - Requires CIPC COR14.3, Director Smart ID/Passport, and Black Ownership % confirmation.
   - Once documents are verified, the next action is to generate the BEE Sworn Affidavit.

2. **NCR Credit Provider Registration Orders**:
   - **Mandatory SOP Deliverables**:
     * \`ncr_form_2\` (NCR Form 2 Credit Provider Application)
     * \`ncr_director_resolution\` (NCR Director Resolution & Signatory Mandate)
     * \`ncr_annexure_fees\` (NCR Annexure: Confirmation of Payment of Fees)
     * \`accounting_officer_letter\` (Accounting Officer Consent & Appointment Letter under Reg 67/68)
   - Strict statutory requirements: Police Clearance < 6 months, Bank Confirmation < 3 months, CIPC COR14.3.

3. **Accountant's Letter / Confirmation Orders**:
   - **Mandatory SOP Deliverable**: \`accountants_letter\` ("Accountant's Financial Confirmation & Compliance Letter").
   - Review client purpose in Communication History or intake (e.g. Nedbank Revolving Credit Facility, visa application, landlord lease, financial verification).
   - Ingest bank statement figures and draft confirmation letter on My Accountant letterhead.

4. **Company Registration & Secretarial Orders**:
   - **Mandatory SOP Deliverables**:
     * \`share_certificate\` (Official Company Share Certificate - 100 Ordinary Shares)
     * \`power_of_attorney\` (Special Power of Attorney & Authorizing Resolution)

5. **SARS Public Officer / Tax Representative Orders**:
   - **Mandatory SOP Deliverable**: \`sars_public_officer_resolution\` (SARS Public Officer Appointment & Director Resolution).

6. **Communication History Intelligence**:
   - Parse all notes from client or staff. If the client asked for specific wording, bank names, updated addresses, or shared alternate documents in chat attachments, highlight these under \`communicationInsights\` and factor them into your recommendations.

7. **Determine Exact Health Score & Next Steps**:
   - **Health Score (0–100)**: Reflects proportion of approved/valid documents, presence of necessary drafts, and absence of unresolved compliance blocks.
   - **overallState**:
     * \`awaiting_documents\`: Crucial client KYC or source files are missing.
     * \`in_review\`: Documents uploaded but need consultant sign-off.
     * \`drafts_ready\`: All documents approved; statutory drafts generated and ready for consultant dispatch to client.
     * \`ready_to_lodge\`: Signed documents returned from client; ready for regulatory submission.
     * \`complete\`: Order executed and finalized.
   - **nextActionLabel** & **nextActionType**: Provide the precise single highest-priority button for staff.
`,
});

const analyzeOrderFulfillmentFlow = ai.defineFlow(
  {
    name: 'analyzeOrderFulfillment',
    inputSchema: AnalyzeOrderFulfillmentInputSchema,
    outputSchema: AnalyzeOrderFulfillmentOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeOrderFulfillmentPrompt(input);
    if (!output) {
      throw new Error('Failed to generate order fulfillment analysis.');
    }
    return {
      ...output,
      reviewedAt: new Date().toISOString(),
    };
  }
);

export async function analyzeOrderFulfillment(
  input: AnalyzeOrderFulfillmentInput
): Promise<AnalyzeOrderFulfillmentOutput> {
  return analyzeOrderFulfillmentFlow(input);
}

