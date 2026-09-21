/**
 * @fileOverview South African Bank Statement Initial Allocation & Triage Engine.
 * 
 * Implements:
 * 1. Strict Expense Safeguard: Income transactions (amount > 0 or isExpense === false)
 *    strictly exit triage unallocated with status 'new'.
 * 2. Ingestion Metadata Enrichment: Runs BankCleaner.process to extract cleanDescription,
 *    merchantKey, paymentChannel, branchLocation, and structuralClues.
 * 3. 3-Tier Hybrid Triage Pipeline:
 *    - Tier 1: Client-Specific Allocation Rules (highest priority, sorted by priority).
 *    - Tier 2: Global Practice Allocation Rules (171 MASTER_ALLOCATION_RULES, resolved to client COA).
 *    - Tier 3: Past Allocation History Memory (100% consistency invariant by merchantKey).
 */

import { BankCleaner, matchesRuleKeyword } from './bank-cleaner';
import { resolveAccountForCategory } from './chart-of-accounts-mapper';
import { MASTER_ALLOCATION_RULES, MasterAllocationRule, SORTED_MASTER_ALLOCATION_RULES } from './master-allocation-rules';
import {
  AllocationRule,
  ChartOfAccount,
  ImportedTransaction,
  PaymentChannel,
  StructuralClues,
  VatType,
} from './types';

export type CanonicalVatType = VatType;
export type AccountCategory = ChartOfAccount;

export interface TriageContext {
  clientRules?: AllocationRule[];
  masterRules?: MasterAllocationRule[];
  disableGlobalRules?: boolean;
  chartOfAccounts?: any[];
  historicalTransactions?: ImportedTransaction[];
  isVatRegistered?: boolean;
  historyConsistencyMap?: Map<string, { accountId: string; vatType: CanonicalVatType; accountType?: string }>;
}

export interface TriageResult {
  isAllocated: boolean;
  status: 'new' | 'reviewed' | 'allocated';
  accountId?: string;
  accountType?: 'account' | 'supplier' | 'customer' | string;
  vatType?: CanonicalVatType;
  source?: 'client_rule' | 'master_rule' | 'history' | 'none';
  matchedRuleId?: string;
  matchedRuleDescription?: string;
  matchedKeyword?: string;
  merchantKey?: string;
  cleanDescription?: string;
  rawDescription?: string;
  paymentChannel?: PaymentChannel;
  branchLocation?: string;
  structuralClues?: StructuralClues;
}

/**
 * Builds a fast consistency lookup map from historical reviewed/allocated expense transactions.
 * Enforces the 100% Consistency Invariant: a merchantKey only qualifies if ALL past records
 * share the exact same accountId and vatType.
 */
export function buildConsistencyMap(
  historicalTransactions: ImportedTransaction[]
): Map<string, { accountId: string; vatType: CanonicalVatType; accountType?: string }> {
  const consistencyMap = new Map<string, { accountId: string; vatType: CanonicalVatType; accountType?: string }>();
  if (!historicalTransactions || historicalTransactions.length === 0) {
    return consistencyMap;
  }

  // Group historical allocations by merchantKey
  const groups = new Map<string, Array<{ accountId: string; vatType: CanonicalVatType; accountType?: string }>>();

  for (const tx of historicalTransactions) {
    // Expense safeguard: only consider expense transactions
    const isExpense = tx.isExpense === true || (tx.amount < 0 && tx.isExpense !== false);
    const isReviewedOrAllocated = tx.status === 'reviewed' || (tx.status as string) === 'allocated';
    if (!isExpense || !isReviewedOrAllocated) {
      continue;
    }

    const targetAccountId = tx.allocatedTo?.value || (tx as any).accountId;
    if (!targetAccountId) {
      continue;
    }

    const targetVatType = (tx.vatType as CanonicalVatType) || 'no_vat';
    const targetAccountType = tx.allocatedTo?.type || (tx as any).accountType || 'account';

    const key = tx.merchantKey || BankCleaner.process(tx.description || '').merchantKey;
    if (!key || key === 'UNKNOWN') {
      continue;
    }

    const list = groups.get(key) || [];
    list.push({ accountId: targetAccountId, vatType: targetVatType, accountType: targetAccountType });
    groups.set(key, list);
  }

  for (const [key, records] of groups.entries()) {
    if (records.length === 0) continue;
    const first = records[0];
    const is100PercentConsistent = records.every(
      r => r.accountId === first.accountId && r.vatType === first.vatType
    );
    if (is100PercentConsistent) {
      consistencyMap.set(key, {
        accountId: first.accountId,
        vatType: first.vatType,
        accountType: first.accountType,
      });
    }
  }

  return consistencyMap;
}

/**
 * Pure, deterministic initial allocation and triage engine for bank transactions.
 */
