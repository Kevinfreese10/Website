---
name: quote-generator
description: Generates and autonomously sends standardized, beautifully formatted formal quotations, executive proposals, and consultation responses (Premium Minimalist Outlook-compatible HTML) from info@myacc.co.za or kev@thinkesty.co.za for once-off registrations, VAT/tax advisory, and monthly accounting/payroll retainers.
---

# My Accountant Master Email & Quotation Framework (v2.0 Enterprise)

This skill governs all client-facing quotation emails, strategic proposals, consultation responses, and service onboarding communications.

## 🎯 Core Design Philosophy
**PREMIUM + PROFESSIONAL + MINIMAL + HIGHLY READABLE**

A client or executive must be able to scan any email in **approximately 30 seconds** and immediately understand:
1. **Why we are contacting them**
2. **What we recommend**
3. **What we will do**
4. **What it will cost**
5. **What they need to do next**

---

## 🛡️ Autonomy, Routing & Safety Protocol Matrix

| Origin / Inquiry Type | Criteria | Action Protocol & Guardrail |
|---|---|---|
| **Forwarded by Kevin (`kev@thinkesty.co.za`)** | Any inquiry, contact form, or instruction forwarded by Kevin | **Strict Human-in-the-Loop Guardrail:** NEVER auto-send directly to the end-client. Always draft the 30-Second Executive HTML response and reply directly to Kevin's email thread (`kev@thinkesty.co.za`) for one-click review, or present in chat. Only dispatch to the end-client when explicitly commanded (e.g., *"send to client"*). |
| **Standard Fixed Catalog Service** | Matches 100% of fixed one-off catalog services (Company Reg, NCCA, VAT, Tax Clearance, CIDB, Licences, ITR14) | **Standard Catalog Protocol:** Draft the 30-Second Executive HTML proposal. Query exact live pricing via `lookup_price.ts`. Include all statutory prerequisites and turnaround notices. |
| **Accounting / Bookkeeping Retainer** | Monthly retainers, monthly bookkeeping, management accounts, or payroll packages | **Strict Review Protocol (Requires Kevin's Scoping):** NEVER send unvetted retainer pricing. Send an executive consultation acknowledgment to the client, issue the **Retainer Scoping Questionnaire**, and route the scoping dossier to `kev@thinkesty.co.za`. |
| **SARS Tax Debt Compromise / Relief** | Tax debt compromise, debt relief, or Section 200 settlement | **Assessment Protocol:** Prompt client for approximate debt value and eFiling access. Standard terms: **R20,000 upfront retainer** + **5% success fee**; lodgement within **5 working days**; SARS review **30–90 business days**. Banking: FNB Acc **63084378223** (Ref: Entity Name). Alert `kev@thinkesty.co.za`. |
| **Custom / Complex Corporate Scope** | Multi-entity restructures, foreign corporate holdings, Section 200, or unlisted scopes | **Review Protocol:** Auto-draft the proposal into IMAP Drafts / scratch and email the preview to `kev@thinkesty.co.za` for approval before dispatch. |
| **Spam, Cold Sales, & Solicitations** | SEO agencies, web designers, crypto pitches, offshore directories, link schemes | **Spam Suppression Guardrail:** Auto-flag as spam and mark processed immediately. Never send quotes, replies, or inquiries to unsolicited sales bots. |
| **Out-of-Scope Requests** | Criminal law, civil litigation, debt collection (non-tax), loans/unregistered lending | **Polite Decline Guardrail:** Issue a polite professional decline stating that My Accountant focuses exclusively on accounting, tax, corporate secretarial, and regulatory compliance. |

> [!CRITICAL]
> **Email Dispatch CC Invariant**: NEVER CC `info@myacc.co.za` on any outgoing emails. Adding `info@myacc.co.za` to CC generates loopback emails in the inbox and risks circular triggering of the inbox agent.

---

## 🛑 Mandatory Pre-Quotation Catalog Query Invariant

**NEVER estimate, guess, or invent service prices from memory.**
All live services and prices are stored in Firestore strictly under the **`services`** collection (NOT `products`).

Before drafting ANY quote, proposal, fee schedule, or email mentioning prices:
1. The agent **MUST EXECUTE** the live price lookup tool:
   ```bash
   npx tsx .agents/skills/quote-generator/scripts/lookup_price.ts <keyword> [--json]
   ```
   *(Examples: `lookup_price.ts cleaning`, `lookup_price.ts "letter of good standing"`, `lookup_price.ts vat`)*
2. The lookup engine supports an extensive **Synonym & Alias Dictionary** (e.g. `cleaning` $\rightarrow$ NCCA & NBC Provident Fund, `good standing` $\rightarrow$ COIDA Renewal, `tcs` $\rightarrow$ Tax Clearance Pin).
3. The agent **MUST QUOTE** the exact numeric `price` returned by Firestore.
4. The agent **MUST REFERENCE** the verified title and official URL (`https://www.myacc.co.za/products/<slug>`).
5. If an inquiry involves a custom scope not found in the database, the agent **MUST NOT** invent pricing; route the inquiry to `kev@thinkesty.co.za` for Kevin's direct evaluation.

---

## 🏦 Banking Details & Anti-Phishing Security Invariant

To safeguard clients and maintain professional integrity, all quotations featuring banking details or payment instructions must adhere strictly to official practice details:

- **Entity Name:** My Accountant (Pty) Ltd
- **Bank:** First National Bank (FNB)
- **Account Number:** `63084378223`
- **Branch Code:** `250655`
- **Standard Reference:** Client Entity Name / Invoice Number

> [!IMPORTANT]
> **Mandatory Anti-Fraud Disclaimer**:
> *"My Accountant will never notify you of changes to banking details via standalone email or telephone. Always verify payment instructions against our official domain www.myacc.co.za before transferring funds."*

---

## ⚖️ Statutory Invariants & Regulatory Prerequisites

### 1. SARS Voluntary VAT Registration (Effective 1 April 2026)
- **Compulsory Threshold:** **R 2,300,000.00** *(Taxable turnover within any 12-month period)*.
- **Voluntary Threshold:** **R 120,000.00** *(Minimum historical turnover required to register)*.
- **Quotation Invariant:** When quoting VAT Registration (**R 1,800.00**), the agent **MUST** inform the client that SARS requires verifiable evidence of having exceeded R120,000 in past 12-month turnover OR at least 1 month bank statement reflecting commercial trading receipts of at least R10,000. Applications without financial proof will be rejected by SARS.

### 2. Active Business Bank Account Requirement
- Many regulatory registrations (**VAT**, **NCCA**, **NCR**, **Customs Import/Export**, and **CIDB**) require an active business cheque account in the company's legal registered name (accompanied by a bank confirmation letter stamped within 3 months).
- Always list this in **"What We Need From You"** to prevent onboarding roadblocks.

### 3. SARS Tax Representative Disclosure
- When quoting **SARS Tax Representative Appointment** (**R 950.00**), disclose that this appointment is required solely for administrative and technical access to the company's SARS eFiling profile. It **does not** transfer personal tax debt liability to the representative.

### 4. Realistic Non-Cumulative Turnaround Times
- Never add up individual turnaround times linearly for independent regulatory authorities. State individual review times clearly:
  - CIPC Name & Registration: **1–3 working days**
  - SARS Tax Clearance PIN: **1–2 working days**
  - NCCA Membership Review: **21–45 working days**
  - SARS VAT Registration: **21–30 working days**
  - COIDA Letter of Good Standing: **1–2 working days** (if assessments up to date)

---

## 📋 Retainer Scoping Questionnaire (Accounting & Bookkeeping)

When a client inquires about monthly accounting, bookkeeping, or payroll retainers, issue the following 5-point scoping checklist:

1. **Monthly Transaction Volume:** Average number of bank transactions per month across all company accounts.
2. **Payroll Staff Count:** Number of active directors and employees paid monthly.
3. **VAT Registration Status:** Is the business currently registered for VAT? (Invoice or payment basis?)
4. **Current Accounting Platform:** Are you using Xero, Sage, QuickBooks, or raw bank statements/Excel?
5. **Historical Catch-up:** Is the current financial year up to date, or are prior unfiled periods required?

---

## 📐 Layout & Typography Guidelines

### Email Container & Spacing
- **Container Width**: Centered 660px – 700px width (`max-width: 660px; margin: 0 auto;`).
- **Background**: Clean white content card (`#ffffff`) on a subtle light slate backdrop (`#f8fafc`).
- **Generous Padding**:
  - `32px – 36px` container padding.
  - `20px – 28px` between major section blocks.
  - `8px – 12px` between related items.
- **Borders & Shadows**: Subtle 1px border (`#e2e8f0`) with rounded corners (`8px – 10px`).

### Typography & Colors
- **Font Stack**: Modern, clean system sans-serif: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- **Body Text**: `15px – 16px`, `line-height: 1.6`, regular weight, dark slate (`#1e293b` or `#334155`).
- **Headings**: `15px – 18px`, bold (`font-weight: 700`), dark navy / near-black (`#0f172a`).
- **Primary Brand Accent**: `#1D70E8` (My Accountant Blue).
- **Recommendation Card**: `#f0fdf4` backdrop with `border-left: 4px solid #16a34a`.
- **Selective Bolding**: Bold ONLY key recommendations, critical amounts, deadlines, and service names. **Never bold full sentences.**
- **Paragraph Length**: Strictly **2 – 3 sentences maximum** per paragraph.

---

## 🏗️ Master Email HTML Architecture

```html
1. HEADER
   MY ACCOUNTANT
   Corporate Formation • Accounting • Regulatory Compliance

2. GREETING & CONTEXT (Max 2–3 sentences)
   Hi [Client Name],
   [Context + brief acknowledgment of their current position].

3. SECTION 1 — OUR RECOMMENDATION (Card: #f0fdf4 / border-left: 4px solid #16a34a)
   • Recommendation 1: Core deliverable and statutory purpose.
   • Recommendation 2: Complementary compliance / health audit check.

4. SECTION 2 — WHAT WE WILL DO (Numbered Minimal Steps)
   01 — Step Name: One-sentence deliverable summary.
   02 — Step Name: One-sentence deliverable summary.
   03 — Step Name: One-sentence deliverable summary.

5. SECTION 3 — FEE SCHEDULE (Clean Table)
   Service Description | Category | Fee (ZAR)
   [Prominent summary card: Total Once-Off Investment / Monthly Thereafter]

6. SECTION 4 — WHAT WE NEED FROM YOU (3–5 concise bullets)
   • CIPC Registration / Disclosure Certificate
   • Certified ID of Director(s)
   • SARS Tax Clearance PIN / Banking Details

7. SECTION 5 — NEXT STEP & CTA (Visually prominent button)
   Ready to proceed? Reply "PROCEED" to this email.
   [ REPLY TO PROCEED ]

8. IMPORTANT NOTES (Small secondary text: 12px, #64748b)
   [Statutory turnaround, turnover thresholds, and banking anti-fraud notice]

9. EXECUTIVE SIGNATURE
   Kevin Freese | Director | CBAP (SA) #3561
   My Accountant (Pty) Ltd • Practice No: PR-0098553
   Landline: +27 10 109 1625 | Web: www.myacc.co.za
```

---

## 💰 Official Core Live Service Rates (Reference Matrix)

All rates verified against live Firestore `services` collection:

### Entity Registrations & Bundles
- **Private Company Registration (Pty Ltd):** **R 950.00** &bull; `/products/private-company-registration`
- **Tender Ready Company Package:** **R 1,600.00** &bull; `/products/tender-ready-company-registration-package`
- **Non-Profit Company Registration (NPC):** **R 950.00** &bull; `/products/non-profit-company-registration`
- **NPO Registration (Department of Social Development):** **R 1,200.00** &bull; `/products/npo-registration`
- **PBO Registration (SARS Tax Exemption Unit):** **R 1,800.00** &bull; `/products/pbo-registration`
- **External Company Registration (Foreign Subsidiary):** **R 3,450.00** &bull; `/products/external-company-registration`
- **Registered Office Address (12-Month Retainer):** **R 3,600.00** &bull; `/products/registered-office-address-12-month-retainer`

### SARS Tax Compliance & Profile Access
- **SARS Tax Representative Appointment:** **R 950.00** &bull; `/products/tax-representative-appointment`
- **SARS Tax Clearance PIN (TCS):** **R 350.00** &bull; `/products/tax-clearance-pin`
- **SARS VAT Registration:** **R 1,800.00** &bull; `/products/vat-registration`
- **Company Income Tax Return (ITR14 - Trading):** **R 650.00** &bull; `/products/company-income-tax-return-itr14`
- **Individual Income Tax Return (ITR12 - Simple):** **R 750.00** &bull; `/products/individual-income-tax-return-itr12-simple`
- **Individual Income Tax Return (ITR12 - Complex):** **R 1,150.00** &bull; `/products/individual-income-tax-return-itr12-complex`
- **Sole Proprietor / Trading ITR12:** **R 2,950.00** &bull; `/products/sole-proprietorship-itr12`
- **Provisional Tax Return (IRP6):** **R 550.00** &bull; `/products/provisional-tax-return-irp6-trading`
- **Remission of SARS Interest & Penalties:** **R 1,200.00** &bull; `/products/remission-of-sars-interest-and-penalties`

### Annual Financial Statements (AFS)
- **Non-VAT Registered Company AFS:** **R 5,000.00** / year *(includes full bank statement processing, general ledger, and trial balance)*.
- **VAT-Registered Company AFS:** **R 7,500.00** / year *(includes full bank statement processing, bi-monthly VAT reconciliation, and trial balance)*.
- **AFS Draft & Sign-off Only:** **R 3,000.00** &bull; `/products/annual-financial-statements-draft-and-sign-off-only`

### Industry Regulators & Licences
- **NCCA Registration Services:** **R 1,900.00** &bull; `/products/ncca-registration-services`
- **NBC Provident Fund Company Registration:** **R 750.00** &bull; `/products/nbc-provident-fund-company-registration`
- **COIDA Registration:** **R 1,400.00** &bull; `/products/coida-registration`
- **COIDA Renewal / Letter of Good Standing:** **R 850.00** &bull; `/products/coida-renewal`
- **UIF Registration (Department of Labour):** **R 1,900.00** &bull; `/products/uif-registration`
- **NCR Credit Provider Registration:** **R 1,400.00** &bull; `/products/ncr-registration`
- **CIDB Grade 1 Registration:** **R 1,150.00** &bull; `/products/cidb-registration`
- **CIDB 3-Year Renewal:** **R 1,800.00** &bull; `/products/cidb-3-year-renewal`
- **Customs Import Licence:** **R 1,250.00** &bull; `/products/import-licence`
- **Customs Export Licence:** **R 1,250.00** &bull; `/products/export-licence`
- **NHBRC Registration:** **R 850.00** &bull; `/products/nhbrc-registration`
- **Property Practitioners (PPRA) Firm Registration:** **R 1,750.00** &bull; `/products/property-practitioners-ppra-firm-registration`
- **Liquor Licence Application Pack:** **R 1,650.00** &bull; `/products/liquor-licence-application-pack`

---

## 🛠️ Automated Operations Scripts

- **`lookup_price.ts`**:
  ```bash
  npx tsx .agents/skills/quote-generator/scripts/lookup_price.ts <keyword> [--json] [--category <cat>]
  ```
  *Features: Synonym dictionary, fuzzy token ranking, live Firestore lookup, structured JSON output.*
- **`check_inbox.ts`**:
  ```bash
  npx tsx .agents/skills/quote-generator/scripts/check_inbox.ts [--unread]
  ```
  *Features: IMAP polling (`ai@myacc.co.za`), spam suppression, forward parsing, lead extraction, state persistence (`quote_ai_state.json`).*
- **`send_quote_reply.ts`**:
  ```bash
  npx tsx .agents/skills/quote-generator/scripts/send_quote_reply.ts --to <email> --subject <subj> --htmlFile <path> [--inReplyTo <id>] [--uid <num>]
  ```
  *Features: SMTP dispatch (`mail.myacc.co.za:465`), sender authentication as `"Kevin Freese" <kev@thinkesty.co.za>`, thread reference retention, automated UID state update.*
