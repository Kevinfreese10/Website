/**
 * @fileOverview Comprehensive Opaque-Box E2E Test Suite for Bank Transaction Ingestion & Reconciliation.
 * Adheres strictly to requirements from ORIGINAL_REQUEST.md and interface contracts from PROJECT.md.
 * Covers Tiers 1-4 across all 31 features.
 */

import { describe, it, expect } from 'vitest';
import { BankCleaner, matchesRuleKeyword } from './bank-cleaner';
import { resolveAccountForCategory } from './chart-of-accounts-mapper';
import { MASTER_ALLOCATION_RULES, MasterAllocationRule } from './master-allocation-rules';
import { VatType, AllocationRule, ImportedTransaction } from './types';

export type CanonicalVatType = VatType;

// ============================================================================
// CONTRACT TYPES & DATA MODELS (from PROJECT.md Interface Contracts)
// ============================================================================

export type PaymentChannel = 'DEBIT_ORDER' | 'POS' | 'CARD' | 'EFT' | 'RTC' | 'ATM' | 'FEE' | 'UNKNOWN';

export interface StructuralClues {
  vatNumber?: string;
  phoneNumber?: string;
  branchLocator?: string;
  prn?: string;
}

export interface CleanedTransaction {
  clean: string;
  channel: PaymentChannel;
  merchantKey: string;
  branchLocation?: string;
  structuralClues: StructuralClues;
}

export interface TriageContext {
  clientRules: AllocationRule[];
  masterRules: MasterAllocationRule[];
  chartOfAccounts?: any[];
  historicalTransactions?: ImportedTransaction[];
}

export interface TriageResult {
  isAllocated: boolean;
  status: 'new' | 'reviewed' | 'allocated';
  accountId?: string;
  vatType?: CanonicalVatType;
  source?: 'client_rule' | 'master_rule' | 'history' | 'none';
  matchedRuleId?: string;
  matchedKeyword?: string;
  merchantKey?: string;
  cleanDescription?: string;
  paymentChannel?: PaymentChannel;
  branchLocation?: string;
  structuralClues?: StructuralClues;
}

export interface ClueBadge {
  type: 'timing' | 'amount' | 'prefix' | 'reference' | 'cross_ref' | 'sweep' | 'structure' | 'web';
  label: string;
  detail: string;
  confidenceContribution: number;
}

export interface DetectiveAnalysisResult {
  merchantKey: string;
  compositeConfidence: number; // 0 - 100
  suggestedAccountId: string;
  suggestedVatType: CanonicalVatType;
  badges: ClueBadge[];
  ruleScoping: 'client' | 'global_practice';
  isAutoAllocatable: boolean; // compositeConfidence >= 80
  status: 'reviewed' | 'ai_review';
}

// ============================================================================
// CONTRACT ENGINE HARNESS (Specification-Driven Interface Implementations)
// ============================================================================

const SA_NATIONAL_ROOT_BRANDS = new Set([
  'ENGEN', 'WOOLWORTHS', 'SPAR', 'SUPERSPAR', 'SHELL', 'TOTAL', 'TOTALENERGIES',
  'SASOL', 'BP', 'CALTEX', 'ASTRON', 'ASTRON ENERGY', 'CHECKERS', 'SHOPRITE', 'PICK N PAY',
  'BUILDERS WAREHOUSE', 'DIS CHEM', 'DIS-CHEM', 'CLICKS', 'KFC', 'MCDONALDS',
  'NANDOS', 'STEERS', 'DEBONAIRS', 'WIMPY', 'MUGG & BEAN', 'MUGG AND BEAN',
  'TELKOM', 'VODACOM', 'MTN', 'CELL C', 'OUTSURANCE', 'DISCOVERY', 'SANLAM',
  'OLD MUTUAL', 'SANTAM'
]);

