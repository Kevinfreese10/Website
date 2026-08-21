---
name: order-audit-and-document-generator
description: >
  Audits client orders across all My Accountant services, verifies uploaded KYC/statutory documents with AI vision, generates compliant statutory PDFs (Accounting Officer Letters, NCR Form 2, resolutions, share certificates, COIDA Form CF-1B, Power of Attorney, BEE affidavits, etc.), and routes delivery via Communication History or Kevin's review inbox based on confidence thresholds.
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
     ├─ Missing docs? ──► Auto-draft client reminder in Communication History (order.notes)
     └─ Valid docs?   ──► Extract entity metadata & confidence score
                         │
                         ▼
          [3. Generate Statutory PDFs]
     (Accounting Officer Letter, NCR Form 2, CF-1B, Special POA, BEE Affidavits, etc.)
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
                                [Kevin approves → Deliver to order.notes]
```

## Dependencies

- `order-fulfillment-agent`: Platform SOP checklist rules, state machine, and portal communication policy.
- `src/lib/pdf/template-generators.ts`: PDF generation engine with official brand letterhead, CIBA CBA (SA) #3561 credentials, and statutory templates.
- `src/lib/firebase-admin.ts`: Firestore database & Firebase Storage client.
- `src/lib/email.ts`: Nodemailer SMTP transport for review notifications.

## Order Status Taxonomy & Visual Standards

| Status | Badge Color | Purpose / When to Apply |
|---|---|---|
| **`Processing`** | 🔵 Info (Blue) | Active order currently being worked on by staff/agent. |
| **`Waiting on Customer`** | 🟡 Amber / Orange | Waiting for customer uploads, signature on Form CF-1B/POA/resolutions, or client review. |
| **`Under Review`** | 🟣 Indigo / Purple | Statutory draft(s) generated and uploaded; awaiting Kevin's review. |
| **`Pending Payment`** | 🟡 Warning (Yellow) | Awaiting payment confirmation. |
| **`Completed`** | 🟢 Success (Green) | All statutory deliverables posted to Communication History and confirmed. |

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

## Step-by-Step Workflow Protocol

### Step 1: Ingest & Inspect
Run `audit_order.ts fetch --order-id <ID>`:
- Check client identity, business entity name, registration number, and tax number.
- Inspect uploaded files (`documentUploads`) and SOP checklist steps.
- Check prerequisite orders (if any are linked via `dependsOnOrderIds`).

### Step 2: Document Verification & Extraction
- If documents are missing: Auto-draft a polite reminder requesting the specific missing documents and post it to Communication History (`order.notes`). Set SOP checklist step to `Blocked` or status to `Waiting on Customer`.
- If documents are uploaded: Run Gemini multimodal extraction to retrieve entity details (Legal Entity Name, Reg Number, SARS Tax Number, Director Name, ID Number, Registered Office Address).
- **Data Mismatch Handling**: If extracted data contradicts Firestore records, log the discrepancy in the verification report for Kevin's review, but continue using the extracted data for drafting.

### Step 3: Statutory PDF Generation Guidelines

#### A. Accountant's Confirmation of Income & Drawings (Bank Proof of Income)
- **No Commissioner Stamp / No Signature PNG**: Standard accountant letters must use the clean executive digital signature card without a Commissioner of Oaths stamp.
- **Signature Block Format**:
  ```text
  FOR MY ACCOUNTANT (PTY) LTD (REG: 2020 / 548105 / 07):
  Kevin Freese
  DIGITALLY SIGNED • CBA (SA) #3561 • Date: [Date]
  Chartered Business Accountant in Practice (CBAP SA #3561) • PR-0098553
  ```
- **Omit Debit Outflows**: Keep the financial table strictly focused on `STATEMENT PERIOD`, `STATEMENT REFERENCE`, and `VERIFIED CREDIT INFLOWS (ZAR)`.
- **Conservative Inflow Reconciliation**: Substantively audit all credit inflows to exclude interbank/own-account transfers, loan receipts (e.g. Wonga), interest rebates, and non-income credits. Disclose verified net income and add a footnote explaining the conservative exclusion.
- **Layout Spacing**: Maintain generous vertical padding (at least 24–28pt) between financial summary tables and section headings (e.g. `CONFIRMATION OF SUSTAINABLE DRAWINGS / NET INCOME:`).

#### B. COIDA Nature of Business Change Pack
- **Official Form CF-1B (3 Pages)**: Use the official 3-page template (`CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf`).
  - Section A: Digitally populate Employer Name, CF Reg No (digit boxes), CIPC Reg No (digit boxes), Tax No (digit boxes), Address, City, Province, Postal Code, Phone numbers, and Email.
  - Section B: Detailed description of retail/business operations, Current Classification, Target Subclass (e.g. `Subclass 0710`), Reason for Change, and Effective Date.
  - Page 2: 5 representative trade clients with contact numbers and goods/services supplied, 5 key activities, and photographs checkbox.
  - Page 3: Supporting document ticks (AFS, Proof of Address, Photos), Employer signature block, and Consultant signature block (Kevin Freese, CIBA #3561).
- **Special Power of Attorney (COIDA Mandate)**:
  - Generate on My Accountant executive letterhead.
  - Formally appoint Kevin Freese (CIBA #3561, ID: `8606205046085`) to represent the employer, submit Form CF-1B, and liaise with the Compensation Commissioner.

#### C. B-BBEE Sworn Affidavit (EME - General)
- Use official dtic template `public/templates/Affidavit-EME-Gen.pdf`.
- Embed high-res trimmed signature asset `public/templates/Signature_Kevin_New.png`.
- Position signature compactly above `Commissioner of Oaths:` header.
- Place official Commissioner of Oaths stamp box neatly below.
- Scale FYE date font size to $\le 7.2\text{pt}$ so text like `"28 February 2026"` fits between $X=246.5$ and $X=314.2$ without overlapping printed text.

### Step 4: Mandatory Checkpoint (Kevin Confirmation)
**Always pause after PDF generation** and present a summary to Kevin showing:
- Entity Name, Registration Number, Director Name & ID.
- Generated documents with file size and status.
- Wait for Kevin's go-ahead before executing client delivery.

### Step 5: Delivery Routing & Communication History
- **Firestore Data Structure (CRITICAL)**:
  - Notes and deliverables must be appended directly to the `order.notes` **array on the order document** (`orders/{orderId}`) using `FieldValue.arrayUnion()`.
  - Attachments must follow the object schema: `attachments: [{ name: "filename.pdf", url: "https://..." }]`.
- **Client Delivery Policy**:
  - Never email end clients directly via raw SMTP. All client updates and download links must be posted to `order.notes`.
- **Review Emails**:
  - Emails sent via SMTP are reserved for internal review alerts to Kevin (`kev@thinkestry.co.za` & `freesekevin@gmail.com`) with attachments for sign-off.

## Safeguards & Rules

1. **Strict Statutory Prerequisite Gate (No Drafting on Incomplete Info)**: Never generate statutory registration documents until ALL prerequisite source documents have been verified and extracted. (e.g. Tax Clearance PIN for NCR Form 2; Signed AFS & Instruction letter for COIDA CF-1B).
2. **Strict Communication History Policy**: All client communications belong in `orders/{orderId}` under `order.notes`.
3. **WinAnsi Encoding Constraint**: In pdf-lib, avoid unicode bullets or smart quotes. Use standard ASCII characters (`•` as ASCII bullet or dash).
4. **Single Page Strictness**: Letters and statutory certificates must fit neatly on a single page unless inherently multi-page (e.g. NCR Form 2, Form CF-1B).
