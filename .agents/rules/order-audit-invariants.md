---
description: Universal guardrails for order audits, approval gates, and client communication formatting
globs: ["*"]
---

# Order Audit Invariants & Approval Guardrails

### 1. Mandatory Skill Routing
- Whenever asked to audit an order (e.g. "audit order X", "check order #1234"), ALWAYS activate and follow the `order-audit-and-document-generator` skill (`.agents/skills/order-audit-and-document-generator/SKILL.md`).

### 2. Strict User Pre-Approval Gate & Review Pack Gating
- **NEVER** upload documents to Cloud Storage, post notes to Firestore (`order.notes`), or dispatch emails to clients until Kevin has reviewed and explicitly approved them.
- **Review Emails Strictly Gated on Draft Statutory Documents**:
  - The agent **ONLY** compiles and dispatches the Executive Audit Review Pack to `kev@thinkestry.co.za` (do NOT CC `info@myacc.co.za`) when newly drafted statutory deliverables (PDFs/letters/forms) were actually generated and require Kevin's review or signature (`documentsGenerated.length > 0`).
  - If NO statutory documents were generated (e.g., conversational client notes, status queries, Discovery Questionnaires, or requests for information), **completely suppress** the review pack email. Kevin monitors conversational updates directly on the portal dashboard.
  - For external fulfillment orders (e.g., Sinto for SARS Tax Rep appointments or CIPC lodgments) where no statutory PDFs require Kevin's signature, do **NOT** send an Executive Review Pack. CC Kevin directly on the fulfillment dossier dispatched to Sinto once prerequisites are verified.
- **Strict Portal Isolation & Approval**: Even though email notifications to Kevin are suppressed for non-document scenarios, the agent MUST STILL pause for Kevin's explicit approval (either in the active IDE chat or via the portal queue) before posting any communication note to `orders/{orderId}.notes` or advancing order status. Zero unsolicited client messages without prior sign-off.

### 3. Client Note Formatting & Storage Integrity Invariants
- **Concise & Direct**: Keep messages concise and readable in under 30 seconds. Avoid overwhelming the client with lengthy audit dumps or internal verification jargon.
- **No Markdown Bold Asterisks (`**`)**: Never format client communication notes with `**`. Keep the text clean and plain.
- **No Raw Firebase URLs**: **NEVER** show raw Firebase Storage URLs (`https://firebasestorage.googleapis.com/...`) in the note text. Note text must refer cleanly to the attached document (e.g., "Please review the draft document attached below").
- **No "Download Links:" Header**: Do not include `Download Links:` or `**Download Links:**` as a header. Attachments are automatically rendered as interactive download cards in the portal UI via the `attachments: [{ name, url }]` array.
- **Mandatory Storage Download Token & Public Access**: All Firebase Admin SDK uploads MUST include a cryptographically unique `firebaseStorageDownloadTokens: crypto.randomUUID()` in file metadata AND invoke `await file.makePublic()`.
- **Pre-flight HTTP 200 Verification**: Before committing an attachment URL to Firestore, the agent must perform an HTTP GET pre-flight check confirming `res.status === 200` to prevent client 403 Forbidden errors.

### 4. Accountant's Letter Discovery Questionnaire Invariant
- **Pre-Draft Discovery Mandatory**: For Accountant's Letters (income confirmation, self-employment, drawings, lease, mortgage, asset finance, visa), NEVER finalize or post a letter based solely on the raw initial uploads without first executing a targeted Discovery Questionnaire via Communication History to uncover the full scope of earnings and benefits.
- **Systematic Discovery Probes**: Proactively ask targeted questions regarding: (1) Exact recipient institution, department, and purpose; (2) Required calculation period (3, 6, or 12 months); (3) Personal living expenses paid directly by the company (vehicle, fuel, mobile, medical, rent/accommodation); (4) Secondary trading accounts, director loan repayments, or dividends; and (5) Specific wording or clauses required by the recipient.
- **Pre-Approval Gate (No Review Email)**: Present the drafted questionnaire to Kevin for review and explicit approval directly in the chat or portal queue before posting to `order.notes`. Do NOT email an Executive Review Pack for discovery questionnaires. Once approved and posted, transition status to `Waiting on Customer`.
- **Evidentiary Verification**: All figures stated by the client in discovery responses must be cross-verified against bank debits, contracts, or source invoices before inclusion in the final certified letter. Never certify unverified numbers.

