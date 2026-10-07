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
6. **Strict PDF-Only Output Invariant**:
   - **NEVER** generate or deliver Microsoft Word (`.docx`) documents for client-facing statutory instruments, engagement letters, or executive proposals.
   - All client deliverables must be compiled directly into high-resolution, vector-rendered PDFs (`pdf-lib` / ReportLab) with embedded vector letterhead and transparent digital signature stamps.
7. **Official Practice Banking Details**:
   - When drafting fee annexures, retainer schedules, or payment request cards:
     - **Bank**: First National Bank (FNB)
     - **Account Name**: My Accountant (Pty) Ltd
     - **Account Number**: `63084378223`
     - **Universal Branch Code**: `250655`
     - **Account Type**: Business Current Account
   - NEVER use placeholder or unverified bank account numbers.
8. **Card Boundary & Two-Column Grid Budgeting**:
   - For entity detail cards (`DATE`, `CLIENT ENTITY`, `PHYSICAL ADDRESS`, `STATUS`):
     - Column 1 (Left): Labels at `x = MARGIN + 12`, Values at `x = MARGIN + 88`.
     - Column 2 (Right): Labels at `x = MARGIN + 260`, Values at `x = MARGIN + 346`.
     - Right border clearance: Values in Column 2 must have at least 30–40 pt of padding before the card border (`MARGIN + CONTENT_W`). Never allow addresses or entity statuses to extend past the right card border.
9. **Dynamic Container Box Heights & Paragraph Coherence**:
   - **Dynamic Box Sizing**: Never hardcode static heights (`cardH`) for bordered highlight cards containing multi-paragraph text (e.g. Fee Structure boxes). Always compute height dynamically:
     `boxHeight = (totalWrappedLines * lineHeight) + padding`.
   - **Widow/Orphan & Page Budgeting**:
     - Keep headings together with their subsequent text blocks; never isolate a heading or single clause at the bottom of a page.
     - Avoid artificial page inflation: If an engagement letter can fit comfortably on 2 pages, budget it cleanly with standard 8.0pt–8.5pt body text, 11.0pt–11.5pt line height, and 4pt–8pt inter-clause spacing. Avoid leaving 250–300 pt blank voids across 3 pages.
10. **Narrative Text over Decorative Callout Boxes**:
    - **Core Terms as Continuous Text**: Never place core settlement offers, statutory motivations, or narrative legal clauses inside tinted or bordered callout cards/boxes.
    - **Paragraph Coherence**: Present core offers and narrative terms as clean, authoritative body text (`8.0pt`–`8.5pt` font, `11.2pt`–`11.5pt` leading), keeping related paragraphs tightly grouped (`4pt`–`5pt` inter-paragraph spacing) without artificial container fragmentation.
    - **Restricted Card Usage**: Reserve bordered cards strictly for structured metadata summaries (e.g. entity/matter detail cards) or the executive signature block.
11. **Heading Typography & Vertical Hierarchy Spacing**:
    - **Adequate Breathing Space Below Headings**: Never use tight baseline drops (e.g. `11pt` drop for `9pt` bold heading, which leaves under 2pt of visual clearance). Always allocate a `15pt`–`16pt` drop below paragraph headings to give clear breathing space above the first body line.
    - **Vertical Rhythm Invariants**:
      - Inter-section spacing (above heading): `10pt`–`14pt`.
      - Space below heading: `15pt`–`16pt`.
      - Between paragraphs within the same section: `4pt`–`5pt`.
12. **Natural Continuous Page Flow (No Premature Breaks)**:
    - **Never Prematurely Break Related Sections**: Never insert an arbitrary page break between logically paired sections (e.g., splitting a settlement offer from its structured payment schedule) when substantial vertical budget remains on the page (`y > 100pt`).
    - **Avoid Dead Space Voids**: Eliminate awkward blank voids (e.g., 200–350 pt) at the bottom of pages. Flow sections continuously down the page so that each page carries balanced, substantive content before advancing to subsequent pages.
