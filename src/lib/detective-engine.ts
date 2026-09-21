/**
 * @fileOverview Pure 9-Clue Detective Allocation Engine for AI Accountant.
 * Evaluates Tier 1 local heuristics and Tier 2 Gemini web grounding to produce
 * composite confidence scores, canonical VAT types, rule scoping, and explainable visual badges.
 */

import { BankCleaner, NATIONAL_ROOT_BRANDS, PaymentChannel, StructuralClues, matchesRuleKeyword } from './bank-cleaner';
import { MASTER_ALLOCATION_RULES, MasterAllocationRule, SORTED_MASTER_ALLOCATION_RULES } from './master-allocation-rules';
import { resolveAccountForCategory } from './chart-of-accounts-mapper';
import { AllocationRule } from './types';
import { CanonicalVatType } from './vat-types';

export type ClueType =
  | 'timing'
  | 'amount'
  | 'prefix'
  | 'reference'
  | 'cross_ref'
  | 'sweep'
  | 'structure'
  | 'web';

export interface ClueBadge {
  type: ClueType;
  label: string;
  detail: string;
  confidenceContribution: number;
}

export interface DetectiveInputTransaction {
  id?: string;
  description: string;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD
  isExpense?: boolean;
  bankAccountId?: string;
  paymentChannel?: PaymentChannel;
  merchantKey?: string;
  cleanDescription?: string;
  branchLocation?: string;
  structuralClues?: StructuralClues;
  reference?: string;
}

export interface DetectiveContext {
  allBatchTransactions?: DetectiveInputTransaction[];
  clientRules?: AllocationRule[];
  globalRules?: AllocationRule[];
  masterRules?: MasterAllocationRule[];
  historyConsistencyMap?: Map<string, { accountId: string; vatType: CanonicalVatType; accountType?: string }>;
  historicalTransactions?: Array<{
    description?: string;
    merchantKey?: string;
    allocatedTo?: { value: string; type: string };
    vatType?: string;
    status?: string;
    isExpense?: boolean;
    amount?: number;
  }>;
  openInvoices?: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    contactName: string;
  }>;
  chartOfAccounts?: Array<{
    id?: string;
    accountNumber?: string;
    accountName?: string;
    description?: string;
    name?: string;
    code?: string;
  }>;
  isVatRegistered?: boolean;
}

export interface WebGroundingResult {
  merchantName?: string;
  merchantCategory?: string;
  cipcRegistered?: boolean;
  vatVendorStatus?: 'registered' | 'unregistered' | 'exempt' | 'unknown';
  suggestedAccountId?: string;
  suggestedVatType?: CanonicalVatType;
  confidence?: number;
  rationale?: string;
  suggestedKeyword?: string;
}

export interface DetectiveAnalysisResult {
  merchantKey: string;
  cleanDescription: string;
  compositeConfidence: number; // 0 - 100
  suggestedAccountId: string;
  suggestedAccountLabel?: string;
  suggestedVatType: CanonicalVatType;
  badges: ClueBadge[];
  ruleScoping: 'client' | 'global_practice';
  isAutoAllocatable: boolean; // compositeConfidence >= 80
  status: 'reviewed' | 'ai_review';
  isInterAccountSweep?: boolean;
  sweepCounterpartTxId?: string;
}

// ============================================================================
// DATE PARSING UTILITY (Timezone-agnostic)
// ============================================================================

export function parseDateParts(dateStr: string): { day: number; month: number; year: number } {
  if (!dateStr) return { day: 0, month: 0, year: 0 };
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10)
    };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate()
    };
  }
  return { day: 0, month: 0, year: 0 };
}

// ============================================================================
// CLUE 1: TIMING / CALENDAR HEURISTICS
// ============================================================================

