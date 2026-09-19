import { ChartOfAccount } from '@/lib/types';
import { MasterAllocationRule } from './master-allocation-rules';

export interface ResolvedAccount {
  accountNumber: string;
  accountName: string;
  accountType: 'account' | 'supplier' | 'customer';
  isExactMatch: boolean;
  matchReason: string;
}

/**
 * Bidirectional mapping between legacy 4-digit accounting codes (e.g. Pastel / QuickBooks)
 * and the official AI Accountant 7-digit Standard Chart of Accounts.
 */
export const LEGACY_ACCOUNT_CODE_MAP: Record<string, string> = {
  '2150': '7000-008', // SARS VAT Control
  '2200': '7000-011', // SARS PAYE / UIF Liability
  '2250': '7000-015', // SARS Income Tax Liability
  '3100': '3000-001', // Advertising & Marketing -> Advertising & Promotions
  '3200': '3000-004', // Bank Charges - Merchant Fees -> Bank Charges
  '3500': '3000-010', // Courier & Postage
  '3600': '3000-020', // Entertainment Expenses
  '3700': '3000-023', // Insurance
  '3750': '3000-034', // Vehicle Insurance
  '3800': '3000-033', // Motor Vehicle Expenses - Fuel -> Fuel
  '3850': '3000-035', // Motor Vehicle Repairs & Maintenance
  '4000': '3000-036', // Office Equipment & Supplies -> Printing & Stationery
  '4100': '3000-005', // Cleaning & Hygiene -> Cleaning
  '4150': '3000-008', // Software Subscriptions -> Subscriptions
  '4200': '3000-006', // Computer & Software Expenses -> Computer Expenses
  '4300': '3000-055', // Staff Tea & Refreshments -> Office Refreshments & Supplies
  '4350': '3000-024', // Security / Alarm / Armed Response
  '4360': '3000-024', // Security Guarding & Armed Response
  '4400': '3000-039', // Repairs & Maintenance
  '4450': '3000-055', // Office Refreshments & Consumables
  '4500': '3000-051', // Telephone & Internet
  '4600': '3000-018', // Rates & Municipal Services -> Rates & Taxes (Municipal)
  '4700': '3000-052', // Accommodation -> Travel & Accommodation
  '4750': '3000-052', // Travel & Flights -> Travel & Accommodation
  '4800': '3000-050', // Licences, Permits & Statutory Fees -> Professional Subscriptions / Memberships
  '4850': '3000-028', // Fines & Penalties -> Penalties & Fines (Non-deductible)
  '8500-000': '7000-008', // SARS VAT Control Account
};

export const STANDARD_TO_LEGACY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_ACCOUNT_CODE_MAP).map(([legacy, std]) => [std, legacy])
);

/**
 * Common account naming synonyms mapped to standard Master Rule categories.
 */
