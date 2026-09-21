import { describe, it, expect } from 'vitest';
import {
  triageTransaction,
  buildConsistencyMap,
  TriageContext,
} from './initial-allocation-engine';
import { AllocationRule, ImportedTransaction } from './types';
import { MASTER_ALLOCATION_RULES } from './master-allocation-rules';
import { resolveAccountForCategory } from './chart-of-accounts-mapper';

describe('Empirical Challenger Suite: Milestone 1 Initial Allocation Engine', () => {
  const baseContext: TriageContext = {
    clientRules: [],
    masterRules: MASTER_ALLOCATION_RULES,
    chartOfAccounts: [],
    historicalTransactions: [],
    isVatRegistered: true,
  };

  // ==========================================================================
  // 1. ADVERSARIAL STRESS TEST: Strict Expense Safeguard
  // ==========================================================================
  describe('1. Adversarial Stress Test: Strict Expense Safeguard', () => {
    it('rejects positive amounts matching master rule keywords (e.g. Vodacom refund/reversal)', () => {
      const result = triageTransaction(
        { description: 'VODACOM REFUND OVERPAYMENT', amount: 899.50, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
      expect(result.vatType).toBeUndefined();
      expect(result.matchedRuleId).toBeUndefined();
      // Ingestion metadata must still be preserved
      expect(result.cleanDescription).toBeDefined();
      expect(result.merchantKey).toContain('VODACOM');
    });

    it('rejects positive amounts matching master fuel rule (e.g. Shell rebate or refund)', () => {
      const result = triageTransaction(
        { description: 'SHELL GARAGE FUEL REBATE', amount: 350.00, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
    });

    it('rejects positive amounts matching client-specific custom rules', () => {
      const clientRule: AllocationRule = {
        id: 'client_rule_special_supplier',
        keywords: ['ACME INDUSTRIAL'],
        accountId: '6500-001',
        vatType: 'standard_rated_purchases',
        description: 'ACME Industrial Supplier',
        priority: 1,
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [clientRule],
      };

      const result = triageTransaction(
        { description: 'ACME INDUSTRIAL CREDIT NOTE REFUND', amount: 12500.00, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
    });

    it('rejects positive amounts even when explicitly passed isExpense: true (Safeguard Invariant)', () => {
      // Stress test: what if caller or CSV metadata erroneously asserts isExpense: true on positive amount?
      const result = triageTransaction(
        {
          description: 'SHELL ULTRA CITY FUEL REFUND',
          amount: 500,
          isExpense: true,
          date: '2026-03-01',
        },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
    });

    it('rejects negative amounts when explicitly flagged isExpense: false', () => {
      const result = triageTransaction(
        {
          description: 'CORRECTION OF OVERPAYMENT TO CUSTOMER',
          amount: -1500,
          isExpense: false,
          date: '2026-03-01',
        },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
    });

    it('rejects zero amount when isExpense is not explicitly true', () => {
      const result = triageTransaction(
        { description: 'BANK VERIFICATION ZERO DEPOSIT', amount: 0, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
    });

    it('rejects micro-cents positive income amounts (0.0001)', () => {
      const result = triageTransaction(
        { description: 'VODACOM ROUNDING CREDIT', amount: 0.0001, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
    });

    it('correctly auto-allocates normal negative expense matching master rule', () => {
      const result = triageTransaction(
        { description: 'VODACOM MONTHLY CONTRACT', amount: -899.50, isExpense: true, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(true);
      expect(result.status).toBe('reviewed');
      expect(result.source).toBe('master_rule');
      expect(result.accountId).toBe('3000-051');
      expect(result.vatType).toBe('standard_rated_purchases');
    });
  });

  // ==========================================================================
  // 2. ADVERSARIAL STRESS TEST: Rule Precedence
  // ==========================================================================
  describe('2. Adversarial Stress Test: Rule Precedence', () => {
    it('guarantees Client Rule with low priority (50) beats Global Master Rule with high priority (1)', () => {
      // Global Master Rule: master_tel_vodacom has priority: 1, defaultAccountCode: '3000-051'
      // Client Rule: priority: 50, accountId: 'CUSTOM-CLIENT-TEL'
      const clientVodacomRule: AllocationRule = {
        id: 'client_rule_voda_override',
        keywords: ['VODACOM'],
        accountId: 'CUSTOM-CLIENT-TEL',
        vatType: 'standard_rated_purchases',
        description: 'Client Custom Vodacom Override',
        priority: 50,
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [clientVodacomRule],
      };

      const result = triageTransaction(
        { description: 'DEBIT ORDER VODACOM SA', amount: -799, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.source).toBe('client_rule');
      expect(result.matchedRuleId).toBe('client_rule_voda_override');
      expect(result.accountId).toBe('CUSTOM-CLIENT-TEL');
    });

    it('guarantees Client Rule with bottom priority (99) beats Global Master Rule with top priority (1)', () => {
      const clientShellRule: AllocationRule = {
        id: 'client_shell_bottom',
        keywords: ['SHELL'],
        accountId: 'CUSTOM-SHELL-99',
        vatType: 'standard_rated_purchases',
        description: 'Client Shell Bottom Priority',
        priority: 99,
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [clientShellRule],
      };

      const result = triageTransaction(
        { description: 'PURCHASE SHELL ULTRA CITY', amount: -500, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.source).toBe('client_rule');
      expect(result.accountId).toBe('CUSTOM-SHELL-99');
    });

    it('guarantees Client Rule with undefined priority defaults safely and beats Global Master Rule', () => {
      const clientRuleNoPriority: AllocationRule = {
        id: 'client_rule_no_prio',
        keywords: ['UBER'],
        accountId: 'CUSTOM-UBER-TRAVEL',
        vatType: 'standard_rated_purchases',
        description: 'Client Uber No Priority Defined',
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [clientRuleNoPriority],
      };

      const result = triageTransaction(
        { description: 'UBER TRIP HELP.UBER.COM', amount: -150, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.source).toBe('client_rule');
      expect(result.accountId).toBe('CUSTOM-UBER-TRAVEL');
    });

    it('correctly prioritizes Client Rule A (priority: 5) over Client Rule B (priority: 10)', () => {
      const ruleLow: AllocationRule = {
        id: 'rule_prio_10',
        keywords: ['SUPPLIER X'],
        accountId: 'ACC-10',
        vatType: 'standard_rated_purchases',
        priority: 10,
      };
      const ruleHigh: AllocationRule = {
        id: 'rule_prio_5',
        keywords: ['SUPPLIER X'],
        accountId: 'ACC-5',
        vatType: 'standard_rated_purchases',
        priority: 5,
      };

      // Pass them in reverse order to test sorting
      const context: TriageContext = {
        ...baseContext,
        clientRules: [ruleLow, ruleHigh],
      };

      const result = triageTransaction(
        { description: 'SUPPLIER X CAPE TOWN', amount: -400, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.source).toBe('client_rule');
      expect(result.accountId).toBe('ACC-5');
      expect(result.matchedRuleId).toBe('rule_prio_5');
    });

    it('evaluates Master Rules before Past History Memory (Tier 2 before Tier 3)', () => {
      // Historical transaction suggests account ACC-HISTORY for Engen
      const historicalTransactions: ImportedTransaction[] = [
        {
          id: 'tx_hist_1',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'ENGEN QUICKSHOP',
          merchantKey: 'ENGEN',
          amount: -250,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: 'ACC-HISTORY', type: 'account' },
          vatType: 'zero_rated_purchases',
        },
      ];

      // Engen matches master_fuel_engen in MASTER_ALLOCATION_RULES
      const context: TriageContext = {
        ...baseContext,
        historicalTransactions,
      };

      const result = triageTransaction(
        { description: 'ENGEN WINCHESTER', amount: -350, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.source).toBe('master_rule');
      expect(result.accountId).toBe('3000-033'); // Master rule Fuel account wins over history
    });
  });

  // ==========================================================================
  // 3. ADVERSARIAL STRESS TEST: Past History Consistency
  // ==========================================================================
  describe('3. Adversarial Stress Test: Past History Consistency', () => {
    it('strictly does NOT allocate when 99 transactions are to Account A and 1 transaction is to Account B (100% Invariant)', () => {
      const historicalTransactions: ImportedTransaction[] = [];

      // 99 transactions to Account A (3000-055 Staff Refreshments)
      for (let i = 1; i <= 99; i++) {
        historicalTransactions.push({
          id: `tx_a_${i}`,
          bankAccountId: 'bank_1',
          date: `2026-01-${(i % 28) + 1}`,
          description: 'ADVERSARIAL COFFEE ROASTERY',
          merchantKey: 'ADVERSARIAL COFFEE',
          amount: -50 - (i % 10),
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-055', type: 'account' },
          vatType: 'standard_rated_purchases',
        });
      }

      // 1 lone transaction to Account B (3000-020 Entertainment)
      historicalTransactions.push({
        id: 'tx_b_100',
        bankAccountId: 'bank_1',
        date: '2026-02-14',
        description: 'ADVERSARIAL COFFEE ROASTERY',
        merchantKey: 'ADVERSARIAL COFFEE',
        amount: -500,
        status: 'reviewed',
        isExpense: true,
        allocatedTo: { value: '3000-020', type: 'account' }, // CONFLICT!
        vatType: 'standard_rated_purchases',
      });

      const consistencyMap = buildConsistencyMap(historicalTransactions);
      expect(consistencyMap.has('ADVERSARIAL COFFEE')).toBe(false);

      const context: TriageContext = {
        ...baseContext,
        historicalTransactions,
        historyConsistencyMap: consistencyMap,
      };

      const result = triageTransaction(
        { description: 'ADVERSARIAL COFFEE ROASTERY', amount: -85, isExpense: true, date: '2026-03-01' },
        context
      );

      // Must remain unallocated in status 'new'
      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
    });

    it('strictly does NOT allocate when 99 transactions have VAT type A and 1 transaction has VAT type B', () => {
      const historicalTransactions: ImportedTransaction[] = [];

      // 99 transactions with standard_rated_purchases
      for (let i = 1; i <= 99; i++) {
        historicalTransactions.push({
          id: `tx_vat_a_${i}`,
          bankAccountId: 'bank_1',
          date: `2026-01-${(i % 28) + 1}`,
          description: 'LOCAL HARDWARE DIRECT',
          merchantKey: 'LOCAL HARDWARE',
          amount: -200,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-039', type: 'account' },
          vatType: 'standard_rated_purchases',
        });
      }

      // 1 transaction with zero_rated_purchases
      historicalTransactions.push({
        id: 'tx_vat_b_100',
        bankAccountId: 'bank_1',
        date: '2026-02-20',
        description: 'LOCAL HARDWARE DIRECT',
        merchantKey: 'LOCAL HARDWARE',
        amount: -200,
        status: 'reviewed',
        isExpense: true,
        allocatedTo: { value: '3000-039', type: 'account' },
        vatType: 'zero_rated_purchases', // CONFLICT!
      });

      const consistencyMap = buildConsistencyMap(historicalTransactions);
      expect(consistencyMap.has('LOCAL HARDWARE')).toBe(false);
    });

    it('ensures unreviewed (status new/ai_review/rejected) transactions do NOT pollute consistency map', () => {
      const historicalTransactions: ImportedTransaction[] = [
        // 2 Genuine reviewed expenses
        {
          id: 'tx_rev_1',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'SPECIALTY PLASTICS',
          merchantKey: 'SPECIALTY PLASTICS',
          amount: -300,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-039', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
        {
          id: 'tx_rev_2',
          bankAccountId: 'bank_1',
          date: '2026-01-20',
          description: 'SPECIALTY PLASTICS',
          merchantKey: 'SPECIALTY PLASTICS',
          amount: -450,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-039', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
        // Unreviewed transaction with different account (should NOT break 100% consistency)
        {
          id: 'tx_unrev_new',
          bankAccountId: 'bank_1',
          date: '2026-02-01',
          description: 'SPECIALTY PLASTICS',
          merchantKey: 'SPECIALTY PLASTICS',
          amount: -150,
          status: 'new',
          isExpense: true,
          allocatedTo: { value: '3000-999', type: 'account' },
          vatType: 'zero_rated_purchases',
        },
        // In-review transaction with different account (should NOT break 100% consistency)
        {
          id: 'tx_unrev_ai',
          bankAccountId: 'bank_1',
          date: '2026-02-05',
          description: 'SPECIALTY PLASTICS',
          merchantKey: 'SPECIALTY PLASTICS',
          amount: -250,
          status: 'ai_review' as any,
          isExpense: true,
          allocatedTo: { value: '3000-888', type: 'account' },
          vatType: 'exempt_purchases',
        },
      ];

      const consistencyMap = buildConsistencyMap(historicalTransactions);
      expect(consistencyMap.has('SPECIALTY PLASTICS')).toBe(true);
      expect(consistencyMap.get('SPECIALTY PLASTICS')?.accountId).toBe('3000-039');
    });

    it('ensures historical income transactions (amount > 0 / isExpense false) do NOT pollute consistency map', () => {
      const historicalTransactions: ImportedTransaction[] = [
        // Reviewed Expense
        {
          id: 'tx_cleaner_exp',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'CITY CLEANING SERVICES',
          merchantKey: 'CITY CLEANING',
          amount: -500,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-005', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
        // Reviewed Customer Receipt / Income with same merchant name (should be excluded from expense memory)
        {
          id: 'tx_cleaner_inc',
          bankAccountId: 'bank_1',
          date: '2026-01-15',
          description: 'CITY CLEANING SERVICES',
          merchantKey: 'CITY CLEANING',
          amount: 5000,
          status: 'reviewed',
          isExpense: false,
          allocatedTo: { value: '1000-001', type: 'account' },
          vatType: 'standard_rated_sales' as any,
        },
      ];

      const consistencyMap = buildConsistencyMap(historicalTransactions);
      expect(consistencyMap.has('CITY CLEANING')).toBe(true);
      expect(consistencyMap.get('CITY CLEANING')?.accountId).toBe('3000-005');
    });

    it('handles merchantKey derivation fallback when historical tx lacks merchantKey property', () => {
      const historicalTransactions: ImportedTransaction[] = [
        {
          id: 'tx_no_key_1',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'POS PURCHASE CAPE UNION MART CENTURION',
          // merchantKey is missing
          amount: -899,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-052', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
      ];

      const consistencyMap = buildConsistencyMap(historicalTransactions);
      // BankCleaner extracts 'CAPE UNION MART'
      expect(consistencyMap.has('CAPE UNION MART')).toBe(true);
      expect(consistencyMap.get('CAPE UNION MART')?.accountId).toBe('3000-052');
    });
  });

  // ==========================================================================
  // 4. ADVERSARIAL STRESS TEST: Chart of Accounts Resolution Fallback
  // ==========================================================================
  describe('4. Adversarial Stress Test: Chart of Accounts Resolution Fallback', () => {
    it('falls back to rule defaultAccountCode when client chartOfAccounts is empty array or undefined', () => {
      const contextEmptyCoA: TriageContext = {
        ...baseContext,
        chartOfAccounts: [],
      };

      const result = triageTransaction(
        { description: 'VODACOM PAYMENT', amount: -500, isExpense: true, date: '2026-03-01' },
        contextEmptyCoA
      );

      expect(result.isAllocated).toBe(true);
      expect(result.source).toBe('master_rule');
      expect(result.accountId).toBe('3000-051'); // Standard Telephone & Internet
    });

    it('resolves semantic synonym match in custom client COA (e.g. 6100 "Data & Fiber Internet")', () => {
      const customCoA = [
        { accountNumber: '1000', accountName: 'FNB Business Cheque', type: 'Asset' },
        { accountNumber: '6100', accountName: 'Data & Fiber Internet Expenses', type: 'Expense' },
        { accountNumber: '6200', accountName: 'Motor Fuel & Tolls', type: 'Expense' },
      ];

      const contextCustom: TriageContext = {
        ...baseContext,
        chartOfAccounts: customCoA,
      };

      const result = triageTransaction(
        { description: 'VODACOM PAYMENT', amount: -600, isExpense: true, date: '2026-03-01' },
        contextCustom
      );

      expect(result.isAllocated).toBe(true);
      expect(result.accountId).toBe('6100');
    });

    it('resolves legacy 4-digit Pastel code mapping (3000-051 -> 4500 Telephone & Internet)', () => {
      const legacyCoA = [
        { accountNumber: '1000', accountName: 'Bank', type: 'Asset' },
        { accountNumber: '4500', accountName: 'Telephone & Internet', type: 'Expense' },
        { accountNumber: '3800', accountName: 'Motor Vehicle Expenses - Fuel', type: 'Expense' },
      ];

      const contextLegacy: TriageContext = {
        ...baseContext,
        chartOfAccounts: legacyCoA,
      };

      // Vodacom master rule has defaultAccountCode '3000-051', which maps to legacy '4500'
      const resultTel = triageTransaction(
        { description: 'VODACOM SA DEBIT ORDER', amount: -750, isExpense: true, date: '2026-03-01' },
        contextLegacy
      );
      expect(resultTel.isAllocated).toBe(true);
      expect(resultTel.accountId).toBe('4500');

      // Shell master rule has defaultAccountCode '3000-033', which maps to legacy '3800'
      const resultFuel = triageTransaction(
        { description: 'PURCHASE SHELL ULTRA CITY', amount: -600, isExpense: true, date: '2026-03-01' },
        contextLegacy
      );
      expect(resultFuel.isAllocated).toBe(true);
      expect(resultFuel.accountId).toBe('3800');
    });

    it('resolves COA accounts using alternative property keys (code / id / name / description)', () => {
      const variantCoA = [
        { code: 'EXP-TEL-1', name: 'Telephone and Mobile', type: 'Expense' },
        { id: 'EXP-GEN-1', description: 'General Expenses', type: 'Expense' },
      ];

      const contextVariant: TriageContext = {
        ...baseContext,
        chartOfAccounts: variantCoA,
      };

      const result = triageTransaction(
        { description: 'VODACOM MONTHLY', amount: -400, isExpense: true, date: '2026-03-01' },
        contextVariant
      );

      expect(result.isAllocated).toBe(true);
      expect(result.accountId).toBe('EXP-TEL-1');
    });

    it('falls back to General Expenses when custom COA has no matching category or synonym', () => {
      const nonMatchingCoA = [
        { accountNumber: '1000', accountName: 'Bank Account', type: 'Asset' },
        { accountNumber: '5000', accountName: 'Direct Cost of Sales', type: 'Expense' },
        { accountNumber: '8999', accountName: 'General Expenses & Sundry', type: 'Expense' },
      ];

      // A rule for a specialized merchant whose category has no synonym match in this COA
      const specializedRule: AllocationRule = {
        id: 'master_specialized',
        keywords: ['EXOTIC LAB SUPPLIES'],
        defaultAccountCode: '3000-099',
        category: 'specialized_testing',
      } as any;

      const context: TriageContext = {
        ...baseContext,
        masterRules: [specializedRule as any],
        chartOfAccounts: nonMatchingCoA,
      };

      const result = triageTransaction(
        { description: 'EXOTIC LAB SUPPLIES JHB', amount: -3200, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.accountId).toBe('8999'); // Fallback to General Expenses
    });

    it('falls back to first available account when COA has zero expense accounts', () => {
      const balanceSheetOnlyCoA = [
        { accountNumber: '1000-001', accountName: 'FNB Primary Current', type: 'Asset' },
        { accountNumber: '2000-001', accountName: 'Director Loan Account', type: 'Liability' },
      ];

      const specializedRule: AllocationRule = {
        id: 'master_test_first_fallback',
        keywords: ['UNKNOWN UNMATCHABLE SUPPLIER'],
        defaultAccountCode: '9999-999',
      } as any;

      const context: TriageContext = {
        ...baseContext,
        masterRules: [specializedRule as any],
        chartOfAccounts: balanceSheetOnlyCoA,
      };

      const result = triageTransaction(
        { description: 'UNKNOWN UNMATCHABLE SUPPLIER', amount: -200, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.accountId).toBe('1000-001'); // Absolute fallback to first account
    });
  });

  // ==========================================================================
  // 5. ADVERSARIAL STRESS TEST: Ingestion Metadata & Channel Tagging
  // ==========================================================================
  describe('5. Adversarial Stress Test: Ingestion Metadata & Channel Tagging', () => {
    it('extracts all structural clues (10-digit VAT, phone, branch) and preserves them', () => {
      const description = 'EFT PMT VODACOM VAT 4991234567 TEL 0119876543 STORE 4421';
      const result = triageTransaction(
        { description, amount: -1500, isExpense: true, date: '2026-03-01' },
        baseContext
      );

      expect(result.structuralClues?.vatNumber).toBe('4991234567');
      expect(result.structuralClues?.phoneNumber).toBe('0119876543');
      expect(result.paymentChannel).toBe('EFT');
      expect(result.rawDescription).toBe(description);
      expect(result.cleanDescription).toBeDefined();
    });

    it('preserves complete metadata on rejected income transactions', () => {
      const description = 'DEBIT ORDER CLIENT REFUND 0821234567 VAT 4012345678 STORE 99';
      const result = triageTransaction(
        { description, amount: 2500, date: '2026-03-01' },
        baseContext
      );

      // Must NOT be allocated
      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      // But metadata MUST be enriched for UI inspection
      expect(result.paymentChannel).toBe('DEBIT_ORDER');
      expect(result.structuralClues?.vatNumber).toBe('4012345678');
      expect(result.structuralClues?.phoneNumber).toBe('0821234567');
      expect(result.cleanDescription).toBeDefined();
    });
  });

  // ==========================================================================
  // 6. ADVERSARIAL STRESS TEST: Edge Cases in Keyword Matching & Metacharacters
  // ==========================================================================
  describe('6. Adversarial Stress Test: Keyword Matching & Metacharacters', () => {
    it('handles regex metacharacters in keywords without crashing (e.g. (PTY) LTD, C++, R50.00)', () => {
      const rule: AllocationRule = {
        id: 'rule_metachar',
        keywords: ['ACME (PTY) LTD', 'C++', 'R50.00'],
        accountId: '3000-099',
        vatType: 'standard_rated_purchases',
        description: 'Metacharacter test',
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [rule],
      };

      const result1 = triageTransaction(
        { description: 'EFT ACME (PTY) LTD PAYMENT', amount: -250, isExpense: true, date: '2026-03-01' },
        context
      );
      expect(result1.isAllocated).toBe(true);
      expect(result1.matchedKeyword).toBe('ACME (PTY) LTD');

      const result2 = triageTransaction(
        { description: 'PURCHASE C++ COURSE', amount: -100, isExpense: true, date: '2026-03-01' },
        context
      );
      expect(result2.isAllocated).toBe(true);

      const result3 = triageTransaction(
        { description: 'SERVICE CHARGE R50.00 MONTHLY', amount: -50, isExpense: true, date: '2026-03-01' },
        context
      );
      expect(result3.isAllocated).toBe(true);
    });

    it('handles undefined, null, or whitespace-only descriptions without crashing', () => {
      const resultEmpty = triageTransaction(
        { description: '', amount: -50, isExpense: true, date: '2026-03-01' },
        baseContext
      );
      expect(resultEmpty.isAllocated).toBe(false);
      expect(resultEmpty.status).toBe('new');

      const resultSpaces = triageTransaction(
        { description: '    ', amount: -50, isExpense: true, date: '2026-03-01' },
        baseContext
      );
      expect(resultSpaces.isAllocated).toBe(false);
      expect(resultSpaces.status).toBe('new');
    });
  });

  // ==========================================================================
  // 7. ADVERSARIAL STRESS TEST: Priority 0 and Falsy Priority Behavior
  // ==========================================================================
  describe('7. Adversarial Stress Test: Priority 0 and Falsy Priority Behavior', () => {
    it('checks behavior when a client rule has priority: 0', () => {
      // In JS, 0 is falsy. If code does (a.priority || 99), priority 0 gets turned into 99!
      const ruleZero: AllocationRule = {
        id: 'rule_zero',
        keywords: ['PRIORITY_TEST'],
        accountId: 'ACC-ZERO',
        vatType: 'standard_rated_purchases',
        priority: 0,
      };
      const ruleTen: AllocationRule = {
        id: 'rule_ten',
        keywords: ['PRIORITY_TEST'],
        accountId: 'ACC-TEN',
        vatType: 'standard_rated_purchases',
        priority: 10,
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [ruleTen, ruleZero],
      };

      const result = triageTransaction(
        { description: 'PRIORITY_TEST SUPPLIER', amount: -100, isExpense: true, date: '2026-03-01' },
        context
      );

      // Document exact empirical behavior:
      // Does rule_zero win or does rule_ten win?
      // If (a.priority || 99) is used, ruleZero becomes 99, so ruleTen (10) wins!
      // If (a.priority ?? 99) is used, ruleZero remains 0, so ruleZero (0) wins!
      expect(result.isAllocated).toBe(true);
      // Let's verify what actually gets matched:
      console.log('Empirical priority:0 matched rule ID:', result.matchedRuleId);
    });
  });

  // ==========================================================================
  // 8. ADVERSARIAL STRESS TEST: History with Positive Amount marked isExpense: true
  // ==========================================================================
  describe('8. Adversarial Stress Test: History with Positive Amount marked isExpense: true', () => {
    it('checks whether positive amount in history with isExpense: true pollutes consistency map', () => {
      const historicalTransactions: ImportedTransaction[] = [
        {
          id: 'tx_exp_normal',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'ALPHA SUPPLIER',
          merchantKey: 'ALPHA SUPPLIER',
          amount: -500,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-005', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
        {
          id: 'tx_positive_with_isExpense_true',
          bankAccountId: 'bank_1',
          date: '2026-01-15',
          description: 'ALPHA SUPPLIER',
          merchantKey: 'ALPHA SUPPLIER',
          amount: 500, // POSITIVE AMOUNT (Income/Deposit)
          status: 'reviewed',
          isExpense: true, // But flagged isExpense: true
          allocatedTo: { value: '1000-001', type: 'account' }, // Different account!
          vatType: 'standard_rated_sales' as any,
        },
      ];

      const consistencyMap = buildConsistencyMap(historicalTransactions);
      console.log('Empirical buildConsistencyMap has ALPHA SUPPLIER:', consistencyMap.has('ALPHA SUPPLIER'));
      // If line 75 `tx.isExpense === true || (tx.amount < 0 && tx.isExpense !== false)` is used,
      // tx_positive_with_isExpense_true is treated as an expense, resulting in 2 conflicting records,
      // which causes consistencyMap to NOT have ALPHA SUPPLIER!
    });
  });
});

