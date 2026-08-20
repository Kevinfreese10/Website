'use server';

/**
 * @fileOverview Multimodal Genkit flow for verifying, auditing, and extracting client-uploaded order documents
 * using specialized South African accounting, corporate secretarial, and regulatory compliance validation skills.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AIDocumentVerification } from '@/lib/types';

const VerifyOrderDocumentInputSchema = z.object({
  fileUrl: z.string().describe('URL to the uploaded document (PDF or Image) or data URI.'),
  requirementLabel: z.string().describe('The requirement name requested from the client, e.g. "Certified South African ID Copy", "Proof of Residence", "Tax Clearance Certificate (TCC)", "Bank Account Confirmation Letter".'),
  serviceTitle: z.string().optional().describe('Title of the ordered service, e.g. "NCR Registration", "COIDA Nature of Business Change", "Annual Financial Statements".'),
  clientName: z.string().optional().describe('The name of the client or company who ordered the service.'),
  customAiInstructions: z.string().optional().describe('Custom operational directives and validation rules configured on the SOP step by the administrator.'),
});

export type VerifyOrderDocumentInput = z.infer<typeof VerifyOrderDocumentInputSchema>;

const VerifyOrderDocumentOutputSchema = z.object({
  status: z.enum(['verified', 'flagged', 'inconclusive']).describe('Overall verification status.'),
  confidence: z.number().min(0).max(100).describe('Confidence score from 0 to 100.'),
  detectedType: z.string().describe('Detected document classification (e.g., SA Smart ID Card, SAPS Criminal Clearance, CIPC COR14.3, SARS TCS PIN, Standard Bank Confirmation Letter).'),
  extractedData: z.record(z.any()).describe('Key extracted entities such as registration numbers, ID numbers, tax references, dates, party names, and addresses.'),
  issues: z.array(z.string()).describe('List of potential issues, discrepancies, or statutory compliance violations found in the document.'),
  summary: z.string().describe('Concise human-readable summary of what was found in the document and its audit status.'),
  recommendation: z.enum(['approve', 'reject', 'manual_review']).describe('Recommended action for human staff confirmation.'),
  reason: z.string().describe('Clear rationale for the recommended action referencing statutory rules.'),
});

export type VerifyOrderDocumentOutput = z.infer<typeof VerifyOrderDocumentOutputSchema>;

const verifyOrderDocumentPrompt = ai.definePrompt({
  name: 'verifyOrderDocumentPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: VerifyOrderDocumentInputSchema },
  output: { schema: VerifyOrderDocumentOutputSchema },
  prompt: `You are an expert Senior Compliance Auditor and Corporate Secretarial Specialist at My Accountant (a premier South African accounting, tax, and advisory practice).

Your duty is to conduct an authoritative, rigorous compliance audit on the client document provided below against South African statutory requirements (CIPC, SARS, NCR, COIDA, FICA/KYC, and Banking regulations).

---
### **AUDIT CONTEXT:**
- **Expected Document Requirement**: {{requirementLabel}}
- **Service Being Fulfilled**: {{serviceTitle}}
- **Client / Entity Name**: {{clientName}}
{{#if customAiInstructions}}
- **CUSTOM SOP DIRECTIVES & AI RULES CONFIGURED FOR THIS STEP**:
{{{customAiInstructions}}}
{{/if}}

Document Media:
{{media url=fileUrl}}

---
### **SPECIALIZED COMPLIANCE VALIDATION SKILLS & RULES:**

Apply the following domain-specific validation rules based on what is being audited:

#### 1. **South African Identity Documents (ID / Passport):**
- **Document Types**: SA Smart ID Card (front & back), SA Green Barcoded ID Book, or Valid Foreign Passport.
- **FICA Certification Stamp**: If the requirement specifies "Certified ID", check for an official Commissioner of Oaths, SAPS, or Post Office certification stamp with a visible signature and date within the last **3 months**.
- **Data to Extract**: 13-digit SA ID Number, Full Legal Names, Date of Birth, Gender, Citizenship Status.
- **Flag If**: Stamp is older than 3 months, commissioner signature/date is illegible, edges are cropped, or ID number does not match expected client particulars.

#### 2. **CIPC Company Registration Documents (COR14.3 / Standard MOI / CK1 / CK2 / COR39):**
- **Data to Extract**: 10-digit CIPC Registration Number (format: YYYY/NNNNNN/07 or CK format), Registered Company Name, Enterprise Status (must be "In Business"), Registered Physical Address, and Active Directors.
- **Compliance Check**: Verify that the entity is in good standing and that the applicant / signing officer is listed as an active director.

#### 3. **SARS Tax Compliance (TCC / TCS PIN vs. Notice of Registration):**
- **CRITICAL DISTINCTION**:
  - **Tax Clearance Certificate / TCS PIN Document**: Features SARS Good Standing status, 10-digit Tax Number, and an active Tax Compliance Status (TCS) PIN with an expiry date.
  - **Notice of Registration / IT150**: Only confirms income tax registration and is **NOT** a Tax Clearance Certificate.
- **Flag If**: The requirement is for a Tax Clearance Certificate / TCS PIN, but the client uploaded a Notice of Registration (IT150).

#### 4. **SAPS Criminal Clearance Certificate (NCR / Police Clearance):**
- **Issuing Authority**: South African Police Service (SAPS) Criminal Record Centre or accredited AFISwitch biometric partner.
- **Validity Window**: Must be dated within the last **6 months**.
- **Data to Extract**: Certificate Reference / Enquiry Number, Subject Name, ID Number, Issue Date, Finding ("No Convictions" / clean record).
- **Flag If**: Certificate is older than 6 months or contains uncertified alterations.

#### 5. **Bank Account Confirmation Letter:**
- **Issuing Authority**: Major South African registered bank (Standard Bank, Capitec, FNB, ABSA, Nedbank, TymeBank, Investec, Sasfin).
- **Recency**: Must be dated within the last **3 months** and bear an official bank digital stamp / signature / verification QR code.
- **Account Holder**: Must be in the registered legal name of the entity or primary director.
- **Data to Extract**: Account Number, Branch Code, Account Type, Issue Date.

#### 6. **Statutory Proof of Payment (POP):**
- **Beneficiary Check**: E.g., for NCR, verify beneficiary is National Credit Regulator (Standard Bank Acct 200456490).
- **Amount Check**: Verify exact statutory amount (e.g., R1,800.00 for NCR Category 9 application fee).
- **Payment Reference**: Reference MUST be the entity's CIPC Registration Number (e.g. 2026/000000/07) or NCRCP registration number.

#### 7. **Proof of Physical Address:**
- **Allowed Documents**: Utility bill (rates, electricity, water), Telkom/fibre bill, bank statement, or signed lease agreement dated within the last **3 months**.

---
### **OUTPUT OBJECTIVES:**
1. **Classify**: Identify precise document type (e.g., \`SA Smart ID Card (Certified)\`, \`CIPC COR14.3 Registration Certificate\`, \`SARS Tax Compliance Status PIN\`, \`SAPS Criminal Record Clearance\`, \`Capitec Bank Confirmation Letter\`, \`Capitec Payment Notification\`).
2. **Extract**: Pull all vital numbers (ID, Reg No, Tax No, Account No, Amount, Dates, Addresses).
3. **Audit Issues**: Detail any compliance defects, missing certification stamps, expired dates, or name mismatches.
4. **Formulate Recommendation**:
   - **approve**: High confidence (≥85%), fulfills requirement perfectly, dates compliant, no defects.
   - **reject**: Document is incorrect type (e.g. Notice of Registration instead of TCC), severely expired, or illegible.
   - **manual_review**: Minor stamp ambiguity, confidence 50-84%, or requires consultant discretion.

Return your structured analysis strictly adhering to the output schema.`,
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

    // ─── Code-Enforced Compliance Post-Processing ──────────────────────────────
    // 1. Strict Confidence Floor: automated approval requires >= 85% confidence
    const sanitizedConfidence = Math.max(0, Math.min(100, Math.round(output.confidence || 0)));
    let sanitizedRecommendation = output.recommendation;
    let issues = Array.isArray(output.issues) ? [...output.issues] : [];

    if (sanitizedRecommendation === 'approve' && sanitizedConfidence < 85) {
      sanitizedRecommendation = 'manual_review';
      issues.push(`Confidence score (${sanitizedConfidence}%) is below the 85% automated approval threshold.`);
    }

    // 2. If issues are detected, do not permit silent approval
    if (sanitizedRecommendation === 'approve' && issues.length > 0) {
      sanitizedRecommendation = 'manual_review';
    }

    return {
      ...output,
      confidence: sanitizedConfidence,
      recommendation: sanitizedRecommendation,
      issues,
    };
  }
);

export async function verifyOrderDocument(
  input: VerifyOrderDocumentInput
): Promise<VerifyOrderDocumentOutput> {
  return verifyOrderDocumentFlow(input);
}
