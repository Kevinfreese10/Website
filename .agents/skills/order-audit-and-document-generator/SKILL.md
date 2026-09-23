---
name: order-audit-and-document-generator
description: >
  Audits client orders across all My Accountant services, verifies uploaded KYC/statutory documents with AI vision, generates compliant statutory PDFs (Accounting Officer Letters, NCR Form 2, Fee Annexures, resolutions, share certificates, COIDA Form CF-1B, Special Power of Attorney, BEE affidavits, etc.), and routes delivery via Communication History or Kevin's review inbox based on strict confidence thresholds and state machine rules.
---

# Order Audit & Document Generator

This skill guides the end-to-end audit, document verification, statutory PDF generation, and delivery routing for all client orders on the **My Accountant** platform.

## Overview

```
[Order Triggered (Single ID / Batch / Live Listener)]
                         │
                         ▼
        [1. Ingest & Fetch Order Context]
                         │
                         ▼
    [2. Document Verification & KYC Pre-Flight]
      ├─ Missing docs? ──► Move to "Waiting on Customer" & post checklist reminder
      └─ Valid docs?   ──► Extract entity metadata & proceed to Drafting
                         │
                         ▼
           [3. Generate Statutory PDFs]
      (Form NCR 2, Fee Annexure, Special POA, Resolutions, Accountant's Letters, etc.)
                         │
                         ▼
   [4. CHECKPOINT: Present PDF Summary / Dispatch Review]
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
  [Client Signature Needed]     [Statutory Lodgement / Delivery]
           │                           │
  [Post Drafts to Notes &]      [Lodge with Regulator (NCR/COIDA)]
  [Set "Waiting on Customer"]   [Set "Waiting on External"]
                                       │
                                [Approved / Issued]
                                [Set "Completed"]
```

## Dependencies

- `order-fulfillment-agent`: Platform SOP checklist rules, state machine, and portal communication policy.
- `src/lib/pdf/template-generators.ts` & `src/lib/documents/renderers/`: PDF generation engine with official brand letterhead, CIBA CBA (SA) #3561 credentials, and statutory templates.
- `src/lib/firebase-admin.ts`: Firestore database & Firebase Storage client.
- `src/lib/email.ts` / Nodemailer: SMTP transport (`mail.myacc.co.za:465`) for review notifications and client communications.

---

## Canonical Order Status Taxonomy & State Machine

| Status | Badge Color | Purpose / When to Apply |
|---|---|---|
| **`Processing`** | 🔵 Info (Blue) | Active order currently being worked on by staff/agent (document verification, trial balance, drafting). |
| **`Waiting on Customer`** | 🟡 Amber / Orange | Waiting for customer document uploads, digital/physical signatures on Form NCR 2 / POA / Resolutions, or client feedback on drafts. |
| **`Waiting on External`** | 🟣 Purple / Indigo | All documents verified and submitted to external regulators or government bodies (e.g. NCR at `registrations@ncr.org.za`, COIDA Commissioner, SARS, CIPC). |
| **`Pending Payment`** | 🟡 Warning (Yellow) | Awaiting payment confirmation or ITN clearance. |
| **`Completed`** | 🟢 Success (Green) | All statutory deliverables, registration certificates, or signed letters posted to Communication History and confirmed. |

---

## Strict Email Routing Guardrail

> [!IMPORTANT]
> **Internal Review Emails**: Review emails and sign-off drafts must be routed **strictly to `kev@thinkestry.co.za`** (CC `info@myacc.co.za`).
> **NEVER include or CC `freesekevin@gmail.com`**.
>
> **Client Outbound Emails**: Dispatched from `info@myacc.co.za` (via `mail.myacc.co.za:465`) with responsive HTML layout and clean plain-text fallback, CCing `info@myacc.co.za`.

---

## Step-by-Step Workflow Protocol

### Step 1: Ingest & Inspect
- Fetch order details: Customer Name, Email, Phone, Legal Entity Name, Registration Number, SARS Tax Number, Order Items, and Total.
- Inspect `documentUploads`, `uploadedFiles`, and `notes` (Communication History).

