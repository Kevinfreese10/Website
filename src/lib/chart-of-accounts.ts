import { ChartOfAccount } from './types';

// Standard IFRS for SMEs & South African Statutory Financial Statement Grouping Categories
export const FS_GROUPS = [
  // Balance Sheet - Assets
  'Property, plant and equipment',
  'Investment property',
  'Intangible assets',
  'Other financial assets',
  'Deferred tax asset',
  'Inventories',
  'Trade and other receivables',
  'Current tax receivable',
  'Cash and cash equivalents',
  // Balance Sheet - Equity & Liabilities
  'Share capital',
  'Share premium',
  'Retained income / (Accumulated loss)',
  'Loans from shareholders',
  'Other financial liabilities',
  'Deferred tax liability',
  'Trade and other payables',
  'Provisions',
  'Current tax payable',
  // Income Statement
  'Revenue',
  'Cost of Sales',
  'Other Income',
  'Operating Expenses',
  'Finance Costs',
  'Taxation',
] as const;

export const FS_NOTES = [
  'Note 2: Cash and cash equivalents',
  'Note 3: Share capital',
  'Note 4: Loans from shareholders',
  'Note 5: Operating expenses',
  'Note 6: Cash used in operations',
  'Note 7: Taxation',
  'Note 8: Related parties',
  'Note 9: Going concern',
  'Note 10: Events after reporting period',
] as const;

