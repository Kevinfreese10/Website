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

## 💰 Official Live Service Rates (Synced with Firestore Catalog)

Always verify live pricing from the website catalog (`https://www.myacc.co.za`):
- **SARS VAT Registration:** **R 1,800.00** &bull; `https://www.myacc.co.za/products/vat-registration`
- **Historical Catch-Up Bookkeeping:** **R 5,000.00 – R 7,000.00** *(Once-off trading reconstruction)*
- **Annual Partnership Income & Expense Statement:** **R 5,000.00** *(Once-off per tax year)*
- **Private Company Registration (Pty Ltd):** **R 950.00** &bull; `https://www.myacc.co.za/products/private-company-registration`
- **Monthly Ecommerce Accounting Retainer:** **R 1,850.00 – R 2,450.00 / month** &bull; `https://www.myacc.co.za/products/monthly-accounting`
- **Monthly All-Inclusive Accounting & Payroll (1–5 Staff):** **R 5,500.00 / month**
- **SARS Tax Clearance PIN (TCS):** **R 350.00** &bull; `https://www.myacc.co.za/products/tax-clearance-pin`
- **NCR Credit Provider Registration:** **R 1,400.00** &bull; `https://www.myacc.co.za/products/ncr-registration`
- **Annual Financial Statements (Compilation):** **R 2,500.00** &bull; `https://www.myacc.co.za/products/annual-financial-statements`
- **Individual Income Tax Return (ITR12 - Simple):** **R 750.00** &bull; `https://www.myacc.co.za/products/individual-income-tax-return-itr12-simple`
- **Individual Income Tax Return (ITR12 - Complex/Business):** **R 1,150.00** &bull; `https://www.myacc.co.za/products/complex-individual-income-tax-return-itr12`
- **Provisional Tax Return (IRP6 - Trading):** **R 550.00** &bull; `https://www.myacc.co.za/products/provisional-tax-return-irp6-trading`
- **Beneficial Ownership Declaration:** **R 550.00** &bull; `https://www.myacc.co.za/products/beneficial-ownership-declaration`
- **PAYE Registration:** **R 750.00** &bull; `https://www.myacc.co.za/products/paye-registration`
- **UIF Registration:** **R 1,200.00** &bull; `https://www.myacc.co.za/products/uif-registration`
- **COIDA Registration:** **R 1,400.00** &bull; `https://www.myacc.co.za/products/coida-registration`
- **CIDB 3-Year Renewal:** **R 1,800.00** &bull; `https://www.myacc.co.za/products/cidb-3-year-renewal`
- **CIDB Upgrades (Grades 2–9):** **R 1,800.00** &bull; `https://www.myacc.co.za/products/cidb-upgrades-grades-2-9`
- **CIDB Annual Renewal:** **R 650.00** &bull; `https://www.myacc.co.za/products/cidb-annual-renewal`
- **CIDB Grade 1 Registration:** **R 1,150.00** &bull; `https://www.myacc.co.za/products/cidb-registration`

