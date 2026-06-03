const coa = [
  { "accountNumber": "1000-000", "description": "Sales", "id": "1000-000", "section": "Income Statement" },
  { "section": "Income Statement", "id": "1000-001", "description": "Export Sales", "accountNumber": "1000-001" },
  { "id": "1000-002", "description": "Other Operating Income", "accountNumber": "1000-002", "section": "Income Statement" },
  { "section": "Income Statement", "description": "Interest Received", "id": "1000-003", "accountNumber": "1000-003" },
  { "section": "Income Statement", "id": "1000-004", "accountNumber": "1000-004", "description": "Discount Received" },
  { "description": "Profit/Loss on Sale of Non-Current Assets", "accountNumber": "1000-005", "id": "1000-005", "section": "Income Statement" },
  { "accountNumber": "1000-006", "description": "Bad Debts Recovered", "id": "1000-006", "section": "Income Statement" },
  { "description": "Sundry Income", "id": "1000-007", "accountNumber": "1000-007", "section": "Income Statement" },
  { "id": "1000-008", "accountNumber": "1000-008", "description": "Recovery Account", "section": "Income Statement" },
  { "section": "Income Statement", "accountNumber": "2000-000", "id": "2000-000", "description": "Cost of Sales / Purchases" },
  { "description": "Inventory Adjustment", "accountNumber": "2000-001", "id": "2000-001", "section": "Income Statement" },
  { "description": "Inventory Count Variance", "accountNumber": "2000-002", "id": "2000-002", "section": "Income Statement" },
  { "section": "Income Statement", "id": "2000-003", "description": "Purchase Variance", "accountNumber": "2000-003" },
  { "section": "Income Statement", "description": "Accounting Fees", "accountNumber": "3000-000", "id": "3000-000" },
  { "section": "Income Statement", "id": "3000-001", "description": "Advertising & Promotions", "accountNumber": "3000-001" },
  { "id": "3000-003", "description": "Bad Debts", "accountNumber": "3000-003", "section": "Income Statement" },
  { "description": "Bank Charges", "id": "3000-004", "accountNumber": "3000-004", "section": "Income Statement" },
  { "section": "Income Statement", "id": "3000-005", "description": "Cleaning", "accountNumber": "3000-005" },
  { "section": "Income Statement", "id": "3000-006", "description": "Computer Expenses", "accountNumber": "3000-006" },
  { "accountNumber": "3000-007", "description": "Consumables", "id": "3000-007", "section": "Income Statement" },
  { "id": "3000-008", "description": "Subscriptions", "accountNumber": "3000-008", "section": "Income Statement" },
  { "section": "Income Statement", "id": "3000-009", "accountNumber": "3000-009", "description": "Consulting Fees" },
  { "section": "Income Statement", "id": "3000-010", "description": "Courier & Postage", "accountNumber": "3000-010" },
  { "section": "Income Statement", "id": "3000-011", "accountNumber": "3000-011", "description": "Depreciation" },
  { "id": "3000-013", "accountNumber": "3000-013", "description": "Discount Allowed", "section": "Income Statement" },
  { "section": "Income Statement", "accountNumber": "3000-015", "id": "3000-015", "description": "Donations" },
  { "section": "Income Statement", "id": "3000-016", "description": "Electricity", "accountNumber": "3000-016" },
  { "section": "Income Statement", "id": "3000-017", "accountNumber": "3000-017", "description": "Water" },
  { "section": "Income Statement", "accountNumber": "3000-018", "description": "Rates & Taxes (Municipal)", "id": "3000-018" },
  { "accountNumber": "3000-020", "description": "Entertainment Expenses", "id": "3000-020", "section": "Income Statement" },
  { "section": "Income Statement", "description": "Finance Charges", "accountNumber": "3000-021", "id": "3000-021" },
  { "section": "Income Statement", "description": "Insurance", "id": "3000-023", "accountNumber": "3000-023" },
  { "id": "3000-024", "accountNumber": "3000-024", "description": "Security / Alarm / Armed Response", "section": "Income Statement" },
  { "accountNumber": "3000-025", "id": "3000-025", "description": "Interest Paid", "section": "Income Statement" },
  { "description": "Loan Interest", "accountNumber": "3000-026", "id": "3000-026", "section": "Income Statement" },
  { "accountNumber": "3000-027", "description": "Leasing Charges", "id": "3000-027", "section": "Income Statement" },
  { "section": "Income Statement", "accountNumber": "3000-028", "description": "Penalties & Fines (Non-deductible)", "id": "3000-028" },
  { "id": "3000-029", "description": "Legal Fees", "accountNumber": "3000-029", "section": "Income Statement" },
  { "section": "Income Statement", "id": "3000-030", "accountNumber": "3000-030", "description": "Levies" },
  { "section": "Income Statement", "description": "Motor Vehicle Expenses", "accountNumber": "3000-032", "id": "3000-032" },
  { "id": "3000-033", "description": "Fuel", "accountNumber": "3000-033", "section": "Income Statement" },
  { "description": "Vehicle Insurance", "accountNumber": "3000-034", "id": "3000-034", "section": "Income Statement" },
  { "section": "Income Statement", "description": "Vehicle Repairs & Maintenance", "accountNumber": "3000-035", "id": "3000-035" },
  { "accountNumber": "3000-036", "id": "3000-036", "description": "Printing & Stationery", "section": "Income Statement" },
  { "section": "Income Statement", "id": "3000-037", "description": "Profit/Loss on Foreign Exchange", "accountNumber": "3000-037" },
  { "section": "Income Statement", "id": "3000-038", "accountNumber": "3000-038", "description": "Rent Paid" },
  { "section": "Income Statement", "id": "3000-039", "description": "Repairs & Maintenance", "accountNumber": "3000-039" },
  { "accountNumber": "3000-040", "id": "3000-040", "description": "Salaries & Wages", "section": "Income Statement" },
  { "accountNumber": "3000-041", "id": "3000-041", "description": "Basic Salaries", "section": "Income Statement" },
  { "id": "3000-042", "accountNumber": "3000-042", "description": "Overtime", "section": "Income Statement" },
  { "section": "Income Statement", "id": "3000-043", "description": "UIF Contributions", "accountNumber": "3000-043" },
  { "section": "Income Statement", "accountNumber": "3000-044", "description": "PAYE", "id": "3000-044" },
  { "section": "Income Statement", "id": "3000-045", "accountNumber": "3000-045", "description": "Pension / Provident Fund" },
  { "section": "Income Statement", "id": "3000-046", "accountNumber": "3000-046", "description": "Medical Aid Contributions" },
  { "section": "Income Statement", "description": "Staff Commissions / Bonuses", "id": "3000-047", "accountNumber": "3000-047" },
  { "accountNumber": "3000-048", "description": "Staff Training", "id": "3000-048", "section": "Income Statement" },
  { "section": "Income Statement", "id": "3000-049", "description": "Staff Welfare", "accountNumber": "3000-049" },
  { "section": "Income Statement", "description": "Professional Subscriptions / Memberships", "accountNumber": "3000-050", "id": "3000-050" },
  { "section": "Income Statement", "description": "Telephone & Internet", "id": "3000-051", "accountNumber": "3000-051" },
  { "section": "Income Statement", "description": "Travel & Accommodation", "accountNumber": "3000-052", "id": "3000-052" },
  { "accountNumber": "3000-053", "id": "3000-053", "description": "Staff Uniforms / Protective Clothing", "section": "Income Statement" },
  { "section": "Income Statement", "id": "3000-054", "description": "Staff Recruitment / HR Costs", "accountNumber": "3000-054" },
  { "section": "Income Statement", "description": "Office Refreshments & Supplies", "id": "3000-055", "accountNumber": "3000-055" },
  { "section": "Income Statement", "description": "Income Tax Expense", "id": "3000-056", "accountNumber": "3000-056" },
  { "description": "Penalties and Interest – SARS", "accountNumber": "3000-057", "id": "3000-057", "section": "Income Statement" },
  { "id": "4000-000", "description": "Exceptional / One-off Expenses", "accountNumber": "4000-000", "section": "Income Statement" },
  { "section": "Income Statement", "description": "Exceptional / One-off Income", "id": "4000-001", "accountNumber": "4000-001" },
  { "section": "Balance Sheet", "id": "5000-000", "description": "Land & Buildings - Net Value", "accountNumber": "5000-000" },
  { "section": "Balance Sheet", "description": "Land & Buildings - At Cost", "accountNumber": "5000-001", "id": "5000-001" },
  { "section": "Balance Sheet", "description": "Land & Buildings - Accumulated Depreciation", "id": "5000-002", "accountNumber": "5000-002" },
  { "section": "Balance Sheet", "description": "Motor Vehicles - Net Value", "id": "5000-003", "accountNumber": "5000-003" },
  { "id": "5000-004", "description": "Motor Vehicles - At Cost", "accountNumber": "5000-004", "section": "Balance Sheet" },
  { "id": "5000-005", "accountNumber": "5000-005", "description": "Motor Vehicles - Accumulated Depreciation", "section": "Balance Sheet" },
  { "accountNumber": "5000-006", "id": "5000-006", "description": "Computer Equipment - Net Value", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "accountNumber": "5000-007", "id": "5000-007", "description": "Computer Equipment - At Cost" },
  { "section": "Balance Sheet", "description": "Computer Equipment - Accumulated Depreciation", "id": "5000-008", "accountNumber": "5000-008" },
  { "id": "5000-009", "accountNumber": "5000-009", "description": "Office Equipment - Net Value", "section": "Balance Sheet" },
  { "id": "5000-010", "accountNumber": "5000-010", "description": "Office Equipment - At Cost", "section": "Balance Sheet" },
  { "accountNumber": "5000-011", "description": "Office Equipment - Accumulated Depreciation", "id": "5000-011", "section": "Balance Sheet" },
  { "description": "Furniture & Fittings - Net Value", "id": "5000-012", "accountNumber": "5000-012", "section": "Balance Sheet" },
  { "description": "Furniture & Fittings - At Cost", "accountNumber": "5000-013", "id": "5000-013", "section": "Balance Sheet" },
  { "id": "5000-014", "description": "Furniture & Fittings - Accumulated Depreciation", "accountNumber": "5000-014", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "accountNumber": "5000-015", "id": "5000-015", "description": "Other Fixed Assets - Net Value" },
  { "section": "Balance Sheet", "id": "5000-016", "description": "Other Fixed Assets - At Cost", "accountNumber": "5000-016" },
  { "id": "5000-017", "description": "Other Fixed Assets - Accumulated Depreciation", "accountNumber": "5000-017", "section": "Balance Sheet" },
  { "id": "5000-018", "accountNumber": "5000-018", "description": "Investment Property", "section": "Balance Sheet" },
  { "accountNumber": "5000-019", "description": "Investments", "id": "5000-019", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "description": "Deferred Tax Asset", "id": "5000-020", "accountNumber": "5000-020" },
  { "section": "Balance Sheet", "accountNumber": "7000-000", "description": "Supplier Control Account", "id": "7000-000" },
  { "section": "Balance Sheet", "id": "7000-001", "description": "GRN Accrual Account", "accountNumber": "7000-001" },
  { "description": "Sundry Suppliers", "accountNumber": "7000-002", "id": "7000-002", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "description": "Provision for Future Expenses", "id": "7000-003", "accountNumber": "7000-003" },
  { "id": "7000-004", "description": "Provision for Insurance", "accountNumber": "7000-004", "section": "Balance Sheet" },
  { "id": "7000-005", "description": "Provision for Salary Bonus", "accountNumber": "7000-005", "section": "Balance Sheet" },
  { "description": "Provision for Leave Pay", "id": "7000-006", "accountNumber": "7000-006", "section": "Balance Sheet" },
  { "accountNumber": "7000-007", "description": "Accrued Expenses (General)", "id": "7000-007", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "id": "7000-008", "accountNumber": "7000-008", "description": "VAT / Tax Control Account" },
  { "section": "Balance Sheet", "description": "PAYE Control", "accountNumber": "7000-011", "id": "7000-011" },
  { "section": "Balance Sheet", "description": "UIF Control", "accountNumber": "7000-012", "id": "7000-012" },
  { "section": "Balance Sheet", "description": "SDL Control", "accountNumber": "7000-013", "id": "7000-013" },
  { "description": "VAT / Tax Provision Account", "id": "7000-014", "accountNumber": "7000-014", "section": "Balance Sheet" },
  { "accountNumber": "7000-015", "description": "Income Tax Payable", "id": "7000-015", "section": "Balance Sheet" },
  { "id": "7500-000", "description": "Long-Term Liabilities", "accountNumber": "7500-000", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "accountNumber": "7500-001", "description": "Instalment Sale Creditors", "id": "7500-001" },
  { "section": "Balance Sheet", "accountNumber": "7500-002", "description": "Deferred Tax Liability", "id": "7500-002" },
  { "section": "Balance Sheet", "id": "8000-000", "description": "Inventory Control Account", "accountNumber": "8000-000" },
  { "section": "Balance Sheet", "description": "Customer Control Account", "accountNumber": "8000-001", "id": "8000-001" },
  { "id": "8000-002", "accountNumber": "8000-002", "description": "Sundry Customers", "section": "Balance Sheet" },
  { "id": "8000-003", "accountNumber": "8000-003", "description": "Provisional Tax Payments", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "description": "Bank - Current Account", "accountNumber": "8000-004", "id": "8000-004" },
  { "id": "9000-000", "description": "Share Capital", "accountNumber": "9000-000", "section": "Balance Sheet" },
  { "accountNumber": "9000-001", "description": "Shareholder Loan Account", "id": "9000-001", "section": "Balance Sheet" },
  { "accountNumber": "9000-002", "description": "Drawings / Dividends Paid", "id": "9000-002", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "id": "9000-003", "description": "Current Year Profit / (Loss)", "accountNumber": "9000-003" },
  { "section": "Balance Sheet", "description": "Retained Income / (Accumulated Loss)", "id": "9000-004", "accountNumber": "9000-004" },
  { "section": "Balance Sheet", "id": "9500-001", "description": "Unallocated Suspense", "accountNumber": "9500-001" },
  { "section": "Balance Sheet", "accountNumber": "9500-002", "description": "Opening Balance / Suspense Account", "id": "9500-002" },
  { "description": "Bank Transfer Suspense", "accountNumber": "9500-003", "id": "9500-003", "section": "Balance Sheet" },
  { "section": "Balance Sheet", "accountNumber": "9500-004", "id": "9500-004", "description": "Unpaid Suspense" },
  { "section": "Balance Sheet", "accountNumber": "8400-001", "id": "8400-001", "description": "ABSA" }
];