export function evaluateTimingClue(dateStr: string, description: string): ClueBadge[] {
  const { day, month } = parseDateParts(dateStr);
  if (day === 0) return [];
  const badges: ClueBadge[] = [];

  // SARS Provisional Tax (Aug and Feb, late month)
  if ((month === 8 || month === 2) && day >= 20 && /SARS|PROV|IRP6|PROVISIONAL|TAX/i.test(description)) {
    badges.push({
      type: 'timing',
      label: 'SARS Provisional Tax Window (Aug/Feb)',
      detail: `Day ${day} Month ${month}: Aligned with bi-annual SARS Provisional Tax (IRP6) payment deadline`,
      confidenceContribution: 35
    });
    return badges;
  }

  // SARS VAT201 Window (25th to month-end)
  if (day >= 25 && day <= 31 && /SARS|VAT201|VAT\b/i.test(description)) {
    badges.push({
      type: 'timing',
      label: 'SARS VAT201 Window (25th-Month End)',
      detail: `Day ${day}: Aligned with bi-monthly SARS VAT201 filing and payment deadline`,
      confidenceContribution: 30
    });
    return badges;
  }

  // SARS EMP201 Deadline (1st to 7th)
  if (day >= 1 && day <= 7 && /SARS|EMP201|PAYE|UIF|SDL/i.test(description)) {
    badges.push({
      type: 'timing',
      label: 'SARS EMP201 Deadline (7th)',
      detail: `Day ${day}: Aligned with SARS EMP201 monthly payroll tax filing deadline`,
      confidenceContribution: 30
    });
    return badges;
  }

  // Payroll Window (25th to month-end)
  if (day >= 25 && day <= 31) {
    const isPayroll = /SALAR|WAGE|PAYROLL|REMUNERATION|STAFF|DIRECTOR/i.test(description);
    badges.push({
      type: 'timing',
      label: isPayroll ? 'Payroll Window (25th-Month End)' : 'End of Month Cycle',
      detail: `Day ${day}: Common payroll and statutory VAT filing window`,
      confidenceContribution: 25
    });
    return badges;
  }

  // Start of Month (1st to 7th)
  if (day >= 1 && day <= 7) {
    const isMunicipal = /CITY OF|MUNICIPALITY|RATES|WATER|ELECTRICITY|ESKOM/i.test(description);
    badges.push({
      type: 'timing',
      label: isMunicipal ? 'Municipal Utility Cycle' : 'Start of Month Billing (Start-of-Month 1st-7th)',
      detail: `Day ${day}: Common debit order and municipal utility cycle`,
      confidenceContribution: isMunicipal ? 20 : 25
    });
    return badges;
  }

  return badges;
}

// ============================================================================
// CLUE 2: AMOUNT CONTEXT HEURISTICS
// ============================================================================

export function evaluateAmountClue(
  amount: number,
  description: string,
  history?: Array<{ amount?: number; isExpense?: boolean }>,
  openInvoices?: Array<{ id: string; invoiceNumber: string; totalAmount: number; contactName: string }>
): { badges: ClueBadge[]; suggestedAccountId?: string; suggestedVatType?: CanonicalVatType } {
  const badges: ClueBadge[] = [];
  let suggestedAccountId: string | undefined;
  let suggestedVatType: CanonicalVatType | undefined;
  const absAmount = Math.abs(amount);

  // 1. Open Invoice match
  if (openInvoices && openInvoices.length > 0) {
    const matchedInvoice = openInvoices.find(inv => Math.abs(inv.totalAmount - absAmount) < 0.01);
    if (matchedInvoice) {
      badges.push({
        type: 'amount',
        label: 'Open Invoice Match',
        detail: `Matches open invoice ${matchedInvoice.invoiceNumber} (${matchedInvoice.contactName})`,
        confidenceContribution: 40
      });
      return { badges, suggestedAccountId: '2000-001', suggestedVatType: 'standard_rated_sales' };
    }
  }

  // 2. Round thousand drawings (director transfer, loan, etc.)
  if (absAmount >= 1000 && absAmount % 1000 === 0 && /DIRECTOR|DRAWING|MEMBER|OWNER|LOAN/i.test(description)) {
    badges.push({
      type: 'amount',
      label: 'Round Thousand Drawings',
      detail: 'Round figure characteristic of owner/director drawings or loan account movements',
      confidenceContribution: 20
    });
    suggestedAccountId = '5000-001';
    suggestedVatType = 'no_vat';
  }

  // 3. Recurring Fixed Amount across history
  if (history && history.length >= 2) {
    const sameAmountCount = history.filter(h => Math.abs(Math.abs(h.amount || 0) - absAmount) < 0.01).length;
    if (sameAmountCount >= 2) {
      badges.push({
        type: 'amount',
        label: 'Recurring Fixed Amount',
        detail: `Exact amount R ${absAmount.toFixed(2)} recurred across ${sameAmountCount} prior statements`,
        confidenceContribution: 25
      });
    }
  }

  // 4. Exact 15% Standard SA VAT Math
  const vatPortion = (absAmount * 15) / 115;
  const isExactCentVat = Math.abs(vatPortion - Math.round(vatPortion)) < 0.01;
  if (isExactCentVat && absAmount >= 100) {
    badges.push({
      type: 'amount',
      label: '15% VAT Exact Factor',
      detail: `Amount R ${absAmount.toFixed(2)} divides evenly into 15% standard VAT (R ${vatPortion.toFixed(2)}) and net base`,
      confidenceContribution: 15
    });
  }

  return { badges, suggestedAccountId, suggestedVatType };
}

// ============================================================================
// CLUE 3: PREFIX / CHANNEL INTENT DECODING
// ============================================================================

