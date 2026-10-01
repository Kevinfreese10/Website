---
name: audit-and-rebuild-financial-model
description: Autonomously audits, reconciles, and compiles standardized 8-tab double-entry financial models (Notes, GL, TB per FY, VAT201 Monthly per FY, VAT Schedule, Bank Rec) for South African entities adhering strictly to the AI Accountant practice rules and SARS VAT Act compliance.
---

# Audit & Rebuild Financial Model Skill

## Overview
This skill provides the end-to-end standard operating procedure for auditing bank statement exports (FNB, Netcash, ABSA, Standard Bank, etc.), matching multi-account inter-bank transfers, resolving transfer suspense to `R0.00`, enforcing statutory VAT Act No. 89 of 1991 compliance, and generating formula-linked 8-tab Excel financial models.

---

## Standard 8-Tab Workbook Architecture

| Tab # | Sheet Name | Formula Standard & Description |
| :---: | :--- | :--- |
| **1** | `Notes & Assumptions` | Company registration, tax reference, banking metadata, and statutory tax notes. |
| **2** | `General Ledger` | Complete, balanced double-entry ledger across all audited periods (`Debit == Credit`, `Variance == R0.00`). |
| **3** | `Trial Balance (per FY)` | Dedicated Trial Balance for each financial year (e.g. `Trial Balance FY2025`, `Trial Balance FY2026`). Dynamic `SUMIFS` formulas linked to GL. Balance Sheet accounts roll forward from prior year closing; Income Statement accounts reset to R0.00. |
| **4** | `VAT201 Monthly (per FY)` | Monthly VAT return calculation schedules for each FY derived dynamically from GL Accounts `7000-010` (Output VAT) and `7000-009` (Input VAT). |
| **5** | `VAT Schedule` | Comprehensive line-by-line transaction ledger with Gross, Net, VAT Amount, VAT Direction (Output/Input/None), and Audit Reason. |
| **6** | `Bank Reconciliation` | Multi-account reconciliation table matching ledger balances (`8400-001`, `8400-002`, etc.) to closing statement balances with `R0.00` difference. |

---

## Core Allocation & VAT Invariants

1. **Inter-Account Transfers & Suspense (`9500-003`)**:
   - All inter-bank transfers (e.g. FNB $\leftrightarrow$ Netcash $\leftrightarrow$ Savings) must be paired and allocated to **`9500-003 Bank Transfer Suspense`** so that the net suspense balance equals **`R0.00`**.
   - Genuine unallocated / unmatched transactions must be moved to **`9500-001 Unallocated Suspense`** (0% VAT) for dedicated audit review.
2. **Cost of Sales & Recoveries (`2000-000`)**:
   - Direct hardware & materials (Build It, project hardware) $\rightarrow$ **15% Input VAT**.
   - Cash send / InstantMoney / casual day wages $\rightarrow$ **0% VAT**.
   - Expense recoveries (`1000-008`, `ABR`, `ABU`) and sundry project income $\rightarrow$ **0% VAT credit offset**.
   - Direct director project disbursements $\rightarrow$ **0% VAT**.
3. **Statutory & Practice Exemptions**:
   - **`3000-000 Accounting Fees`**: 0% VAT (My Accountant, A Padachey, CIPC).
   - **`3000-020 Entertainment Expenses`**: Strictly 0% VAT (SARS s 17(2)(a) input tax denial on restaurants, fast food, and liquor).
   - **`3000-033 Fuel`**: Strictly 0% VAT (SARS s 11(1)(h) zero-rated fuel levy goods).
   - **`3000-040 Salaries & Wages`**: 0% VAT.
   - **`3000-049 Staff Welfare`**: 0% VAT (Supermarkets, Dis-Chem, Clicks, medicals).
   - **`3000-053 Staff Uniforms / Protective Clothing`**: **15% Input VAT** (Workwear, overalls, PPE).
4. **Travel & Transit vs Motor Overheads**:
   - **`3000-052 Travel & Accommodation`** (15% VAT): All Toll Gates (Plaza, Sanral, Gosforth, N1, N3, Mooi, Tugela, Carousel), passenger transit (Uber, Bolt), car hire, flights, and accommodation.
   - **`3000-032 Motor Vehicle Expenses`** (15% VAT): Vehicle tracking (Tracker, Netstar, Cartrack), parts/servicing (Midas, Autozone, Golfwagen, tyres), and vehicle licensing.

