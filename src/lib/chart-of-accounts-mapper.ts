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