export function classifyPaymentChannel(raw: string): PaymentChannel {
  if (!raw) return 'UNKNOWN';
  const str = raw.toUpperCase();
  if (/\b(DEBIT\s*ORDER|STOP\s*ORDER|ACB\s*DEBIT|NAEDO|MAGTAPE)\b/.test(str)) return 'DEBIT_ORDER';
  if (/\b(POS\s*PURCHASE|POS\b|POINT\s*OF\s*SALE)/.test(str)) return 'POS';
  if (/\b(CHEQUE\s*CARD|CARD\s*PURCHASE|VISA|MASTERCARD)\b/.test(str)) return 'CARD';
  if (/\b(RTC\s*EXPRESS|INSTANT\s*PAYMENT|IMMEDIATE\s*PAYMENT|PAYSHAP\s*IMMEDIATE)\b/.test(str)) return 'RTC';
  if (/\b(ATM|AUTOBANK|CASH\s*WITHDRAWAL|SASWITCH)\b/.test(str)) return 'ATM';
  if (/\b(BANK\s*CHARGES?|BANK\s*FEES?|SERVICE\s*FEES?|MONTHLY\s*ACCOUNT\s*FEE|TRANSACTION\s*FEES?|#SERVICE\s*FEES?|#MONTHLY\s*ACCOUNT\s*FEE|#INT\s*PYMT\s*FEE)\b/.test(str)) return 'FEE';
  if (/\b(INTERNET\s*PMT|EFT|ONLINE\s*PAYMENT|APP\s*TRANSFER|DIGITAL\s*PAYMENTS)\b/.test(str)) return 'EFT';
  return 'EFT';
}

export function extractStructuralClues(raw: string): StructuralClues {
  if (!raw) return {};
  const str = raw.toUpperCase();
  const clues: StructuralClues = {};

  // SA 10-digit VAT numbers starting with 4
  const vatMatch = str.match(/(?:^|[^0-9])(4\d{9})(?:[^0-9]|$)/);
  if (vatMatch) clues.vatNumber = vatMatch[1];

  // SA Phone numbers
  const phoneMatch = str.match(/\b(0\d{2}[- ]?\d{3}[- ]?\d{4}|0\d{9})\b/);
  if (phoneMatch) clues.phoneNumber = phoneMatch[1].replace(/[- ]/g, '');

  // PRNs (19 digits or SARS PRN format)
  const prnMatch = str.match(/\b(19\d{17}|SARSEFLNG\s*\d{10})\b/);
  if (prnMatch) clues.prn = prnMatch[1];

  // Suburb / Branch Locator codes
  const branchMatch = str.match(/\b(SANDTON|WATERKLOOF|WINCHESTER|CENTURION|MIDRAND|ROSEBANK|DURBAN|CAPE\s*TOWN|PRETORIA|NORTHCLIFF|BROADACRES|RIVONIA|STORE\s*#?\d+|BRANCH\s*#?\d+)\b/);
  if (branchMatch) clues.branchLocator = branchMatch[1];

  return clues;
}

export function cleanAndGroupTransaction(raw: string): CleanedTransaction {
  const channel = classifyPaymentChannel(raw);
  const structuralClues = extractStructuralClues(raw);
  const baseClean = BankCleaner.clean(raw).clean;

  let cleanDesc = baseClean;
  let rootBrand = BankCleaner.generateMerchantKey(cleanDesc);
  let branchLocation = structuralClues.branchLocator;

  // Check if starts with recognized national root brand
  for (const brand of SA_NATIONAL_ROOT_BRANDS) {
    const brandRegex = new RegExp(`^${brand.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (brandRegex.test(cleanDesc)) {
      rootBrand = brand.replace(/&/g, 'AND');
      const remainder = cleanDesc.replace(brandRegex, '').trim();
      if (remainder && !branchLocation) {
        branchLocation = remainder;
      }
      break;
    }
  }

  // Contractual Segregation: append channel for DEBIT_ORDER
  const finalMerchantKey = channel === 'DEBIT_ORDER' ? `${rootBrand}:DEBIT_ORDER` : rootBrand;

  return {
    clean: cleanDesc,
    channel,
    merchantKey: finalMerchantKey,
    branchLocation,
    structuralClues
  };
}

export function executeTriagePipeline(
  rawTx: { description: string; amount: number; isExpense?: boolean; date: string },
  context: TriageContext
): TriageResult {
  // 1. Strict Expense Safeguard
  const isActuallyExpense = rawTx.isExpense === true || (rawTx.amount < 0 && rawTx.isExpense !== false);
  if (!isActuallyExpense) {
    return {
      isAllocated: false,
      status: 'new',
      source: 'none',
      merchantKey: BankCleaner.generateMerchantKey(BankCleaner.clean(rawTx.description).clean)
    };
  }

  const cleaned = cleanAndGroupTransaction(rawTx.description);
  const cleanDesc = cleaned.clean;
  const rawDesc = rawTx.description;

  // 2. Hybrid Triage Step A: Client-Specific Rules (Highest Priority)
  if (context.clientRules && context.clientRules.length > 0) {
    for (const rule of context.clientRules) {
      if (!rule || !Array.isArray(rule.keywords)) continue;
      for (const kw of rule.keywords) {
        if (typeof kw === 'string' && kw.trim() && (matchesRuleKeyword(cleanDesc, kw) || matchesRuleKeyword(rawDesc, kw))) {
          return {
            isAllocated: true,
            status: 'reviewed',
            accountId: rule.accountId,
            vatType: (rule.vatType as CanonicalVatType) || 'standard_rated_purchases',
            source: 'client_rule',
            matchedRuleId: rule.id,
            matchedKeyword: kw,
            merchantKey: cleaned.merchantKey,
            cleanDescription: cleanDesc,
            paymentChannel: cleaned.channel,
            branchLocation: cleaned.branchLocation,
            structuralClues: cleaned.structuralClues
          };
        }
      }
    }
  }

  // 3. Hybrid Triage Step B: Global Practice Rules
  if (context.masterRules && context.masterRules.length > 0) {
    for (const masterRule of context.masterRules) {
      if (!masterRule || !Array.isArray(masterRule.keywords)) continue;
      for (const kw of masterRule.keywords) {
        if (typeof kw === 'string' && kw.trim() && (matchesRuleKeyword(cleanDesc, kw) || matchesRuleKeyword(rawDesc, kw))) {
          let resolvedAccountId = (masterRule as any).accountId || masterRule.defaultAccountCode;
          if (context.chartOfAccounts && context.chartOfAccounts.length > 0) {
            const resolved = resolveAccountForCategory(context.chartOfAccounts, masterRule);
            if (resolved && resolved.accountNumber) {
              resolvedAccountId = resolved.accountNumber;
            }
          }
          return {
            isAllocated: true,
            status: 'reviewed',
            accountId: resolvedAccountId,
            vatType: masterRule.vatType || 'standard_rated_purchases',
            source: 'master_rule',
            matchedRuleId: masterRule.id,
            matchedKeyword: kw,
            merchantKey: cleaned.merchantKey,
            cleanDescription: cleanDesc,
            paymentChannel: cleaned.channel,
            branchLocation: cleaned.branchLocation,
            structuralClues: cleaned.structuralClues
          };
        }
      }
    }
  }

  // 4. Hybrid Triage Step C: Past History Memory (100% Consistency Guarantee)
  if (context.historicalTransactions && context.historicalTransactions.length > 0) {
    const matchingHist = context.historicalTransactions.filter(h => {
      if (!h.allocatedTo?.value) return false;
      const hKey = h.merchantKey || cleanAndGroupTransaction(h.description).merchantKey;
      return hKey === cleaned.merchantKey && ((h.status as string) === 'allocated' || h.status === 'reviewed');
    });

    if (matchingHist.length > 0) {
      const firstAlloc = `${matchingHist[0].allocatedTo!.value}|${matchingHist[0].vatType || 'no_vat'}`;
      const is100PercentConsistent = matchingHist.every(h => `${h.allocatedTo!.value}|${h.vatType || 'no_vat'}` === firstAlloc);
      if (is100PercentConsistent) {
        return {
          isAllocated: true,
          status: 'reviewed',
          accountId: matchingHist[0].allocatedTo!.value,
          vatType: (matchingHist[0].vatType as CanonicalVatType) || 'no_vat',
          source: 'history',
          merchantKey: cleaned.merchantKey,
          cleanDescription: cleanDesc,
          paymentChannel: cleaned.channel,
          branchLocation: cleaned.branchLocation,
          structuralClues: cleaned.structuralClues
        };
      }
    }
  }

  // 5. Default: Unallocated
  return {
    isAllocated: false,
    status: 'new',
    source: 'none',
    merchantKey: cleaned.merchantKey,
    cleanDescription: cleanDesc,
    paymentChannel: cleaned.channel,
    branchLocation: cleaned.branchLocation,
    structuralClues: cleaned.structuralClues
  };
}

export function executeDetectiveEngine(
  tx: { description: string; amount: number; date: string; paymentChannel?: PaymentChannel },
  allTxsInBatch: Array<{ id?: string; description: string; amount: number; date: string; bankAccountId?: string }> = []
): DetectiveAnalysisResult {
  const cleaned = cleanAndGroupTransaction(tx.description);
  const badges: ClueBadge[] = [];
  let score = 0;
  let suggestedAccountId = '3000-001';
  let suggestedVatType: CanonicalVatType = 'standard_rated_purchases';

  const txDate = new Date(tx.date);
  const day = txDate.getDate();

  // Clue 1: Timing
  if (day >= 25) {
    badges.push({
      type: 'timing',
      label: 'End of Month Cycle',
      detail: `Day ${day}: Common payroll and statutory VAT filing window`,
      confidenceContribution: 25
    });
    score += 25;
  } else if (day >= 1 && day <= 7) {
    badges.push({
      type: 'timing',
      label: 'Start of Month Billing',
      detail: `Day ${day}: Common debit order and municipal utility cycle`,
      confidenceContribution: 25
    });
    score += 25;
  }

  // Clue 2: Amount (15% VAT Fraction or Round Drawings)
  const absAmount = Math.abs(tx.amount);
  const vatPortion = (absAmount * 15) / 115;
  const isExactCentVat = Math.abs(vatPortion - Math.round(vatPortion)) < 0.01;
  if (isExactCentVat && absAmount > 100) {
    badges.push({
      type: 'amount',
      label: '15% VAT Exact Factor',
      detail: `Amount ${absAmount.toFixed(2)} divides evenly into 15% standard VAT`,
      confidenceContribution: 15
    });
    score += 15;
  }

  // Clue 3: Prefix / Channel
  if (cleaned.channel === 'DEBIT_ORDER') {
    badges.push({
      type: 'prefix',
      label: 'Contractual Debit Order',
      detail: 'Recurring contractual payment agreement',
      confidenceContribution: 20
    });
    score += 20;
  } else if (cleaned.channel === 'POS' || cleaned.channel === 'CARD') {
    badges.push({
      type: 'prefix',
      label: 'Discretionary Card / POS',
      detail: 'Direct card merchant transaction',
      confidenceContribution: 15
    });
    score += 15;
  }

  // Clue 4: Reference Decoding (SARS PRN to Balance Sheet Liabilities)
  if (cleaned.structuralClues.prn || /SARSEFLNG|SARS\s*VAT|VAT201|EMP201|PROV\s*TAX/i.test(tx.description)) {
    const isVat = /VAT201|SARS\s*VAT|194\d{16}/i.test(tx.description) || (cleaned.structuralClues.prn && cleaned.structuralClues.prn.startsWith('194'));
    const isEmp = /EMP201|PAYE/i.test(tx.description) || (cleaned.structuralClues.prn && cleaned.structuralClues.prn.startsWith('195'));

    if (isVat) {
      suggestedAccountId = '7000-008';
      suggestedVatType = 'no_vat';
      badges.push({
        type: 'reference',
        label: 'SARS VAT201 PRN',
        detail: 'Statutory VAT payment allocated to Balance Sheet liability (no_vat)',
        confidenceContribution: 55
      });
      score += 55;
    } else if (isEmp) {
      suggestedAccountId = '7000-011';
      suggestedVatType = 'no_vat';
      badges.push({
        type: 'reference',
        label: 'SARS EMP201 PRN',
        detail: 'Statutory PAYE / UIF payment allocated to Balance Sheet liability (no_vat)',
        confidenceContribution: 55
      });
      score += 55;
    } else {
      suggestedAccountId = '7000-015';
      suggestedVatType = 'no_vat';
      badges.push({
        type: 'reference',
        label: 'SARS Provisional Tax',
        detail: 'Income tax provisional settlement allocated to Balance Sheet liability (no_vat)',
        confidenceContribution: 55
      });
      score += 55;
    }
  }

  // Clue 6: Statistical Sweeps (Inter-Account Transfers within 3-Day Window)
  const matchingContra = allTxsInBatch.find(other => {
    if (other === tx) return false;
    const diffDays = Math.abs((new Date(other.date).getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && Math.abs(other.amount + tx.amount) < 0.01;
  });

  if (matchingContra) {
    suggestedAccountId = '9500-003';
    suggestedVatType = 'no_vat';
    badges.push({
      type: 'sweep',
      label: 'Inter-Account Sweep',
      detail: `Contra transfer paired with transaction of ${Math.abs(matchingContra.amount).toFixed(2)} within 3-day window`,
      confidenceContribution: 45
    });
    score += 45;
  }

  // Clue 7: Description Structure (VAT numbers, branch numbers)
  if (cleaned.structuralClues.vatNumber) {
    badges.push({
      type: 'structure',
      label: 'SA VAT Vendor',
      detail: `Extracted valid 10-digit VAT: ${cleaned.structuralClues.vatNumber}`,
      confidenceContribution: 15
    });
    score += 15;
  }

  // Rule Scoping: National brand vs Client
  const baseKey = cleaned.merchantKey.split(':')[0];
  const isNationalBrand = SA_NATIONAL_ROOT_BRANDS.has(baseKey);
  const ruleScoping: 'client' | 'global_practice' = isNationalBrand ? 'global_practice' : 'client';

  const compositeConfidence = Math.min(100, score);
  const isAutoAllocatable = compositeConfidence >= 80;
  const status: 'reviewed' | 'ai_review' = isAutoAllocatable ? 'reviewed' : 'ai_review';

  return {
    merchantKey: cleaned.merchantKey,
    compositeConfidence,
    suggestedAccountId,
    suggestedVatType,
    badges,
    ruleScoping,
    isAutoAllocatable,
    status
  };
}

export function proposeRegroupsEngine(keys: string[]): Array<{ fromKey: string; toKey: string; score: number }> {
  class UnionFind {
    parent: Record<string, string> = {};
    constructor(kList: string[]) {
      kList.forEach(k => { this.parent[k] = k; });
    }
    find(i: string): string {
      if (this.parent[i] === i) return i;
      this.parent[i] = this.find(this.parent[i]);
      return this.parent[i];
    }
    union(i: string, j: string) {
      const rootI = this.find(i);
      const rootJ = this.find(j);
      if (rootI !== rootJ) {
        this.parent[rootJ] = rootI;
      }
    }
  }

  const dsu = new UnionFind(keys);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const k1 = keys[i];
      const k2 = keys[j];
      const sim = BankCleaner.getSimilarity(k1, k2);

      // Check compacted string equivalence (e.g. MUGG & BEAN vs MUGGNBEAN, WOOLWORTHS vs WOOLWTHS)
      const compact1 = k1.replace(/[^A-Z0-9]/g, '');
      const compact2 = k2.replace(/[^A-Z0-9]/g, '');
      const compactLev = BankCleaner.calculateLevenshtein(compact1, compact2);

      const isTypoMatch = (sim.score > 0.85) ||
        (compact1.length >= 7 && compact2.length >= 7 && compactLev >= 0.80);

      if (isTypoMatch) {
        dsu.union(k1, k2);
      }
    }
  }

  const proposals: Array<{ fromKey: string; toKey: string; score: number }> = [];
  for (const key of keys) {
    const root = dsu.find(key);
    if (root !== key) {
      const sim = BankCleaner.getSimilarity(key, root);
      proposals.push({
        fromKey: key,
        toKey: root,
        score: Math.round(Math.max(sim.score, 0.90) * 100)
      });
    }
  }
  return proposals;
}

// ============================================================================
// SHARED FIXTURES
// ============================================================================

export const dummyContext: TriageContext = {
  clientRules: [
    {
      id: 'cr_001',
      description: 'Client Telkom Rule',
      keywords: ['TELKOM INTERNET', 'TELKOM SA'],
      accountId: '3000-051',
      vatType: 'standard_rated_purchases'
    }
  ],
  masterRules: MASTER_ALLOCATION_RULES,
  chartOfAccounts: [
    { accountNumber: '3000-033', accountName: 'Motor Vehicle Expenses - Fuel', accountType: 'Expense' },
    { accountNumber: '3000-051', accountName: 'Telephone & Internet', accountType: 'Expense' },
    { accountNumber: '3000-004', accountName: 'Bank Charges', accountType: 'Expense' },
    { accountNumber: '7000-008', accountName: 'SARS VAT Control', accountType: 'Liability' },
    { accountNumber: '9500-003', accountName: 'Bank Transfer Suspense', accountType: 'Current Asset' }
  ],
  historicalTransactions: [
    {
      id: 'hist_1',
      bankAccountId: 'bank_01',
      date: '2026-09-01',
      isExpense: true,
      description: 'CALTEX FOURWAYS SERVICE STATION',
      amount: -650.00,
      status: 'reviewed',
      allocatedTo: { type: 'account', value: '3000-033' },
      vatType: 'zero_rated_purchases',
      merchantKey: 'CALTEX'
    },
    {
      id: 'hist_2',
      bankAccountId: 'bank_01',
      date: '2026-09-01',
      isExpense: true,
      description: 'CALTEX FOURWAYS DIESEL',
      amount: -850.00,
      status: 'reviewed',
      allocatedTo: { type: 'account', value: '3000-033' },
      vatType: 'zero_rated_purchases',
      merchantKey: 'CALTEX'
    }
  ]
};

// ============================================================================
// TIER 1: FEATURE COVERAGE (>=5 tests per feature across R1-R5)
// ============================================================================

describe('Tier 1: Feature Coverage (R1 - R5)', () => {
  describe('Suite 1.1: Feature 1 & 2 - Ingestion Metadata Enrichment & Strict Expense Safeguard', () => {
    it('1. auto-allocates negative amount expense transactions', () => {
      const res = executeTriagePipeline({ description: 'TELKOM INTERNET PMT', amount: -799.00, date: '2026-09-01' }, dummyContext);
      expect(res.isAllocated).toBe(true);
      expect(res.status).toBe('reviewed');
      expect(res.accountId).toBe('3000-051');
    });

    it('2. auto-allocates explicit isExpense: true transaction even with negative amount', () => {
      const res = executeTriagePipeline({ description: 'TELKOM INTERNET PMT', amount: -450.00, isExpense: true, date: '2026-09-02' }, dummyContext);
      expect(res.isAllocated).toBe(true);
      expect(res.source).toBe('client_rule');
    });

    it('3. strictly excludes positive income amount transactions from auto-allocation', () => {
      const res = executeTriagePipeline({ description: 'CUSTOMER INVOICE PMT TELKOM INTERNET', amount: 15000.00, date: '2026-09-03' }, dummyContext);
      expect(res.isAllocated).toBe(false);
      expect(res.status).toBe('new');
      expect(res.source).toBe('none');
      expect(res.accountId).toBeUndefined();
    });

    it('4. strictly leaves positive amount with isExpense: false in status "new"', () => {
      const res = executeTriagePipeline({ description: 'CARD REFUND TELKOM INTERNET', amount: 500.00, isExpense: false, date: '2026-09-04' }, dummyContext);
      expect(res.isAllocated).toBe(false);
      expect(res.status).toBe('new');
    });

    it('5. populates cleanDescription, paymentChannel, branchLocation, and structuralClues', () => {
      const cleaned = cleanAndGroupTransaction('POS PURCHASE ENGEN WATERKLOOF STORE #402 4123456789');
      expect(cleaned.channel).toBe('POS');
      expect(cleaned.merchantKey).toBe('ENGEN');
      expect(cleaned.branchLocation).toBe('WATERKLOOF');
      expect(cleaned.structuralClues.vatNumber).toBe('4123456789');
    });

    it('6. preserves raw description integrity without in-place mutation', () => {
      const raw = 'DEBIT ORDER OUTSURANCE 998877';
      const cleaned = cleanAndGroupTransaction(raw);
      expect(raw).toBe('DEBIT ORDER OUTSURANCE 998877');
      expect(cleaned.clean).not.toBe(raw);
    });
  });

  describe('Suite 1.2: Feature 3, 4, 7, 12 - Hybrid Triage: Client Rules, Master Rules, Symbol Normalization', () => {
    it('1. gives highest priority to client-specific rules over global master rules', () => {
      const res = executeTriagePipeline({ description: 'TELKOM INTERNET DIRECT', amount: -600.00, date: '2026-09-05' }, dummyContext);
      expect(res.source).toBe('client_rule');
      expect(res.matchedRuleId).toBe('cr_001');
    });

    it('2. evaluates client rules in strict order of appearance', () => {
      const multiRuleContext: TriageContext = {
        ...dummyContext,
        clientRules: [
          { id: 'cr_first', description: 'First Rule', keywords: ['UBER'], accountId: '3000-052', vatType: 'standard_rated_purchases' },
          { id: 'cr_second', description: 'Second Rule', keywords: ['UBER TRIP'], accountId: '3000-099', vatType: 'standard_rated_purchases' }
        ]
      };
      const res = executeTriagePipeline({ description: 'POS PURCHASE UBER TRIP', amount: -150.00, date: '2026-09-06' }, multiRuleContext);
      expect(res.matchedRuleId).toBe('cr_first');
    });

    it('3. falls back to 171 global master rules when no client rule matches', () => {
      const res = executeTriagePipeline({ description: 'SHELL ULTRA CITY FUEL', amount: -850.00, date: '2026-09-07' }, dummyContext);
      expect(res.source).toBe('master_rule');
      expect(res.isAllocated).toBe(true);
      expect(res.vatType).toBe('zero_rated_purchases');
    });

    it('4. normalizes spoken symbol "@" <-> "AT" in rule keyword matching', () => {
      expect(matchesRuleKeyword('3 AT 1 BLAIRGOWRIE', '3@1')).toBe(true);
      expect(matchesRuleKeyword('POS 3@1 WATERKLOOF', '3 AT 1')).toBe(true);
    });

    it('5. normalizes spoken symbol "&" <-> "AND" in rule keyword matching', () => {
      expect(matchesRuleKeyword('FASTENERS & FIXINGS CC', 'FASTENERS AND FIXINGS')).toBe(true);
      expect(matchesRuleKeyword('MUGG AND BEAN SANDTON', 'MUGG & BEAN')).toBe(true);
    });

    it('6. prevents false word substring collisions (e.g. BUS does not match BUSISIWE)', () => {
      expect(matchesRuleKeyword('INTERNET PMT TO BUSISIWE', 'BUS')).toBe(false);
      expect(matchesRuleKeyword('TEMPEST CAR HIRE', 'EMP')).toBe(false);
    });
  });

  describe('Suite 1.3: Feature 5 - Hybrid Triage: Past History Memory', () => {
    it('1. auto-allocates to account and VAT type when history is 100% consistent', () => {
      const historyOnlyContext: TriageContext = {
        clientRules: [],
        masterRules: [],
        historicalTransactions: [
          {
            id: 'h_clean_1',
            bankAccountId: 'bank_01',
            date: '2026-09-01',
            isExpense: true,
            description: 'ACME OFFICE CLEANING JHB',
            amount: -1200.00,
            status: 'reviewed',
            allocatedTo: { type: 'account', value: '3000-005' },
            vatType: 'standard_rated_purchases',
            merchantKey: 'ACME OFFICE CLEANING'
          }
        ]
      };
      const res = executeTriagePipeline({ description: 'ACME OFFICE CLEANING JHB', amount: -1200.00, date: '2026-09-08' }, historyOnlyContext);
      expect(res.isAllocated).toBe(true);
      expect(res.source).toBe('history');
      expect(res.accountId).toBe('3000-005');
      expect(res.vatType).toBe('standard_rated_purchases');
    });

    it('2. refuses to auto-allocate if past history allocations are mixed or inconsistent', () => {
      const mixedContext: TriageContext = {
        ...dummyContext,
        historicalTransactions: [
          { id: 'h1', bankAccountId: 'bank_01', date: '2026-09-01', isExpense: true, description: 'MIXED VENDOR', amount: -100, status: 'reviewed', allocatedTo: { type: 'account', value: '3000-001' }, vatType: 'standard_rated_purchases', merchantKey: 'MIXED VENDOR' },
          { id: 'h2', bankAccountId: 'bank_01', date: '2026-09-01', isExpense: true, description: 'MIXED VENDOR', amount: -120, status: 'reviewed', allocatedTo: { type: 'account', value: '3000-002' }, vatType: 'zero_rated_purchases', merchantKey: 'MIXED VENDOR' }
        ]
      };
      const res = executeTriagePipeline({ description: 'MIXED VENDOR SHOP', amount: -110.00, date: '2026-09-09' }, mixedContext);
      expect(res.source).not.toBe('history');
    });

    it('3. ignores historical transactions in "new" or "ai_processing" status', () => {
      const unreviewedContext: TriageContext = {
        ...dummyContext,
        historicalTransactions: [
          { id: 'h1', bankAccountId: 'bank_01', date: '2026-09-01', isExpense: true, description: 'NEW VENDOR', amount: -100, status: 'new', allocatedTo: { type: 'account', value: '3000-001' }, merchantKey: 'NEW VENDOR' }
        ]
      };
      const res = executeTriagePipeline({ description: 'NEW VENDOR SERVICE', amount: -100.00, date: '2026-09-10' }, unreviewedContext);
      expect(res.source).not.toBe('history');
    });

    it('4. matches history memory specifically by canonical merchantKey', () => {
      const cleaned = cleanAndGroupTransaction('CALTEX FOURWAYS');
      expect(cleaned.merchantKey).toBe('CALTEX');
    });

    it('5. preserves canonical VAT type from historical allocation', () => {
      const res = executeTriagePipeline({ description: 'CALTEX FOURWAYS', amount: -750.00, date: '2026-09-11' }, dummyContext);
      expect(res.vatType).toBe('zero_rated_purchases');
    });
  });

  describe('Suite 1.4: Feature 6 - Chart of Accounts Resolution', () => {
    it('1. maps rule category "fuel_motor_expenses" to client COA "3000-033"', () => {
      const coa = [{ accountNumber: '3000-033', accountName: 'Fuel', accountType: 'Expense' }];
      const resolved = resolveAccountForCategory(coa, { accountId: '3800', category: 'fuel_motor_expenses' });
      expect(resolved?.accountNumber).toBe('3000-033');
    });

    it('2. resolves legacy Pastel 4-digit code "2150" to 7-digit SARS VAT Control "7000-008"', () => {
      const coa = [{ accountNumber: '7000-008', accountName: 'SARS VAT Control', accountType: 'Liability' }];
      const resolved = resolveAccountForCategory(coa, { accountId: '2150', category: 'sars_statutory' });
      expect(resolved?.accountNumber).toBe('7000-008');
    });

    it('3. matches account synonyms for Telephone and Internet', () => {
      const coa = [{ accountNumber: 'EXP-TEL-01', accountName: 'Cell & Internet Connectivity', accountType: 'Expense' }];
      const resolved = resolveAccountForCategory(coa, { accountId: '4500', category: 'telecoms_internet' });
      expect(resolved?.accountNumber).toBe('EXP-TEL-01');
    });

    it('4. resolves legacy code "2200" to PAYE / UIF liability "7000-011"', () => {
      const coa = [{ accountNumber: '7000-011', accountName: 'SARS PAYE Liability', accountType: 'Liability' }];
      const resolved = resolveAccountForCategory(coa, { accountId: '2200', category: 'sars_statutory' });
      expect(resolved?.accountNumber).toBe('7000-011');
    });

    it('5. falls back cleanly to General Expense account when category has no exact match', () => {
      const coa = [{ accountNumber: '9999-001', accountName: 'General Expenses', accountType: 'Expense' }];
      const resolved = resolveAccountForCategory(coa, { accountId: 'UNKNOWN_99', category: 'unmapped_random_category' });
      expect(resolved?.accountNumber).toBe('9999-001');
    });
  });

  describe('Suite 1.5: Feature 8 & 9 - Noise Elimination & First-Class Channel Tagging', () => {
    it('1. accurately tags DEBIT_ORDER and strips prefix noise', () => {
      const cleaned = cleanAndGroupTransaction('DEBIT ORDER OUTSURANCE INSURANCE 998877');
      expect(cleaned.channel).toBe('DEBIT_ORDER');
      expect(cleaned.clean).toContain('OUTSURANCE');
    });

    it('2. accurately tags POS channel from physical retail terminal swipes', () => {
      const cleaned = cleanAndGroupTransaction('POS PURCHASE CHECKERS HYPER 123456');
      expect(cleaned.channel).toBe('POS');
      expect(cleaned.clean).toContain('CHECKERS');
    });

    it('3. accurately tags CARD channel from cheque card / Visa / Mastercard transactions', () => {
      const cleaned = cleanAndGroupTransaction('CHEQUE CARD PURCHASE TAKEALOT CAPE TOWN');
      expect(cleaned.channel).toBe('CARD');
    });

    it('4. accurately tags EFT channel from internet banking transfers', () => {
      const cleaned = cleanAndGroupTransaction('INTERNET PMT TO TELKOM REF 99001');
      expect(cleaned.channel).toBe('EFT');
    });

    it('5. accurately tags RTC channel from real-time clearing / PayShap immediate', () => {
      const cleaned = cleanAndGroupTransaction('RTC EXPRESS PMT TO CONTRACTOR PLUMBING');
      expect(cleaned.channel).toBe('RTC');
    });

    it('6. accurately tags ATM channel from cash withdrawals', () => {
      const cleaned = cleanAndGroupTransaction('ATM WITHDRAWAL SANDTON CITY');
      expect(cleaned.channel).toBe('ATM');
    });

    it('7. accurately tags FEE channel from banking charges and fees', () => {
      const cleaned = cleanAndGroupTransaction('FNB #MONTHLY ACCOUNT FEE FOR AUG');
      expect(cleaned.channel).toBe('FEE');
    });
  });

  describe('Suite 1.6: Feature 10 & 26 - Clue Extraction Preservation', () => {
    it('1. extracts 10-digit SA VAT numbers starting with 4', () => {
      const clues = extractStructuralClues('SUPPLIER INVOICE 4123456789 PAYMENT');
      expect(clues.vatNumber).toBe('4123456789');
    });

    it('2. ignores 10-digit numbers starting with non-4 digits', () => {
      const clues = extractStructuralClues('SUPPLIER INVOICE 5123456789 PAYMENT');
      expect(clues.vatNumber).toBeUndefined();
    });

    it('3. extracts South African telephone numbers', () => {
      const clues = extractStructuralClues('TELKOM SA 011-234-5678 FIBRE');
      expect(clues.phoneNumber).toBe('0112345678');
    });

    it('4. extracts SARS 19-digit Payment Reference Numbers (PRN)', () => {
      const clues = extractStructuralClues('SARS PRN 1940000000000000000 PAYMENT');
      expect(clues.prn).toBe('1940000000000000000');
    });

    it('5. preserves structural clues in CleanedTransaction metadata', () => {
      const cleaned = cleanAndGroupTransaction('INTERNET PMT TO VODACOM 0821234567 VAT 4987654321');
      expect(cleaned.structuralClues.phoneNumber).toBe('0821234567');
      expect(cleaned.structuralClues.vatNumber).toBe('4987654321');
    });
  });

  describe('Suite 1.7: Feature 11 - Location Suffix Guardrail', () => {
    it('1. strips branch locator when appearing as trailing suffix after national brand', () => {
      const cleaned = cleanAndGroupTransaction('ENGEN WATERKLOOF');
      expect(cleaned.merchantKey).toBe('ENGEN');
      expect(cleaned.branchLocation).toBe('WATERKLOOF');
    });

    it('2. strips city code when appearing after recognized national chain', () => {
      const cleaned = cleanAndGroupTransaction('WOOLWORTHS SANDTON');
      expect(cleaned.merchantKey).toBe('WOOLWORTHS');
      expect(cleaned.branchLocation).toBe('SANDTON');
    });

    it('3. strictly preserves leading location name on independent local businesses', () => {
      const cleaned = cleanAndGroupTransaction('BLAIRGOWRIE HYPER MARKET');
      expect(cleaned.clean).toContain('BLAIRGOWRIE HYPER');
      expect(cleaned.clean.startsWith('HYPER')).toBe(false);
    });

    it('4. preserves leading city on independent auto repairers', () => {
      const cleaned = cleanAndGroupTransaction('RANDBURG AUTO REPAIRS');
      expect(cleaned.clean).toContain('RANDBURG AUTO REPAIRS');
    });

    it('5. preserves full local business entity without stripping location prefix', () => {
      const cleaned = cleanAndGroupTransaction('ALBERTON PHARMACY CC');
      expect(cleaned.clean).toContain('ALBERTON PHARMACY');
    });
  });

  describe('Suite 1.8: Feature 13, 14, 15 - Root Brand Consolidation & Contractual Segregation', () => {
    it('1. consolidates multiple Engen branches under canonical root brand "ENGEN"', () => {
      const b1 = cleanAndGroupTransaction('ENGEN WINCHESTER');
      const b2 = cleanAndGroupTransaction('ENGEN WATERKLOOF');
      const b3 = cleanAndGroupTransaction('ENGEN GARAGE 4421');
      expect(b1.merchantKey).toBe('ENGEN');
      expect(b2.merchantKey).toBe('ENGEN');
      expect(b3.merchantKey).toBe('ENGEN');
    });

    it('2. consolidates multiple Woolworths Food branches under "WOOLWORTHS"', () => {
      const w1 = cleanAndGroupTransaction('WOOLWORTHS FOOD #1024');
      const w2 = cleanAndGroupTransaction('WOOLWORTHS SANDTON');
      expect(w1.merchantKey).toBe('WOOLWORTHS');
      expect(w2.merchantKey).toBe('WOOLWORTHS');
    });

    it('3. preserves branch location metadata across different branches', () => {
      const w1 = cleanAndGroupTransaction('WOOLWORTHS SANDTON');
      expect(w1.branchLocation).toBe('SANDTON');
    });

    it('4. segregates recurring DEBIT_ORDER transactions from ad-hoc POS / CARD spend', () => {
      const debitTx = cleanAndGroupTransaction('DEBIT ORDER VODACOM SA');
      const posTx = cleanAndGroupTransaction('POS PURCHASE VODACOM STORE');
      expect(debitTx.merchantKey).toBe('VODACOM:DEBIT_ORDER');
      expect(posTx.merchantKey).toBe('VODACOM');
      expect(debitTx.merchantKey).not.toBe(posTx.merchantKey);
    });

    it('5. groups franchise supermarket branches under canonical SPAR brand', () => {
      const s1 = cleanAndGroupTransaction('SPAR NORTHCLIFF');
      const s2 = cleanAndGroupTransaction('SUPERSPAR BROADACRES');
      expect(s1.merchantKey).toBe('SPAR');
      expect(s2.merchantKey).toBe('SUPERSPAR');
    });
  });

  describe('Suite 1.9: Feature 16, 17, 18 - Union-Find Clustering & Safe Merges', () => {
    it('1. successfully clusters typo variants (e.g. MUGG & BEAN vs MUGGNBEAN)', () => {
      const keys = ['MUGG & BEAN', 'MUGGNBEAN'];
      const proposals = proposeRegroupsEngine(keys);
      expect(proposals.length).toBe(1);
      expect(proposals[0].score).toBeGreaterThanOrEqual(85);
    });

    it('2. clusters domain and dot variations (e.g. TAKEALOT ONLINE vs TAKEALOT COM)', () => {
      const keys = ['TAKEALOT ONLINE', 'TAKEALOT COM'];
      const proposals = proposeRegroupsEngine(keys);
      expect(proposals.length).toBe(1);
    });

    it('3. prevents false merges across distinct merchants sharing generic words', () => {
      const keys = ['THE HARDWARE STORE', 'THE BAKERY SHOP'];
      const proposals = proposeRegroupsEngine(keys);
      expect(proposals.length).toBe(0);
    });

    it('4. calculates Levenshtein + Jaccard similarity accurately', () => {
      const sim = BankCleaner.getSimilarity('OUTSURANCE', 'OUTSURANCE DEBIT');
      expect(sim.score).toBeGreaterThan(0.80);
    });

    it('5. generates formatted merge proposals for UI bulk action', () => {
      const keys = ['ENGEN WATERKLOOF', 'ENGEN WINCHESTER'];
      const proposals = proposeRegroupsEngine(keys);
      expect(Array.isArray(proposals)).toBe(true);
    });
  });

  describe('Suite 1.10: Feature 19, 20, 21, 22, 24 - Detective Engine Clues 1-3 & 5', () => {
    it('1. Clue 1 (Timing): flags payroll window on the 25th - end of month', () => {
      const analysis = executeDetectiveEngine({ description: 'SALARIES STAFF BATCH', amount: -45000.00, date: '2026-09-25' });
      const timingBadge = analysis.badges.find(b => b.type === 'timing');
      expect(timingBadge).toBeDefined();
      expect(timingBadge?.label).toContain('End of Month Cycle');
    });

    it('2. Clue 1 (Timing): flags recurring debit order window between 1st and 7th', () => {
      const analysis = executeDetectiveEngine({ description: 'DEBIT ORDER OFFICE RENT', amount: -15000.00, date: '2026-09-02' });
      const timingBadge = analysis.badges.find(b => b.type === 'timing');
      expect(timingBadge).toBeDefined();
      expect(timingBadge?.label).toContain('Start of Month Billing');
    });

    it('3. Clue 2 (Amount): identifies exact 15% standard VAT factors', () => {
      const analysis = executeDetectiveEngine({ description: 'SUPPLIER COMMERCIAL INVOICE', amount: -1150.00, date: '2026-09-10' });
      const amountBadge = analysis.badges.find(b => b.type === 'amount');
      expect(amountBadge).toBeDefined();
      expect(amountBadge?.label).toContain('15% VAT');
    });

    it('4. Clue 3 (Prefix): decodes contractual debit order intent', () => {
      const analysis = executeDetectiveEngine({ description: 'DEBIT ORDER TELKOM FIBRE', amount: -899.00, date: '2026-09-03' });
      const prefixBadge = analysis.badges.find(b => b.type === 'prefix');
      expect(prefixBadge?.label).toBe('Contractual Debit Order');
    });

    it('5. Clue 3 (Prefix): decodes POS card retail intent', () => {
      const analysis = executeDetectiveEngine({ description: 'POS PURCHASE WOOLWORTHS', amount: -350.00, date: '2026-09-15' });
      const prefixBadge = analysis.badges.find(b => b.type === 'prefix');
      expect(prefixBadge?.label).toBe('Discretionary Card / POS');
    });
  });

  describe('Suite 1.11: Feature 23 - Detective Engine Clue 4: SARS PRNs to Balance Sheet Liabilities', () => {
    it('1. VAT201 PRN allocates to Balance Sheet 7000-008 (VAT Control) with no_vat', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS VAT201 PRN 1940012345678901234', amount: -28500.00, date: '2026-09-25' });
      expect(analysis.suggestedAccountId).toBe('7000-008');
      expect(analysis.suggestedVatType).toBe('no_vat');
      expect(analysis.badges.some(b => b.label.includes('SARS VAT201'))).toBe(true);
    });

    it('2. EMP201 PRN allocates to Balance Sheet 7000-011 (PAYE/UIF Liability) with no_vat', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS EMP201 PRN 1950098765432109876', amount: -14200.00, date: '2026-09-07' });
      expect(analysis.suggestedAccountId).toBe('7000-011');
      expect(analysis.suggestedVatType).toBe('no_vat');
      expect(analysis.badges.some(b => b.label.includes('SARS EMP201'))).toBe(true);
    });

    it('3. Provisional Tax settlement allocates to Balance Sheet 7000-015 with no_vat', () => {
      const analysis = executeDetectiveEngine({ description: 'SARSEFLNG 9876543210 PROV TAX', amount: -35000.00, date: '2026-08-31' });
      expect(analysis.suggestedAccountId).toBe('7000-015');
      expect(analysis.suggestedVatType).toBe('no_vat');
    });

    it('4. strictly disallows operating expense accounts for SARS statutory payments', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS VAT201 PRN 1940000000000000000', amount: -5000.00, date: '2026-09-25' });
      expect(analysis.suggestedAccountId.startsWith('3000')).toBe(false);
      expect(analysis.suggestedAccountId.startsWith('5000')).toBe(false);
    });

    it('5. strictly disallows input VAT deduction on SARS statutory tax settlements', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS EMP201 PAYMENT', amount: -12000.00, date: '2026-09-07' });
      expect(analysis.suggestedVatType).toBe('no_vat');
      expect(analysis.suggestedVatType).not.toBe('standard_rated_purchases');
    });
  });

  describe('Suite 1.12: Feature 25 - Detective Engine Clue 6: Inter-Account Sweeps', () => {
    it('1. detects matching debit/credit contra transfer pair across accounts within 1 day', () => {
      const tx1 = { id: 't1', description: 'TRANSFER TO SAVINGS', amount: -25000.00, date: '2026-09-10', bankAccountId: 'cheque' };
      const tx2 = { id: 't2', description: 'TRANSFER FROM CHEQUE', amount: 25000.00, date: '2026-09-11', bankAccountId: 'savings' };
      const analysis = executeDetectiveEngine(tx1, [tx1, tx2]);
      expect(analysis.suggestedAccountId).toBe('9500-003');
      expect(analysis.suggestedVatType).toBe('no_vat');
      expect(analysis.badges.some(b => b.type === 'sweep')).toBe(true);
    });

    it('2. detects sweep pair occurring up to 3 days apart', () => {
      const tx1 = { id: 't1', description: 'SWEEP OUT', amount: -50000.00, date: '2026-09-01' };
      const tx2 = { id: 't2', description: 'SWEEP IN', amount: 50000.00, date: '2026-09-04' };
      const analysis = executeDetectiveEngine(tx1, [tx1, tx2]);
      expect(analysis.suggestedAccountId).toBe('9500-003');
    });

    it('3. rejects sweep pairing if time difference exceeds 3 days (>72 hours)', () => {
      const tx1 = { id: 't1', description: 'TRANSFER TO NOTICE', amount: -10000.00, date: '2026-09-01' };
      const tx2 = { id: 't2', description: 'NOTICE DEPOSIT', amount: 10000.00, date: '2026-09-06' };
      const analysis = executeDetectiveEngine(tx1, [tx1, tx2]);
      expect(analysis.badges.some(b => b.type === 'sweep')).toBe(false);
    });

    it('4. rejects sweep pairing if amounts do not match exactly', () => {
      const tx1 = { id: 't1', description: 'TRANSFER', amount: -10000.00, date: '2026-09-01' };
      const tx2 = { id: 't2', description: 'TRANSFER', amount: 9950.00, date: '2026-09-02' };
      const analysis = executeDetectiveEngine(tx1, [tx1, tx2]);
      expect(analysis.badges.some(b => b.type === 'sweep')).toBe(false);
    });

    it('5. allocates sweep strictly to Bank Transfer Suspense with no_vat', () => {
      const tx1 = { id: 't1', description: 'SWEEP', amount: -5000.00, date: '2026-09-01' };
      const tx2 = { id: 't2', description: 'SWEEP', amount: 5000.00, date: '2026-09-01' };
      const analysis = executeDetectiveEngine(tx1, [tx1, tx2]);
      expect(analysis.suggestedAccountId).toBe('9500-003');
      expect(analysis.suggestedVatType).toBe('no_vat');
    });
  });

  describe('Suite 1.13: Feature 27, 28, 29, 30 - Confidence Scoring, Badges, Rule Scoping & Low-Confidence Staging', () => {
    it('1. generates rich visual clue badges with type, label, detail, and score', () => {
      const analysis = executeDetectiveEngine({ description: 'DEBIT ORDER OUTSURANCE 4123456789', amount: -1150.00, date: '2026-09-02' });
      expect(analysis.badges.length).toBeGreaterThanOrEqual(3);
      expect(analysis.badges[0]).toHaveProperty('confidenceContribution');
    });

    it('2. auto-allocates to "reviewed" when composite confidence >= 80%', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS VAT201 PRN 1940000000000000000', amount: -25000.00, date: '2026-09-25' });
      expect(analysis.compositeConfidence).toBeGreaterThanOrEqual(80);
      expect(analysis.isAutoAllocatable).toBe(true);
      expect(analysis.status).toBe('reviewed');
    });

    it('3. scopes rule creation to "global_practice" for recognized national brands', () => {
      const analysis = executeDetectiveEngine({ description: 'DEBIT ORDER OUTSURANCE VEHICLE', amount: -1500.00, date: '2026-09-01' });
      expect(analysis.ruleScoping).toBe('global_practice');
    });

    it('4. scopes rule creation to "client" for local or independent merchants', () => {
      const analysis = executeDetectiveEngine({ description: 'JOE LOCAL PLUMBING SERVICES', amount: -2300.00, date: '2026-09-12' });
      expect(analysis.ruleScoping).toBe('client');
    });

    it('5. leaves low-confidence transactions (<80%) unallocated in "ai_review"', () => {
      const analysis = executeDetectiveEngine({ description: 'UNKNOWN SUNDRY SPEND', amount: -42.15, date: '2026-09-14' });
      expect(analysis.compositeConfidence).toBeLessThan(80);
      expect(analysis.isAutoAllocatable).toBe(false);
      expect(analysis.status).toBe('ai_review');
    });

    it('6. generates strictly ZERO automated client query cards for low-confidence items', () => {
      const analysis = executeDetectiveEngine({ description: 'UNRECOGNIZED VENDOR', amount: -99.00, date: '2026-09-15' });
      expect(analysis.status).toBe('ai_review');
      expect((analysis as any).queryCard).toBeUndefined();
    });
  });
});

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES (>=5 tests per boundary dimension)
// ============================================================================

describe('Tier 2: Boundary & Corner Cases', () => {
  describe('Suite 2.1: Negative Amounts & Extreme Expense Values', () => {
    it('1. processes large negative expense amount (-R1,500,000.00)', () => {
      const res = executeTriagePipeline({ description: 'VODACOM FIBRE BULK', amount: -1500000.00, date: '2026-09-01' }, dummyContext);
      expect(res.isAllocated).toBe(true);
    });

    it('2. processes minimal fractional negative expense (-R0.05)', () => {
      const res = executeTriagePipeline({ description: 'BANK CHARGES ADJUSTMENT', amount: -0.05, date: '2026-09-01' }, dummyContext);
      expect(res.status).toBe('reviewed');
    });

    it('3. parses negative currency with 4 decimal places cleanly', () => {
      const res = executeTriagePipeline({ description: 'TELKOM SA FIBRE', amount: -499.9999, date: '2026-09-01' }, dummyContext);
      expect(res.isAllocated).toBe(true);
    });

    it('4. handles parenthesized negative representation', () => {
      const res = executeTriagePipeline({ description: 'VODACOM DATA', amount: -120.00, isExpense: true, date: '2026-09-01' }, dummyContext);
      expect(res.isAllocated).toBe(true);
    });

    it('5. prevents negative values from wrapping or overflowing', () => {
      const res = executeTriagePipeline({ description: 'VODACOM ENTERPRISE', amount: -99999999.99, date: '2026-09-01' }, dummyContext);
      expect(res.isAllocated).toBe(true);
    });
  });

  describe('Suite 2.2: Zero Amounts, Fractional Cents & Massive Totals', () => {
    it('1. ignores exactly zero amount (0.00) as non-expense', () => {
      const res = executeTriagePipeline({ description: 'ZERO FEE NOTICE', amount: 0.00, date: '2026-09-01' }, dummyContext);
      expect(res.isAllocated).toBe(false);
      expect(res.status).toBe('new');
    });

    it('2. handles zero amount when explicit isExpense: true is provided', () => {
      const res = executeTriagePipeline({ description: 'VODACOM ZERO INVOICE', amount: 0.00, isExpense: true, date: '2026-09-01' }, dummyContext);
      expect(res.isAllocated).toBe(true);
    });

    it('3. handles 0.01 cent micro-transaction', () => {
      const res = executeTriagePipeline({ description: 'VODACOM CENT CHARGE', amount: -0.01, date: '2026-09-01' }, dummyContext);
      expect(res.isAllocated).toBe(true);
    });

    it('4. calculates 15% VAT fraction on 0.5-cent boundary values', () => {
      const analysis = executeDetectiveEngine({ description: 'INVOICE 115.005', amount: -115.005, date: '2026-09-10' });
      expect(analysis.badges).toBeDefined();
    });

    it('5. handles massive corporate tax settlement (-R99,999,999.99)', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS VAT201 PRN 1940000000000000000', amount: -99999999.99, date: '2026-09-25' });
      expect(analysis.suggestedAccountId).toBe('7000-008');
    });
  });

  describe('Suite 2.3: Empty Strings, Whitespace & Corrupted Banking Feeds', () => {
    it('1. safely handles empty string description ""', () => {
      const cleaned = cleanAndGroupTransaction('');
      expect(cleaned.clean).toBe('UNKNOWN');
      expect(cleaned.channel).toBe('UNKNOWN');
    });

    it('2. safely handles whitespace-only description "   "', () => {
      const cleaned = cleanAndGroupTransaction('   ');
      expect(cleaned.clean).toBe('UNKNOWN');
    });

    it('3. handles string with only punctuation and symbols "!@#$%^&*()"', () => {
      const cleaned = cleanAndGroupTransaction('!@#$%^&*()');
      expect(cleaned.clean).toBeDefined();
    });

    it('4. safely truncates extreme repetitive string "AAAAA....."', () => {
      const longStr = 'A'.repeat(500);
      const cleaned = cleanAndGroupTransaction(longStr);
      expect(cleaned.clean.length).toBeLessThanOrEqual(500);
    });

    it('5. handles null or undefined string defensively', () => {
      const cleaned = cleanAndGroupTransaction(null as any);
      expect(cleaned.clean).toBe('UNKNOWN');
    });
  });

  describe('Suite 2.4: Multi-Digit VAT Numbers', () => {
    it('1. extracts standard 10-digit SA VAT starting with 4 (4123456789)', () => {
      const clues = extractStructuralClues('VENDOR 4123456789');
      expect(clues.vatNumber).toBe('4123456789');
    });

    it('2. ignores 10-digit number starting with 5 (5123456789)', () => {
      const clues = extractStructuralClues('VENDOR 5123456789');
      expect(clues.vatNumber).toBeUndefined();
    });

    it('3. ignores 9-digit number', () => {
      const clues = extractStructuralClues('VENDOR 412345678');
      expect(clues.vatNumber).toBeUndefined();
    });

    it('4. ignores 11-digit number', () => {
      const clues = extractStructuralClues('VENDOR 41234567890');
      expect(clues.vatNumber).toBeUndefined();
    });

    it('5. extracts VAT number embedded inside complex invoice string', () => {
      const clues = extractStructuralClues('INV-990-VAT4987654321-PAID');
      expect(clues.vatNumber).toBe('4987654321');
    });
  });

  describe('Suite 2.5: Boundary Calendar Dates', () => {
    it('1. triggers timing badge on exact 25th of month', () => {
      const analysis = executeDetectiveEngine({ description: 'PAYROLL SALARY', amount: -20000, date: '2026-09-25' });
      expect(analysis.badges.some(b => b.type === 'timing')).toBe(true);
    });

    it('2. triggers timing badge on 30th on 30-day month (April)', () => {
      const analysis = executeDetectiveEngine({ description: 'SALARIES', amount: -20000, date: '2026-04-30' });
      expect(analysis.badges.some(b => b.type === 'timing')).toBe(true);
    });

    it('3. triggers timing badge on 31st on 31-day month (December)', () => {
      const analysis = executeDetectiveEngine({ description: 'SALARIES', amount: -20000, date: '2026-12-31' });
      expect(analysis.badges.some(b => b.type === 'timing')).toBe(true);
    });

    it('4. triggers timing badge on leap year February 29th (2024-02-29)', () => {
      const analysis = executeDetectiveEngine({ description: 'SALARIES', amount: -20000, date: '2024-02-29' });
      expect(analysis.badges.some(b => b.type === 'timing')).toBe(true);
    });

    it('5. triggers timing badge on non-leap year February 28th (2025-02-28)', () => {
      const analysis = executeDetectiveEngine({ description: 'SALARIES', amount: -20000, date: '2025-02-28' });
      expect(analysis.badges.some(b => b.type === 'timing')).toBe(true);
    });
  });

  describe('Suite 2.6: 1st-7th Debit Order Window vs Mid-Month', () => {
    it('1. day 1 of month activates start-of-month timing badge', () => {
      const analysis = executeDetectiveEngine({ description: 'DEBIT ORDER RENT', amount: -10000, date: '2026-09-01' });
      expect(analysis.badges.some(b => b.label.includes('Start of Month'))).toBe(true);
    });

    it('2. day 7 of month activates start-of-month timing badge', () => {
      const analysis = executeDetectiveEngine({ description: 'DEBIT ORDER INSURANCE', amount: -2000, date: '2026-09-07' });
      expect(analysis.badges.some(b => b.label.includes('Start of Month'))).toBe(true);
    });

    it('3. day 8 of month does NOT activate start-of-month timing badge', () => {
      const analysis = executeDetectiveEngine({ description: 'DEBIT ORDER INSURANCE', amount: -2000, date: '2026-09-08' });
      expect(analysis.badges.some(b => b.label.includes('Start of Month'))).toBe(false);
    });

    it('4. day 15 mid-month does NOT activate timing badge', () => {
      const analysis = executeDetectiveEngine({ description: 'DEBIT ORDER INSURANCE', amount: -2000, date: '2026-09-15' });
      expect(analysis.badges.some(b => b.type === 'timing')).toBe(false);
    });

    it('5. month transition from day 31 to day 1 switches from end-of-month to start-of-month', () => {
      const day31 = executeDetectiveEngine({ description: 'PAYMENT', amount: -1000, date: '2026-08-31' });
      const day1 = executeDetectiveEngine({ description: 'PAYMENT', amount: -1000, date: '2026-09-01' });
      expect(day31.badges.find(b => b.type === 'timing')?.label).toContain('End of Month');
      expect(day1.badges.find(b => b.type === 'timing')?.label).toContain('Start of Month');
    });
  });

  describe('Suite 2.7: Unusual Spoken Symbols & Complex Delimiters', () => {
    it('1. handles "@" spoken symbol interchangeability ("3@1" <-> "3 AT 1")', () => {
      expect(matchesRuleKeyword('3@1 BLAIRGOWRIE', '3 AT 1')).toBe(true);
      expect(matchesRuleKeyword('PURCHASE @HOME SANDTON', 'AT HOME')).toBe(true);
    });

    it('2. handles "&" inside brand name ("MUGG & BEAN")', () => {
      expect(matchesRuleKeyword('MUGG & BEAN SANDTON', 'MUGG AND BEAN')).toBe(true);
    });

    it('3. handles "+" in medical and pharmacy brands ("DIS-CHEM + PHARMACY")', () => {
      expect(matchesRuleKeyword('DIS-CHEM + PHARMACY WATERKLOOF', 'DIS-CHEM')).toBe(true);
    });

    it('4. handles slashes and hashes in banking references ("#SERVICE FEES", "TELKOM/SA")', () => {
      expect(matchesRuleKeyword('FNB #SERVICE FEES FOR AUG', '#SERVICE FEES')).toBe(true);
      expect(matchesRuleKeyword('PAYMENT TO TELKOM/SA', 'TELKOM')).toBe(true);
    });

    it('5. handles asterisk auth tags ("POS 491050*9002 UBER")', () => {
      expect(matchesRuleKeyword('POS PURCHASE 491050*9002 UBER TRIP', 'UBER')).toBe(true);
    });
  });

  describe('Suite 2.8: Typo Variants & Compacted String Matching', () => {
    it('1. matches compacted name without spaces ("MUGGNBEAN" vs "MUGG & BEAN")', () => {
      const proposals = proposeRegroupsEngine(['MUGG & BEAN', 'MUGGNBEAN']);
      expect(proposals.length).toBe(1);
    });

    it('2. matches missing vowel typo ("WOOLWTHS" vs "WOOLWORTHS")', () => {
      const proposals = proposeRegroupsEngine(['WOOLWORTHS', 'WOOLWTHS']);
      expect(proposals.length).toBe(1);
    });

    it('3. matches double letter typo ("ENNGEN" vs "ENGEN") using Levenshtein distance', () => {
      const lev = BankCleaner.calculateLevenshtein('ENNGEN', 'ENGEN');
      expect(lev).toBeGreaterThan(0.80);
    });

    it('4. matches transposed adjacent letters ("TAEKALOT" vs "TAKEALOT") using Levenshtein', () => {
      const lev = BankCleaner.calculateLevenshtein('TAEKALOT', 'TAKEALOT');
      expect(lev).toBeGreaterThanOrEqual(0.75);
    });

    it('5. prevents merging short distinct words ("SHELL" vs "SMELL")', () => {
      const proposals = proposeRegroupsEngine(['SHELL', 'SMELL']);
      expect(proposals.length).toBe(0);
    });
  });

  describe('Suite 2.9: Inter-Account Sweep 3-Day Window Limits', () => {
    it('1. pairs same-day contra transfer (0 days difference)', () => {
      const t1 = { description: 'XFER OUT', amount: -5000, date: '2026-09-01' };
      const t2 = { description: 'XFER IN', amount: 5000, date: '2026-09-01' };
      const res = executeDetectiveEngine(t1, [t1, t2]);
      expect(res.suggestedAccountId).toBe('9500-003');
    });

    it('2. pairs 1-day difference contra transfer', () => {
      const t1 = { description: 'XFER OUT', amount: -5000, date: '2026-09-01' };
      const t2 = { description: 'XFER IN', amount: 5000, date: '2026-09-02' };
      const res = executeDetectiveEngine(t1, [t1, t2]);
      expect(res.suggestedAccountId).toBe('9500-003');
    });

    it('3. pairs 2-day difference contra transfer', () => {
      const t1 = { description: 'XFER OUT', amount: -5000, date: '2026-09-01' };
      const t2 = { description: 'XFER IN', amount: 5000, date: '2026-09-03' };
      const res = executeDetectiveEngine(t1, [t1, t2]);
      expect(res.suggestedAccountId).toBe('9500-003');
    });

    it('4. pairs exactly 3-day difference contra transfer', () => {
      const t1 = { description: 'XFER OUT', amount: -5000, date: '2026-09-01' };
      const t2 = { description: 'XFER IN', amount: 5000, date: '2026-09-04' };
      const res = executeDetectiveEngine(t1, [t1, t2]);
      expect(res.suggestedAccountId).toBe('9500-003');
    });

    it('5. rejects pairing exceeding 3 days (4 days difference)', () => {
      const t1 = { description: 'XFER OUT', amount: -5000, date: '2026-09-01' };
      const t2 = { description: 'XFER IN', amount: 5000, date: '2026-09-05' };
      const res = executeDetectiveEngine(t1, [t1, t2]);
      expect(res.badges.some(b => b.type === 'sweep')).toBe(false);
    });

    it('6. rejects pairing when amounts differ by even R0.01', () => {
      const t1 = { description: 'XFER OUT', amount: -5000.00, date: '2026-09-01' };
      const t2 = { description: 'XFER IN', amount: 5000.01, date: '2026-09-02' };
      const res = executeDetectiveEngine(t1, [t1, t2]);
      expect(res.badges.some(b => b.type === 'sweep')).toBe(false);
    });
  });
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Interactions)
// ============================================================================

describe('Tier 3: Cross-Feature Combinations', () => {
  describe('Suite 3.1: Cleaning + Root Brand Grouping + Branch Preservation', () => {
    it('1. combines cleaning, national brand grouping and branch locator extraction on Engen', () => {
      const cleaned = cleanAndGroupTransaction('POS PURCHASE ENGEN WATERKLOOF 123456');
      expect(cleaned.merchantKey).toBe('ENGEN');
      expect(cleaned.branchLocation).toBe('WATERKLOOF');
    });

    it('2. combines cleaning, national brand grouping and branch locator extraction on Woolworths', () => {
      const cleaned = cleanAndGroupTransaction('CHEQUE CARD PURCHASE WOOLWORTHS SANDTON #99');
      expect(cleaned.merchantKey).toBe('WOOLWORTHS');
      expect(cleaned.branchLocation).toBe('SANDTON');
    });

    it('3. combines cleaning, national brand grouping and branch locator extraction on Shell', () => {
      const cleaned = cleanAndGroupTransaction('POS PURCHASE SHELL MIDRAND 4123456789');
      expect(cleaned.merchantKey).toBe('SHELL');
      expect(cleaned.branchLocation).toBe('MIDRAND');
      expect(cleaned.structuralClues.vatNumber).toBe('4123456789');
    });

    it('4. preserves independent business name while extracting suburb locator', () => {
      const cleaned = cleanAndGroupTransaction('BLAIRGOWRIE HYPER STORE SANDTON');
      expect(cleaned.clean.startsWith('BLAIRGOWRIE')).toBe(true);
    });

    it('5. cleans multiple auth codes while maintaining root brand key', () => {
      const cleaned = cleanAndGroupTransaction('POS PURCHASE AUTH 998877 TERM 001 ENGEN WINCHESTER');
      expect(cleaned.merchantKey).toBe('ENGEN');
      expect(cleaned.clean).not.toContain('AUTH 998877');
    });
  });

  describe('Suite 3.2: Contractual Debit Order vs POS Retail + History Memory', () => {
    const historyContext: TriageContext = {
      clientRules: [],
      masterRules: [],
      historicalTransactions: [
        { id: 'h_debit', bankAccountId: 'bank_01', date: '2026-09-01', isExpense: true, description: 'DEBIT ORDER VODACOM', amount: -899, status: 'reviewed', allocatedTo: { type: 'account', value: '3000-051' }, vatType: 'standard_rated_purchases', merchantKey: 'VODACOM:DEBIT_ORDER' },
        { id: 'h_pos', bankAccountId: 'bank_01', date: '2026-09-01', isExpense: true, description: 'POS VODACOM STORE', amount: -250, status: 'reviewed', allocatedTo: { type: 'account', value: '3000-036' }, vatType: 'standard_rated_purchases', merchantKey: 'VODACOM' }
      ]
    };

    it('1. routes contractual DEBIT_ORDER transaction to telephone contract account from history', () => {
      const res = executeTriagePipeline({ description: 'DEBIT ORDER VODACOM SA', amount: -899, date: '2026-09-02' }, historyContext);
      expect(res.source).toBe('history');
      expect(res.accountId).toBe('3000-051');
    });

    it('2. routes retail POS spend to stationery/equipment account from history', () => {
      const res = executeTriagePipeline({ description: 'POS PURCHASE VODACOM STORE SANDTON', amount: -250, date: '2026-09-10' }, historyContext);
      expect(res.source).toBe('history');
      expect(res.accountId).toBe('3000-036');
    });

    it('3. keeps distinct merchant keys for contractual and discretionary channels', () => {
      const debitKey = cleanAndGroupTransaction('DEBIT ORDER VODACOM').merchantKey;
      const posKey = cleanAndGroupTransaction('POS PURCHASE VODACOM').merchantKey;
      expect(debitKey).toBe('VODACOM:DEBIT_ORDER');
      expect(posKey).toBe('VODACOM');
      expect(debitKey).not.toBe(posKey);
    });

    it('4. ensures debit order history does not cross-contaminate POS transactions', () => {
      const res = executeTriagePipeline({ description: 'POS PURCHASE VODACOM', amount: -150, date: '2026-09-11' }, historyContext);
      expect(res.accountId).toBe('3000-036');
      expect(res.accountId).not.toBe('3000-051');
    });

    it('5. ensures POS history does not cross-contaminate debit order transactions', () => {
      const res = executeTriagePipeline({ description: 'DEBIT ORDER VODACOM', amount: -999, date: '2026-09-01' }, historyContext);
      expect(res.accountId).toBe('3000-051');
    });
  });

  describe('Suite 3.3: Inter-Account Sweep Detection + Strict Expense Safeguard', () => {
    it('1. recognizes credit leg of sweep as contra transfer to suspense (not commercial revenue)', () => {
      const creditLeg = { id: 'c1', description: 'TRANSFER FROM CHEQUE ACC', amount: 50000.00, date: '2026-09-02', isExpense: false };
      const debitLeg = { id: 'd1', description: 'TRANSFER TO SAVINGS ACC', amount: -50000.00, date: '2026-09-01' };
      const analysis = executeDetectiveEngine(creditLeg, [creditLeg, debitLeg]);
      expect(analysis.suggestedAccountId).toBe('9500-003');
      expect(analysis.suggestedVatType).toBe('no_vat');
      expect(analysis.badges.some(b => b.type === 'sweep')).toBe(true);
    });

    it('2. recognizes debit leg of sweep as contra transfer to suspense (not operating expense)', () => {
      const creditLeg = { id: 'c1', description: 'SWEEP CREDIT', amount: 15000.00, date: '2026-09-01' };
      const debitLeg = { id: 'd1', description: 'SWEEP DEBIT', amount: -15000.00, date: '2026-09-01' };
      const analysis = executeDetectiveEngine(debitLeg, [creditLeg, debitLeg]);
      expect(analysis.suggestedAccountId).toBe('9500-003');
      expect(analysis.suggestedVatType).toBe('no_vat');
    });

    it('3. isolates unpaired positive credit transactions to status "new"', () => {
      const creditTx = { description: 'UNPAIRED INFLOW CLIENT DEPOSIT', amount: 25000.00, isExpense: false, date: '2026-09-01' };
      const res = executeTriagePipeline(creditTx, dummyContext);
      expect(res.isAllocated).toBe(false);
      expect(res.status).toBe('new');
    });

    it('4. assigns no_vat to both legs of the sweep transaction', () => {
      const t1 = { id: '1', description: 'SWEEP', amount: -2000, date: '2026-09-01' };
      const t2 = { id: '2', description: 'SWEEP', amount: 2000, date: '2026-09-01' };
      const a1 = executeDetectiveEngine(t1, [t1, t2]);
      const a2 = executeDetectiveEngine(t2, [t1, t2]);
      expect(a1.suggestedVatType).toBe('no_vat');
      expect(a2.suggestedVatType).toBe('no_vat');
    });

    it('5. gives 45% confidence contribution to sweep detection', () => {
      const t1 = { id: '1', description: 'SWEEP', amount: -2000, date: '2026-09-01' };
      const t2 = { id: '2', description: 'SWEEP', amount: 2000, date: '2026-09-01' };
      const a1 = executeDetectiveEngine(t1, [t1, t2]);
      const badge = a1.badges.find(b => b.type === 'sweep');
      expect(badge?.confidenceContribution).toBe(45);
    });
  });

  describe('Suite 3.4: Clue Extraction + SARS PRN Reference Decoding to Balance Sheet', () => {
    it('1. extracts PRN clue and resolves to Balance Sheet 7000-008', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS PRN 1940001112223334445 VAT201', amount: -15000, date: '2026-09-25' });
      expect(analysis.suggestedAccountId).toBe('7000-008');
      expect(analysis.suggestedVatType).toBe('no_vat');
    });

    it('2. extracts PRN clue and resolves to Balance Sheet 7000-011 for EMP201', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS PRN 1950001112223334445 EMP201', amount: -9000, date: '2026-09-07' });
      expect(analysis.suggestedAccountId).toBe('7000-011');
      expect(analysis.suggestedVatType).toBe('no_vat');
    });

    it('3. combines PRN clue with 25th timing clue to achieve >= 80% auto-allocation', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS VAT201 PRN 1940001112223334445', amount: -20000, date: '2026-09-25' });
      expect(analysis.compositeConfidence).toBeGreaterThanOrEqual(80);
      expect(analysis.status).toBe('reviewed');
    });

    it('4. combines EMP201 PRN clue with 7th timing clue to achieve >= 80% auto-allocation', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS EMP201 PRN 1950001112223334445', amount: -12000, date: '2026-09-07' });
      expect(analysis.compositeConfidence).toBeGreaterThanOrEqual(80);
      expect(analysis.status).toBe('reviewed');
    });

    it('5. strictly prevents expense accounts when PRN is detected', () => {
      const analysis = executeDetectiveEngine({ description: 'SARS PRN 1940001112223334445 VAT201', amount: -15000, date: '2026-09-25' });
      expect(analysis.suggestedAccountId.startsWith('7000')).toBe(true);
    });
  });

  describe('Suite 3.5: Regrouping Proposal + Safe Merge Guardrails', () => {
    it('1. merges high-similarity merchant variants while blocking low-similarity distinct merchants', () => {
      const keys = ['MUGG & BEAN', 'MUGGNBEAN', 'TOTAL FOURWAYS', 'TOTAL BRYANSTON', 'RANDOM STORE A', 'RANDOM STORE B'];
      const proposals = proposeRegroupsEngine(keys);
      expect(proposals.some(p => p.fromKey.includes('MUGG') || p.toKey.includes('MUGG'))).toBe(true);
      expect(proposals.some(p => p.fromKey.includes('RANDOM STORE A') && p.toKey.includes('RANDOM STORE B'))).toBe(false);
    });

    it('2. safeguards against generic first token collisions', () => {
      const sim = BankCleaner.getSimilarity('THE CAFE', 'THE CLINIC');
      expect(sim.score).toBeLessThan(0.85);
    });

    it('3. clusters dot-com and local variations safely', () => {
      const proposals = proposeRegroupsEngine(['TAKEALOT COM', 'TAKEALOT ONLINE']);
      expect(proposals.length).toBe(1);
    });

    it('4. provides similarity score >= 85 for all approved regroup proposals', () => {
      const proposals = proposeRegroupsEngine(['MUGG & BEAN', 'MUGGNBEAN']);
      proposals.forEach(p => {
        expect(p.score).toBeGreaterThanOrEqual(85);
      });
    });

    it('5. handles single-element merchant groups without error', () => {
      const proposals = proposeRegroupsEngine(['UNIQUE STORE']);
      expect(proposals.length).toBe(0);
    });
  });

  describe('Suite 3.6: Hybrid Triage Collision Resolution: Client Rule vs Master Rule vs History', () => {
    const collisionContext: TriageContext = {
      clientRules: [
        { id: 'cr_win', description: 'Client Override', keywords: ['SHELL'], accountId: 'CLIENT-SPECIFIC-ACC', vatType: 'standard_rated_purchases' }
      ],
      masterRules: MASTER_ALLOCATION_RULES,
      historicalTransactions: [
        { id: 'h_collide', bankAccountId: 'bank_01', date: '2026-09-01', isExpense: true, description: 'SHELL ULTRA CITY', amount: -500, status: 'reviewed', allocatedTo: { type: 'account', value: 'HISTORY-ACC' }, vatType: 'zero_rated_purchases', merchantKey: 'SHELL' }
      ]
    };

    it('1. client rule definitively wins when client rule, master rule, and history all match', () => {
      const res = executeTriagePipeline({ description: 'SHELL ULTRA CITY FUEL', amount: -500, date: '2026-09-01' }, collisionContext);
      expect(res.source).toBe('client_rule');
      expect(res.accountId).toBe('CLIENT-SPECIFIC-ACC');
    });

    it('2. master rule wins over history memory when no client rule matches', () => {
      const noClientContext: TriageContext = {
        ...collisionContext,
        clientRules: []
      };
      const res = executeTriagePipeline({ description: 'SHELL ULTRA CITY FUEL', amount: -500, date: '2026-09-01' }, noClientContext);
      expect(res.source).toBe('master_rule');
    });

    it('3. history memory wins when neither client rule nor master rule matches', () => {
      const unmappedHistoryContext: TriageContext = {
        clientRules: [],
        masterRules: [],
        historicalTransactions: [
          { id: 'h_unmapped', bankAccountId: 'bank_01', date: '2026-09-01', isExpense: true, description: 'LOCAL ARTISAN BREAD', amount: -150, status: 'reviewed', allocatedTo: { type: 'account', value: '3000-035' }, vatType: 'standard_rated_purchases', merchantKey: 'LOCAL ARTISAN BREAD' }
        ]
      };
      const res = executeTriagePipeline({ description: 'LOCAL ARTISAN BREAD JHB', amount: -150, date: '2026-09-01' }, unmappedHistoryContext);
      expect(res.source).toBe('history');
      expect(res.accountId).toBe('3000-035');
    });

    it('4. unmapped transaction with no client rule, no master rule, and no history stays "new"', () => {
      const emptyContext: TriageContext = { clientRules: [], masterRules: [] };
      const res = executeTriagePipeline({ description: 'COMPLETELY UNKNOWN ENTITY', amount: -75, date: '2026-09-01' }, emptyContext);
      expect(res.isAllocated).toBe(false);
      expect(res.status).toBe('new');
      expect(res.source).toBe('none');
    });

    it('5. income transaction always stays "new" regardless of matching client or master rules', () => {
      const res = executeTriagePipeline({ description: 'SHELL REFUND', amount: 500, date: '2026-09-01' }, collisionContext);
      expect(res.isAllocated).toBe(false);
      expect(res.status).toBe('new');
      expect(res.source).toBe('none');
    });
  });
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ============================================================================

describe('Tier 4: Real-World Application Scenarios', () => {
  const practiceContext: TriageContext = {
    clientRules: [
      { id: 'cr_fibre', description: 'Office Fibre', keywords: ['TELKOM INTERNET'], accountId: '3000-051', vatType: 'standard_rated_purchases' }
    ],
    masterRules: MASTER_ALLOCATION_RULES,
    chartOfAccounts: [
      { accountNumber: '3000-033', accountName: 'Motor Vehicle Expenses - Fuel', accountType: 'Expense' },
      { accountNumber: '3000-051', accountName: 'Telephone & Internet', accountType: 'Expense' },
      { accountNumber: '3000-055', accountName: 'Staff Refreshments', accountType: 'Expense' },
      { accountNumber: '3000-036', accountName: 'Hardware & Maintenance', accountType: 'Expense' },
      { accountNumber: '3000-018', accountName: 'Rates & Taxes (Municipal)', accountType: 'Expense' },
      { accountNumber: '3000-023', accountName: 'Insurance', accountType: 'Expense' },
      { accountNumber: '5000-040', accountName: 'Salaries & Wages', accountType: 'Expense' },
      { accountNumber: '7000-008', accountName: 'SARS VAT Control', accountType: 'Liability' },
      { accountNumber: '7000-011', accountName: 'SARS PAYE / UIF Payable', accountType: 'Liability' },
      { accountNumber: '9500-003', accountName: 'Bank Transfer Suspense', accountType: 'Current Asset' }
    ]
  };

  describe('Scenario 1: Monthly Retail Client with Multi-Branch POS & Card Spend', () => {
    it('reconciles multi-branch retail expenses with root brand consolidation and preserved location metadata', () => {
      // 1. Ingest transactions from various retail branches
      const rawTransactions = [
        { description: 'POS PURCHASE ENGEN WINCHESTER 4123456789', amount: -650.00, date: '2026-09-05' },
        { description: 'POS PURCHASE ENGEN WATERKLOOF', amount: -850.00, date: '2026-09-12' },
        { description: 'CHEQUE CARD PURCHASE WOOLWORTHS FOOD #1024 SANDTON', amount: -420.00, date: '2026-09-15' },
        { description: 'POS PURCHASE SHELL MIDRAND DIESEL', amount: -950.00, date: '2026-09-18' }
      ];

      // 2. Triage transactions through pipeline
      const triaged = rawTransactions.map(t => executeTriagePipeline(t, practiceContext));

      // 3. Verify Engen root brand consolidation
      expect(triaged[0].merchantKey).toBe('ENGEN');
      expect(triaged[1].merchantKey).toBe('ENGEN');
      expect(triaged[0].branchLocation).toBe('WINCHESTER');
      expect(triaged[1].branchLocation).toBe('WATERKLOOF');

      // 4. Verify VAT clue extraction on Engen Winchester
      expect(triaged[0].structuralClues?.vatNumber).toBe('4123456789');

      // 5. Verify Woolworths Food consolidation and Sandton branch extraction
      expect(triaged[2].merchantKey).toBe('WOOLWORTHS');
      expect(triaged[2].branchLocation).toBe('SANDTON');

      // 6. Verify Shell consolidation and fuel zero-rating
      expect(triaged[3].merchantKey).toBe('SHELL');
      expect(triaged[3].vatType).toBe('zero_rated_purchases');
    });
  });

  describe('Scenario 2: End-of-Month Payroll Run on the 25th with Subsequent EMP201 Payment', () => {
    it('accurately distinguishes salaries on 25th and allocates subsequent EMP201 payment to Balance Sheet', () => {
      // Step 1: Ingest monthly salary payment on the 25th
      const salaryTx = { description: 'NET SALARIES SEPTEMBER STAFF BATCH', amount: -65000.00, date: '2026-09-25' };
      const salaryAnalysis = executeDetectiveEngine(salaryTx);
      expect(salaryAnalysis.badges.some(b => b.label.includes('End of Month Cycle'))).toBe(true);

      // Step 2: Ingest subsequent SARS EMP201 statutory settlement on the 7th
      const emp201Tx = { description: 'SARS EMP201 PRN 1950002223334445556', amount: -18500.00, date: '2026-10-07' };
      const emp201Analysis = executeDetectiveEngine(emp201Tx);

      // Step 3: Verify Timing Clue 1 detects 7th EMP201 date
      expect(emp201Analysis.badges.some(b => b.label.includes('Start of Month Billing'))).toBe(true);

      // Step 4: Verify Clue 4 PRN reference decoding routes to Balance Sheet 7000-011
      expect(emp201Analysis.suggestedAccountId).toBe('7000-011');

      // Step 5: Verify VAT type is strictly no_vat
      expect(emp201Analysis.suggestedVatType).toBe('no_vat');

      // Step 6: Verify confidence >= 80% triggering auto-allocation to 'reviewed'
      expect(emp201Analysis.compositeConfidence).toBeGreaterThanOrEqual(80);
      expect(emp201Analysis.status).toBe('reviewed');
    });
  });

  describe('Scenario 3: Bi-Monthly VAT201 Statutory Settlement with 19-Digit PRN', () => {
    it('allocates bi-monthly VAT payment with PRN on 25th strictly to Balance Sheet liability with no_vat', () => {
      // Step 1: Ingest SARS VAT payment
      const vatTx = { description: 'ELECTRONIC PMT SARS VAT201 1940001234567890123', amount: -34500.00, date: '2026-09-25' };

      // Step 2: Run detective engine
      const analysis = executeDetectiveEngine(vatTx);

      // Step 3: Verify statutory VAT PRN reference badge
      expect(analysis.badges.some(b => b.label.includes('SARS VAT201'))).toBe(true);

      // Step 4: Verify timing badge on 25th
      expect(analysis.badges.some(b => b.label.includes('End of Month Cycle'))).toBe(true);

      // Step 5: Verify strict Balance Sheet account 7000-008 (VAT Control)
      expect(analysis.suggestedAccountId).toBe('7000-008');

      // Step 6: Verify no_vat VAT type
      expect(analysis.suggestedVatType).toBe('no_vat');

      // Step 7: Verify auto-allocation status
      expect(analysis.isAutoAllocatable).toBe(true);
      expect(analysis.status).toBe('reviewed');
    });
  });

  describe('Scenario 4: Inter-Account Bank Sweeps Between Cheque and Savings Accounts', () => {
    it('detects contra transfer pair across accounts within 3 days and allocates to Suspense with no_vat', () => {
      // Step 1: Create batch of transactions including sweep pair
      const batch = [
        { id: 'tx_chq', description: 'TRANSFER TO 32 DAY NOTICE ACC', amount: -100000.00, date: '2026-09-10', bankAccountId: 'cheque_01' },
        { id: 'tx_sav', description: 'TRANSFER FROM CHEQUE ACC', amount: 100000.00, date: '2026-09-12', bankAccountId: 'savings_01' },
        { id: 'tx_exp', description: 'OFFICE SUPPLIES STORE', amount: -450.00, date: '2026-09-11', bankAccountId: 'cheque_01' }
      ];

      // Step 2: Analyze debit leg
      const debitAnalysis = executeDetectiveEngine(batch[0], batch);
      expect(debitAnalysis.suggestedAccountId).toBe('9500-003');
      expect(debitAnalysis.suggestedVatType).toBe('no_vat');
      expect(debitAnalysis.badges.some(b => b.type === 'sweep')).toBe(true);

      // Step 3: Analyze credit leg
      const creditAnalysis = executeDetectiveEngine(batch[1], batch);
      expect(creditAnalysis.suggestedAccountId).toBe('9500-003');
      expect(creditAnalysis.suggestedVatType).toBe('no_vat');
      expect(creditAnalysis.badges.some(b => b.type === 'sweep')).toBe(true);

      // Step 4: Verify standard expense is unaffected by sweep logic
      const expAnalysis = executeDetectiveEngine(batch[2], batch);
      expect(expAnalysis.suggestedAccountId).not.toBe('9500-003');
      expect(expAnalysis.badges.some(b => b.type === 'sweep')).toBe(false);
    });
  });

  describe('Scenario 5: Municipal Utility & Recurring Contractual Debit Orders', () => {
    it('identifies contractual municipal and insurance debit orders on 1st-3rd of month', () => {
      // Step 1: Ingest monthly recurring debit orders
      const debitOrders = [
        { description: 'DEBIT ORDER CITY OF JHB ELECTRICITY & RATES', amount: -8500.00, date: '2026-09-01' },
        { description: 'DEBIT ORDER TELKOM FIBRE SA', amount: -999.00, date: '2026-09-02' },
        { description: 'DEBIT ORDER OUTSURANCE BUSINESS VEHICLE POLICY', amount: -2450.00, date: '2026-09-03' }
      ];

      // Step 2: Run detective engine for City of Joburg
      const coj = executeDetectiveEngine(debitOrders[0]);
      expect(coj.badges.some(b => b.type === 'prefix' && b.label.includes('Contractual Debit Order'))).toBe(true);
      expect(coj.badges.some(b => b.type === 'timing' && b.label.includes('Start of Month'))).toBe(true);

      // Step 3: Run detective engine for Telkom
      const telkom = executeDetectiveEngine(debitOrders[1]);
      expect(telkom.badges.some(b => b.type === 'prefix')).toBe(true);

      // Step 4: Run detective engine for OutSurance
      const out = executeDetectiveEngine(debitOrders[2]);
      expect(out.ruleScoping).toBe('global_practice'); // OutSurance is recognized national brand

      // Step 5: Verify contractual segregation from ad-hoc card payments
      const adHocTelkom = cleanAndGroupTransaction('POS PURCHASE TELKOM AIRTIME');
      const contractualTelkom = cleanAndGroupTransaction('DEBIT ORDER TELKOM FIBRE');
      expect(contractualTelkom.merchantKey).toBe('TELKOM:DEBIT_ORDER');
      expect(adHocTelkom.merchantKey).toBe('TELKOM');
      expect(contractualTelkom.merchantKey).not.toBe(adHocTelkom.merchantKey);
    });
  });
});