### Step 2: Document Verification & Extraction
- **Auditing Checklist against Service Playbook**:
  - **NCR Registration**: CIPC CoR14.3, Certified Director IDs (<3 months), SAPS/AFISwitch Criminal Clearance (<6 months), Bank Confirmation Letter in entity name (<3 months), SARS TCS PIN, Proof of Payment (R1,800).
  - **Accountant's Income Letter**: Certified ID, 6-month bank statements (PDF), proof of contract/invoice earnings, addressee details.
- **Handling Incomplete Documents**: Move order status to `Waiting on Customer` and post a clear itemized list of required documents to `order.notes`.
- **False-Positive Handling**: If automated vision flags valid contractor invoices (e.g., "Expected payslip but found invoice"), override to approved if justified by contractor/self-employed status.

### Step 2.5: Accountant's Letter Discovery Questionnaire Protocol (MANDATORY)
* **Pre-Draft Discovery Rule**: Never draft or certify an Accountant's Letter based solely on the raw documents uploaded without first asking targeted discovery questions via Communication History. This ensures the letter captures the client's complete earnings picture and meets the recipient's specific criteria.
* **Standard Discovery Probe Dimensions**:
  1. **Addressee & Exact Purpose**: Full legal name of institution (bank, landlord, embassy, vehicle financer), branch/department, contact person, and application reference number.
  2. **Required Calculation Period**: Explicitly confirm whether the institution requires 3 months, 6 months, or 12 months average.
  3. **Company-Paid Living Expenses & Subsidies**: Ask if the company directly pays personal living expenses on the applicant's behalf (e.g., vehicle lease, fuel, mobile contracts, medical aid, residential rent, or security) to reflect total effective monthly realization.
  4. **Secondary / Undocumented Earnings**: Inquire whether there are secondary trading accounts, director loan repayments, or dividend payouts not reflected in the primary account statements.
  5. **Specific Institution Clauses / Templates**: Ask if the institution has provided a mandatory template or specific wording clauses required for acceptance.
* **Pre-Approval Gate**: The drafted questionnaire note MUST be presented to Kevin for review and explicit approval before posting to Firestore (`order.notes`).
* **Post-Questionnaire State**: Once Kevin approves and the note is posted, immediately transition order status to **`Waiting on Customer`**.
* **Evidentiary Standard**: When the client replies, cross-reference all stated figures against bank debits, contracts, or invoices. Never certify unverified numbers without documentary backing.

### Step 2.6: Forensic Anti-Fraud & Conduit Audit Checklist
Before drafting any Accountant's Letter, perform the following forensic tests on bank statements and source documents:
1. **Balance Retention & Conduit Test**: Does the account maintain an ongoing operational/working balance, or does it operate as an immediate pass-through conduit where deposits are promptly swept out to linked or third-party accounts (e.g. mobile app transfers to secondary names)? If funds are immediately dissipated, request 6 months of statements for the receiving account to verify retention and living expense settlement.
2. **Spike & Outlier Normalization Test**: Does any single month contain > 50% of the entire period's total credits? If yes, inspect contract terms to determine if it is a non-recurring advance/buyout vs regular recurring royalties. Never mask revenue volatility with an unadjusted arithmetic mean.
3. **Operational & Living Expense Reality Test**: Are normal personal subsistence debits present (rent, utilities, vehicle, mobile, medical aid)? If absent, query the source of personal upkeep in the Discovery Questionnaire before attesting to affordability.
4. **Counterparty & Name Matching**: Cross-examine sender names on inward SWIFTs/transfers against contracts and company registries. Verify that the legal individual on the ID card matches the contractual licensor/director or formal alias.
5. **SARS Tax Number & Compliance**: Check whether the applicant is registered for Income Tax or Provisional Tax, especially for large foreign revenue streams.

---

### Step 3: Statutory PDF Generation Guidelines