const requestedNames = [
  "Clothing",
  "Meal staff",
  "Meals staff",
  "Meals",
  "Catering",
  "Food",
  "Staff welfare",
  "Tools",
  "School fees",
  "Subscriptions",
  "Telephone",
  "Rendering of Services",
  "Rendering of services",
  "Consumables",
  "Utilities",
  "Transport",
  "Printing and Stationery",
  "Printing",
  "Stationery",
  "Repairs",
  "Vehicle repairs",
  "Medical",
  "Entertainment",
  "Computer repairs",
  "Computer expense",
  "Equipment"
];

const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const mapped = {};
requestedNames.forEach(name => {
    let best = null;
    let bestScore = 0;
    
    coa.forEach(acc => {
        const desc = acc.description;
        
        // Exact match
        if (desc.toLowerCase() === name.toLowerCase()) {
            best = acc;
            bestScore = 100;
            return;
        }
        
        // Custom smart rules based on standard accounting rules:
        if (name === "Clothing" && desc.includes("Uniforms")) {
            best = acc; bestScore = 95; return;
        }
        if ((name === "Meal staff" || name === "Meals staff" || name === "Meals" || name === "Food") && desc === "Staff Welfare") {
            best = acc; bestScore = 90; return;
        }
        if (name === "Catering" && desc === "Entertainment Expenses") {
            best = acc; bestScore = 90; return;
        }
        if (name === "School fees" && desc === "Exceptional / One-off Expenses") {
            best = acc; bestScore = 90; return;
        }
        if (name === "Tools" && desc === "Repairs & Maintenance") {
            best = acc; bestScore = 90; return;
        }
        if ((name === "Rendering of Services" || name === "Rendering of services") && desc === "Sales") {
            best = acc; bestScore = 90; return;
        }
        if (name === "Utilities" && desc === "Electricity") {
            best = acc; bestScore = 90; return;
        }
        if (name === "Transport" && desc === "Travel & Accommodation") {
            best = acc; bestScore = 90; return;
        }
        if (name === "Vehicle repairs" && desc === "Vehicle Repairs & Maintenance") {
            best = acc; bestScore = 95; return;
        }
        if (name === "Computer expense" && desc === "Computer Expenses") {
            best = acc; bestScore = 95; return;
        }
        if (name === "Computer repairs" && desc === "Repairs & Maintenance") {
            best = acc; bestScore = 90; return;
        }
        if (name === "Equipment" && desc === "Repairs & Maintenance") {
            best = acc; bestScore = 80; return;
        }
        if (name === "Medical" && desc === "Staff Welfare") {
            best = acc; bestScore = 80; return;
        }
        
        // Text similarity
        const c1 = clean(name);
        const c2 = clean(desc);
        if (c2.includes(c1) || c1.includes(c2)) {
            const score = Math.min(c1.length, c2.length) / Math.max(c1.length, c2.length) * 50;
            if (score > bestScore) {
                best = acc;
                bestScore = score;
            }
        }
    });
    
    mapped[name] = best ? { id: best.id, desc: best.description, score: bestScore } : null;
});

console.log(JSON.stringify(mapped, null, 2));