---

## Multi-Year Modeling & Date Isolation Rules

1. **Strict Date Filtering**: Always verify bank statement date ranges against the entity's registered financial year-end (e.g. 28 February) prior to ingesting into the model.
2. **Rolling Balance Sheet Balances**:
   - In `Trial Balance FY(N+1)`, Column `Opening Balance` is dynamically linked to `= 'Trial Balance FY(N)'!G{row}` for all Balance Sheet accounts.
   - Income Statement accounts open at `0.00`.
3. **Verification**: Run automated double-entry and VAT reconciliations ensuring GL debits == credits, TB debits == credits, and bank statement differences == R0.00.

---

## 📜 Statutory AFS Compilation Report Letterhead & Signature Protocol (CRITICAL INVARIANT)

Whenever Annual Financial Statements (AFS) are compiled, audited, or finalized from accounting software (CaseWare, Draftworx, Sage) or internal engines, the **Practitioner's Compilation Report** (typically Page 4 or 5 of the AFS) must be issued on official practice stationery with verified credentials.

### 1. New Letterhead Applied
* **Top Header**:
  - Left: **MY ACCOUNTANT (PTY) LTD** (13.5pt Arial Bold, Navy `#0F2137`), `REGISTRATION NUMBER: 2020 / 548105 / 07` (6.5pt Arial Bold, Slate Grey `#64748B`), `ACCOUNTING  •  PAYROLL  •  TAX  •  ADVISORY` (6.5pt Arial Bold, Warm Gold `#C5A059`).
  - Right: `Ground Floor, Waterstone Building, Stonemill Office Park`, `300 Acacia Road, Darrenwood, Johannesburg, 2195`, `Tel: 010 109 1625 | Email: info@myacc.co.za | Web: www.myacc.co.za` (7.2pt Arial, Slate Grey `#64748B`).
  - Divider: 1.5pt Warm Gold rule (`#C5A059`) at `y = 68` spanning margins (`left_x = 49.4` to `right_x = 548.2`).
* **Software Placeholder Redaction**:
  - Automatically redact CaseWare/Draftworx placeholder icons (`[+]` icon at top, `Double click to insert your logo` box & divider line at bottom).

### 2. Removed Outdated Sign-Off Block
* Permanently remove/redact legacy references:
  - Any reference to `Jude Capital (Pty) Ltd`
  - Obsolete designation `BAP (SA)` or `Partner`
  - Obsolete location `Springs`

### 3. Added Correct Signature & Practice Details
* **Signature Line & Image**:
  - Clean black signature line (`0.75pt` width, 180pt length) positioned with ample breathing space below Paragraph 5.
  - Transparent digital signature ([`Signature_Kevin_New.png`](file:///c:/myacc/public/templates/Signature_Kevin_New.png)) resting naturally across the signature line.
* **Authoritative Sign-Off Block**:
  ```text
  My Accountant (Pty) Ltd
  Kevin Freese
  Director
  Chartered Business Accountant in Practice (SA)
  CIBA CBAP (SA) #3561 | SARS PR-0098553

  <Date>
  Johannesburg
  ```

### 4. Canonical Deliverable Naming & Output Standard
* Never distribute raw software filenames (e.g. `Financialstatements-SME[69].pdf`).
* Rename deliverable to:
  `[Entity Name] - Annual Financial Statements [YYYY].pdf`
* Automatically export the standalone 1-page Compilation Report:
  `Practitioners_Compilation_Report_[Entity_Name].pdf`
* Always create an automatic safety backup of the original before modifying:
  `[Original_Name]_ORIGINAL_BACKUP.pdf`

### 5. Automated Execution CLI
Execute the automated branding tool:
```bash
uv run --with pymupdf python .agents/skills/audit-and-rebuild-financial-model/scripts/brand_compilation_report.py \
  --pdf "C:/path/to/Financialstatements.pdf" \
  --entity "Entity Name (Pty) Ltd" \
  --date "29 September 2026"
```