### 5. Fraud Prevention & Forensic Conduit Invariant (Accountant's Letters)
- **Zero Unverified Claims**: Any claim or figure certified in an Accountant's Letter MUST be verified against documentary evidence (bank statements, executed contracts, official tax returns, or vendor invoices). Never certify unverified client assertions, as doing so exposes the practice to aiding and abetting financial or lease fraud.
- **Conduit & Zero-Balance Testing**: Inspect closing balances and outward dissipation patterns. If an account ends with near-zero balances and immediately transfers funds out to linked or third-party accounts, do NOT certify income retention. Require 6 months of bank statements for the receiving account to verify actual retention and expense settlement.
- **Outlier Spike & Revenue Continuity**: Never present an unadjusted arithmetic mean if a single non-recurring lump sum or contract advance skews the monthly figure. Separate base recurring earnings from extraordinary lump sums, and highlight revenue volatility where low months exist.
- **Living Expenses Verification**: If a statement reflects zero debits for basic subsistence (rent, utilities, transport, insurance), investigate where living expenses are paid from before attesting to credit or rental affordability.

### 6. Email Trigger & Audit Dispatch Invariant
- When an email with subject `New Note on Order #XXXX` is received by the inbox agent from the portal notification system:
  1. It triggers an autonomous audit of order `#XXXX` using `order-audit-and-document-generator`.
  2. The agent audits uploads, performs forensic reconciliations, and renders statutory draft PDFs locally.
  3. **Mandatory Gate (Draft Statutory Deliverables Only)**: The agent compiles and dispatches an executive review email to `kev@thinkestry.co.za` (do NOT CC `info@myacc.co.za`) **ONLY IF** draft statutory documents (PDFs/letters/forms) requiring Kevin's review or signature were generated and attached (`documentsGenerated.length > 0`). If 0 documents were generated (e.g. conversational notes, requests, or questions), the email to Kevin is completely suppressed.
  4. **Strict Isolation**: The agent MUST NOT post notes to `orders/{orderId}.notes` or update the order status until Kevin replies or confirms approval.


### 7. Client Files Directory Invariant (Accounting Clients)
- **Mandatory Folder**: ALWAYS mirror and save all generated statutory drafts, unsigned letters, signed letters, and review packs into:
  `C:\Users\kev\OneDrive\Desktop\Accounting Clients\Order #<ID>\`
- Create the subfolder `Order #<ID>` automatically if it does not already exist.
- Ensure both the `_UNSIGNED.pdf` and `_SIGNED.pdf` versions are present in this folder for Kevin's direct review.

### 8. Strict Order Completion Gate (Client Confirmation Invariant)
- **NEVER** change an order status to `Completed` until the client has explicitly confirmed satisfaction and acceptance of the final deliverables in a note.
- **Delivery State**: When final deliverables are uploaded or sent, the order remains in `Waiting on Customer` (or `Processing` / `Waiting on External` if awaiting regulator action).
- **Mandatory Dual Gate**: Only transition to `Completed` when:
  1. The client explicitly sends an affirmative confirmation (e.g. "looks great", "I confirm", "thank you, all good", "happy with this"), AND
  2. Kevin explicitly signs off on completing the order.
- Never prematurely advance status to `Completed` simply because a letter was signed or uploaded.

