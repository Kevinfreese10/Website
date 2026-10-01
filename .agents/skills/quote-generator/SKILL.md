---
name: quote-generator
description: Generates and autonomously sends standardized, beautifully formatted formal quotations, executive proposals, and consultation responses (Premium Minimalist Outlook-compatible HTML) from info@myacc.co.za for once-off registrations, VAT/tax advisory, and monthly accounting/payroll retainers.
---

# My Accountant Master Email & Quotation Framework

This skill governs all client-facing quotation emails, strategic proposals, consultation responses, and service onboarding communications.

## 🎯 Core Design Philosophy
**PREMIUM + PROFESSIONAL + MINIMAL + HIGHLY READABLE**

A client must be able to scan any email in **approximately 30 seconds** and immediately understand:
1. **Why we are contacting them**
2. **What we recommend**
3. **What we will do**
4. **What it will cost**
5. **What they need to do next**

---

## 🤖 Autonomy & Dispatch Protocol

| Inquiry Type | Criteria | Action Protocol |
|---|---|---|
| **Standard Fixed Catalog Service** | Matches 100% of fixed one-off website catalog items (e.g. Company Reg, VAT Reg, Tax Clearance, CIDB renewals, ITR14) | **Full Autonomy:** Automatically generate the 30-Second Executive HTML email and dispatch directly to the client. |
| **Accounting / Payroll Retainer** | Monthly accounting retainers, monthly bookkeeping, or payroll packages | **Strict Review Protocol (Requires Kevin's Input):** NEVER send automated pricing or proposals to the client. Retainers require Kevin's direct evaluation first. Auto-reply with an executive consultation acknowledgment and forward the inquiry to `kev@thinkestry.co.za` for scoping. |
| **SARS Tax Debt Compromise** | Tax debt compromise, debt relief, or tax settlement inquiries | **Free Assessment Protocol:** Prompt the client for (1) the approximate total debt value, and (2) SARS eFiling login credentials to conduct a free assessment. Alert `kev@thinkestry.co.za`. |
| **Custom / Complex Advisory Scope** | Multi-entity restructures, foreign corporate holding advisory, Section 200 compromises, or custom pricing | **Review Protocol:** Auto-draft the proposal into IMAP Drafts and email the preview to `kev@thinkestry.co.za` for one-click approval before sending. |

> [!CRITICAL]
> **Email Dispatch CC Invariant**: NEVER CC `info@myacc.co.za` on any outgoing emails. Adding `info@myacc.co.za` to CC generates loopback emails in the inbox and risks circular triggering of the inbox agent.

> [!CRITICAL]
> ### 🛑 MANDATORY PRE-QUOTATION CATALOG QUERY INVARIANT
> **NEVER estimate, guess, or invent service prices from memory.**
> All live services and prices are stored in Firestore strictly under the **`services`** collection (NOT `products`).
> 
> Before drafting ANY quote, proposal, fee schedule, or email mentioning prices:
> 1. The agent **MUST EXECUTE** the live price lookup tool:
>    ```bash
>    npx tsx .agents/skills/quote-generator/scripts/lookup_price.ts <keyword>
>    ```
>    *(Examples: `npx tsx .agents/skills/quote-generator/scripts/lookup_price.ts npc` or `... "vat registration"`)*
> 2. The agent **MUST QUOTE** the exact numeric `price` returned by Firestore.
> 3. The agent **MUST REFERENCE** the verified title and official URL (`https://www.myacc.co.za/products/<slug>`).
> 4. If an inquiry involves a custom scope not found in the database, the agent **MUST NOT** invent pricing; route the inquiry to `kev@thinkestry.co.za` for Kevin's direct evaluation.

---

## 📐 Layout & Typography Guidelines

### Email Container & Spacing
- **Container Width**: Centered 660px – 700px width (`max-width: 660px; margin: 0 auto;`).
- **Background**: Clean white content card (`#ffffff`) on a subtle light slate backdrop (`#f8fafc`).
- **Generous Padding**:
  - `32px – 36px` container padding.
  - `20px – 28px` between major section blocks.
  - `8px – 12px` between related items.
- **Borders & Shadows**: Subtle 1px border (`#e2e8f0`) with rounded corners (`8px – 10px`). Avoid heavy dark dividing lines or box borders.

### Typography & Colors
- **Font Stack**: Modern, clean system sans-serif: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- **Body Text**: `15px – 16px`, `line-height: 1.6`, regular weight, dark slate (`#1e293b` or `#334155`).
- **Headings**: `15px – 18px`, bold (`font-weight: 700`), dark navy / near-black (`#0f172a`).
- **Primary Brand Accent**: `#1D70E8` (My Accountant Blue).
- **Selective Bolding**: Bold ONLY key recommendations, critical amounts, deadlines, and service names. **Never bold full sentences.**
- **Paragraph Length**: Strictly **2 – 3 sentences maximum** per paragraph.

---

## 📑 Information Priority & Progressive Disclosure

Follow the strict sequence:
**SUMMARY $\rightarrow$ RECOMMENDATION $\rightarrow$ SCOPE $\rightarrow$ PRICING $\rightarrow$ NEXT STEP**

| Priority | Type | Action Rule |
|---|---|---|
| **A** | **ESSENTIAL** | Must be prominently visible (Recommendation, Price, Action). |
| **B** | **USEFUL** | Included as concise bullets or numbered steps. |
| **C** | **TECHNICAL** | Omit entirely, or place in a small secondary "Important Notes" footer block. |

---

## 🏗️ Master Email HTML Architecture

```html
1. HEADER
   MY ACCOUNTANT
   Corporate Formation • Accounting • Tax Strategy

2. GREETING & CONTEXT (Max 2–3 sentences)
   Hi [Client Name],
   [Context + brief acknowledgment of their current position].

3. SECTION 1 — OUR RECOMMENDATION (Subtle Highlighted Card: #f0fdf4 / border-left: 4px solid #16a34a)
   • Recommendation 1
   • Recommendation 2
   • Recommendation 3

4. SECTION 2 — WHAT WE WILL DO (Numbered Minimal Steps)
   01 — Step Name: One-sentence deliverable summary.
   02 — Step Name: One-sentence deliverable summary.
   03 — Step Name: One-sentence deliverable summary.

5. SECTION 3 — FEE SCHEDULE (Clean Table)
   Service | Category | Fee
   [Prominent summary card: Once-off investment vs. Monthly thereafter]

6. SECTION 4 — WHAT WE NEED FROM YOU (3–5 concise bullets)
   • Item 1
   • Item 2
   • Item 3

7. SECTION 5 — NEXT STEP & CTA (Visually prominent button)
   Ready to get started? Reply "PROCEED" to this email.
   [ REPLY TO PROCEED ]

8. IMPORTANT NOTES (Small secondary text: 12px, #64748b)
   [Technical/regulatory threshold notes]

9. EXECUTIVE SIGNATURE
   Kevin Freese | Director | CBAP (SA) #3561
   My Accountant (Pty) Ltd • Practice No: PR-0098553
   Landline: +27 10 109 1625 | Web: www.myacc.co.za
```

---

## ⚖️ Statutory VAT Thresholds (Effective 1 April 2026)

SARS updated South Africa's national VAT registration thresholds effective **1 April 2026**:

| VAT Registration Type | Previous Threshold | **New Statutory Threshold (Effective 1 April 2026)** |
|---|---|---|
| **Compulsory VAT Registration** | R 1,000,000.00 | **R 2,300,000.00** *(Taxable turnover within any 12-month period)* |
| **Voluntary VAT Registration** | R 50,000.00 | **R 120,000.00** *(Minimum historical trading turnover required to register)* |

---

## 💰 Official Live Service Rates & Core Pricing Rules

### Annual Financial Statements (AFS)
- **Non-VAT Registered Company AFS:** **R 5,000.00** per financial year.
  - *Full Inclusion Rule*: Fully includes processing raw bank statements, compiling general ledgers, trial balance, and IFRS for SMEs financials. Never quote a separate catch-up bookkeeping fee.
- **VAT-Registered Company AFS:** **R 7,500.00** per financial year.
  - *Full Inclusion Rule*: Fully includes processing raw bank statements, bi-monthly VAT reconciliation against SARS VAT201 declarations, trial balance, and IFRS for SMEs financials.
- **Standard AFS Turnaround:** 7 to 10 working days from receipt of complete bank statements.

### SARS Tax Compliance & Profile Access
- **SARS Tax Representative Appointment:** **R 950.00** per company (Turnaround: 3 to 5 working days for SARS verification). Mandatory disclosure: required to access unlinked or dormant eFiling profiles and does not affect the director's personal tax profile or personal liabilities in any way.
- **Company Income Tax Return (ITR14):** **R 650.00** per return (calculated from signed AFS).
- **Individual Income Tax Return (ITR12 - Simple):** **R 750.00** per return (Salary/remuneration, medical, retirement).
- **Individual Income Tax Return (ITR12 - Complex):** **R 1,150.00** per return (Investments, CGT, local rental income, travel allowance).
- **Sole Proprietorship / Independent Trading ITR12:** **R 2,950.00** per return (Unincorporated trading turnover).


### Foreign Company & Subsidiary Establishment Rules (CRITICAL INVARIANT)
- **Always Use External Company Registration**: When a foreign entity, foreign corporate parent, or offshore shareholder inquires about establishing a South African subsidiary, branch, or commercial entity, **ALWAYS quote External Company Registration** under Section 23 of the Companies Act No. 71 of 2008 (CIPC Form CoR 20.1 / CoR 20.2; **R 3,450.00**; `/products/external-company-registration`). Do NOT quote a standard domestic Pty Ltd.
- **Mandatory Foreign Setup Bundle**:
  1. External Company Registration: **R 3,450.00**
  2. Registered Office Address (12-Month Retainer): **R 3,600.00** (`/products/registered-office-address-12-month-retainer`)
  3. SARS Tax Representative Appointment: **R 950.00** (`/products/tax-representative-appointment`)
  4. SARS Tax Clearance PIN: **R 350.00** (`/products/tax-clearance-pin`)
  5. CIPC Beneficial Ownership Declaration: **R 550.00** (`/products/beneficial-ownership-declaration`)
  6. SARS Customs Import Licence: **R 1,250.00** (`/products/import-licence`)
  7. SARS Customs Export Licence: **R 1,250.00** (`/products/export-licence`)
  *Total Turnkey Setup: R 11,400.00* (once-off).
- **Foreign Subsidiary Accounting Retainer**: Quote the **R 5,500.00 / month** all-inclusive accounting retainer (`/products/monthly-accounting`), covering monthly bookkeeping, parent group management accounts, VAT201, monthly payroll/EMP201, provisional tax (IRP6), annual financial statements (AFS under IFRS for SMEs), corporate tax (ITR14), and CIPC annual maintenance.

### Mandatory Proposal Elements
- **Free CIPC Assessment**: Always offer a complimentary CIPC health audit on corporate/tax proposals (Annual Returns standing, deregistration risk, active directors, Beneficial Ownership).
- **Exploratory Quotation Link Discipline**: Do not include website catalog links in exploratory proposals unless explicitly requested. Keep communications focused, consultative, and executive.
- **Accounting Retainer Scoping (VAT Review Invariant)**: When preparing preliminary retainer proposals or engagement letters that encompass VAT201 compliance for an entity that is currently Non-VAT registered, always state that the initial retainer fee applies to the non-VAT trading state, and that the fee will be formally reviewed and adjusted upon active VAT registration.

### Other Official Live Rates (Synced with Firestore Catalog)
- **Non-Profit Company Registration (NPC):** **R 950.00** &bull; `https://www.myacc.co.za/products/non-profit-company-registration` *(Turnaround: 1–3 working days)*
- **NPO Registration (Department of Social Development):** **R 1,200.00** &bull; `https://www.myacc.co.za/products/npo-registration` *(Turnaround: ~90 working days)*
- **PBO Registration (SARS Tax Exemption Unit):** **R 1,800.00** &bull; `https://www.myacc.co.za/products/pbo-registration` *(Turnaround: 21–30 working days)*
- **SARS VAT Registration:** **R 1,800.00** &bull; `https://www.myacc.co.za/products/vat-registration`
- **Private Company Registration (Pty Ltd):** **R 950.00** &bull; `https://www.myacc.co.za/products/private-company-registration`
- **Monthly Ecommerce Accounting Retainer:** **R 1,850.00 – R 2,450.00 / month** &bull; `https://www.myacc.co.za/products/monthly-accounting`
- **Monthly All-Inclusive Accounting & Payroll (1–5 Staff):** **R 5,500.00 / month**
- **SARS Tax Clearance PIN (TCS):** **R 350.00** &bull; `https://www.myacc.co.za/products/tax-clearance-pin`
- **NCR Credit Provider Registration:** **R 1,400.00** &bull; `https://www.myacc.co.za/products/ncr-registration`
- **Provisional Tax Return (IRP6 - Trading):** **R 550.00** &bull; `https://www.myacc.co.za/products/provisional-tax-return-irp6-trading`
- **Beneficial Ownership Declaration:** **R 550.00** &bull; `https://www.myacc.co.za/products/beneficial-ownership-declaration`
- **PAYE Registration:** **R 750.00** &bull; `https://www.myacc.co.za/products/paye-registration`
- **UIF Registration (Department of Labour):** **R 1,900.00** *(Manual in-person Department of Labour processing)* &bull; `https://www.myacc.co.za/products/uif-registration`
- **COIDA Registration:** **R 1,400.00** &bull; `https://www.myacc.co.za/products/coida-registration`
- **CIDB 3-Year Renewal:** **R 1,800.00** &bull; `https://www.myacc.co.za/products/cidb-3-year-renewal`
- **CIDB Upgrades (Grades 2–9):** **R 1,800.00** &bull; `https://www.myacc.co.za/products/cidb-upgrades-grades-2-9`
- **CIDB Annual Renewal:** **R 650.00** &bull; `https://www.myacc.co.za/products/cidb-annual-renewal`
- **CIDB Grade 1 Registration:** **R 1,150.00** &bull; `https://www.myacc.co.za/products/cidb-registration`