#### A. Accountant's Confirmation of Income & Drawings
* **Typography & Word Wrapping**: Use dynamic font measurement to wrap text strictly on word boundaries (`wrapText`). Never truncate or split words across line breaks.
* **Layout Spacing**: Maintain generous vertical breathing room (12–16pt) between cards, paragraphs, tables, and the highlight box.
* **Scope Limitation**: Confine confirmation strictly to the examination of verified bank statements and invoices. Do NOT claim unperformed reviews (e.g., tax profile or billing audits).
* **Dedicated Digital Signature Slot**: Use an expanded signature box (85pt height) with a clean ~38pt open blank area above Kevin's printed name so digital signature stamps can be applied cleanly without overlapping text:
  ```text
  FOR MY ACCOUNTANT (PTY) LTD (REGISTRATION NO: 2020 / 548105 / 07):

  [ OPEN ~38PT BLANK SPACE FOR DIGITAL SIGNATURE ]

  Kevin Freese
  Chartered Business Accountant in Practice • CBAP (SA) #3561
  Practice Number: PR-0098553 • CIBA Member in Good Standing
  ```

#### B. NCR Credit Provider 6-Document Statutory Pack
* **Single-Page PDF Layout Budgeting Invariant**:
  - 1-page statutory instruments (Accounting Officer Consent Letters, Special Power of Attorney, Director Resolutions, Fee Annexures) MUST fit on **exactly 1 page** without overflowing signatures to page 2.
  - **CSS Page Budget Guidelines**:
    ```css
    @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9.5pt; line-height: 1.45; color: #2D3748; }
    .header-table { padding-bottom: 6px; margin-bottom: 12px; }
    .meta-box { padding: 8px 12px; margin-bottom: 12px; font-size: 9pt; }
    .sign-col { padding: 10px 12px; margin-top: 14px; }
    ```
  - **Verification**: Programmatically verify `pdfDoc.getPageCount() === 1` before finalizing.