export function triageTransaction(
  rawTx: { description: string; amount: number; isExpense?: boolean; date?: string },
  context: TriageContext
): TriageResult {
  const description = rawTx.description || '';
  
  // 1. Ingestion Metadata Enrichment via BankCleaner
  const processed = BankCleaner.process(description);
  const cleanDesc = processed.cleanDescription;
  const rawDesc = description;

  // 2. Strict Expense Safeguard:
  // Income (amount > 0 or isExpense === false or zero without explicit isExpense: true)
  // strictly exits triage unallocated with status 'new'.
  const isIncome = rawTx.amount > 0 || rawTx.isExpense === false;
  const isZeroNonExpense = rawTx.amount === 0 && rawTx.isExpense !== true;
  const isExpense = (rawTx.amount < 0 || rawTx.isExpense === true) && !isIncome && !isZeroNonExpense;

  if (!isExpense) {
    return {
      isAllocated: false,
      status: 'new',
      source: 'none',
      merchantKey: processed.merchantKey,
      cleanDescription: cleanDesc,
      rawDescription: rawDesc,
      paymentChannel: processed.paymentChannel,
      branchLocation: processed.branchLocation,
      structuralClues: processed.structuralClues,
    };
  }

  // 3. Tier 1: Client-Specific Allocation Rules (Highest Priority)
  if (context.clientRules && context.clientRules.length > 0) {
    const sortedClientRules = [...context.clientRules].sort(
      (a, b) => (a.priority ?? 99) - (b.priority ?? 99)
    );

    for (const rule of sortedClientRules) {
      if (!rule || !Array.isArray(rule.keywords) || !rule.accountId) continue;
      for (const kw of rule.keywords) {
        if (typeof kw === 'string' && kw.trim() && (matchesRuleKeyword(cleanDesc, kw) || matchesRuleKeyword(rawDesc, kw))) {
          const vatType = context.isVatRegistered === false
            ? 'no_vat'
            : ((rule.vatType as CanonicalVatType) || 'standard_rated_purchases');

          return {
            isAllocated: true,
            status: 'reviewed',
            accountId: rule.accountId,
            accountType: rule.accountType || 'account',
            vatType,
            source: 'client_rule',
            matchedRuleId: rule.id,
            matchedRuleDescription: rule.description,
            matchedKeyword: kw,
            merchantKey: processed.merchantKey,
            cleanDescription: cleanDesc,
            rawDescription: rawDesc,
            paymentChannel: processed.paymentChannel,
            branchLocation: processed.branchLocation,
            structuralClues: processed.structuralClues,
          };
        }
      }
    }
  }

  // 4. Tier 2: Global Practice Allocation Rules (170+ Master Rules)
  const masterRules = context.disableGlobalRules
    ? []
    : (context.masterRules !== undefined ? context.masterRules : SORTED_MASTER_ALLOCATION_RULES);

  if (masterRules && masterRules.length > 0) {
    const sortedMasterRules = masterRules === SORTED_MASTER_ALLOCATION_RULES
      ? (masterRules as MasterAllocationRule[])
      : [...masterRules].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

    for (const masterRule of sortedMasterRules) {
      if (!masterRule || !Array.isArray(masterRule.keywords)) continue;
      for (const kw of masterRule.keywords) {
        if (typeof kw === 'string' && kw.trim() && (matchesRuleKeyword(cleanDesc, kw) || matchesRuleKeyword(rawDesc, kw))) {
          let resolvedAccountId = (masterRule as any).accountId || masterRule.defaultAccountCode;
          let resolvedAccountType = 'account';

          if (context.chartOfAccounts && context.chartOfAccounts.length > 0) {
            const resolved = resolveAccountForCategory(context.chartOfAccounts, masterRule);
            if (resolved && resolved.accountNumber) {
              resolvedAccountId = resolved.accountNumber;
              resolvedAccountType = resolved.accountType || 'account';
            }
          }

          const vatType = context.isVatRegistered === false
            ? 'no_vat'
            : ((masterRule.vatType as CanonicalVatType) || 'standard_rated_purchases');

          return {
            isAllocated: true,
            status: 'reviewed',
            accountId: resolvedAccountId,
            accountType: resolvedAccountType,
            vatType,
            source: 'master_rule',
            matchedRuleId: masterRule.id,
            matchedRuleDescription: masterRule.description,
            matchedKeyword: kw,
            merchantKey: processed.merchantKey,
            cleanDescription: cleanDesc,
            rawDescription: rawDesc,
            paymentChannel: processed.paymentChannel,
            branchLocation: processed.branchLocation,
            structuralClues: processed.structuralClues,
          };
        }
      }
    }
  }

  // 5. Tier 3: Past Allocation History Memory (100% Consistency Invariant)
  let consistencyMap = context.historyConsistencyMap;
  if (!consistencyMap && context.historicalTransactions && context.historicalTransactions.length > 0) {
    consistencyMap = buildConsistencyMap(context.historicalTransactions);
  }

  if (consistencyMap && consistencyMap.has(processed.merchantKey)) {
    const match = consistencyMap.get(processed.merchantKey)!;
    const vatType = context.isVatRegistered === false ? 'no_vat' : match.vatType;

    return {
      isAllocated: true,
      status: 'reviewed',
      accountId: match.accountId,
      accountType: match.accountType || 'account',
      vatType,
      source: 'history',
      merchantKey: processed.merchantKey,
      cleanDescription: cleanDesc,
      rawDescription: rawDesc,
      paymentChannel: processed.paymentChannel,
      branchLocation: processed.branchLocation,
      structuralClues: processed.structuralClues,
    };
  }

  // 6. Default: Unallocated Expense
  return {
    isAllocated: false,
    status: 'new',
    source: 'none',
    merchantKey: processed.merchantKey,
    cleanDescription: cleanDesc,
    rawDescription: rawDesc,
    paymentChannel: processed.paymentChannel,
    branchLocation: processed.branchLocation,
    structuralClues: processed.structuralClues,
  };
}
