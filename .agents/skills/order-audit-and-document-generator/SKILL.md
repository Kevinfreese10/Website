---
name: order-audit-and-document-generator
description: >
  Audits client orders across all My Accountant services, verifies uploaded KYC/statutory documents with AI vision, generates compliant statutory PDFs (Accounting Officer Letters, NCR Form 2, resolutions, share certificates, etc.), and routes delivery via Communication History or Kevin's review inbox based on confidence thresholds.
---

# Order Audit & Document Generator

This skill guides the end-to-end audit, document verification, statutory PDF generation, and delivery routing for all client orders on the **My Accountant** platform.

## Overview

```
[Order Triggered (Single ID / Batch / Service Filter)]
                         │
                         ▼
        [1. Ingest & Fetch Order Context]
                         │
                         ▼
   [2. Document Verification (Gemini Multimodal)]
     ├─ Missing docs? ──► Auto-draft client reminder in Communication History
     └─ Valid docs?   ──► Extract entity metadata & confidence score
                         │
                         ▼
          [3. Generate Statutory PDFs]
     (Accounting Officer Letter, NCR Form 2, Director Resolutions, etc.)
                         │
                         ▼
  [4. CHECKPOINT: Present PDF Summary to Kevin]
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
 [Confidence ≥ 90%]            [Confidence < 90%]
          │                             │
 [Auto-post Deliverable to]     [Email PDF to Kevin for review]
 [Communication History]                │
                                [Kevin approves → Deliver]
```

## Dependencies

- `order-fulfillment-agent`: Platform SOP checklist rules, state machine, and portal communication policy.
- `src/lib/pdf/template-generators.ts`: PDF generation engine with official brand letterhead, CIBA CBA (SA) #3561 credentials, and statutory templates.
- `src/lib/firebase-admin.ts`: Firestore database & Firebase Storage client.
- `src/lib/email.ts`: Nodemailer SMTP transport for review notifications.

## Quick Start Commands

```bash
# 1. Fetch and inspect order snapshot & uploads
npx tsx .agents/skills/order-audit-and-document-generator/scripts/audit_order.ts fetch --order-id 10138

# 2. Generate statutory draft(s)
npx tsx .agents/skills/order-audit-and-document-generator/scripts/audit_order.ts generate --order-id 10138 --doc accounting-officer-letter
# or generate all applicable drafts:
npx tsx .agents/skills/order-audit-and-document-generator/scripts/audit_order.ts generate --order-id 10138 --doc all

# 3. Present PDF summary to Kevin and wait for confirmation.

# 4. Upload to Firebase Storage and route delivery (auto-posts if confidence >= 90%, else emails Kevin)
npx tsx .agents/skills/order-audit-and-document-generator/scripts/deliver_order.ts --order-id 10138

# 5. If Kevin reviewed and gave approval, publish to Communication History:
npx tsx .agents/skills/order-audit-and-document-generator/scripts/deliver_order.ts --order-id 10138 --approve-and-post
```

## Trigger Patterns

Activate this skill when the user asks:
- **Single Order:** `"Audit Order #10138"`, `"Generate documents for order 10136"`
- **Batch of Orders:** `"Audit orders 10138, 10139, 10140"`
- **Service Filter:** `"Audit all pending NCR Registration orders"`
- **Status Filter:** `"Process all orders in Processing state"`

## Step-by-Step Workflow Protocol

### Step 1: Ingest & Inspect
Run `audit_order.ts fetch --order-id <ID>`:
- Check client identity, business entity name, registration number, and tax number.
- Inspect uploaded files (`documentUploads`) and SOP checklist steps.
- Check prerequisite orders (if any are linked via `dependsOnOrderIds`).

### Step 2: Document Verification & Extraction
- If documents are missing: Auto-draft a polite reminder requesting the specific missing documents and post it to Communication History (`orders/{orderId}/notes`). Set SOP checklist step to `Blocked`.
- If documents are uploaded: Run Gemini multimodal extraction to retrieve entity details (Legal Entity Name, Reg Number, SARS Tax Number, Director Name, ID Number, Registered Office Address).
- **Data Mismatch Handling**: If extracted data contradicts Firestore records, log the discrepancy in the verification report for Kevin's review, but continue using the extracted data for drafting.

### Step 3: Statutory PDF Generation
Use `src/lib/pdf/template-generators.ts` generators:
- `generateAccountingOfficerConsentDraft`: NCR Accounting Officer Consent (CIBA CBAP SA #3561, Regulations 67 & 68).
- `generateNcrForm2Draft`: NCR Form 2 Credit Provider Application form.
- `generateNcrDirectorResolutionDraft`: Director resolution appointing Kevin Freese as mandated agent.
- `generatePowerOfAttorneyResolutionDraft`: TP-POA (Third Party Power of Attorney).
- `generateNcrAnnexureFeesDraft`: NCR Annexure confirmation of payment of fees.
- `generateShareCertificateDraft`: Official Share Certificate with share allotment details.
- `generateSarsPublicOfficerResolutionDraft`: SARS Public Officer appointment resolution.
- `generateEngagementLetterDraft`: Professional accounting / retainer engagement letter.
- `generateAccountantsLetterDraft`: Accountant's confirmation letter for bank / audit.
- `generateCoidaCf1bApplicationDraft`: COIDA Return of Earnings / CF-1B application.

### Step 4: Mandatory Checkpoint (Kevin Confirmation)
**Always pause after PDF generation** and present a summary to Kevin showing:
- Entity Name, Registration Number, Director Name & ID.
- Generated documents with file size and status.
- Wait for Kevin's go-ahead before executing delivery.

### Step 5: Delivery Routing
- **If AI Confidence ≥ 90%**: Run `deliver_order.ts --order-id <ID>`. Uploads to Storage, marks SOP step completed, and auto-posts direct download link to Communication History.
- **If AI Confidence < 90%**: Run `deliver_order.ts --order-id <ID>`. Sends an email with attached PDF to `kev@thinkestry.co.za` & `freesekevin@gmail.com`. Keeps Communication History untouched until Kevin approves.
- **Once Kevin Approves**: Run `deliver_order.ts --order-id <ID> --approve-and-post` to publish deliverable note to client Communication History.

## Safeguards & Rules

1. **Strict Statutory Prerequisite Gate (No Drafting on Incomplete Info)**: Never generate or process statutory registration documents until ALL prerequisite source documents have been verified and extracted. For NCR registrations, a valid **SARS Tax Clearance Certificate / PIN** is a strict prerequisite because the official SARS Income Tax Reference Number and VAT status are extracted directly from the Tax Clearance. If Tax Clearance is missing, the order MUST NOT proceed to document generation; it must remain in `Waiting for Client Info` and a document request note posted for the client.
2. **Strict Communication History Policy**: Never send raw emails to end clients. All client communication must go through `orders/{orderId}/notes`.
3. **WinAnsi Encoding Constraint**: In pdf-lib, avoid unicode bullets or smart quotes. Use standard ASCII characters (`•` as ASCII bullet or dash).
4. **Single Page Strictness**: Letters and statutory certificates must fit neatly on a single page unless inherently multi-page (e.g. NCR Form 2).