### 9. Client Note Debounce (30-Minute Quiet Window) & No Blind Document Regeneration
- **30-Minute Quiet Window (Debounce Queue)**: When an incoming client note or note notification is received, record the timestamp and buffer the order in the debounce queue. Do NOT immediately fire autonomous audit pipelines or review emails. Wait for a 30-minute quiet window of client inactivity so all consecutive notes and uploads in that session are evaluated together as a whole.
- **Zero Blind Document Regeneration**: When client notes arrive, NEVER blindly regenerate documents or execute generic mock templates (such as static HireRight or recruitment letters).
- **Deliverable Preservation**: If deliverables already exist in `generatedDrafts` or order notes, preserve them. Only redraft documents if the client explicitly requests an amendment or revision in their notes.
- **Dynamic Context Resolution**: If document redrafting is requested, dynamically derive the addressee, subject, and paragraphs from the actual order questionnaire, uploaded financials, and client instructions—never from static hardcoded templates.

### 10. Lead Email Notification Routing Invariant (Preliminary Pricing vs. General Consultation)
- **Automated Preliminary Pricing Sent -> Suppress Kevin Notification**:
  - For prospective client emails, website contact form submissions, or catalog inquiries: whenever an automated preliminary pricing response (with live fixed fee, service description, and online checkout link `myacc.co.za/products/...`) has been dispatched to the client, **DO NOT notify `kev@thinkestry.co.za`**.
  - Rationale: The transaction is already addressed autonomously with complete pricing and direct onboarding; notifying Kevin creates redundant inbox noise.
- **General Consultation Required -> Notify Kevin**:
  - Whenever an inquiry cannot be serviced automatically by a catalog match, involves ambiguous or custom tax/accounting advisory, or requires personalized scoping:
  - **DO notify `kev@thinkestry.co.za`** with subject `[NEW LEAD - GENERAL CONSULTATION REQUIRED] ${lead.name} — General Consultation`.
  - Provide full lead contact details, inquiry message, and confirmation that an executive consultation acknowledgment was dispatched to the client.

### 11. Accounting & Payroll Retainer Gating (Mandatory Pre-Approval)
- **NEVER** send automated emails, pricing proposals, or quotations regarding retainers for accounting or payroll directly to prospective or existing clients.
- Monthly accounting and payroll retainers require Kevin's direct review, scope evaluation, and personal input before any pricing or commitment is communicated.
- All incoming inquiries concerning retainers, monthly bookkeeping, or payroll must be routed to Kevin (`kev@thinkestry.co.za`) for manual review and scoping. The client should only receive an executive acknowledgment that their consultation request has been received.

### 12. Outgoing Email CC Invariant (Never CC info@myacc.co.za)
- **NEVER** CC `info@myacc.co.za` on any outgoing emails.
- Outgoing emails originate from `info@myacc.co.za`; adding `info@myacc.co.za` to CC generates loopback emails in the inbox and causes circular triggering of the inbox agent.
- When notifications or review packs are required, email `kev@thinkestry.co.za` directly.

### 13. SARS Tax Debt Compromise Assessment Intake Protocol
- When an email or lead inquires about SARS tax debt compromise, tax relief, or debt settlement services:
  1. The automated intake response must request:
     - The **approximate total value** of the outstanding SARS tax debt.
     - Their **SARS eFiling login credentials** (username and password) so our practice can perform a **free preliminary assessment** of their statement of account, debt composition, compliance standing, and compromise viability under the Tax Administration Act.
  2. Simultaneously alert Kevin (`kev@thinkestry.co.za`) that a tax debt compromise lead has been received for review.

### 14. Inbox Hygiene & Auto-Archiving Invariant (info@myacc.co.za)
- **Zero Inbox Clutter**: The `INBOX` folder for `info@myacc.co.za` must remain clean at all times.
- **Immediate Archive Upon Processing**: All incoming emails that have been responded to, triaged, acknowledged, escalated, or filtered (including marketing/spam and system receipts) must be automatically moved from `INBOX` to `INBOX.Archive` via IMAP.
- Under no circumstances should processed or resolved correspondence linger in the active `INBOX` view.