// Master default Chart of Accounts with standard FS groupings and note assignments
export let chartOfAccounts: ChartOfAccount[] = [
  // REVENUE (1000 series)
  { id: '1000-000', accountNumber: '1000-000', description: 'Sales', section: 'Income Statement', category: 'Revenue', fsGroup: 'Revenue' },
  { id: '1000-001', accountNumber: '1000-001', description: 'Export Sales', section: 'Income Statement', category: 'Revenue', fsGroup: 'Revenue' },
  { id: '1000-002', accountNumber: '1000-002', description: 'Other Operating Income', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },
  { id: '1000-003', accountNumber: '1000-003', description: 'Interest Received', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },
  { id: '1000-004', accountNumber: '1000-004', description: 'Discount Received', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },
  { id: '1000-005', accountNumber: '1000-005', description: 'Profit/Loss on Sale of Non-Current Assets', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },
  { id: '1000-006', accountNumber: '1000-006', description: 'Bad Debts Recovered', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },
  { id: '1000-007', accountNumber: '1000-007', description: 'Sundry Income', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },
  { id: '1000-008', accountNumber: '1000-008', description: 'Recovery Account', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },

  // COST OF SALES (2000 series)
  { id: '2000-000', accountNumber: '2000-000', description: 'Cost of Sales / Purchases', section: 'Income Statement', category: 'Cost of Sales', fsGroup: 'Cost of Sales' },
  { id: '2000-001', accountNumber: '2000-001', description: 'Inventory Adjustment', section: 'Income Statement', category: 'Cost of Sales', fsGroup: 'Cost of Sales' },
  { id: '2000-002', accountNumber: '2000-002', description: 'Inventory Count Variance', section: 'Income Statement', category: 'Cost of Sales', fsGroup: 'Cost of Sales' },
  { id: '2000-003', accountNumber: '2000-003', description: 'Purchase Variance', section: 'Income Statement', category: 'Cost of Sales', fsGroup: 'Cost of Sales' },

  // OPERATING EXPENSES (3000 series)
  { id: '3000-000', accountNumber: '3000-000', description: 'Accounting Fees', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-001', accountNumber: '3000-001', description: 'Advertising & Promotions', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-003', accountNumber: '3000-003', description: 'Bad Debts', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-004', accountNumber: '3000-004', description: 'Bank Charges', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-005', accountNumber: '3000-005', description: 'Cleaning', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-006', accountNumber: '3000-006', description: 'Computer Expenses', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-007', accountNumber: '3000-007', description: 'Consumables', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-008', accountNumber: '3000-008', description: 'Subscriptions', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-009', accountNumber: '3000-009', description: 'Consulting Fees', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-010', accountNumber: '3000-010', description: 'Courier & Postage', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-011', accountNumber: '3000-011', description: 'Depreciation', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-013', accountNumber: '3000-013', description: 'Discount Allowed', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-015', accountNumber: '3000-015', description: 'Donations', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-016', accountNumber: '3000-016', description: 'Electricity', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-017', accountNumber: '3000-017', description: 'Water', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-018', accountNumber: '3000-018', description: 'Rates & Taxes (Municipal)', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-020', accountNumber: '3000-020', description: 'Entertainment Expenses', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-021', accountNumber: '3000-021', description: 'Finance Charges', section: 'Income Statement', category: 'Finance Costs', fsGroup: 'Finance Costs', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-023', accountNumber: '3000-023', description: 'Insurance', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-024', accountNumber: '3000-024', description: 'Security / Alarm / Armed Response', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-025', accountNumber: '3000-025', description: 'Interest Paid', section: 'Income Statement', category: 'Finance Costs', fsGroup: 'Finance Costs', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-026', accountNumber: '3000-026', description: 'Loan Interest', section: 'Income Statement', category: 'Finance Costs', fsGroup: 'Finance Costs', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-027', accountNumber: '3000-027', description: 'Leasing Charges', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-028', accountNumber: '3000-028', description: 'Penalties & Fines (Non-deductible)', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-029', accountNumber: '3000-029', description: 'Legal Fees', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-030', accountNumber: '3000-030', description: 'Levies', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-032', accountNumber: '3000-032', description: 'Motor Vehicle Expenses', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-033', accountNumber: '3000-033', description: 'Fuel', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-034', accountNumber: '3000-034', description: 'Vehicle Insurance', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-035', accountNumber: '3000-035', description: 'Vehicle Repairs & Maintenance', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-036', accountNumber: '3000-036', description: 'Printing & Stationery', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-037', accountNumber: '3000-037', description: 'Profit/Loss on Foreign Exchange', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },
  { id: '3000-038', accountNumber: '3000-038', description: 'Rent Paid', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-039', accountNumber: '3000-039', description: 'Repairs & Maintenance', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-040', accountNumber: '3000-040', description: 'Salaries & Wages', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-041', accountNumber: '3000-041', description: 'Basic Salaries', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-042', accountNumber: '3000-042', description: 'Overtime', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-043', accountNumber: '3000-043', description: 'UIF Contributions', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-044', accountNumber: '3000-044', description: 'PAYE', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-045', accountNumber: '3000-045', description: 'Pension / Provident Fund', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-046', accountNumber: '3000-046', description: 'Medical Aid Contributions', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-047', accountNumber: '3000-047', description: 'Staff Commissions / Bonuses', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-048', accountNumber: '3000-048', description: 'Staff Training', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-049', accountNumber: '3000-049', description: 'Staff Welfare', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-050', accountNumber: '3000-050', description: 'Professional Subscriptions / Memberships', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-051', accountNumber: '3000-051', description: 'Telephone & Internet', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-052', accountNumber: '3000-052', description: 'Travel & Accommodation', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-053', accountNumber: '3000-053', description: 'Staff Uniforms / Protective Clothing', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-054', accountNumber: '3000-054', description: 'Staff Recruitment / HR Costs', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-055', accountNumber: '3000-055', description: 'Office Refreshments & Supplies', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '3000-056', accountNumber: '3000-056', description: 'Income Tax Expense', section: 'Income Statement', category: 'Taxation', fsGroup: 'Taxation', fsNote: 'Note 7: Taxation' },
  { id: '3000-057', accountNumber: '3000-057', description: 'Penalties and Interest – SARS', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '4000-000', accountNumber: '4000-000', description: 'Exceptional / One-off Expenses', section: 'Income Statement', category: 'Operating Expenses', fsGroup: 'Operating Expenses', fsNote: 'Note 5: Operating expenses' },
  { id: '4000-001', accountNumber: '4000-001', description: 'Exceptional / One-off Income', section: 'Income Statement', category: 'Other Income', fsGroup: 'Other Income' },

  // NON-CURRENT ASSETS (5000 series)
  { id: '5000-000', accountNumber: '5000-000', description: 'Land & Buildings - Net Value', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-001', accountNumber: '5000-001', description: 'Land & Buildings - At Cost', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-002', accountNumber: '5000-002', description: 'Land & Buildings - Accumulated Depreciation', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-003', accountNumber: '5000-003', description: 'Motor Vehicles - Net Value', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-004', accountNumber: '5000-004', description: 'Motor Vehicles - At Cost', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-005', accountNumber: '5000-005', description: 'Motor Vehicles - Accumulated Depreciation', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-006', accountNumber: '5000-006', description: 'Computer Equipment - Net Value', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-007', accountNumber: '5000-007', description: 'Computer Equipment - At Cost', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-008', accountNumber: '5000-008', description: 'Computer Equipment - Accumulated Depreciation', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-009', accountNumber: '5000-009', description: 'Office Equipment - Net Value', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-010', accountNumber: '5000-010', description: 'Office Equipment - At Cost', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-011', accountNumber: '5000-011', description: 'Office Equipment - Accumulated Depreciation', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-012', accountNumber: '5000-012', description: 'Furniture & Fittings - Net Value', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-013', accountNumber: '5000-013', description: 'Furniture & Fittings - At Cost', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-014', accountNumber: '5000-014', description: 'Furniture & Fittings - Accumulated Depreciation', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-015', accountNumber: '5000-015', description: 'Other Fixed Assets - Net Value', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-016', accountNumber: '5000-016', description: 'Other Fixed Assets - At Cost', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-017', accountNumber: '5000-017', description: 'Other Fixed Assets - Accumulated Depreciation', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Property, plant and equipment' },
  { id: '5000-018', accountNumber: '5000-018', description: 'Investment Property', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Investment property' },
  { id: '5000-019', accountNumber: '5000-019', description: 'Investments', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Other financial assets' },
  { id: '5000-020', accountNumber: '5000-020', description: 'Deferred Tax Asset', section: 'Balance Sheet', category: 'Non-Current Assets', fsGroup: 'Deferred tax asset', fsNote: 'Note 7: Taxation' },

  // CURRENT LIABILITIES & PROVISIONS (7000 series)
  { id: '7000-000', accountNumber: '7000-000', description: 'Supplier Control Account', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-001', accountNumber: '7000-001', description: 'GRN Accrual Account', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-002', accountNumber: '7000-002', description: 'Sundry Suppliers', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-003', accountNumber: '7000-003', description: 'Provision for Future Expenses', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Provisions' },
  { id: '7000-004', accountNumber: '7000-004', description: 'Provision for Insurance', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Provisions' },
  { id: '7000-005', accountNumber: '7000-005', description: 'Provision for Salary Bonus', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Provisions' },
  { id: '7000-006', accountNumber: '7000-006', description: 'Provision for Leave Pay', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Provisions' },
  { id: '7000-007', accountNumber: '7000-007', description: 'Accrued Expenses (General)', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-008', accountNumber: '7000-008', description: 'VAT / Tax Control Account', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-011', accountNumber: '7000-011', description: 'PAYE Control', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-012', accountNumber: '7000-012', description: 'UIF Control', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-013', accountNumber: '7000-013', description: 'SDL Control', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-014', accountNumber: '7000-014', description: 'VAT / Tax Provision Account', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '7000-015', accountNumber: '7000-015', description: 'Income Tax Payable', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Current tax payable', fsNote: 'Note 7: Taxation' },

  // NON-CURRENT LIABILITIES (7500 series)
  { id: '7500-000', accountNumber: '7500-000', description: 'Long-Term Liabilities', section: 'Balance Sheet', category: 'Non-Current Liabilities', fsGroup: 'Other financial liabilities' },
  { id: '7500-001', accountNumber: '7500-001', description: 'Instalment Sale Creditors', section: 'Balance Sheet', category: 'Non-Current Liabilities', fsGroup: 'Other financial liabilities' },
  { id: '7500-002', accountNumber: '7500-002', description: 'Deferred Tax Liability', section: 'Balance Sheet', category: 'Non-Current Liabilities', fsGroup: 'Deferred tax liability', fsNote: 'Note 7: Taxation' },

  // CURRENT ASSETS & BANK (8000 series)
  { id: '8000-000', accountNumber: '8000-000', description: 'Inventory Control Account', section: 'Balance Sheet', category: 'Current Assets', fsGroup: 'Inventories' },
  { id: '8000-001', accountNumber: '8000-001', description: 'Customer Control Account', section: 'Balance Sheet', category: 'Current Assets', fsGroup: 'Trade and other receivables' },
  { id: '8000-002', accountNumber: '8000-002', description: 'Sundry Customers', section: 'Balance Sheet', category: 'Current Assets', fsGroup: 'Trade and other receivables' },
  { id: '8000-003', accountNumber: '8000-003', description: 'Provisional Tax Payments', section: 'Balance Sheet', category: 'Current Assets', fsGroup: 'Current tax receivable', fsNote: 'Note 7: Taxation' },
  { id: '8000-004', accountNumber: '8000-004', description: 'Bank - Current Account', section: 'Balance Sheet', category: 'Current Assets', fsGroup: 'Cash and cash equivalents', fsNote: 'Note 2: Cash and cash equivalents' },
  { id: '8000-005', accountNumber: '8000-005', description: 'Customer Receipts Control Account', section: 'Balance Sheet', category: 'Current Assets', fsGroup: 'Trade and other receivables' },

  // EQUITY & SHAREHOLDER LOANS (9000 series)
  { id: '9000-000', accountNumber: '9000-000', description: 'Share Capital', section: 'Balance Sheet', category: 'Equity', fsGroup: 'Share capital', fsNote: 'Note 3: Share capital' },
  { id: '9000-001', accountNumber: '9000-001', description: 'Shareholder Loan Account', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Loans from shareholders', fsNote: 'Note 4: Loans from shareholders' },
  { id: '9000-002', accountNumber: '9000-002', description: 'Drawings / Dividends Paid', section: 'Balance Sheet', category: 'Equity', fsGroup: 'Retained income / (Accumulated loss)' },
  { id: '9000-003', accountNumber: '9000-003', description: 'Current Year Profit / (Loss)', section: 'Balance Sheet', category: 'Equity', fsGroup: 'Retained income / (Accumulated loss)' },
  { id: '9000-004', accountNumber: '9000-004', description: 'Retained Income / (Accumulated Loss)', section: 'Balance Sheet', category: 'Equity', fsGroup: 'Retained income / (Accumulated loss)' },

  // SUSPENSE ACCOUNTS (9500 series)
  { id: '9500-001', accountNumber: '9500-001', description: 'Unallocated Suspense', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
  { id: '9500-002', accountNumber: '9500-002', description: 'Opening Balance / Suspense Account', section: 'Balance Sheet', category: 'Equity', fsGroup: 'Retained income / (Accumulated loss)' },
  { id: '9500-003', accountNumber: '9500-003', description: 'Bank Transfer Suspense', section: 'Balance Sheet', category: 'Current Assets', fsGroup: 'Cash and cash equivalents', fsNote: 'Note 2: Cash and cash equivalents' },
  { id: '9500-004', accountNumber: '9500-004', description: 'Unpaid Suspense', section: 'Balance Sheet', category: 'Current Liabilities', fsGroup: 'Trade and other payables' },
];

export function setMasterChartOfAccounts(newAccounts: ChartOfAccount[]) {
  chartOfAccounts = newAccounts;
}

export const balanceSheetControlAccounts: ChartOfAccount[] = chartOfAccounts.filter(
  acc => acc.section === 'Balance Sheet'
);

export function getBalanceSheetControlAccounts(): ChartOfAccount[] {
  return chartOfAccounts.filter(acc => acc.section === 'Balance Sheet');
}
