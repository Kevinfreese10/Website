---
name: order-fulfillment-agent
description: >
  Autonomous end-to-end AI agent for My Accountant orders: audits and verifies client KYC/statutory documents with AI vision, generates compliant statutory PDFs (NCR Form 2, Fee Annexures, Special POA, Resolutions, Accountant's Letters, COIDA CF-1B, BEE Affidavits, CM100 Liquidation packs), routes executive sign-offs to Kevin, manages portal Communication History, executes regulator lodgements (NCR/COIDA/SARS/CIPC), and runs Day 30/60/75 SLA follow-up cycles.
---

# Order Fulfillment AI Agent

This skill guides the end-to-end order fulfillment, document verification, forensic auditing, statutory PDF generation, client portal communication, regulator lodgement, and SLA follow-up workflows across all services on the **My Accountant** platform.

---

## 🔄 End-to-End Autonomous Lifecycle

```
[New Order / Processing / Inbound Client Document]
                        │
                        ▼
       [1. Ingest & Inspect Order Context]
  (Firestore Snapshot, Document Uploads, Inbound Emails)
                        │
                        ▼
   [2. Document Verification & KYC Pre-Flight (AI Vision)]
     ├─ Missing/rejected? ──► Move to "Waiting on Customer" & post checklist reminder
     └─ Valid uploads?    ──► Perform Forensic Checks & proceed to Drafting
                        │
                        ▼
   [2.5 Discovery Protocol / Forensic Anti-Fraud Audit]
     (Probe living subsidies, conduit dissipation, revenue spikes)
                        │
                        ▼
           [3. Generate Statutory PDFs]
  (NCR 6-Pack, Accountant's Letters, COIDA CF-1B, CM100, BEE Affidavits)
                        │
                        ▼
   [4. Executive Sign-Off Gate (Email to Kevin)]
  (Suppress email if no PDFs generated; NEVER write unapproved notes)
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
[Client Signature Needed]     [Statutory Lodgement Ready]
         │                             │
[Post Drafts to Portal Notes] [Lodge with Regulator (NCR/COIDA)]
[Set "Waiting on Customer"]   [Set "Waiting on External"]
                                       │
                                       ▼
                       [5. Autonomous SLA Follow-Up Cycle]
                       (Day 30, Day 60, Day 75 with Officers)
                                       │
                                       ▼
                       [6. Completion & Certificate Delivery]
                       (Upload final certificate & set "Completed")
```

---

## 🏛️ Dependencies & Codebase Architecture

- **Core Pipeline Engine**: `src/lib/agent/order-audit-pipeline.ts` — Ingests orders, executes forensic checks, populates statutory templates, validates single-page budget compliance, prepares executive review packs, and commits approved deliverables.
- **PDF Generation Engine**: `src/lib/pdf/template-generators.ts` & `src/lib/documents/renderers/` — High-resolution vector PDF generators with official brand letterhead and CIBA CBAP (SA) #3561 credentials.
- **AFS Compilation Report Branding**: `.agents/skills/audit-and-rebuild-financial-model/scripts/brand_compilation_report.py` — Enforces My Accountant official letterhead, redacts software draft placeholders, strips legacy sign-off blocks, and places Kevin's digital signature for all Annual Financial Statements.
- **Document Registry & Context**: `src/lib/documents/registry.ts` and `src/lib/documents/context.ts`.
- **Database & Storage**: `src/lib/firebase-admin.ts` — Firestore database & Firebase Storage bucket.
- **Email Transport**: `src/lib/email.ts` (SMTP `mail.myacc.co.za:465`).

---

## 📊 Canonical Order Status Taxonomy & State Machine

| Status | Badge Color | Definition & Application Criteria |
|---|---|---|
| **`Processing`** | 🔵 Info (Blue) | Active order currently being worked on by staff/agent (document verification, income analysis, trial balance, drafting). |
| **`Waiting on Customer`** | 🟡 Amber / Orange | Waiting for customer document uploads, answers to Discovery Questionnaires, or digital/physical signatures on drafts (Form NCR 2 / POA / Resolutions). |
| **`Waiting on External`** | 🟣 Purple / Indigo | All required documents verified, signed, and formally lodged with external regulators or government bodies (NCR, COIDA Commissioner, SARS, CIPC). |
| **`Pending Payment`** | 🟡 Warning (Yellow) | Awaiting payment confirmation or ITN clearance from payment gateway. |
| **`Completed`** | 🟢 Success (Green) | Final statutory certificate (NCRCP Certificate, CoR14.3, Tax Clearance PIN, Letter of Good Standing) or certified letter delivered to client in portal. |

### State Transition Guardrails

| Status Transition | Trigger & Invariant |
|---|---|
| **`Processing` $\rightarrow$ `Waiting on Customer`** | Required uploads are missing/rejected, or drafts require client review/signatures. Posted exclusively to portal Communication History. |
| **`Waiting on Customer` $\rightarrow$ `Processing`** | Client uploads requested documents in portal or emails them to `info@myacc.co.za`. |
| **`Processing` $\rightarrow$ `Waiting on External`** | All required client instruments (signed Form NCR 2, POA, resolutions, certified IDs, police clearances) are verified and lodged with the regulator. |
| **`Waiting on External` $\rightarrow$ `Completed`** | Final statutory certificate received from regulator, uploaded to Storage, and posted to Communication History. **NEVER complete an order without the final signed/issued deliverable.** |

---

## 🔒 Strict Client Communication Policy (CRITICAL INVARIANTS)

1. **NEVER Email Drafts Directly to Clients**:
   - Do **NOT** email draft documents, review requests, or questionnaires directly to client email addresses.
   - **ALWAYS** post exclusively to the Order's **Communication History** (`order.notes` in Firestore) with attachments. This ensures 100% of client correspondence remains centralized in the portal dashboard.
2. **Clean Plain-Text Formatting**:
   - **NEVER** use markdown bold asterisks (`**`) in client communication notes. Keep all text plain and clean.
   - **NEVER** show raw Firebase Storage URLs (`https://firebasestorage.googleapis.com/...`) in note body text.
   - **NEVER** write `Download Links:` headers. The portal UI automatically generates download action buttons from the `attachments` array.
   - Keep messages concise, actionable, and readable in under 30 seconds.

---

## ✉️ Strict Internal Review Email Routing (Executive Sign-Off)

> [!IMPORTANT]
> **Internal Review Emails**: Review packs must be routed **strictly to `kev@thinkestry.co.za`** (CC `info@myacc.co.za`).
> **NEVER include or CC `freesekevin@gmail.com`**.
>
> **Mandatory Pre-Approval Invariant**:
> Even when confident in audit results and calculations, the agent **MUST ALWAYS** obtain Kevin's explicit approval before committing deliverables or updating `order.notes` in the portal.
>
> **Review Email Suppression Rule**:
> The agent **ONLY** dispatches an executive review email to Kevin when draft statutory documents (PDFs) were actually generated (`documentsGenerated.length > 0`). If no PDFs were drafted (e.g. conversational notes, questionnaires, or basic status updates), **completely suppress** the review email; keep the review strictly within the chat interface.

---

## 💳 Payment Notifications & Inbound Document Ingestion

1. **Bank Electronic Notifications (PayFast, Capitec RTC, Absa, FNB)**:
   - The portal's Instant Transaction Notification (ITN) webhook automatically transitions orders from `Pending Payment` to `Processing`.
   - General bank payment advice emails arriving at `info@myacc.co.za` can be **ignored and auto-archived**.
2. **Direct Client Document Uploads via Email**:
   - When a client emails statutory documents, CoR certificates, bank confirmation letters, or IDs directly to `info@myacc.co.za`:
     1. Ingest attachments and upload them to Firebase Storage at `orders/{orderId}/notes/{timestamp}_{filename}`.
     2. Post a confirmation note in the Order's **Communication History** (`order.notes`).
     3. Transition the order from `Cancelled` / `Waiting on Customer` to **`Processing`**.

---

## 📋 Step-by-Step Workflow Protocol

### Step 1: Ingest & Snapshot Inspection
- Fetch order details: Customer Name, Email, Phone, Legal Entity Name, Registration Number, SARS Tax Number, Order Items, and Total.
- Inspect `documentUploads`, `uploadedFiles`, and `notes` (Communication History).

### Step 2: Document Verification & KYC Pre-Flight
- Audit uploads against the specific service checklist (see Service Playbooks below).
- **False-Positive Handling**: If automated vision flags valid contractor invoices (e.g., "Expected payslip but found invoice"), override to approved if justified by contractor/self-employed status.
- If required documents are missing: compile an itemized list, move order to `Waiting on Customer`, and post a polite reminder note in Communication History.

### Step 2.5: Accountant's Letter Discovery Questionnaire Protocol (MANDATORY)
* **Pre-Draft Discovery Rule**: Never draft or certify an Accountant's Income Letter based solely on raw bank statements without first asking targeted discovery questions via Communication History.
* **Standard Discovery Probe Dimensions**:
  1. **Addressee & Exact Purpose**: Full legal name of institution (bank, landlord, embassy, vehicle financer), branch/department, contact person, and application reference number.
  2. **Required Calculation Period**: Confirm whether the institution requires 3 months, 6 months, or 12 months average.
  3. **Company-Paid Living Expenses & Subsidies**: Ask if the company directly pays personal living expenses on the applicant's behalf (e.g., vehicle lease, fuel, mobile contracts, medical aid, residential rent, or security) to reflect total effective monthly realization.
  4. **Secondary / Undocumented Earnings**: Inquire whether there are secondary trading accounts, director loan repayments, or dividend payouts not reflected in the primary account statements.
  5. **Specific Institution Clauses / Templates**: Ask if the institution has provided a mandatory template or specific wording clauses required for acceptance.
* **Pre-Approval Gate**: Present the drafted questionnaire note to Kevin for review and explicit approval before posting to `order.notes`. Transition order to `Waiting on Customer` once posted.

### Step 2.6: Forensic Anti-Fraud & Conduit Audit Checklist
Before drafting any Accountant's Letter, perform the following forensic tests on bank statements and source documents:
1. **Balance Retention & Conduit Test**: Does the account maintain an ongoing operational balance, or does it operate as an immediate pass-through conduit where deposits are swept out immediately to linked/third-party accounts? If funds are dissipated, request 6 months of statements for the receiving account.
2. **Spike & Outlier Normalization Test**: Does any single month contain > 50% of the entire period's total credits? If yes, inspect contract terms to determine if it is a non-recurring advance/buyout vs regular recurring royalties. Never mask revenue volatility with an unadjusted arithmetic mean.
3. **Operational & Living Expense Reality Test**: Are normal personal subsistence debits present (rent, utilities, vehicle, mobile, medical aid)? If absent, query the source of personal upkeep in the Discovery Questionnaire before attesting to affordability.
4. **Counterparty & Name Matching**: Cross-examine sender names on inward SWIFTs/transfers against contracts and company registries. Verify that the legal individual on the ID card matches the contractual licensor/director or formal alias.
5. **SARS Tax Number & Compliance**: Check whether the applicant is registered for Income Tax or Provisional Tax, especially for large foreign revenue streams.

---

## 🛠️ Detailed Statutory Service Playbooks

### Playbook A: NCR Credit Provider 6-Document Statutory Pack
* **Single-Page PDF Layout Budgeting Invariant**:
  - 1-page statutory instruments (Consent Letter, Special POA, Director Resolutions, Fee Annexures) **MUST fit on exactly 1 page** without overflowing signatures to page 2 (`pdfDoc.getPageCount() === 1`).
* **Complete 6-Document Statutory Application Pack**:
  1. **01. Form NCR 2 Application (7/8 Pages)**: Populate official AcroForm template (`NCR_Form_2_Fillable.pdf`) with applicant name, trading name, CIPC registration number, commencement date, FYE, tax number, addresses, contact details, sole director profile, products (unsecured credit & credit facilities), English & IsiZulu languages, BBBEE commitments, overindebtedness commitments, new registrant financials (R 0.00), 1 premise, and disqualification questions (all NO, SAPS consent YES).
  2. **02. Accounting Officer Consent & Appointment Letter (1 Page)**: Generate on My Accountant letterhead confirming independent appointment (CIBA CBAP SA #3561 / PR-0098553) compliant with Regulations 67 & 68 of NCA.
  3. **03. Special Power of Attorney (1 Page)**: Mandating Kevin Freese / My Accountant (Pty) Ltd before the NCR.
  4. **04. Sole Director Written Resolution (1 Page)**: Formal board resolution authorizing NCR registration and agent mandate.
  5. **05. NCR Confirmation of Fees Annexure (1 Page)**: Breakdown (R550 App Fee + R1,250 Branch Fee = R1,800 Total) confirming payment.
  6. **06. Share Certificate #01 (1 Page Landscape)**: Certifying 100 ordinary shares held by sole director.
* **Output Path**: Save copies to `C:\Users\kev\Downloads\Order_<ID>_<Entity>_Statutory_Pack\` and `c:/myacc/scratch/order_<ID>_pack`.
* **Signed Conditions Lodgement Protocol (Section 48(6))**: When an NCR application is approved subject to proposed conditions:
  - Required Attachments: Initialled Proposed Conditions Notice + Signed Annexure A (Consent) + Signed Annexure B (Staff Count).
  - Dispatch to `registrations@ncr.org.za` and assigned officer (e.g. `Tneshehe@ncr.org.za`), CCing client and `info@myacc.co.za`. Set order to `Waiting on External`.

### Playbook B: Accountant's Income & Financial Standing Confirmation
* **Authority**: Issued under Kevin Freese (Director, CBAP SA #3561, Practice No: PR-0098553).
* **Word Wrapping & Typography**: Wrap strictly on word boundaries (`wrapText`). Never split words across line breaks.
* **Scope Limitation**: Confine confirmation strictly to the examination of verified bank statements and invoices. Do NOT claim unperformed reviews (e.g. tax profile or billing audits).
* **Dedicated Digital Signature Slot & Mandatory Transparent Asset Invariant**:
  - The signature card uses a subtle ice-blue fill (`rgb(0.97, 0.98, 1.0)`) with an ink-blue left accent bar (`width: 3.5`, `color: COLORS.ink`).
  - **MANDATORY SIGNATURE ASSET FORMAT**: The signature image MUST ALWAYS be a 4-channel transparent PNG (`RGBA`, `public/templates/Signature_Kevin_New.png`) with true alpha transparency (`hasAlpha: true`, `channels: 4`).
  - **ZERO WHITE BACKGROUND RECTANGLE**: Under no circumstances should an opaque RGB image with a white paper background be embedded, as this creates an unsightly white box over tinted cards. All white/near-white pixels must be transparent (`alpha: 0`) with smooth anti-aliased dark ink strokes (`alpha: 255`) so the card's background color flows seamlessly behind the signature.
  - Box layout:
  ```text
  FOR MY ACCOUNTANT (PTY) LTD (REGISTRATION NO: 2020 / 548105 / 07):

  [ SEAMLESS TRANSPARENT SIGNATURE STAMP ]

  DIGITALLY SIGNED - CBA (SA) #3561 - Date: <Date>
  Chartered Business Accountant in Practice (CBAP SA #3561) - PR-0098553
  ```
* **Strict Fixed-Column Amount Grid**: All currency figures in breakdown lists (Director Drawings, Living Expenses, Fuel, Mobile, Medical Aid, Security) MUST be vertically aligned along a fixed uniform X-coordinate column (`x: 380` on A4). Never use staggered inline currency text.
* **Categorized Remuneration Structure**:
  - Part A: Net Personal Drawings / Direct Remuneration (Regular cash drawings taken by Director).
  - Part B: Direct Company-Paid Living & Operating Subsidies (Expenses settled directly by company on Director's behalf).

### Playbook C: COIDA Nature of Business Change Pack
* **Official Form CF-1B (3 Pages)**: Use `public/templates/CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf`.
* **Special Power of Attorney**: Appointing Kevin Freese (CIBA #3561, ID: `8606205046085`) before the Compensation Commissioner.
* **COIDA vs CIPC Reference Numbers**: Note that `CF99...` is the COIDA reference number, while `YYYY/XXXXXX/XX` is the CIPC registration number. Do not confuse them during audit.

### Playbook D: B-BBEE Sworn Affidavit (EME - General)
* Use official dtic template `public/templates/Affidavit-EME-Gen.pdf`.
* Embed trimmed signature asset `public/templates/Signature_Kevin_New.png`.
* Position signature compactly above `Commissioner of Oaths:` header with Commissioner stamp box below.

### Playbook E: Company Voluntary Liquidation Application & CM100 Pack
* **Master Templates**:
  - Application Pack (Core): `public/templates/LIQUIDATION_APPLICATION_MASTER.docx` (based on `ARP FAMILY ENTERPRISE (PTY) LTD - LIQUIDATION APPLICATION.docx`).
  - Statement of Affairs: `public/templates/CM100_CALLENDRA_HOLDINGS_22_Pages.pdf` (22-page official Master AcroForm).
* **Strict Terminology Invariant (Pty Ltd Companies)**: Strictly use `Director` / `Direkteur` and `Shareholder` / `Aandeelhouer` (NEVER use `Member`, `Lid`, `Membership Interest`, or `Corporation`).
* **Document Architecture**:
  1. Core Application Pack (Pages 1–7): Form CM 26, Form CM 25A, Attachment Note, Notice of Meeting, Minutes of Meeting, Letter of Instruction to CIPC, Sworn Affidavit by Director.
  2. CM100 Statement of Affairs (22 Pages): Standalone official AcroForm pre-populated with SARS preferent debts, liabilities, and assets.

### Playbook F: Tax Representative Appointment Protocol
* **No Document Preparation Invariant**: We do **NOT** prepare documents for this service.
* **Prerequisites Audit**:
  1. CIPC CoR 14.3 / Disclosure Certificate (contains company tax number).
  2. Director / Public Officer ID (certified copy).
  3. **Tax Representative's Personal Income Tax Number**: **MANDATORY PREREQUISITE**. If omitted or "N/A", halt and query client via Communication History.
  4. Representative's cell number and email address.
  5. SARS eFiling credentials (or confirmation to create/link profile).
* **Fulfillment Email Dispatch**: Once complete, email dossier to `sinto4plus@gmail.com` (From: `info@myacc.co.za`, CC: `info@myacc.co.za`, `kev@thinkestry.co.za`) with subject `Tax Representative Appointment — Order #<ID> (<Entity Name>)` and submitted files attached.

### Playbook G: Practice Document Styling, Letterhead & Typography Standards
Every statutory PDF generated must strictly adhere to the unified **Executive Navy & Gold Trim** standard:
1. **Page 1 Letterhead**:
   - Left: `My Accountant (Pty) Ltd` (16.5pt bold Deep Navy `#0f2137`) | `Registration: 2020 / 548105 / 07 • Practice No: PR-0098553` (Warm Gold `#c5a059` accent).
   - Right: `Ground Floor, Waterstone Building, Stonemill Office Park` | `300 Acacia Road, Darrenwood, Johannesburg, 2195` | `Tel: +27 10 109 1625 • Email: info@myacc.co.za • Web: www.myacc.co.za`.
   - Divider Bar: Distinctive horizontal trim bar (Navy 70% / Warm Gold 30%).
2. **Subsequent Pages (2+)**: Never repeat client details in top running headers. Use only a clean `• Page X of Y` indicator at the top right with a subtle gold bullet and slate border.
3. **Palette**: Deep Navy (`#0f2137`), Warm Gold (`#c5a059`), Charcoal (`#1e293b`), Slate (`#e2e8f0` / `#cbd5e1`).
4. **Mandatory Retainer Clause**: For accounting retainers where VAT is included but client is not yet VAT-registered, include: *"Please note that our monthly retainer fee will be reviewed and adjusted accordingly once the company is formally registered for VAT."*
5. **Practice Signature Stamp Format**:
   - Always embed the 4-channel transparent PNG (`public/templates/Signature_Kevin_New.png`) using `pdf.embedPng`.
   - Never embed opaque 3-channel RGB signature files that leave white paper background blocks over tinted cards or colored backgrounds.

---

## 🏛️ Autonomous Regulator Follow-Up Engine (SLA Cadence)

For statutory orders in **`Waiting on External`** (NCR Credit Provider Applications, CIPC company registrations, COIDA Letter of Good Standing, SARS VAT registrations):

1. **Automated Follow-Up Cadence**:
   - **Day 30**: Initial progress inquiry citing statutory lodgement date, reference number, and attached proof of payment.
   - **Day 60**: Formal escalation inquiry requesting allocation details and officer review.
   - **Day 75**: Executive urgent intervention request to senior desk administrators.
2. **Dispatch Protocols**:
   - **From**: `info@myacc.co.za` (via `mail.myacc.co.za:465`).
   - **CC Policy**: ALWAYS CC the client's email and `info@myacc.co.za`.
   - **Audit Trail**: Append a record note with full email text and Message ID to the Order's Communication History (`order.notes` in Firestore).

### NCR Official Contact & Routing Directory:
- 🎯 **Intake & Allocations**: `registrations@ncr.org.za`
- 👤 **Desiree Ndaba** (Senior Data Administrator - Certificates & Allocations): `dndaba@ncr.org.za` *(Tel: 011 554 2614)*
- 👤 **Evelyn Moleko** (Branch Additions & Allocations): `emoleko@ncr.org.za`
- 👤 **Tumelo Xhati** (Annual Renewal Fees & Lapsing): `txhati@ncr.org.za` *(Tel: 011 554 2806)*
- 👤 **Elelwani Tshikundamalema** (Compliance Officer): `etshikundamalema@ncr.org.za` *(Tel: 011 554 2853)*
- 👤 **Motshaki Goba**: `mgoba@ncr.org.za` *(Tel: 011 554 2855)*
- 💳 **Fees Department**: `fees@ncr.org.za`
- ❌ **PERMANENTLY BLACKLISTED (Access Denied / Bounced)**: `applications@ncr.org.za` — **NEVER USE**.

---

## 💾 Storage Upload Path & Firestore Note Schema

* **Storage Path**: `orders/{orderId}/notes/{timestamp}_{filename}.pdf`.
* **UUID Download Token Invariant**:
  - Always attach a unique UUID download token in metadata (`firebaseStorageDownloadTokens: crypto.randomUUID()`) AND call `file.makePublic()`.
  - Format the attachment URL with the token:
    `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`
  - Perform an HTTP GET pre-flight check to verify `res.status === 200` before committing to Firestore.
* **Firestore Data Structure**:
  Append directly to `order.notes` using `FieldValue.arrayUnion()`:
  ```javascript
  const note = {
    id: `note_${Date.now()}`,
    text: "Please review the draft statutory documents attached below for your signature.",
    authorId: "LRM285EOq3gwNMKayY6vtzooaC03",
    authorName: "Kevin Freese (Director)",
    date: new Date(),
    type: "note",
    subject: "Statutory Documents for Signature",
    isInternal: false,
    attachments: [
      { name: "Document.pdf", url: "https://firebasestorage.googleapis.com/..." }
    ]
  };
  ```

---

## 🛠️ CLI Execution Commands

### 1. Inspect Order Details & Uploads
```bash
npx tsx .agents/skills/order-fulfillment-agent/scripts/audit_order.ts fetch --order-id <ID>
```

### 2. Autonomous Audit & Statutory Pack Compilation (Dry-Run Preview)
```bash
npx tsx .agents/skills/order-fulfillment-agent/scripts/audit_order.ts audit --order-id <ID> --dry-run
# Or using pipeline script directly:
npx tsx src/lib/agent/order-audit-pipeline.ts --order-id <ID> --dry-run
```

### 3. Explicit Executive Sign-Off & Deliverables Commitment (After Kevin's Review)
```bash
npx tsx .agents/skills/order-fulfillment-agent/scripts/audit_order.ts approve --order-id <ID>
# Or via pipeline runner:
npx tsx src/lib/agent/order-audit-pipeline.ts --order-id <ID> --approve-and-post
```