### 15. Tax Representative Appointment Invariant (Tax Rep Personal Tax Number & CoR 14.3 Rule)
- **Representative's Personal Tax Number is Mandatory**: For all "Tax Representative Appointment" orders, the **appointed representative's personal income tax number** is a strict, non-negotiable prerequisite. Under no circumstances may the agent dispatch the fulfillment dossier to Sinto (`sinto4plus@gmail.com`) or advance the order without the representative's personal income tax number.
- **No Reliance on Assumptions or Auto-Lookup**: Never assume SARS eFiling or Sinto will look up the representative's tax number solely from their South African ID number, and never treat this field as optional. If the client enters "Not applicable" or omits it, the agent must immediately flag it as a blocker and request it via Communication History.
- **Company Tax Number is on CoR 14.3**: The company's income tax reference number is already printed on the official CIPC CoR 14.3 (Enterprise Disclosure Certificate). Do **NOT** ask the client for the company's tax number if a CoR 14.3 has been uploaded. Always extract the company's tax number directly from the document.

### 16. Automated Regulator Autoreply & Ticket Receipt Invariant
- **Zero Forwarding of Automated Regulator Receipts**: NEVER forward or email automated autoreplies, ticketing acknowledgements, or submission receipts from government regulators (e.g. `CfCallCentre2019@LABOUR.gov.za`, `NoReply@Labour.gov.za`, or any regulator sender with subject containing `Autoreply`, `Automatic reply`, `Query Acknowledgement`, `Ticket Created`) to `kev@thinkestry.co.za`.
- **Silent Logging to Matched Orders**: If an active order is matched from the email content/subject, silently record the regulator receipt / ticket reference into `orders/{orderId}.notes` (`isInternal: true`) for audit history, but send ZERO emails to Kevin.
- **Immediate Archive**: Immediately archive the message to `INBOX.Archive` so the active `INBOX` remains completely clean.
- **Human Regulator Exception**: Substantive correspondence from human regulator officers (e.g. Sinto, NCR analysts, Compensation Fund examiners requesting specific amendments, or approval certificates) MUST continue to be escalated immediately.

### 17. Annual Financial Statements (AFS) Pricing & Bank Statement Inclusion Invariant
- **AFS Pricing Tiers**:
  - Non-VAT Registered Company AFS: **R 5,000.00** per financial year.
  - VAT-Registered Company AFS: **R 7,500.00** per financial year (includes bi-monthly VAT reconciliation against SARS VAT201 declarations).
- **Full In-House Processing Included**: The AFS fee **strictly includes** ingesting, processing, and reconstructing historical raw bank statements into double-entry general ledgers and trial balances. Never quote a separate bookkeeping catch-up fee or ledger reconstruction surcharge for AFS compilations unless specifically instructed by Kevin.
- **Turnaround Time**: Standard turnaround is **7 to 10 working days** from the date complete bank statements are received.

### 18. Tax Compliance Inquiry & SARS Tax Representative Protocol
- Whenever an email, inquiry, or lead asks about company tax compliance (ITR14), director tax returns (ITR12), or finding out what returns are outstanding:
  1. Inform the client that in order to view which returns are outstanding on SARS eFiling and lodge submissions, access to their SARS eFiling profile is required.
  2. Advise that accessing an unlinked or dormant profile may require a formal **Tax Representative Appointment**.
  3. State the fixed fee: **R 1,500.00** per company.
  4. State the turnaround time: **3 to 5 working days** for SARS verification and profile activation once documents are lodged.
  5. Provide statutory reassurance: Explain that this appointment is a formal requirement under the Tax Administration Act and does **not** affect their personal tax profile or personal liabilities in any way.
- **Tax Filing Rates**:
  - Company Income Tax Return (ITR14): **R 650.00** per return (compiled from signed AFS).
  - Individual Income Tax Return (ITR12 - Simple): **R 750.00** per return (Salary/remuneration, medical aid, retirement).
  - Individual Income Tax Return (ITR12 - Complex): **R 1,150.00** per return (Investments, capital gains, local rental income, travel allowance).
  - Sole Proprietorship / Independent Trading ITR12: **R 2,950.00** per return (Unincorporated trading turnover).

