import { describe, it, expect } from 'vitest';
import {
  triageTransaction,
  buildConsistencyMap,
  TriageContext,
} from './initial-allocation-engine';
import { AllocationRule, ImportedTransaction } from './types';
import { MASTER_ALLOCATION_RULES } from './master-allocation-rules';

describe('Initial Allocation & Triage Engine (Milestone 1)', () => {
  const baseContext: TriageContext = {
    clientRules: [],
    masterRules: MASTER_ALLOCATION_RULES,
    chartOfAccounts: [],
    historicalTransactions: [],
    isVatRegistered: true,
  };

  // ==========================================================================
  // 1. Strict Expense Safeguard
  // ==========================================================================
  describe('Strict Expense Safeguard', () => {
    it('strictly keeps positive amount income in status new with no allocation', () => {
      const result = triageTransaction(
        { description: 'CLIENT PAYMENT', amount: 1500, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
      expect(result.vatType).toBeUndefined();
      expect(result.merchantKey).toBeDefined();
    });

    it('strictly keeps income matching master rule keywords in status new with no allocation', () => {
      // Even though VODACOM matches a master rule, positive amount represents a refund or deposit (income)
      const result = triageTransaction(
        { description: 'VODACOM REFUND DEPOSIT', amount: 450, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
      expect(result.vatType).toBeUndefined();
    });

    it('strictly treats explicit isExpense: false as income even if amount is negative', () => {
      const result = triageTransaction(
        { description: 'PAYMENT CORRECTION', amount: -200, isExpense: false, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.accountId).toBeUndefined();
    });

    it('strictly treats zero amount without isExpense: true as non-expense', () => {
      const result = triageTransaction(
        { description: 'ZERO BALANCE CHECK', amount: 0, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.accountId).toBeUndefined();
    });
  });

  // ==========================================================================
  // 2. Client Rule Priority
  // ==========================================================================
  describe('Tier 1: Client Rule Priority', () => {
    it('gives client rule precedence over conflicting Global Master Rule regardless of priority integer', () => {
      // Global master rule for SHELL (Fuel) has priority: 10, defaultAccountCode: '3000-033'
      // Client rule has priority: 99 (numerically lower priority / higher integer) and custom account '3000-099'
      const clientRule: AllocationRule = {
        id: 'client_shell_custom',
        keywords: ['SHELL'],
        accountId: '3000-099',
        vatType: 'standard_rated_purchases',
        description: 'Client Custom Fuel Account',
        priority: 99,
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [clientRule],
      };

      const result = triageTransaction(
        { description: 'PURCHASE SHELL ULTRA CITY', amount: -450, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.status).toBe('reviewed');
      expect(result.source).toBe('client_rule');
      expect(result.accountId).toBe('3000-099');
      expect(result.matchedRuleId).toBe('client_shell_custom');
    });

    it('evaluates client rules in order of priority ascending', () => {
      const ruleHighPriority: AllocationRule = {
        id: 'rule_high',
        keywords: ['TARGET MERCHANT'],
        accountId: 'ACC-HIGH',
        vatType: 'standard_rated_purchases',
        priority: 1,
      };

      const ruleLowPriority: AllocationRule = {
        id: 'rule_low',
        keywords: ['TARGET MERCHANT'],
        accountId: 'ACC-LOW',
        vatType: 'standard_rated_purchases',
        priority: 10,
      };

      // Pass in reverse order to ensure sorting by priority works
      const context: TriageContext = {
        ...baseContext,
        clientRules: [ruleLowPriority, ruleHighPriority],
      };

      const result = triageTransaction(
        { description: 'TARGET MERCHANT STORE', amount: -100, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.source).toBe('client_rule');
      expect(result.accountId).toBe('ACC-HIGH');
      expect(result.matchedRuleId).toBe('rule_high');
    });

    it('skips client rule with missing or empty accountId and does not allocate', () => {
      const invalidClientRule: AllocationRule = {
        id: 'rule_no_acc',
        keywords: ['CUSTOM VENDOR XYZ'],
        accountId: '', // missing / empty accountId
        vatType: 'standard_rated_purchases',
        priority: 1,
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [invalidClientRule],
      };

      const result = triageTransaction(
        { description: 'CUSTOM VENDOR XYZ INVOICE', amount: -100, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.accountId).toBeUndefined();
      expect(result.source).toBe('none');
    });
  });

  // ==========================================================================
  // 3. Master Rules & Chart of Accounts Resolution
  // ==========================================================================
  describe('Tier 2: Global Master Rules & COA Resolution', () => {
    it('matches Vodacom telecom master rule and resolves to client custom account code', () => {
      // Client has custom Chart of Accounts where Telecoms is '6100'
      const chartOfAccounts = [
        {
          id: 'acc_6100',
          accountNumber: '6100',
          accountName: 'Cell Phone & Internet',
          description: 'Cell Phone & Internet',
          type: 'Expense',
        },
        {
          id: 'acc_6200',
          accountNumber: '6200',
          accountName: 'Motor Vehicle Fuel',
          description: 'Motor Vehicle Fuel',
          type: 'Expense',
        },
      ];

      const context: TriageContext = {
        ...baseContext,
        chartOfAccounts,
      };

      const result = triageTransaction(
        { description: 'DEBIT ORDER VODACOM SA', amount: -799, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.status).toBe('reviewed');
      expect(result.source).toBe('master_rule');
      expect(result.accountId).toBe('6100'); // Resolved semantically to client custom code
      expect(result.vatType).toBe('standard_rated_purchases');
      expect(result.matchedRuleId).toBe('master_tel_vodacom');
    });

    it('falls back to rule defaultAccountCode when chartOfAccounts is not provided', () => {
      const result = triageTransaction(
        { description: 'VODACOM BILL PAYMENT', amount: -500, isExpense: true, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(true);
      expect(result.source).toBe('master_rule');
      expect(result.accountId).toBe('3000-051'); // Standard Telephone & Internet code
      expect(result.matchedRuleId).toBe('master_tel_vodacom');
    });

    it('applies no_vat when client is not VAT registered', () => {
      const nonVatContext: TriageContext = {
        ...baseContext,
        isVatRegistered: false,
      };

      const result = triageTransaction(
        { description: 'VODACOM BILL PAYMENT', amount: -500, isExpense: true, date: '2026-03-01' },
        nonVatContext
      );

      expect(result.isAllocated).toBe(true);
      expect(result.vatType).toBe('no_vat');
    });

    it('passing masterRules: [] results in isAllocated: false even if description matches a master rule keyword', () => {
      const emptyMasterContext: TriageContext = {
        ...baseContext,
        masterRules: [],
      };

      const result = triageTransaction(
        { description: 'VODACOM BILL PAYMENT', amount: -500, isExpense: true, date: '2026-03-01' },
        emptyMasterContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
    });

    it('passing disableGlobalRules: true results in isAllocated: false', () => {
      const disabledGlobalContext: TriageContext = {
        ...baseContext,
        disableGlobalRules: true,
      };

      const result = triageTransaction(
        { description: 'VODACOM BILL PAYMENT', amount: -500, isExpense: true, date: '2026-03-01' },
        disabledGlobalContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
    });
  });

  // ==========================================================================
  // 4. Past History Memory (100% Consistency Invariant)
  // ==========================================================================
  describe('Tier 3: Past Allocation History Memory', () => {
    it('auto-allocates with source history when historical allocations are 100% consistent', () => {
      const historicalTransactions: ImportedTransaction[] = [
        {
          id: 'tx_1',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'LOCAL CORNER BAKERY',
          merchantKey: 'LOCAL CORNER BAKERY',
          amount: -120,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-055', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
        {
          id: 'tx_2',
          bankAccountId: 'bank_1',
          date: '2026-02-15',
          description: 'LOCAL CORNER BAKERY',
          merchantKey: 'LOCAL CORNER BAKERY',
          amount: -180,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-055', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
      ];

      const context: TriageContext = {
        ...baseContext,
        historicalTransactions,
      };

      const result = triageTransaction(
        { description: 'LOCAL CORNER BAKERY', amount: -150, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(true);
      expect(result.status).toBe('reviewed');
      expect(result.source).toBe('history');
      expect(result.accountId).toBe('3000-055');
      expect(result.vatType).toBe('standard_rated_purchases');
    });

    it('leaves transaction unallocated in status new when history has conflicting accounts', () => {
      const historicalTransactions: ImportedTransaction[] = [
        {
          id: 'tx_1',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'LOCAL HARDWARE STORE',
          merchantKey: 'LOCAL HARDWARE',
          amount: -300,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-039', type: 'account' }, // Repairs & Maintenance
          vatType: 'standard_rated_purchases',
        },
        {
          id: 'tx_2',
          bankAccountId: 'bank_1',
          date: '2026-02-10',
          description: 'LOCAL HARDWARE STORE',
          merchantKey: 'LOCAL HARDWARE',
          amount: -450,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-036', type: 'account' }, // Office Supplies (Conflict!)
          vatType: 'standard_rated_purchases',
        },
      ];

      const context: TriageContext = {
        ...baseContext,
        historicalTransactions,
      };

      const result = triageTransaction(
        { description: 'LOCAL HARDWARE STORE', amount: -250, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
      expect(result.accountId).toBeUndefined();
    });

    it('leaves transaction unallocated when history has conflicting VAT types for the same account', () => {
      const historicalTransactions: ImportedTransaction[] = [
        {
          id: 'tx_1',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'MIXED SUPPLIES CO',
          merchantKey: 'MIXED SUPPLIES',
          amount: -300,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-055', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
        {
          id: 'tx_2',
          bankAccountId: 'bank_1',
          date: '2026-02-10',
          description: 'MIXED SUPPLIES CO',
          merchantKey: 'MIXED SUPPLIES',
          amount: -450,
          status: 'reviewed',
          isExpense: true,
          allocatedTo: { value: '3000-055', type: 'account' },
          vatType: 'zero_rated_purchases', // Conflicting VAT type!
        },
      ];

      const context: TriageContext = {
        ...baseContext,
        historicalTransactions,
      };

      const result = triageTransaction(
        { description: 'MIXED SUPPLIES CO', amount: -250, isExpense: true, date: '2026-03-01' },
        context
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
    });

    it('leaves transaction unallocated when there are 0 historical instances', () => {
      const result = triageTransaction(
        { description: 'BRAND NEW UNKNOWN SUPPLIER', amount: -500, isExpense: true, date: '2026-03-01' },
        baseContext
      );

      expect(result.isAllocated).toBe(false);
      expect(result.status).toBe('new');
      expect(result.source).toBe('none');
    });

    it('ignores non-reviewed and non-expense transactions when building consistency map', () => {
      const historicalTransactions: ImportedTransaction[] = [
        {
          id: 'tx_1',
          bankAccountId: 'bank_1',
          date: '2026-01-10',
          description: 'LOCAL CLEANER',
          merchantKey: 'LOCAL CLEANER',
          amount: 500, // Income: should be ignored!
          status: 'reviewed',
          isExpense: false,
          allocatedTo: { value: '1000-001', type: 'account' },
          vatType: 'standard_rated_sales',
        },
        {
          id: 'tx_2',
          bankAccountId: 'bank_1',
          date: '2026-01-15',
          description: 'LOCAL CLEANER',
          merchantKey: 'LOCAL CLEANER',
          amount: -250,
          status: 'new', // Unreviewed: should be ignored!
          isExpense: true,
          allocatedTo: { value: '3000-005', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
        {
          id: 'tx_3',
          bankAccountId: 'bank_1',
          date: '2026-02-15',
          description: 'LOCAL CLEANER',
          merchantKey: 'LOCAL CLEANER',
          amount: -300,
          status: 'reviewed', // Genuine reviewed expense
          isExpense: true,
          allocatedTo: { value: '3000-005', type: 'account' },
          vatType: 'standard_rated_purchases',
        },
      ];

      const consistencyMap = buildConsistencyMap(historicalTransactions);
      expect(consistencyMap.has('LOCAL CLEANER')).toBe(true);
      expect(consistencyMap.get('LOCAL CLEANER')?.accountId).toBe('3000-005');
    });
  });

  // ==========================================================================
  // 5. Spoken Symbols & Keyword Matching
  // ==========================================================================
  describe('Spoken Symbols & Keyword Matching', () => {
    it('matches "3@1 WATERKLOOF" and "3 AT 1" with rule keyword "3 AT 1"', () => {
      const rule: AllocationRule = {
        id: 'rule_3_at_1',
        keywords: ['3 AT 1'],
        accountId: '3000-010',
        vatType: 'standard_rated_purchases',
        description: '3@1 Printing & Courier',
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [rule],
      };

      const result1 = triageTransaction(
        { description: '3@1 WATERKLOOF', amount: -75, isExpense: true, date: '2026-03-01' },
        context
      );
      expect(result1.isAllocated).toBe(true);
      expect(result1.matchedKeyword).toBe('3 AT 1');

      const result2 = triageTransaction(
        { description: 'POS PURCHASE 3 AT 1', amount: -120, isExpense: true, date: '2026-03-01' },
        context
      );
      expect(result2.isAllocated).toBe(true);
      expect(result2.matchedKeyword).toBe('3 AT 1');
    });

    it('strictly prevents "HOME AFFAIRS" from matching "@HOME"', () => {
      const rule: AllocationRule = {
        id: 'rule_at_home',
        keywords: ['@HOME'],
        accountId: '3000-036',
        vatType: 'standard_rated_purchases',
        description: '@Home Homeware',
      };

      const context: TriageContext = {
        ...baseContext,
        clientRules: [rule],
      };

      const resultAffairs = triageTransaction(
        { description: 'HOME AFFAIRS PRETORIA', amount: -150, isExpense: true, date: '2026-03-01' },
        context
      );
      expect(resultAffairs.isAllocated).toBe(false);
      expect(resultAffairs.status).toBe('new');

      const resultOldAge = triageTransaction(
        { description: 'OLD AGE HOME DONATION', amount: -500, isExpense: true, date: '2026-03-01' },
        context
      );
      expect(resultOldAge.isAllocated).toBe(false);
      expect(resultOldAge.status).toBe('new');

      // But genuine @HOME should match
      const resultAtHome = triageTransaction(
        { description: 'POS PURCHASE @HOME MENLYN', amount: -850, isExpense: true, date: '2026-03-01' },
        context
      );
      expect(resultAtHome.isAllocated).toBe(true);
      expect(resultAtHome.matchedRuleId).toBe('rule_at_home');
    });
  });

  // ==========================================================================
  // 6. Ingestion Metadata Enrichment
  // ==========================================================================
  describe('Ingestion Metadata Enrichment', () => {
    it('properly populates merchantKey, paymentChannel, branchLocation, and structuralClues', () => {
      const rawDescription = 'DEBIT ORDER VODACOM SA 0112345678 VAT 4123456789 STORE 12';
      const result = triageTransaction(
        { description: rawDescription, amount: -899, isExpense: true, date: '2026-03-01' },
        baseContext
      );

      expect(result.rawDescription).toBe(rawDescription);
      expect(result.cleanDescription).toBeDefined();
      expect(result.paymentChannel).toBe('DEBIT_ORDER');
      expect(result.merchantKey).toContain('VODACOM');
      expect(result.merchantKey).toContain('[DEBIT ORDER]');
      expect(result.structuralClues).toBeDefined();
      expect(result.structuralClues?.vatNumber).toBe('4123456789');
      expect(result.structuralClues?.phoneNumber).toBe('0112345678');
      expect(result.branchLocation || result.structuralClues?.branchLocator).toBeDefined();
    });

    it('populates metadata even on unallocated and income transactions', () => {
      const incomeResult = triageTransaction(
        { description: 'POS PURCHASE WOOLWORTHS FOOD #1024', amount: 350, date: '2026-03-01' },
        baseContext
      );

      expect(incomeResult.status).toBe('new');
      expect(incomeResult.isAllocated).toBe(false);
      expect(incomeResult.paymentChannel).toBe('POS');
      expect(incomeResult.merchantKey).toBe('WOOLWORTHS');
      expect(incomeResult.branchLocation || incomeResult.structuralClues?.branchLocator).toBeDefined();
    });
  });
});