export function evaluatePrefixClue(channel: PaymentChannel, description: string): {
  badge: ClueBadge | null;
  suggestedAccountId?: string;
  suggestedVatType?: CanonicalVatType;
} {
  if (channel === 'FEE' || /\b(?:BANK\s*FEES?|SERVICE\s*FEES?|MONTHLY\s*ACCOUNT\s*FEE|TRANSACTION\s*FEE|CASH\s*DEPOSIT\s*FEE)\b/i.test(description)) {
    return {
      badge: {
        type: 'prefix',
        label: 'Bank Service Fee',
        detail: 'Official financial institution service charge / tariff',
        confidenceContribution: 50
      },
      suggestedAccountId: '3000-004',
      suggestedVatType: 'exempt_purchases'
    };
  }

  if (channel === 'DEBIT_ORDER' || /DEBIT\s*ORDER/i.test(description)) {
    return {
      badge: {
        type: 'prefix',
        label: 'Contractual Debit Order',
        detail: 'Recurring contractual payment agreement (NAEDO/AEDO/DebiCheck)',
        confidenceContribution: 20
      }
    };
  }

  if (channel === 'POS' || channel === 'CARD' || /POS\s*PURCHASE|CARD\s*PURCHASE/i.test(description)) {
    return {
      badge: {
        type: 'prefix',
        label: 'Discretionary Card / POS',
        detail: 'Direct card merchant transaction',
        confidenceContribution: 15
      }
    };
  }

  if (channel === 'ATM' || /ATM\s*CASH|CASH\s*W\/D|ATM\s*W\/D/i.test(description)) {
    return {
      badge: {
        type: 'prefix',
        label: 'Cash ATM Withdrawal',
        detail: 'Cash withdrawal at automated teller machine',
        confidenceContribution: 25
      },
      suggestedAccountId: '1000-002',
      suggestedVatType: 'no_vat'
    };
  }

  if (channel === 'EFT' || channel === 'RTC' || /EFT\s*PAYMENT|RTC\s*TRANSFER/i.test(description)) {
    return {
      badge: {
        type: 'prefix',
        label: 'Electronic Funds Transfer',
        detail: 'Electronic funds transfer between bank accounts',
        confidenceContribution: 15
      }
    };
  }

  return { badge: null };
}

// ============================================================================
// CLUE 4: REFERENCE DECODING (SARS PRNs & STATUTORY LIABILITIES)
// ============================================================================