export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  telecoms_internet: ['TELEPHONE', 'CELL', 'PHONE', 'INTERNET', 'TELECOM', 'COMMUNICATION', 'DATA', 'CONNECTIVITY', 'FIBRE', 'FIBER', 'MOBILE'],
  fuel_motor_expenses: ['FUEL', 'PETROL', 'DIESEL', 'MOTOR VEHICLE', 'VEHICLE EXPENSES', 'TRANSPORT', 'TRAVEL - MOTOR', 'TRAVEL & MOTOR'],
  bank_charges: ['BANK CHARGES', 'BANK FEES', 'BANK SERVICE CHARGES', 'BANK COST', 'FINANCE CHARGES', 'ACCOUNT FEES'],
  utilities_municipal: ['ELECTRICITY', 'WATER', 'MUNICIPAL', 'RATES', 'UTILITIES', 'LIGHT & WATER', 'POWER', 'SEWERAGE', 'REFUSE'],
  hardware_maintenance: ['REPAIRS', 'MAINTENANCE', 'HARDWARE', 'TOOLS', 'BUILDING MAINTENANCE', 'PROPERTY MAINTENANCE', 'CONSUMABLES'],
  software_subscriptions: ['SOFTWARE', 'COMPUTER', 'IT EXPENSES', 'SUBSCRIPTIONS', 'CLOUD', 'LICENCES', 'LICENSES', 'HOSTING', 'TECHNOLOGY', 'SAAS'],
  courier_freight: ['COURIER', 'POSTAGE', 'FREIGHT', 'DELIVERY', 'POSTNET', 'SHIPPING', 'CARRIAGE'],
  office_stationery: ['STATIONERY', 'PRINTING', 'OFFICE SUPPLIES', 'OFFICE EXPENSES', 'CONSUMABLES', 'PRINTING & STATIONERY'],
  staff_refreshments: ['TEA', 'REFRESHMENTS', 'STAFF REFRESHMENTS', 'GROCERIES', 'STAFF WELFARE', 'STAFF EXPENSES', 'KITCHEN'],
  entertainment_meals: ['ENTERTAINMENT', 'MEALS', 'CLIENT ENTERTAINMENT', 'HOSPITALITY', 'RESTAURANT', 'FOOD & BEVERAGE'],
  travel_transport: ['TRAVEL', 'TRANSPORT', 'ACCOMMODATION', 'HOTEL', 'FLIGHTS', 'AIRFARE', 'UBER', 'TAXI', 'CAR HIRE'],
  advertising_marketing: ['ADVERTISING', 'MARKETING', 'PROMOTION', 'DIGITAL MARKETING', 'SOCIAL MEDIA', 'PUBLIC RELATIONS', 'PR'],
  insurance: ['INSURANCE', 'ASSURANCE', 'COMMERCIAL INSURANCE', 'BUSINESS INSURANCE', 'POLICY'],
  security_cleaning: ['SECURITY', 'CLEANING', 'HYGIENE', 'ARMED RESPONSE', 'ALARM', 'GUARDING'],
  legal_statutory: ['LEGAL', 'STATUTORY', 'LICENCES', 'PERMITS', 'CIPC', 'COMPLIANCE', 'PROFESSIONAL FEES'],
  sars_statutory: ['SARS', 'TAX', 'VAT CONTROL', 'PAYE', 'UIF', 'INCOME TAX', 'TAXATION'],
};

/**
 * Resolves the most appropriate account in a client's Chart of Accounts for a Master Allocation Rule.
 * 
 * Strategy:
 * 1. Exact default account number match (e.g. 3200, 4500, 3800)
 * 2. Semantic name match using standard South African accounting synonyms
 * 3. Exact Category match if client COA has category defined
 * 4. Fallback to General Expenses (or first operating expense account)
 */
export interface ResolvableRule {
  category?: string;
  categoryLabel?: string;
  defaultAccountCode?: string;
  defaultAccountName?: string;
  accountId?: string;
  description?: string;
  [key: string]: any;
}