13. **Windows File Lock Resilience (`EBUSY`)**:
    - When generating or compiling PDFs to local directories (`Documents`, `Downloads`), account for active Windows PDF viewers (e.g., Adobe Acrobat) that place an exclusive lock on the target file.
    - Scripts should perform a writability check (`fs.openSync(path, 'r+')`) or gracefully close blocking reader instances via taskkill (`taskkill /IM Acrobat.exe`) before committing writes.

### Playbook H: SARS Section 200 Tax Debt Compromise Engagements
* **Statutory Mandate**: Sections 200 to 205 of the Tax Administration Act, 28 of 2011 (TAA).
* **Authority**: Issued under Kevin Freese (Director, CBAP SA #3561, SARS PR-0098553).
* **Standard Commercial Fee Structure**:
  - **Upfront Professional Engagement Fee**: R20,000.00 (Excl. VAT) non-refundable retainer payable prior to work commencement. Covers forensic debt review, financial modeling, compromise motivation drafting, and formal SARS lodgement.
  - **Success Fee**: 5% (or 10% where agreed) of total debt successfully saved/written off, calculated as the difference between the pre-compromise SARS liability and the final settlement amount.
  - **Due Date**: Due immediately upon SARS written acceptance, compromise agreement execution, or eFiling debt write-off, payable within 7 days.
* **Standard Timelines**:
  - **Pack Lodgement**: Practice will compile and lodge the complete Section 200 pack within **5 working days provided all information is received**.
  - **SARS Review Window**: SARS statutory review timeframes typically range from **30 to 90 business days**.
* **Mandatory Statutory Clauses**:
  - **Discretionary Outcome Disclaimer**: Confirmation that SARS retains absolute discretion and approval cannot be guaranteed.

### Playbook I: CIPC Statutory Filings, Submission Routing & Supporting Documents Matrix
*Derived from official CIPC Contact Details, Forms & Supporting Documents Guide (V2.0)*.

#### 1. Mandatory Identity & KYC Invariant (All CIPC Filings)
* **South African Citizens**: **MUST** submit a certified green bar-coded RSA ID book or RSA Smart ID Card (**both sides of Smart ID must be certified within 3 months**). Passports are **NOT** accepted for South African citizens.
* **Foreign Nationals**: **ONLY** foreign nationals may submit certified passport copies. Must be accompanied by certified valid permits (visa, refugee, or asylum seeker permit) where applicable.
* **Juristic Incorporators / Trusts**: If an incorporator is a trust or company, attach the authorizing resolution, letters of authority, and certified ID copy of the duly authorized representative.

#### 2. CIPC Statutory Form & Mailbox Routing Playbooks

| CIPC Service | Main Forms | Secondary / Annexures | Mandatory Supporting Documents | Designated Filing Mailbox | Statutory Fee | Turnaround / SLA |
|---|---|---|---|---|---|---|
| **Private Company (Short Form)** | Standard Online Form | N/A | Signed generated documents, certified IDs of applicant, incorporators & directors, POA | `eservicescoreg@cipc.co.za` *(or web portal upload)* | R175 (R125 if name reserved electronically; R100 manual) | 3–5 Business Days |
| **Profit Company (Long Form / Personal Liability Inc / Public)** | **CoR 14.1** & **CoR 15.1B** | CoR 14.1 App A (Initial Directors), App B (Name), App C (Ring-fencing), App D (Auditor / Secretary), CoR 9.4 | Certified IDs of applicant, incorporators, directors; Power of Attorney / Mandate | `companydocs@cipc.co.za` | R475 (R425 electronic name; R400 manual name) | 5–10 Business Days |
| **Non-Profit Company (NPC Long Form)** | **CoR 14.1** & **CoR 15.1D** *(without members)* or **CoR 15.1E** *(with members)* | CoR 14.1 App A, B, C, D; CoR 9.4 | Certified IDs of applicant, incorporators, directors; Power of Attorney | `companydocs@cipc.co.za` | R475 (R425 electronic name; R400 manual) | 5–10 Business Days |
| **Director Changes (CoR 39 - Electronic)** | **CoR 39** (Electronic) | Supporting proof of change | Certified IDs of applicant, resigning, appointed, and active directors; proof of change (resignation letter, appointment acceptance/minutes, death cert, court order); director/shareholder resolution; mandate | `eservicescoreg@cipc.co.za` *(or CIPC portal upload)* | **R0.00** (Free) | **5 Business Days** |
| **Director Changes (CoR 39 - Manual)** | **CoR 39** (Typed / By hand) | Supporting proof of change | Same as electronic above | `manualcor39@cipc.co.za` | **R0.00** (Free) | **30 Business Days** *(Always prefer electronic!)* |
| **Close Corporation Amendments (CK2)** | **CK2** | Control Sheet | Certified IDs of all members and resigning members; notice of meeting + signed minutes/resolution of all members where membership changes; executor letter + certified ID if deceased member | Scanned certified copy to CIPC | R30 (Name, principal business, or FYE only; membership change is R0) | 5–10 Business Days |
| **Close Corporation Accounting Officer & Address (CK2A)** | **CK2A** | Control Sheet | **Change in Accounting Officer**: Appointment letter of new accountant + letter of consent from accounting officer; certified IDs of applicant and all members | Scanned certified copy to CIPC | **R0.00** (Free) | 5–10 Business Days |
| **Company & CC Re-instatement (CoR 40.5)** | **CoR 40.5** | N/A | **Compulsory 6-Part Dossier**: (1) Certified ID of applicant; (2) Certified ID of customer code owner; (3) Multiple Deed search across all 10 regional deeds offices; (4) Department of Public Works letter (if deeds search reflects immovable property); (5) Documentary proof entity was trading or had assets/liabilities at deregistration (bank statements, lease, contracts); (6) Mandate from applicant | `re-instatements@cipc.co.za` | **R200.00** | 15–30 Business Days |
| **Company & CC Deregistration** | Formal Letterhead | N/A | Original letterhead signed by all active directors/members confirming: (i) not carrying on business / dormant, (ii) no assets or inadequate assets with no probability of liquidation; tax number; SARS Tax Clearance / confirmation of no tax liability; certified IDs | `deregistrations@cipc.co.za` | **R0.00** (Free) | 10–20 Business Days |
| **Voluntary Liquidation (Solvent Entity)** | **CoR 40.1** | Form JM12 | Master's Form JM12 security bond or consent to dispense with security; certified written special resolution + minutes + notice/agenda; certified IDs of signatory & customer code owner; POA | `liquidations@cipc.co.za` | **R250.00** | 10–15 Business Days |
| **Voluntary Liquidation (Insolvent Entity)** | **CM 26** & **CM 25A** | **CM 100** (22 Pages) | Master's Form JM12 security bond or consent to dispense; certified written special resolution + minutes; **CM 100 Statement of Affairs duly deposed**; certified IDs; POA | `liquidations@cipc.co.za` | **R80.00** *(+R150 penalty if lodged >1 month after meeting)* | 10–15 Business Days |
| **MOI Amendments (CoR 15.2)** | **CoR 15.2** | CoR 15.1B-E (if aligning) / App A (ring-fencing) | Certified copy of written special resolution or minutes; certified ID of signatory (active director/secretary); POA; certified ID of applicant | `moiamendments@cipc.co.za` | **R250.00** | 10–15 Business Days |
| **Share Conversions (Par to No Par Value)** | **CoR 15.2** & **CoR 31** | Board Report | Board report in terms of Regulation 31(7); board resolution/minutes; certified IDs; POA | `moiamendments@cipc.co.za` | **R250.00** | 10–15 Business Days |
| **Business Rescue (Commencement)** | **CoR 123.1** | CoR 123.2 | Duly completed CoR 123.1; sworn statement with detailed reasons; Public Interest (PI) score breakdown; primary business activities; company resolution; practitioner nomination letter; practitioner signed acceptance letter; certified ID of customer code owner | `businessrescue@cipc.co.za` | **R0.00** (Free) | 3–5 Business Days |
| **Conversion: CC to Company** | **CoR 18.1** | CoR 15.1A/B, CoR 39, CoR 21.1, CoR 25, CoR 44, CoR 9.4 | Written resolution / consent; statement letter that CC is not in liquidation or business rescue; certified IDs of directors & applicant; POA | `companydocs@cipc.co.za` | R175 or R475 (plus R100 if FYE change, R50/R75 name) | 10–15 Business Days |
| **External Company Registration** | **CoR 20.1** | CoR 20.1 App A, CoR 21.1 | Certified MOI/incorporation certificate from foreign jurisdiction; foreign registration cert; certified translations (if non-official language); certified IDs; POA | `companydocs@cipc.co.za` | **R400.00** | 10–15 Business Days |
| **Change to Secretary / Auditor** | **CoR 44** | N/A | Certified ID of applicant; certified IDs of audit committee members (if applicable); appointment letter reflecting registered & postal addresses | `Cor44@cipc.co.za` | **R0.00** (Free) | 5–10 Business Days |
| **Location of Company Records** | **CoR 22** | N/A | Certified ID of applicant | `companychanges@cipc.co.za` | **R0.00** (Free) | 5 Business Days |
| **Annual Financial Statements (AFS)** | XBRL / PDF | CoR 30.2 FAS | Audited or independently reviewed Annual Financial Statements | `financialstatements@cipc.co.za` *(or CIPC portal)* | **R0.00** (Free) | Immediate / Batch |

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

### CIPC Official Contact & Routing Directory:
- 🏢 **Profit & Non-Profit Company Long Form, Foreign & Conversions**: `companydocs@cipc.co.za`
- ⚡ **Electronic Company Registrations & Electronic Director Changes (5-day turnaround)**: `eservicescoreg@cipc.co.za`
- 📝 **Manual Director Amendments (30-day turnaround)**: `manualcor39@cipc.co.za`
- 🔄 **Re-instatements (CoR 40.5)**: `re-instatements@cipc.co.za`
- ❌ **Deregistrations**: `deregistrations@cipc.co.za`
- ⚖️ **Liquidations & Winding Up (CoR 40.1 / CM26 / CM100)**: `liquidations@cipc.co.za`
- 📜 **MOI Amendments & Special Resolutions (CoR 15.2 - 15.5, CoR 31)**: `moiamendments@cipc.co.za`
- 🚨 **Business Rescue (CoR 123.1 - 126.1)**: `businessrescue@cipc.co.za`
- 🏷️ **Name Reservations & Transfers (CoR 9.1 - 11.1)**: `namereservationsandregistrations@cipc.co.za`
- 👨‍💼 **Auditor & Company Secretary Appointments (CoR 44)**: `Cor44@cipc.co.za`
- 📍 **Location of Company Records (CoR 22)**: `companychanges@cipc.co.za`
- 🏢 **Person Authorised to Accept Service (CoR 21.2)**: `Cor21.2@cipc.co.za`
- 🤝 **Amalgamations & Mergers (CoR 89)**: `CoR89@cipc.co.za`
- ⚖️ **Court Orders & Corporate Legal**: `corporatelegalservices@cipc.co.za`
- 📊 **Annual Financial Statements (AFS)**: `financialstatements@cipc.co.za`
- ⚠️ **Reportable Irregularities**: `independentreview@cipc.co.za`
- 🚜 **Co-operatives**: `cooperativesonline@cipc.co.za`

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
