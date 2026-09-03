---
description: Universal South African accounting allocation, AI Accountant practice rules database, SARS VAT Act compliance, and financial year-end reconciliation guardrails.
always_on: true
---

# SARS VAT & AI Accountant Practice Allocation Guardrails

## 1. Statutory VAT Act No. 89 of 1991 Invariants

### 1.1 Entertainment Input Tax Denial (Section 17(2)(a))
- **Rule**: Input VAT deduction is **strictly prohibited** on entertainment, restaurants, fast food, coffee shops, liquor, and catering (KFC, Spur, Nando's, Wimpy, Steers, Debonairs, Mugg & Bean, Burger King, Ocean Basket, RocoMamas, tops/liquor stores, cafes, pubs).
- **Classification**: Allocate to `3000-020 (Entertainment Expenses)` with **0% VAT (No Input VAT claimed)**.

### 1.2 Zero-Rated Fuel (Section 11(1)(h))
- **Rule**: Petrol and diesel subject to the Fuel Levy (Shell, Engen, Total, BP, Sasol, Caltex, Astron, Puma) are zero-rated goods.
- **Classification**: Allocate 100% of gross payments to `3000-033 (Fuel)` with **0% VAT (No Input VAT claimed)**.

### 1.3 Exempt & Practice Zero-Rated Overheads
- **Accounting Fees**: Allocate to `3000-000 (Accounting Fees)` with **0% VAT** (My Accountant, A Padachey, CIPC, accounting secretarial).
- **Salaries, Wages & Casuals**: Net staff salaries, wages, casual cash transfers (`Send Money`, `Cash Send`, `InstantMoney`), and payroll batches carry **0% VAT** under `3000-040`.
- **Staff Welfare & Groceries**: Supermarkets (Checkers, Spar, Pick n Pay, Shoprite, Woolworths, Dis-Chem, Clicks, medicals) allocate to `3000-049 (Staff Welfare)` with **0% VAT**.
- **Donations & Courier**: `3000-015 (Donations)` and `3000-010 (Courier & Postage)` carry **0% VAT**.
- **Financial Services**: Bank interest received (`1000-003`) and interest paid (`3000-025`) carry **0% VAT** under Section 12(a).

---

## 2. Standard AI Accountant Practice Allocation Rules

| Account Code | Account Name | Matching Keywords | VAT Treatment |
| :--- | :--- | :--- | :--- |
| **`1000-000`** | Sales | Sales, commercial invoices, WiOCC, KBC, customer EFT receipts | **15% Output VAT** |
| **`2000-000`** | Cost of Sales / Purchases | Direct project stock, Build It, Planning For Fiber, IC Logistix, Biometrics 3G, site subcontractor labor, recoveries (`1000-008` / `ABR` / `ABU` offset) | **15% Input VAT** (Materials) / **0% VAT** (Cash Send / Recoveries) |
| **`3000-000`** | Accounting Fees | My Accountant, Accounting, CIPC, Padachey | **0% VAT** |
| **`3000-001`** | Advertising & Promotions | Advert, Marketing, Facebook, TikTok Ads | **15% Input VAT** |
| **`3000-004`** | Bank Charges | Fee, Charge, Commission, Saswitch, Cross Border, Netcash service fees | **15% Input VAT** |
| **`3000-006`** | Computer Expenses | Software, Cloud, Domain, Hosting, Microsoft, Adobe, AWS, Google, Apple, ChatGPT, Zoom, Takealot, Dell, Lenovo | **15% Input VAT** |
| **`3000-009`** | Consulting Fees | Consultant, Advisory, Strategic Consult, Legal / Attorney | **15% Input VAT** |
| **`3000-010`** | Courier & Postage | BidAir Cargo, FedEx, Courier, Postnet freight | **0% VAT** |
| **`3000-015`** | Donations | Church, Charity, Foundation, SPCA, Tithe, Welfare | **0% VAT** |
| **`3000-016`** | Electricity | Eskom, EasyPay, PayPoint, Flash, Blu Label, UniPin | **15% Input VAT** |
| **`3000-018`** | Rates & Taxes (Municipal) | Rates, Municipal, Council, CoJ, City of JHB, Tshwane | **15% Input VAT** |
| **`3000-020`** | Entertainment Expenses | Restaurants, Fast Food, Takeaways, Coffee, Liquor, Pubs | **0% VAT** (Denied) |
| **`3000-023`** | Insurance | Insurance, Premium, Policy, Outsurance, Santam, Discovery, Old Mutual | **15% Input VAT** |
| **`3000-024`** | Security / Armed Response | Security, Alarm, Antivirus, Secure, DMS Security | **15% Input VAT** |
| **`3000-025`** | Interest Paid | Interest, Finance Charge, Debit Balance Interest | **0% VAT** (Exempt) |
| **`3000-032`** | Motor Vehicle Expenses | Tracker, Netstar, Tyre, Midas, Autozone, Bosch, Natis, Car Wash, Cartrack | **15% Input VAT** |
| **`3000-033`** | Fuel | Petrol, Diesel, Engen, Shell, Total, Sasol, BP, Caltex, Puma, Astron | **0% VAT** (Zero-rated) |
| **`3000-036`** | Printing & Stationery | Stationery, PNA, Waltons, Postnet, Printing, Office Supplies | **15% Input VAT** |
| **`3000-038`** | Rent Paid | Rent, Growthpoint, Vukile, Redefine, WeWork, Regus, Prop Mgmt | **15% Input VAT** |
| **`3000-039`** | Repairs & Maintenance | Repairs, Plumbing, Electrical, Builders, Cashbuild, Mica, Leroy Merlin | **15% Input VAT** |
| **`3000-040`** | Salaries & Wages | Salary, Wage, Payroll, Employee Net Transfers | **0% VAT** |
| **`3000-048`** | Staff Training | Training, Education, Course, Tuition, Academy, SAICA, SAIPA | **15% Input VAT** |
| **`3000-049`** | Staff Welfare | Checkers, Clicks, Dischem, PNP, Spar, Shoprite, Medicals, Doctor, Pharmacy | **0% VAT** |
| **`3000-051`** | Telephone & Internet | MTN, Vodacom, Rain, Cell C, Telkom, Airtime, Data, WiFi | **15% Input VAT** |
| **`3000-052`** | Travel & Accommodation | **All Toll Gates (Plaza, Sanral, Gosforth, N1, N3, Mooi, Tugela)**, Uber, Bolt, Flights, Car Hire, Hotels, Airbnbs | **15% Input VAT** |
| **`3000-053`** | Staff Uniforms / PPE | Temu workwear, Golf Shirts, Overalls, Protective Clothing | **15% Input VAT** |
| **`3000-055`** | Office Refreshments & Supplies | E-Shop Carlswald, Oasis Water, Office Supplies | **0% VAT** |
| **`5000-xxx`** | Fixed Assets | Motor Vehicles (5000-004), Computer Equipment (5000-007), Furniture (5000-013) | **15% Capital VAT** |
| **`9000-001`** | Shareholder Loan Account | Director disbursements, Personal drawings | **0% VAT** |
| **`9500-001`** | Unallocated Suspense | Genuine unmatched / unallocated transactions for audit review | **0% VAT** |
| **`9500-003`** | Bank Transfer Suspense | Inter-account banking transfers (FNB $\leftrightarrow$ Netcash $\leftrightarrow$ Savings) — must net to R0.00 | **0% VAT** |

---

## 3. Financial Year-End & Multi-Account Invariants
1. **Transfer Suspense Invariant (`9500-003`)**: All inter-account transfers must be paired with corresponding account deposits. Net balance must equal **R0.00**.
2. **Unallocated Isolation (`9500-001`)**: Genuine unmatched transactions are moved to `9500-001 Unallocated Suspense` with 0% VAT for audit query.
3. **Recovery Invariant (`2000-000`)**: Credit recoveries in contracting businesses offset direct project costs in `2000-000` with 0% VAT.
4. **Standard 8-Tab Architecture**: `Notes & Assumptions`, `General Ledger`, `Trial Balance (per FY)`, `VAT201 Monthly (per FY)`, `VAT Schedule`, `Bank Reconciliation` — linked via dynamic `SUMIFS` formulas.
5. **Date Boundary Verification**: Filter statements strictly against company financial year-end dates before ingesting.