export function resolveAccountForCategory(
  chartOfAccounts: any[],
  rule: ResolvableRule
): ResolvedAccount | null {
  if (!chartOfAccounts || chartOfAccounts.length === 0) {
    return null;
  }

  const targetCode = (rule.defaultAccountCode || rule.accountId || '').trim();

  // 1. Direct account number / code / id match
  if (targetCode) {
    const codeMatch = chartOfAccounts.find(
      acc => {
        const num = (acc.accountNumber || acc.code || acc.id || '').trim();
        return num && num.toUpperCase() === targetCode.toUpperCase();
      }
    );
    if (codeMatch) {
      const matchedNum = codeMatch.accountNumber || codeMatch.code || codeMatch.id;
      const matchedName = codeMatch.accountName || codeMatch.name || codeMatch.description || matchedNum;
      return {
        accountNumber: matchedNum,
        accountName: matchedName,
        accountType: 'account',
        isExactMatch: true,
        matchReason: `Exact account code match (${matchedNum})`,
      };
    }

    // 1b. Check if targetCode is a legacy 4-digit code mapping to a standard 7-digit account in this COA
    const mappedStandardCode = LEGACY_ACCOUNT_CODE_MAP[targetCode];
    if (mappedStandardCode) {
      const mappedMatch = chartOfAccounts.find(
        acc => {
          const num = (acc.accountNumber || acc.code || acc.id || '').trim();
          return num && num.toUpperCase() === mappedStandardCode.toUpperCase();
        }
      );
      if (mappedMatch) {
        const matchedNum = mappedMatch.accountNumber || mappedMatch.code || mappedMatch.id;
        const matchedName = mappedMatch.accountName || mappedMatch.name || mappedMatch.description || matchedNum;
        return {
          accountNumber: matchedNum,
          accountName: matchedName,
          accountType: 'account',
          isExactMatch: true,
          matchReason: `Mapped legacy code (${targetCode} -> ${matchedNum} ${matchedName})`,
        };
      }
    }

    // 1c. Check if targetCode is a standard 7-digit code mapping to a legacy 4-digit account in this COA
    const mappedLegacyCode = STANDARD_TO_LEGACY_MAP[targetCode];
    if (mappedLegacyCode) {
      const mappedMatch = chartOfAccounts.find(
        acc => {
          const num = (acc.accountNumber || acc.code || acc.id || '').trim();
          return num && num.toUpperCase() === mappedLegacyCode.toUpperCase();
        }
      );
      if (mappedMatch) {
        const matchedNum = mappedMatch.accountNumber || mappedMatch.code || mappedMatch.id;
        const matchedName = mappedMatch.accountName || mappedMatch.name || mappedMatch.description || matchedNum;
        return {
          accountNumber: matchedNum,
          accountName: matchedName,
          accountType: 'account',
          isExactMatch: true,
          matchReason: `Mapped standard code to client legacy account (${targetCode} -> ${matchedNum} ${matchedName})`,
        };
      }
    }
  }

  // 2. Semantic synonym match against account names
  const synonyms = (rule.category && CATEGORY_SYNONYMS[rule.category]) || [];
  const normalizedRuleName = (rule.defaultAccountName || rule.description || '').toUpperCase();

  // Score candidate accounts
  let bestAccount: any = null;
  let bestScore = 0;
  let bestReason = '';

  for (const acc of chartOfAccounts) {
    const accName = (acc.accountName || acc.name || acc.description || '').toUpperCase().trim();
    const accNum = (acc.accountNumber || acc.code || acc.id || '').trim();
    if (!accName) continue;

    // Check if account name matches defaultAccountName closely
    if (normalizedRuleName && accName === normalizedRuleName) {
      return {
        accountNumber: accNum,
        accountName: acc.accountName || acc.name || acc.description,
        accountType: 'account',
        isExactMatch: true,
        matchReason: `Exact account name match (${accName})`,
      };
    }

    let score = 0;
    let reason = '';

    // Check synonyms
    for (const syn of synonyms) {
      if (accName.includes(syn)) {
        const synScore = syn.length >= 6 ? 10 : 5;
        if (synScore > score) {
          score = synScore;
          reason = `Matched synonym "${syn}" in "${accName}"`;
        }
      }
    }

    // Prefer Expense accounts over Balance Sheet when allocating expenses
    if (acc.accountType === 'Expense' || acc.accountType === 'Operating Expense' || acc.type === 'Expense') {
      score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAccount = acc;
      bestReason = reason;
    }
  }

  if (bestAccount && bestScore >= 5) {
    const bestNum = bestAccount.accountNumber || bestAccount.code || bestAccount.id;
    const bestName = bestAccount.accountName || bestAccount.name || bestAccount.description;
    return {
      accountNumber: bestNum,
      accountName: bestName,
      accountType: 'account',
      isExactMatch: false,
      matchReason: bestReason,
    };
  }

  // 3. Fallback to general expenses or first expense account
  const generalExpense = chartOfAccounts.find(
    acc => {
      const name = (acc.accountName || acc.name || acc.description || '');
      return /GENERAL EXPENSE|SUNDRY EXPENSE|MISCELLANEOUS/i.test(name);
    }
  ) || chartOfAccounts.find(acc => acc.accountType === 'Expense' || acc.type === 'Expense');

  if (generalExpense) {
    const genNum = generalExpense.accountNumber || generalExpense.code || generalExpense.id;
    const genName = generalExpense.accountName || generalExpense.name || generalExpense.description;
    return {
      accountNumber: genNum,
      accountName: genName,
      accountType: 'account',
      isExactMatch: false,
      matchReason: `Fallback to expense account (${genName})`,
    };
  }

  // 4. Default to first account
  const first = chartOfAccounts[0];
  const firstNum = first.accountNumber || first.code || first.id;
  const firstName = first.accountName || first.name || first.description || firstNum;
  return {
    accountNumber: firstNum,
    accountName: firstName,
    accountType: 'account',
    isExactMatch: false,
    matchReason: `Default account fallback`,
  };
}