### 19. Mandatory Complimentary CIPC Health Assessment on Corporate Inquiries
- On all corporate, tax, or AFS inquiries, always offer a **Complimentary CIPC Enterprise Compliance Assessment**.
- The assessment includes:
  1. Annual Return submission standing and deregistration penalties/risks.
  2. Active director records and registered office details.
  3. Beneficial Ownership (BO) compliance status.

### 20. Exploratory Quotation Link Discipline
- In preliminary exploratory quotation emails, do **not** include website catalog purchase/checkout links unless explicitly requested by the client.
- Keep the proposal consultative, clean, and focused on requirements, pricing clarity, and next steps.

### 21. Canonical Practice Document Styling & Formatting Invariant (Executive Navy & Gold Trim)
- **Visual Design Standard**: All generated letters, agreements, resolutions, annexures, and reports must adhere strictly to the **Executive Navy & Gold Trim** practice aesthetic:
  - **Color Palette**: Deep Navy (`#0f2137`) for firm titles, section headings, and primary signature accents; Warm Gold (`#c5a059`) for header trim dividing bars, metadata card accent borders, subsection vertical pills, and heading underlines; Charcoal/Slate (`#1e293b`, `#475569`) for high-legibility body text; subtle borders (`#e2e8f0`, `#cbd5e1`).
  - **No Stock Photography**: Never insert placeholder or stock photographs in the header, margins, or letterhead.
- **Typography & Sizing**:
  - Primary font: Clean Universal Sans-Serif (system sans-serif / Helvetica: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
  - Title: 14pt – 16.5pt bold uppercase; Headings (H2): 11.5pt – 12pt bold with 1.5px warm gold bottom border; Body text: 10.5pt – 11.5pt with `1.45` line height.
- **Header Architecture**:
  - **Page 1 Top Header**: Must always feature the official My Accountant practice block:
    - *Left*: `My Accountant (Pty) Ltd` (16.5pt bold Deep Navy) | `Registration: 2020 / 548105 / 07 • Practice No: PR-0098553` (with gold accent).
    - *Right*: `Ground Floor, Waterstone Building, Stonemill Office Park` | `300 Acacia Road, Darrenwood, Johannesburg, 2195` | `Tel: +27 10 109 1625 • Email: info@myacc.co.za • Web: www.myacc.co.za`.
    - *Divider Trim*: Distinctive horizontal gradient or dual trim bar (Navy 70% / Warm Gold 30%).
  - **Subsequent Pages (Pages 2+)**: **Never repeat client entity names or registration numbers in the running header**. Display ONLY a clean running page number at the top right (e.g. `• Page 2 of 3`) with a subtle gold bullet and slate border.
- **Signatures & Footers**:
  - Dual side-by-side signature blocks for Practice Signatory (left) and Client Signatory (right) with Deep Navy lines.
  - Clean 1-line practice footnote at the bottom of the final page.

### 22. VAT Retainer Fee Review Invariant (Unregistered / Pending VAT Entities)
- When drafting an engagement letter, proposal, or retainer agreement that encompasses VAT calculation and VAT201 return submissions for an entity that is not yet VAT-registered (or pending registration):
  - The VAT service description MUST explicitly include the mandatory disclosure:
    *"VAT Declarations: Bi-monthly or monthly VAT calculations, output/input reconciliations, and submission of VAT201 returns via SARS eFiling (upon active VAT registration). Please note that our monthly retainer fee will be reviewed and adjusted accordingly once the company is formally registered for VAT."*
  - This ensures practice economics are preserved as ledger volume and audit exposure expand upon VAT vendor activation.

### 23. Blocked Spam & Bot Sender Invariant (marina.adams68@webmail.co.za)
- **Automatic Blocklist Filter**: Any emails received from or containing `marina.adams68@webmail.co.za` (including automated contact form submissions) must be immediately intercepted and filtered out.
- **Zero Actions & Zero Escalations**: The inbox agent must **NEVER** parse as a lead, **NEVER** auto-reply, and **NEVER** forward or notify Kevin (`kev@thinkestry.co.za`).
- **Immediate Archive / Trash**: Such messages must be routed directly to `INBOX.Trash` or `INBOX.Archive` to preserve complete inbox cleanliness.