* **Complete 6-Document Statutory Application Pack**:
  1. **01. Form NCR 2 Application (7/8 Pages)**: Populate official AcroForm template (`NCR_Form_2_Fillable.pdf`) with applicant name, trading name, CIPC registration number, commencement date, FYE, tax number, addresses, contact details, sole director profile, products (unsecured credit & credit facilities), English & IsiZulu languages, BBBEE commitments, overindebtedness commitments, new registrant financials (R 0.00), 1 premise, and disqualification questions (all NO, SAPS consent YES).
  2. **02. Accounting Officer Consent & Appointment Letter (1 Page)**: Generate on My Accountant letterhead confirming independent appointment (CIBA CBAP SA #3561 / PR-0098553) compliant with Regulations 67 & 68 of NCA.
  3. **03. Special Power of Attorney (1 Page)**: Mandating Kevin Freese / My Accountant (Pty) Ltd before the NCR.
  4. **04. Sole Director Written Resolution (1 Page)**: Formal board resolution authorizing NCR registration and agent mandate.
  5. **05. NCR Confirmation of Fees Annexure (1 Page)**: Breakdown (R550 App Fee + R1,250 Branch Fee = R1,800 Total) confirming payment.
  6. **06. Share Certificate #01 (1 Page Landscape)**: Certifying 100 ordinary shares held by sole director.
* **Local Output Directory**: Save copies to `C:\Users\kev\Downloads\Order_<ID>_<Entity>_Statutory_Pack\` and `c:/myacc/scratch/order_<ID>_pack`.

#### C. Executive Review Email Routing ("Email the pack to me")
When Kevin requests a review email or "Email the pack to me":
* **To**: `kev@thinkestry.co.za`
* **CC**: `info@myacc.co.za`
* **From**: `"Kevin Freese | My Accountant" <info@myacc.co.za>`
* **Attachments**: All 6 drafted statutory PDFs.

#### D. NCR Signed Conditions Lodgement Protocol (Section 48(6))
When an NCR application is approved subject to proposed conditions:
* **Required Attachments**: Initialled Proposed Conditions Notice + Signed Annexure A (Consent) + Signed Annexure B (Staff Count).
* **To**: `registrations@ncr.org.za` and assigned officer (e.g. `Tneshehe@ncr.org.za`).
* **CC**: Client email address & `info@myacc.co.za`.
* **State Transition**: Set order status to `Waiting on External` and post dispatch note + Message ID to Order Communication History.

#### E. COIDA Nature of Business Change Pack
* **Official Form CF-1B (3 Pages)**: Use `public/templates/CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf`.
* **Special Power of Attorney**: Appointing Kevin Freese (CIBA #3561, ID: `8606205046085`) before the Compensation Commissioner.

#### F. B-BBEE Sworn Affidavit (EME - General)
* Use official dtic template `public/templates/Affidavit-EME-Gen.pdf`.
* Embed trimmed signature asset `public/templates/Signature_Kevin_New.png`.
* Position signature compactly above `Commissioner of Oaths:` header with Commissioner stamp box below.

#### G. Company Voluntary Liquidation Application & CM100 Pack
* **Master Templates**:
  - Application Pack (Core): `public/templates/LIQUIDATION_APPLICATION_MASTER.docx` (based on `ARP FAMILY ENTERPRISE (PTY) LTD - LIQUIDATION APPLICATION.docx`).
  - Statement of Affairs: `public/templates/CM100_CALLENDRA_HOLDINGS_22_Pages.pdf` (22-page official Master AcroForm).
* **Strict Terminology Invariant (Pty Ltd Companies)**:
  - Enterprise Type: Private Company / Maatskappy
  - Officers: Strictly use `Director` / `Direkteur` and `Shareholder` / `Aandeelhouer` (NEVER use `Member`, `Lid`, `Membership Interest`, or `Corporation`).
* **Document Package Architecture**:
  1. **Core Application Pack (Pages 1 to 7)**:
     - Page 1: Form CM 26 (Special Resolution of Company for Voluntary Liquidation by Creditors)
     - Page 2: Form CM 25A (Consent to waive notice of meeting)
     - Page 3: Attachment Note
     - Page 4: Notice of Meeting of Shareholders and Directors
     - Page 5: Extract from Minutes of Meeting of Shareholders and Directors
     - Page 6: Letter of Instruction to CIPC Registrar of Companies
     - Page 7: Sworn Affidavit by Director
  2. **CM100 Statement of Affairs (22 Pages)**:
     - Standalone official AcroForm pre-populated with SARS preferent debts, liabilities, and assets (do not duplicate inline pages).
#### F. Accountant Confirmation of Income, Shareholding & Financial Standing Letter
* **Purpose & Authority**: Independent Professional Accounting Officer confirmation issued under Kevin Freese (Director, CBAP SA #3561, Practice No: PR-0098553) for banking institutions, vehicle asset finance, home loans, leases, and regulatory bodies.
* **Document Architecture & Typography Standards**:
  1. **Strict Fixed-Column Amount Grid**:
     - All currency figures in breakdown lists (e.g. Director Drawings, Living Expenses, Fuel, Mobile, Life Cover, Armed Response) MUST be vertically aligned along a fixed uniform X-coordinate column (`x: 380` on A4).
     - Never use staggered or ragged inline currency text.
  2. **Multi-Currency & Banking Reconciliation**:
     - Cross-reference signed Annual Financial Statements (AFS), SARS tax filings (ITA34 / ITR14), and multi-currency bank statements (ZAR Gold Business + CFC USD accounts).
  3. **Categorized Remuneration Structure**:
     - **Part A: Net Personal Drawings / Direct Remuneration**: Regular cash drawings taken by the Director.
     - **Part B: Direct Company-Paid Living & Operating Subsidies**: Specific expenses paid directly by the company on behalf of the Director (e.g. Fuel, Mobile Contract, Life Insurance, Security).
   #### H. Tax Representative Appointment Protocol
* **No Document Preparation Invariant**:
  - We do **NOT** prepare any documents for the "Tax Representative Appointment" service.
  - The client uploads are audited for completeness:
    1. **CIPC CoR 14.3 / Disclosure Certificate**: Contains the company's corporate income tax number (do NOT request company tax number separately if CoR 14.3 is uploaded).
    2. **Director / Public Officer ID**: Certified copy or clear high-resolution color scan.
    3. **Tax Representative's Personal Income Tax Number**: **MANDATORY PREREQUISITE**. Must be the individual's personal SARS tax reference number. If the client enters "Not applicable" or omits it, halt progression and request it via Communication History.
    4. **Contact Details**: Direct cell number and email address of the appointed representative.
    5. **SARS eFiling Login Credentials**: Username and password (or confirm if a profile needs to be created / linked).
* **Fulfillment Email Dispatch**:
  - Once all required information (strictly including the tax rep's personal tax number) and client uploads are present, immediately compile the dossier and dispatch via email:
    - **To**: `sinto4plus@gmail.com`
    - **From**: `info@myacc.co.za`
    - **CC**: `info@myacc.co.za`, `kev@thinkestry.co.za`
    - **Subject**: `Tax Representative Appointment — Order #<ID> (<Entity Name>)`
    - **Attachments**: The client's submitted files (CoR14.3, Director ID copies).
#### G. Canonical Practice Document Styling, Letterhead & Typography Standards
Every statutory PDF generated by this skill (Engagement Letters, Accountant's Confirmation Letters, Resolutions, Annexures, Power of Attorney) must strictly adhere to the unified **Executive Navy & Gold Trim** standard:

1. **Header Architecture Across Multi-Page Documents**:
   - **Page 1 Letterhead**: Clean My Accountant practice block:
     - *Left*: `My Accountant (Pty) Ltd` (16.5pt bold Deep Navy `#0f2137`) | `Registration: 2020 / 548105 / 07 • Practice No: PR-0098553` (Warm Gold `#c5a059` accent).
     - *Right*: `Ground Floor, Waterstone Building, Stonemill Office Park` | `300 Acacia Road, Darrenwood, Johannesburg, 2195` | `Tel: +27 10 109 1625 • Email: info@myacc.co.za • Web: www.myacc.co.za`.
     - *Divider Bar*: Distinctive horizontal trim bar (Navy 70% / Warm Gold 30%).
   - **Subsequent Pages (2+)**: **Never repeat client details in top running headers**. Use only a clean `• Page X of Y` indicator at the top right with a subtle gold bullet and slate border.
   - **Zero Decorative Imagery**: Never embed stock photos, decorative background vectors, or placeholder graphics.
2. **Color Palette & Visual Trim**:
   - **Deep Navy (`#0f2137`)**: Practice brand title, main headings, table headers, signature lines.
   - **Warm Gold (`#c5a059`)**: Header divider bar, card left accent borders (4px), subsection vertical pill indicators (2.5px), heading underlines (1.5px).
   - **Charcoal Text (`#1e293b`)**: Body paragraphs, bullet text, terms.
   - **Slate Dividing Lines (`#e2e8f0` / `#cbd5e1`)**: Subtle structural borders.
3. **Typography & Page Budget**:
   - Universal Sans-Serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` / Helvetica).
   - Strict page budget management: Ensure clean page breaks so sections never leave isolated single-line bullets on a trailing page.
4. **Mandatory Retainer Clauses**:
   - For accounting retainers where VAT is included but the client is not yet VAT-registered, include the mandatory VAT fee review disclosure in Section 3.B: *"Please note that our monthly retainer fee will be reviewed and adjusted accordingly once the company is formally registered for VAT."*

---

### Step 4: Storage Upload & Client Communication History (CRITICAL INVARIANTS)

* **Mandatory User Approval Gate (STRICT)**:
  - **NEVER** upload documents to Cloud Storage, post notes to Firestore (`order.notes`), or dispatch emails to clients until Kevin has reviewed and explicitly approved them.
  - **Email Pre-Approval Rule (Draft Documents Only)**: The agent **ONLY** compiles and dispatches an executive review pack to `kev@thinkestry.co.za` (do NOT CC `info@myacc.co.za`) when draft statutory documents (PDFs) were actually generated and require Kevin's review/signature (`documentsGenerated.length > 0`). If no draft documents were generated (e.g. conversational notes, requests, or questions), **completely suppress** the review email; keep the activity strictly within the portal dashboard.
  - Wait for Kevin's confirmation or instructions before committing changes to the database.

* **Client Communication Formatting Rules**:
  - Keep client messages concise, actionable, and readable in under 30 seconds. Avoid overwhelming the client with lengthy audit dumps or internal verification jargon.
  - **NEVER** use markdown bold asterisks (`**`) in client communication notes. Keep the text clean and plain.
  - **NEVER** show raw Firebase Storage URLs (`https://firebasestorage.googleapis.com/...`) in the note `text`. The text must refer solely to the attached document (e.g., "Please review the draft document attached below").
  - **NEVER** include a `Download Links:` or `**Download Links:**` header. Attachments are automatically rendered with download buttons in the portal UI via the `attachments` array.
  - **Strict Communication History Rule**: Never email draft documents or review requests directly to clients; always post exclusively to the Order's Communication History (`order.notes` in Firestore) with attachments to keep 100% of client dialogue centralized in the portal dashboard.
* **Storage Upload Path & Download Token Invariant**:
  - Path: `orders/{orderId}/notes/{timestamp}_{filename}.pdf`.
  - When uploading via Firebase Admin SDK, ALWAYS attach a unique UUID download token in metadata (`firebaseStorageDownloadTokens: crypto.randomUUID()`) AND call `file.makePublic()`.
  - Format the attachment URL with the token:
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`
  - Perform an HTTP GET pre-flight check to verify `res.status === 200` before committing to Firestore.
* **Firestore Data Structure**:
  - Notes and deliverables must be appended directly to `order.notes` using `FieldValue.arrayUnion()`.

  - Schema:
    ```javascript
    const note = {
      id: `note_${Date.now()}`,
      text: "...",
      authorId: "LRM285EOq3gwNMKayY6vtzooaC03",
      authorName: "Kevin Freese (Director)",
      date: new Date(),
      type: "note",
      subject: "...",
      isInternal: false,
      attachments: [{ name: "Document.pdf", url: "https://firebasestorage.googleapis.com/..." }]
    };
    ```

---

### Step 5: External Regulator Lodgement Protocol (NCR)

When all statutory documents are signed and ready for lodgement:
1. **Lodgement Target**: `registrations@ncr.org.za`
2. **Officer Inboxes (Direct)**: `dndaba@ncr.org.za`, `emoleko@ncr.org.za`, `mgoba@ncr.org.za`, `JBaloyi@ncr.org.za`, `vkhumo@ncr.org.za`
   *(DO NOT use `applications@ncr.org.za` — permanently rejected / access denied)*.
3. **CC List**: `info@myacc.co.za`, client email.
4. **Attachments**: Complete signed statutory application pack + proof of payment (R1,800.00 to NCR).
5. **Order Status Transition**: Update Firestore status immediately to **`Waiting on External`**.
6. **Log Confirmation**: Post confirmation note to Communication History with email timestamp and Message ID.

---

## Live Event Listener Integration Patterns

To run this skill continuously or reactively in Antigravity:

1. **Firestore `onSnapshot` Daemon**:
   ```javascript
   db.collection('orders')
     .where('status', 'in', ['Processing', 'Waiting on Customer'])
     .onSnapshot(snap => {
       snap.docChanges().forEach(change => {
         if (change.type === 'modified') {
           // Auto-trigger pre-flight audit when documentUploads array updates
         }
       });
     });
   ```
2. **Cron Scheduler (`/schedule`)**: Run recurring audits every 30 minutes to check orders awaiting customer response and draft polite follow-ups after 48 hours.

---

## 🛠️ CLI Execution Commands

### 1. Inspect Order Details & Uploads
```bash
npx tsx .agents/skills/order-audit-and-document-generator/scripts/audit_order.ts fetch --order-id <ID>
```

### 2. Autonomous Audit & Statutory Pack Compilation (Dry-Run Preview)
```bash
npx tsx .agents/skills/order-audit-and-document-generator/scripts/audit_order.ts audit --order-id <ID> --dry-run
# Or using the pipeline script directly:
npx tsx src/lib/agent/order-audit-pipeline.ts --order-id <ID> --dry-run
```

### 3. Explicit Executive Sign-Off & Deliverables Commitment (After Kevin's Review)
```bash
npx tsx .agents/skills/order-audit-and-document-generator/scripts/audit_order.ts approve --order-id <ID>
# Or using flag:
npx tsx .agents/skills/order-audit-and-document-generator/scripts/audit_order.ts --order-id <ID> --approve-and-post
# Or via pipeline runner:
npx tsx src/lib/agent/order-audit-pipeline.ts --order-id <ID> --approve-and-post
```