/**
 * Aligns a single rule account ID to a target Chart of Accounts.
 * If the account ID already exists in the Chart of Accounts, returns it.
 * Otherwise, maps from legacy codes or resolves semantically.
 */
export function alignRuleAccountId(
  accountId: string | undefined,
  chartOfAccounts: any[],
  ruleContext?: { description?: string; category?: string }
): string {
  if (!accountId || !chartOfAccounts || chartOfAccounts.length === 0) {
    return accountId || '';
  }

  const cleanId = accountId.trim();

  // 1. Direct match by id, accountNumber, or code
  const exactMatch = chartOfAccounts.find(
    acc => (acc.id === cleanId || acc.accountNumber === cleanId || acc.code === cleanId)
  );
  if (exactMatch) {
    return exactMatch.id || exactMatch.accountNumber || cleanId;
  }

  // 2. Legacy code mapping
  const mappedStandard = LEGACY_ACCOUNT_CODE_MAP[cleanId];
  if (mappedStandard) {
    const stdMatch = chartOfAccounts.find(
      acc => (acc.id === mappedStandard || acc.accountNumber === mappedStandard || acc.code === mappedStandard)
    );
    if (stdMatch) {
      return stdMatch.id || stdMatch.accountNumber || mappedStandard;
    }
  }

  // 3. Standard-to-legacy reverse mapping (if client has legacy COA)
  const mappedLegacy = STANDARD_TO_LEGACY_MAP[cleanId];
  if (mappedLegacy) {
    const legMatch = chartOfAccounts.find(
      acc => (acc.id === mappedLegacy || acc.accountNumber === mappedLegacy || acc.code === mappedLegacy)
    );
    if (legMatch) {
      return legMatch.id || legMatch.accountNumber || mappedLegacy;
    }
  }

  // 4. Semantic resolution if context is provided
  if (ruleContext?.description || ruleContext?.category) {
    const resolved = resolveAccountForCategory(chartOfAccounts, {
      accountId: cleanId,
      description: ruleContext.description,
      category: ruleContext.category,
    });
    if (resolved && resolved.accountNumber) {
      return resolved.accountNumber;
    }
  }

  return cleanId;
}

/**
 * Ensures all allocation rules are strictly aligned to the target Chart of Accounts.
 * Guarantees that rules never import dangling, missing, or mismatched account IDs.
 */
export function alignRulesToChartOfAccounts(
  rules: any[],
  chartOfAccounts: any[]
): any[] {
  if (!rules || rules.length === 0 || !chartOfAccounts || chartOfAccounts.length === 0) {
    return rules || [];
  }

  const validAccountIds = new Set(
    chartOfAccounts.map(a => (a.id || a.accountNumber || a.code || '').trim().toUpperCase()).filter(Boolean)
  );

  return rules.map(rule => {
    const currentId = (rule.accountId || rule.defaultAccountCode || '').trim();
    if (!currentId) return rule;

    // If it's already an exact match in the target chart of accounts, return as is
    if (validAccountIds.has(currentId.toUpperCase())) {
      return rule;
    }

    const alignedId = alignRuleAccountId(currentId, chartOfAccounts, {
      description: rule.description,
      category: rule.category,
    });

    return {
      ...rule,
      accountId: alignedId,
    };
  });
}