export function evaluateReferenceClue(
  description: string,
  structuralClues?: StructuralClues
): {
  badge: ClueBadge | null;
  suggestedAccountId?: string;
  suggestedVatType?: CanonicalVatType;
} {
  const prn = structuralClues?.prn;
  const isSars = Boolean(prn) || /SARSEFLNG|SARS\s*VAT|VAT201|EMP201|PROV\s*TAX|IRP6|PAYE/i.test(description);

  if (!isSars) {
    const invMatch = description.match(/\b(?:INV|INVOICE|TAX\s*INV)\s*#?\s*([A-Z0-9-]{3,15})\b/i);
    if (invMatch) {
      return {
        badge: {
          type: 'reference',
          label: `Ref: Invoice #${invMatch[1]}`,
          detail: 'Formatted sequential tax invoice reference',
          confidenceContribution: 20
        }
      };
    }
    return { badge: null };
  }

  // 1. VAT201
  const isVat = /VAT201|SARS\s*VAT|194\d{16}/i.test(description) || (prn && prn.startsWith('194'));
  if (isVat) {
    return {
      badge: {
        type: 'reference',
        label: 'SARS VAT201 PRN',
        detail: 'Statutory VAT payment allocated to Balance Sheet liability (no_vat)',
        confidenceContribution: 55
      },
      suggestedAccountId: '7000-008',
      suggestedVatType: 'no_vat'
    };
  }

  // 2. EMP201
  const isEmp = /EMP201|PAYE|UIF|SDL|195\d{16}/i.test(description) || (prn && prn.startsWith('195'));
  if (isEmp) {
    return {
      badge: {
        type: 'reference',
        label: 'SARS EMP201 PRN',
        detail: 'Statutory PAYE / UIF payment allocated to Balance Sheet liability (no_vat)',
        confidenceContribution: 55
      },
      suggestedAccountId: '7000-011',
      suggestedVatType: 'no_vat'
    };
  }

  // 3. Provisional Tax / Income Tax
  return {
    badge: {
      type: 'reference',
      label: 'SARS Provisional Tax',
      detail: 'Income tax provisional settlement allocated to Balance Sheet liability (no_vat)',
      confidenceContribution: 55
    },
    suggestedAccountId: '7000-015',
    suggestedVatType: 'no_vat'
  };
}

// ============================================================================
// CLUE 5: CROSS-REFERENCING (CLIENT HISTORICAL LEDGER MEMORY)
// ============================================================================

export function evaluateCrossReferenceClue(
  merchantKey: string,
  cleanDescription: string,
  history?: Array<{
    merchantKey?: string;
    description?: string;
    allocatedTo?: { value: string; type: string };
    vatType?: string;
    status?: string;
  }>,
  consistencyMap?: Map<string, { accountId: string; vatType: CanonicalVatType; accountType?: string }>
): {
  badge: ClueBadge | null;
  suggestedAccountId?: string;
  suggestedVatType?: CanonicalVatType;
} {
  const normKey = merchantKey.toUpperCase().trim();
  const normClean = cleanDescription.toUpperCase().trim();

  // Fast O(1) path if pre-built consistency map is provided
  if (consistencyMap && (consistencyMap.has(merchantKey) || consistencyMap.has(normKey) || consistencyMap.has(cleanDescription) || consistencyMap.has(normClean))) {
    const match = consistencyMap.get(merchantKey) ||
      consistencyMap.get(normKey) ||
      consistencyMap.get(cleanDescription) ||
      consistencyMap.get(normClean)!;
    if (match && match.accountId) {
      return {
        badge: {
          type: 'cross_ref',
          label: 'Past Ledger Consistency',
          detail: `100% consistent past allocation history for this client (${match.accountId})`,
          confidenceContribution: 40
        },
        suggestedAccountId: match.accountId,
        suggestedVatType: match.vatType || 'standard_rated_purchases'
      };
    }
  }

  if (!history || history.length === 0) return { badge: null };

  const matching = history.filter(h => {
    const isReviewed = h.status === 'reviewed' || h.status === 'allocated';
    if (!isReviewed || !h.allocatedTo?.value) return false;
    const hKey = (h.merchantKey || '').toUpperCase().trim();
    const hDesc = (h.description || '').toUpperCase().trim();
    return (hKey && hKey === normKey) || (hDesc && (hDesc === normClean || hDesc.includes(normClean) || normClean.includes(hDesc)));
  });

  if (matching.length === 0) return { badge: null };

  const firstAccount = matching[0].allocatedTo!.value;
  const firstVat = matching[0].vatType as CanonicalVatType;
  const is100Consistent = matching.every(m => m.allocatedTo?.value === firstAccount);

  if (is100Consistent) {
    return {
      badge: {
        type: 'cross_ref',
        label: 'Past Ledger Consistency',
        detail: `100% consistent past allocation history for this client (${firstAccount}) across ${matching.length} transaction(s)`,
        confidenceContribution: 40
      },
      suggestedAccountId: firstAccount,
      suggestedVatType: firstVat || 'standard_rated_purchases'
    };
  }

  return { badge: null };
}

// ============================================================================
// CLUE 6: STATISTICAL SWEEPS (INTER-ACCOUNT TRANSFERS WITHIN 3 DAYS)
// ============================================================================

export function evaluateStatisticalSweepClue(
  tx: DetectiveInputTransaction,
  allTxsInBatch: DetectiveInputTransaction[]
): {
  badge: ClueBadge | null;
  matchingContra?: DetectiveInputTransaction;
  suggestedAccountId?: string;
  suggestedVatType?: CanonicalVatType;
} {
  if (!allTxsInBatch || allTxsInBatch.length <= 1) return { badge: null };

  const txDate = new Date(tx.date);
  const txTime = isNaN(txDate.getTime()) ? 0 : txDate.getTime();

  const matchingContra = allTxsInBatch.find(other => {
    if (other === tx) return false;
    if (tx.id && other.id && tx.id === other.id) return false;

    // Check exact opposite amounts: |tx.amount + other.amount| < 0.01
    if (Math.abs(other.amount + tx.amount) >= 0.01) return false;

    // Check date difference <= 3 days (3 * 86400 * 1000 ms)
    const otherDate = new Date(other.date);
    const otherTime = isNaN(otherDate.getTime()) ? 0 : otherDate.getTime();
    const diffDays = Math.abs(otherTime - txTime) / (1000 * 60 * 60 * 24);

    return diffDays <= 3.0001;
  });

  if (matchingContra) {
    return {
      badge: {
        type: 'sweep',
        label: 'Inter-Account Sweep',
        detail: `Contra transfer paired with transaction of R ${Math.abs(matchingContra.amount).toFixed(2)} within 3-day window (no_vat)`,
        confidenceContribution: 45
      },
      matchingContra,
      suggestedAccountId: '9500-003',
      suggestedVatType: 'no_vat'
    };
  }

  return { badge: null };
}

// ============================================================================
// CLUE 7: DESCRIPTION STRUCTURE (VAT NUMBERS, PHONES, STORE LOCATORS)
// ============================================================================

export function evaluateStructureClues(
  structuralClues?: StructuralClues,
  description?: string
): ClueBadge[] {
  const badges: ClueBadge[] = [];

  const rawDesc = description || '';
  const vatNum = structuralClues?.vatNumber || rawDesc.match(/\b(?:VAT(?:\s*NO|\s*REG|#)?:?\s*)?(4\d{9})\b/i)?.[1];
  if (vatNum && vatNum.length === 10 && vatNum.startsWith('4')) {
    badges.push({
      type: 'structure',
      label: 'SA VAT Vendor',
      detail: `Extracted valid 10-digit VAT: ${vatNum}`,
      confidenceContribution: 20
    });
  }

  const phoneNum = structuralClues?.phoneNumber || rawDesc.match(/\b(?:TEL|PHONE|CELL)?\s*(0[1-8]\d{8}|08[0-9]{8})\b/i)?.[1];
  if (phoneNum) {
    badges.push({
      type: 'structure',
      label: 'SA Contact Number',
      detail: `Extracted local contact phone number: ${phoneNum}`,
      confidenceContribution: 10
    });
  }

  const branchLoc = structuralClues?.branchLocator || rawDesc.match(/#\s*(\d{3,5})\b/)?.[1];
  if (branchLoc) {
    badges.push({
      type: 'structure',
      label: 'Branch Code',
      detail: `Extracted branch locator: ${branchLoc}`,
      confidenceContribution: 10
    });
  }

  return badges;
}

// ============================================================================
// CLUE 8: TIER 2 GROUNDED WEB RESEARCH
// ============================================================================

export function evaluateWebGroundingClue(
  webResult?: WebGroundingResult,
  chartOfAccounts?: any[]
): {
  badge: ClueBadge | null;
  suggestedAccountId?: string;
  suggestedVatType?: CanonicalVatType;
} {
  if (!webResult || (!webResult.merchantCategory && !webResult.merchantName)) {
    return { badge: null };
  }

  const conf = typeof webResult.confidence === 'number' ? webResult.confidence : 80;
  const contribution = Math.round(Math.min(40, conf * 0.4));

  const categoryLabel = webResult.merchantCategory ? `Web: ${webResult.merchantCategory}` : 'Web: Verified Merchant';
  const detail = webResult.rationale || `Grounded web search identified ${webResult.merchantName || 'merchant'}`;

  let suggestedAccountId = webResult.suggestedAccountId;

  // Align with client's actual Chart of Accounts (resolving legacy or standard codes)
  if (chartOfAccounts && chartOfAccounts.length > 0) {
    if (suggestedAccountId) {
      const exactMatch = chartOfAccounts.some(
        a => (a.id === suggestedAccountId || a.accountNumber === suggestedAccountId || a.code === suggestedAccountId)
      );
      if (!exactMatch) {
        const resolved = resolveAccountForCategory(chartOfAccounts, {
          accountId: suggestedAccountId,
          category: webResult.merchantCategory,
          description: webResult.merchantName
        });
        if (resolved && (resolved.accountNumber || (resolved as any).id)) {
          suggestedAccountId = resolved.accountNumber || (resolved as any).id;
        }
      }
    } else if (webResult.merchantCategory) {
      const resolved = resolveAccountForCategory(chartOfAccounts, {
        category: webResult.merchantCategory,
        description: webResult.merchantName
      });
      if (resolved && (resolved.accountNumber || (resolved as any).id)) {
        suggestedAccountId = resolved.accountNumber || (resolved as any).id;
      }
    }
  }

  return {
    badge: {
      type: 'web',
      label: categoryLabel,
      detail,
      confidenceContribution: contribution
    },
    suggestedAccountId,
    suggestedVatType: webResult.suggestedVatType
  };
}

// ============================================================================
// CLUE 9: COMPOSITE CONFIDENCE & DECISION ENGINE
// ============================================================================

function isDetectiveContext(obj: any): obj is DetectiveContext {
  if (!obj || typeof obj !== 'object') return false;
  return 'historicalTransactions' in obj ||
         'openInvoices' in obj ||
         'chartOfAccounts' in obj ||
         'isVatRegistered' in obj ||
         'allBatchTransactions' in obj;
}

/**
 * Execute pure 9-Clue Detective Engine on a single transaction.
 */
export function executeDetectiveEngine(
  tx: DetectiveInputTransaction,
  allTxsInBatchOrContext?: DetectiveInputTransaction[] | DetectiveContext,
  contextOrWebResult?: DetectiveContext | WebGroundingResult,
  webResultParam?: WebGroundingResult
): DetectiveAnalysisResult {
  let allTxsInBatch: DetectiveInputTransaction[] = [];
  let context: DetectiveContext | undefined;
  let webResult: WebGroundingResult | undefined;

  if (Array.isArray(allTxsInBatchOrContext)) {
    allTxsInBatch = allTxsInBatchOrContext;
    if (isDetectiveContext(contextOrWebResult)) {
      context = contextOrWebResult;
      webResult = webResultParam;
    } else if (contextOrWebResult) {
      webResult = contextOrWebResult as WebGroundingResult;
    } else if (webResultParam) {
      webResult = webResultParam;
    }
  } else if (allTxsInBatchOrContext) {
    if (isDetectiveContext(allTxsInBatchOrContext)) {
      context = allTxsInBatchOrContext;
      allTxsInBatch = context.allBatchTransactions || [];
    }
    if (contextOrWebResult && !isDetectiveContext(contextOrWebResult)) {
      webResult = contextOrWebResult as WebGroundingResult;
    } else if (webResultParam) {
      webResult = webResultParam;
    }
  }

  const cleaned = BankCleaner.clean(tx.description || '');
  const channel: PaymentChannel = tx.paymentChannel || cleaned.channel || 'UNKNOWN';
  const merchantKey = tx.merchantKey || BankCleaner.generateMerchantKey(cleaned.clean, channel);
  const structuralClues: StructuralClues = {
    ...cleaned.structuralClues,
    ...(tx.structuralClues || {})
  };

  const badges: ClueBadge[] = [];
  let score = 0;
  let suggestedAccountId = '';
  let suggestedVatType: CanonicalVatType = 'standard_rated_purchases';
  let isInterAccountSweep = false;
  let sweepCounterpartTxId: string | undefined;

  // Clue 0: Rules Evaluation (Client Rules & Master Rules)
  let ruleMatched = false;
  let accountConfidenceWeight = 0; // Priority weight of source that assigned suggestedAccountId
  let sarsDetected = false;
  let timingBadges: ClueBadge[] = [];

  if (context?.clientRules && context.clientRules.length > 0) {
    const sortedClientRules = [...context.clientRules].sort(
      (a, b) => (a.priority ?? 99) - (b.priority ?? 99)
    );
    for (const rule of sortedClientRules) {
      if (!rule || !Array.isArray(rule.keywords) || !rule.accountId) continue;
      for (const kw of rule.keywords) {
        if (typeof kw === 'string' && kw.trim() && (matchesRuleKeyword(cleaned.clean, kw) || matchesRuleKeyword(tx.description || '', kw) || matchesRuleKeyword(merchantKey, kw))) {
          suggestedAccountId = rule.accountId;
          suggestedVatType = (rule.vatType as CanonicalVatType) || 'standard_rated_purchases';
          score = Math.max(score, 90);
          accountConfidenceWeight = 90;
          badges.push({
            type: 'reference',
            label: `Client Rule: ${rule.description || kw}`,
            detail: `Matched client allocation rule for keyword "${kw}"`,
            confidenceContribution: 90
          });
          ruleMatched = true;
          break;
        }
      }
      if (ruleMatched) break;
    }
  }

  if (!ruleMatched) {
    const rulesToTest: Array<MasterAllocationRule | AllocationRule> = (context?.globalRules && context.globalRules.length > 0)
      ? context.globalRules
      : (context?.masterRules !== undefined ? context.masterRules : (SORTED_MASTER_ALLOCATION_RULES as MasterAllocationRule[]));

    if (rulesToTest && rulesToTest.length > 0) {
      const sortedRules = rulesToTest === SORTED_MASTER_ALLOCATION_RULES
        ? rulesToTest
        : [...rulesToTest].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

      for (const rule of sortedRules) {
        if (!rule || !Array.isArray(rule.keywords)) continue;
        for (const kw of rule.keywords) {
          if (typeof kw === 'string' && kw.trim() && (matchesRuleKeyword(cleaned.clean, kw) || matchesRuleKeyword(tx.description || '', kw) || matchesRuleKeyword(merchantKey, kw))) {
            let resolvedAccountId = (rule as any).accountId || (rule as any).defaultAccountCode;
            if (context?.chartOfAccounts && context.chartOfAccounts.length > 0 && (rule as any).category) {
              const resolved = resolveAccountForCategory(context.chartOfAccounts as any, rule as any);
              if (resolved && (resolved.accountNumber || (resolved as any).id)) {
                resolvedAccountId = resolved.accountNumber || (resolved as any).id;
              }
            }
            suggestedAccountId = resolvedAccountId;
            suggestedVatType = (rule.vatType as CanonicalVatType) || 'standard_rated_purchases';
            score = Math.max(score, 85);
            accountConfidenceWeight = 85;
            badges.push({
              type: 'reference',
              label: `Practice Rule: ${(rule as any).categoryLabel || rule.description || kw}`,
              detail: `Matched practice rule for keyword "${kw}"`,
              confidenceContribution: 85
            });
            ruleMatched = true;
            break;
          }
        }
        if (ruleMatched) break;
      }
    }
  }

  // 1. Clue 1: Timing
  timingBadges = evaluateTimingClue(tx.date, tx.description || '');
  for (const b of timingBadges) {
    badges.push(b);
    if (!ruleMatched) {
      score += b.confidenceContribution;
    }
  }

  // 2. Clue 2: Amount
  const amountRes = evaluateAmountClue(
    tx.amount,
    tx.description || '',
    context?.historicalTransactions,
    context?.openInvoices
  );
  for (const b of amountRes.badges) {
    badges.push(b);
    if (!ruleMatched) {
      score += b.confidenceContribution;
    }
  }
  if (amountRes.suggestedAccountId && accountConfidenceWeight < 40) {
    suggestedAccountId = amountRes.suggestedAccountId;
    accountConfidenceWeight = 40;
    if (amountRes.suggestedVatType) {
      suggestedVatType = amountRes.suggestedVatType;
    }
  }

  // 3. Clue 3: Prefix / Channel
  const prefixRes = evaluatePrefixClue(channel, tx.description || '');
  if (prefixRes.badge) {
    badges.push(prefixRes.badge);
    if (!ruleMatched) {
      score += prefixRes.badge.confidenceContribution;
    }
    if (prefixRes.suggestedAccountId && accountConfidenceWeight < prefixRes.badge.confidenceContribution) {
      suggestedAccountId = prefixRes.suggestedAccountId;
      accountConfidenceWeight = prefixRes.badge.confidenceContribution;
      if (prefixRes.suggestedVatType) {
        suggestedVatType = prefixRes.suggestedVatType;
      }
    }
  }

  // 4. Clue 4: Reference Decoding (SARS PRNs)
  const refRes = evaluateReferenceClue(tx.description || '', structuralClues);
  if (refRes.badge) {
    badges.push(refRes.badge);
    if (!ruleMatched) {
      score += refRes.badge.confidenceContribution;
    }
    if (refRes.suggestedAccountId && accountConfidenceWeight <= 95) {
      suggestedAccountId = refRes.suggestedAccountId;
      sarsDetected = true;
      accountConfidenceWeight = 95;
    }
    if (refRes.suggestedVatType) {
      suggestedVatType = refRes.suggestedVatType;
    }
  }

  // 5. Clue 5: Cross-Referencing (Client History Memory)
  const crossRefRes = evaluateCrossReferenceClue(
    merchantKey,
    cleaned.clean,
    context?.historicalTransactions,
    context?.historyConsistencyMap
  );
  if (crossRefRes.badge) {
    badges.push(crossRefRes.badge);
    if (!ruleMatched) {
      score += crossRefRes.badge.confidenceContribution;
    }
    if (!sarsDetected && crossRefRes.suggestedAccountId && accountConfidenceWeight < 80) {
      suggestedAccountId = crossRefRes.suggestedAccountId;
      accountConfidenceWeight = 80;
      if (crossRefRes.suggestedVatType) {
        suggestedVatType = crossRefRes.suggestedVatType;
      }
    }
  }

  // 6. Clue 6: Statistical Sweeps (Inter-account transfers within 3-day window)
  const sweepRes = evaluateStatisticalSweepClue(tx, allTxsInBatch);
  if (sweepRes.badge) {
    badges.push(sweepRes.badge);
    if (!ruleMatched) {
      score += sweepRes.badge.confidenceContribution;
    }
    if (sweepRes.suggestedAccountId && accountConfidenceWeight <= 95) {
      suggestedAccountId = sweepRes.suggestedAccountId;
      accountConfidenceWeight = 95;
    }
    if (sweepRes.suggestedVatType) {
      suggestedVatType = sweepRes.suggestedVatType;
    }
    isInterAccountSweep = true;
    sweepCounterpartTxId = sweepRes.matchingContra?.id;
  }

  // 7. Clue 7: Description Structure
  const structBadges = evaluateStructureClues(structuralClues, tx.description || '');
  for (const b of structBadges) {
    badges.push(b);
    if (!ruleMatched) {
      score += b.confidenceContribution;
    }
  }

  // 8. Clue 8: Tier 2 Grounded Web Research
  const webRes = evaluateWebGroundingClue(webResult, context?.chartOfAccounts);
  if (webRes.badge) {
    badges.push(webRes.badge);
    if (!ruleMatched) {
      score += webRes.badge.confidenceContribution;
    }
    if (!sarsDetected && !isInterAccountSweep && webRes.suggestedAccountId && accountConfidenceWeight < 75) {
      suggestedAccountId = webRes.suggestedAccountId;
      accountConfidenceWeight = 75;
      if (webRes.suggestedVatType) {
        suggestedVatType = webRes.suggestedVatType;
      }
    }
  }

  // ==========================================================================
  // SYNERGY & RULE SCOPING
  // ==========================================================================
  const baseKey = (tx.merchantKey || merchantKey).replace(/\s*\[DEBIT ORDER\]$/i, '').trim().toUpperCase();
  const rootBrandCandidate = baseKey.split(' ')[0];
  const isNationalBrand = Boolean(NATIONAL_ROOT_BRANDS[baseKey]) || Boolean(NATIONAL_ROOT_BRANDS[rootBrandCandidate]);
  const ruleScoping: 'client' | 'global_practice' = isNationalBrand ? 'global_practice' : 'client';

  // National Brand Base Score
  if (isNationalBrand) {
    score += 20;
  }

  // Synergy 1: Verified sweep pair gets automatic high confidence
  if (isInterAccountSweep) {
    score = Math.max(score, 85);
  }

  // Synergy 2: National Brand + Contractual Debit Order + Timing (1st-7th)
  if (isNationalBrand && channel === 'DEBIT_ORDER' && timingBadges.length > 0) {
    score = Math.max(score, 80);
  }

  // Synergy 3: SARS PRN + Timing Window
  if (sarsDetected && timingBadges.length > 0) {
    score = Math.max(score, 85);
  }

  // ==========================================================================
  // STATUTORY INVARIANTS
  // ==========================================================================
  // SARS Invariant: Never operating expense, never claim input VAT
  const isSarsDescription = /SARSEFLNG|SARS\s*VAT|VAT201|EMP201|PROV\s*TAX|IRP6/i.test(tx.description || '');
  if (sarsDetected || isSarsDescription) {
    if (suggestedAccountId.startsWith('3000') || suggestedAccountId.startsWith('5000')) {
      suggestedAccountId = /VAT201|SARS\s*VAT/i.test(tx.description || '') ? '7000-008' :
        (/EMP201|PAYE/i.test(tx.description || '') ? '7000-011' : '7000-015');
    }
    suggestedVatType = 'no_vat';
  }

  // Sweep Invariant: Always Bank Transfer Suspense with no_vat
  if (isInterAccountSweep) {
    suggestedAccountId = '9500-003';
    suggestedVatType = 'no_vat';
  }

  // Non-VAT registered client invariant
  if (context?.isVatRegistered === false) {
    suggestedVatType = 'no_vat';
  }

  // Resolve account label if chart of accounts is available
  let suggestedAccountLabel: string | undefined;
  if (context?.chartOfAccounts && context.chartOfAccounts.length > 0) {
    const acc = context.chartOfAccounts.find(a =>
      a.id === suggestedAccountId ||
      a.accountNumber === suggestedAccountId ||
      a.code === suggestedAccountId
    );
    if (acc) {
      suggestedAccountLabel = `${acc.accountNumber || acc.code || acc.id} - ${acc.description || acc.name || acc.accountName || ''}`;
    }
  }

  const compositeConfidence = Math.min(100, Math.max(0, score));
  const isAutoAllocatable = compositeConfidence >= 80 && Boolean(suggestedAccountId);
  const status: 'reviewed' | 'ai_review' = isAutoAllocatable ? 'reviewed' : 'ai_review';

  return {
    merchantKey,
    cleanDescription: cleaned.clean,
    compositeConfidence,
    suggestedAccountId,
    suggestedAccountLabel,
    suggestedVatType,
    badges,
    ruleScoping,
    isAutoAllocatable,
    status,
    isInterAccountSweep,
    sweepCounterpartTxId
  };
}

/**
 * Batch Group Detective Analysis (for SmartMatchQueueModal & WorkflowTab)
 */
export function analyzeMerchantGroupDetective(
  groupKey: string,
  transactions: DetectiveInputTransaction[],
  context?: DetectiveContext,
  webResult?: WebGroundingResult
): DetectiveAnalysisResult {
  if (!transactions || transactions.length === 0) {
    return {
      merchantKey: groupKey,
      cleanDescription: groupKey,
      compositeConfidence: 0,
      suggestedAccountId: '',
      suggestedVatType: 'no_vat',
      badges: [],
      ruleScoping: 'client',
      isAutoAllocatable: false,
      status: 'ai_review'
    };
  }

  // Find representative transaction (prioritizing PRN, VAT number, highest amount)
  const repTx = [...transactions].sort((a, b) => {
    const aClues = a.structuralClues?.prn ? 10 : (a.structuralClues?.vatNumber ? 5 : 0);
    const bClues = b.structuralClues?.prn ? 10 : (b.structuralClues?.vatNumber ? 5 : 0);
    if (aClues !== bClues) return bClues - aClues;
    return Math.abs(b.amount) - Math.abs(a.amount);
  })[0];

  const allBatch = context?.allBatchTransactions || transactions;
  const analysis = executeDetectiveEngine(
    { ...repTx, merchantKey: repTx.merchantKey || groupKey },
    allBatch,
    context,
    webResult
  );

  // Group-level enhancement: Recurring fixed amounts across group
  if (transactions.length >= 2) {
    const firstAmt = Math.abs(transactions[0].amount);
    const allSameAmount = transactions.every(t => Math.abs(Math.abs(t.amount) - firstAmt) < 0.01);
    if (allSameAmount && !analysis.badges.some(b => b.label.includes('Recurring'))) {
      const recurringBadge: ClueBadge = {
        type: 'amount',
        label: 'Recurring Fixed Amount',
        detail: `Exact amount R ${firstAmt.toFixed(2)} consistent across all ${transactions.length} group transactions`,
        confidenceContribution: 25
      };
      analysis.badges.push(recurringBadge);
      analysis.compositeConfidence = Math.min(100, analysis.compositeConfidence + 25);
      analysis.isAutoAllocatable = analysis.compositeConfidence >= 80;
      analysis.status = analysis.isAutoAllocatable ? 'reviewed' : 'ai_review';
    }
  }

  return {
    ...analysis,
    merchantKey: groupKey
  };
}
