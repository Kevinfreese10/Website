---
name: quote-generator
description: Generates and sends standardized, beautifully formatted formal quotations (Outlook-compatible HTML) from info@myacc.co.za for once-off registrations and monthly accounting/payroll retainers.
---

# My Accountant Quote Generator

This skill defines the standard quotation template, pricing guidelines, and email structure for sending client quotations on behalf of My Accountant (`info@myacc.co.za`).

## Standard Retainer Packages

### 1. Monthly All-Inclusive Accounting & Payroll (1 – 5 Employees)
- **Fee:** **R5,500.00 / month (Incl. VAT)**
- **Included Services:**
  - **A. Comprehensive Bookkeeping & Accounting:**
    - Bank & credit card processing and monthly reconciliations.
    - Customer and supplier invoice allocation, receipts, and expense claims.
    - Monthly Management Accounts (Income Statement / P&L, Balance Sheet, Performance Insights).
    - Dedicated Accountant & year-round tax advisory.
    - *(Note: Exclude VAT compliance unless client specifically requests VAT registration / submissions).*
  - **B. Full Payroll Management (1 – 5 Employees):**
    - Monthly payroll calculation (Gross, PAYE, UIF, SDL, Net).
    - Digital payslips distributed monthly.
    - Monthly EMP201 preparation and submission to SARS.
    - Monthly UIF electronic uFiling / UI-19 declarations with the Department of Employment & Labour.
    - Leave tracking and administration.
    - Payment summary / net pay distribution list for bank transfers.
  - **C. Annual & Statutory Compliance (Included in Retainer):**
    - **CIPC Annual Returns:** Timely calculation and annual return filing.
    - **Beneficial Ownership Declaration:** Annual filing and updates on the CIPC register.
    - **Bi-Annual & Annual EMP501 Reconciliations:** Filing with SARS and generation of IRP5 / IT3(a) certificates.
    - **Annual COIDA Return of Earnings (ROE):** Annual submission to Compensation Fund and Letter of Good Standing (LOGS) assistance.
    - **Provisional (IRP6) & Corporate Income Tax (ITR14) Returns.**
    - **Annual Financial Statements (AFS):** Year-end compilation by a registered accounting professional.

---

## Once-Off Statutory Registrations & Live URLs

Always verify prices against Firestore `services` collection. Standard default retail prices:
- **PAYE Registration:** R 750.00 &bull; `https://www.myacc.co.za/products/paye-registration`
- **UIF Registration:** R 1,200.00 &bull; `https://www.myacc.co.za/products/uif-registration`
- **COIDA Registration:** R 1,400.00 &bull; `https://www.myacc.co.za/products/coida-registration`
- **Beneficial Ownership Declaration:** R 550.00 &bull; `https://www.myacc.co.za/products/beneficial-ownership-declaration`
- **CIPC Annual Returns:** R 450.00 &bull; `https://www.myacc.co.za/products/annual-returns`
- **VAT Registration:** R 1,400.00 &bull; `https://www.myacc.co.za/products/vat-registration`
- **Private Company Registration:** R 950.00 &bull; `https://www.myacc.co.za/products/private-company-registration`

## Automated Price Verification Engine

Before drafting or emailing any formal quotation, the agent MUST programmatically run the pricing verification engine:
- Call `validateQuotationPricing(items)` from `src/lib/quotes/quote-service.ts`.
- If `valid === false`, DO NOT send the quote. Immediately log the pricing discrepancies and resolve them against the official Firestore catalog.

## Email Formatting Requirements (Outlook Desktop Compatible)

- Always build HTML emails using table-based layout (`<table width="650" cellpadding="0" cellspacing="0">`).
- Use web-safe typography: `Segoe UI, Arial, sans-serif`.
- Include product links with direct URLs for once-off registrations.
- Provide both HTML and plain-text fallback.
- Send from `info@myacc.co.za` via SMTP SSL (`mail.myacc.co.za:465`).
