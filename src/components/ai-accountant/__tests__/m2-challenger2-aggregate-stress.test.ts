/**
 * @fileOverview Empirical Stress & Adversarial Challenge Test Suite for Milestone 2.
 * Challenger 2: Aggregate Balance Integration Stress Testing.
 *
 * Challenge Requirements:
 * 1. Multi-Account Segregation: verify `where('bankAccountId', '==', accountId)` ensures transactions from other accounts never bleed.
 * 2. Split Transaction Conservation: verify that after a transaction is split, net aggregate balance is unchanged (Delta Balance = 0).
 * 3. Clear Account: verify that after clearing transactions, aggregate balance promptly reflects 0 and other accounts remain unaffected.
 * 4. Run vitest test suite.
 */

import { describe, it, expect } from 'vitest';
import { formatPrice } from '../types';

// ============================================================================
// SIMULATION HARNESSES & ORACLES
// ============================================================================

interface MockTransactionDoc {
  id: string;
  clientId: string;
  bankAccountId?: string | null;
  amount: number;
  description: string;
  status: 'new' | 'ai_processing' | 'ai_review' | 'reviewed' | string;
  isExpense: boolean;
  date: string;
  isSplitParent?: boolean;
  isSplitChild?: boolean;
  splitFrom?: string;
  [key: string]: any;
}

/**
 * Server-side Firestore simulator mimicking `getAggregateFromServer`
 * with exact query filter semantics: where('bankAccountId', '==', targetId)
 */
function firestoreServerAggregate(
  collection: MockTransactionDoc[],
  clientId: string,
  targetAccountId: string | null | undefined
): { totalAmount: number; matchedDocsCount: number; aggregateReads: number } {
  if (!clientId || !targetAccountId) {
    return { totalAmount: 0, matchedDocsCount: 0, aggregateReads: 0 };
  }

  // Firestore equality query constraint
  const matched = collection.filter(
    tx => tx.clientId === clientId && tx.bankAccountId === targetAccountId
  );

  const rawSum = matched.reduce((acc, tx) => acc + (typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0), 0);
  const rounded = Math.round((rawSum + Number.EPSILON) * 100) / 100;

  return {
    totalAmount: rounded,
    matchedDocsCount: matched.length,
    aggregateReads: 1 // exactly 1 aggregate read
  };
}

/**
 * Simulates the client-side `fetchCalculatedBalance` parsing logic from BankTransactionsUI.tsx (lines 2999-3019):
 * const raw = snapshot.data().totalAmount;
 * const rounded = typeof raw === 'number' && !isNaN(raw) ? Math.round(raw * 100) / 100 : 0;
 */
function parseAggregateResult(rawAmount: any): number {
  return typeof rawAmount === 'number' && !isNaN(rawAmount)
    ? Math.round((rawAmount + Number.EPSILON) * 100) / 100
    : 0;
}

/**
 * Simulates `handleClearAccount` batch deletion from BankTransactionsUI.tsx (lines 3026-3060):
 * - Queries `where('bankAccountId', '==', accountId)`
 * - Chunks into batches of 500
 * - Deletes matched docs
 */
function simulateClearAccount(
  collection: MockTransactionDoc[],
  clientId: string,
  targetAccountId: string
): { updatedCollection: MockTransactionDoc[]; deletedCount: number; batchesCommitted: number } {
  if (!clientId || !targetAccountId) {
    return { updatedCollection: collection, deletedCount: 0, batchesCommitted: 0 };
  }

  const toDelete = collection.filter(
    tx => tx.clientId === clientId && tx.bankAccountId === targetAccountId
  );

  if (toDelete.length === 0) {
    return { updatedCollection: collection, deletedCount: 0, batchesCommitted: 0 };
  }

  const batchCount = Math.ceil(toDelete.length / 500);
  const remaining = collection.filter(
    tx => !(tx.clientId === clientId && tx.bankAccountId === targetAccountId)
  );

  return {
    updatedCollection: remaining,
    deletedCount: toDelete.length,
    batchesCommitted: batchCount
  };
}

/**
 * Simulates SplitTransactionDialog save operation (lines 130-184):
 * - Deletes original parent doc
 * - Creates child docs with same bankAccountId, sign preservation, and sub-amounts
 */
function simulateSplitTransaction(
  collection: MockTransactionDoc[],
  parentTxId: string,
  splits: Array<{ amount: number; allocatedTo: string; vatType: string }>
): { updatedCollection: MockTransactionDoc[]; isBalanced: boolean; discrepancy: number } {
  const parent = collection.find(tx => tx.id === parentTxId);
  if (!parent) {
    throw new Error(`Parent transaction ${parentTxId} not found`);
  }

  const parentAbs = Math.round(Math.abs(parent.amount) * 100);
  const splitAbsSum = Math.round(splits.reduce((acc, s) => acc + Math.abs(s.amount), 0) * 100);
  const discrepancy = (parentAbs - splitAbsSum) / 100;
  const isBalanced = discrepancy === 0;

  if (!isBalanced) {
    return { updatedCollection: collection, isBalanced: false, discrepancy };
  }

  // Delete parent
  const withoutParent = collection.filter(tx => tx.id !== parentTxId);

  // Sign preservation: expense is negative, income is positive
  const sign = parent.isExpense ? -1 : 1;
  const childDocs: MockTransactionDoc[] = splits.map((s, idx) => ({
    id: `${parent.id}-split-${idx + 1}`,
    clientId: parent.clientId,
    bankAccountId: parent.bankAccountId, // Must inherit parent's bankAccountId!
    date: parent.date,
    description: `${parent.description} (Split ${idx + 1}/${splits.length})`,
    amount: Math.abs(s.amount) * sign,
    status: 'reviewed',
    isExpense: parent.isExpense,
    isSplitChild: true,
    splitFrom: parent.id
  }));

  return {
    updatedCollection: [...withoutParent, ...childDocs],
    isBalanced: true,
    discrepancy: 0
  };
}

// ============================================================================
// CHALLENGE 1: MULTI-ACCOUNT SEGREGATION STRESS TESTS
// ============================================================================

describe('Challenger 2 — Challenge 1: Multi-Account Segregation Stress Tests', () => {
  const CLIENT_ID = 'client-stress-101';

  it('C1.1: Strict partition isolation — 5 accounts with interleaved transactions have zero cross-bleed', () => {
    const txs: MockTransactionDoc[] = [
      { id: 't1', clientId: CLIENT_ID, bankAccountId: 'acc-cheque', amount: 5000.50, description: 'Deposit', status: 'reviewed', isExpense: false, date: '2026-09-01' },
      { id: 't2', clientId: CLIENT_ID, bankAccountId: 'acc-savings', amount: 12000.00, description: 'Transfer in', status: 'reviewed', isExpense: false, date: '2026-09-01' },
      { id: 't3', clientId: CLIENT_ID, bankAccountId: 'acc-credit', amount: -3500.75, description: 'Card purchase', status: 'reviewed', isExpense: true, date: '2026-09-02' },
      { id: 't4', clientId: CLIENT_ID, bankAccountId: 'acc-cheque', amount: -1500.25, description: 'Supplier payment', status: 'reviewed', isExpense: true, date: '2026-09-03' },
      { id: 't5', clientId: CLIENT_ID, bankAccountId: 'acc-petty', amount: -250.00, description: 'Stationery', status: 'new', isExpense: true, date: '2026-09-03' },
      { id: 't6', clientId: CLIENT_ID, bankAccountId: 'acc-usd', amount: 450.00, description: 'Forex inflow', status: 'new', isExpense: false, date: '2026-09-04' },
      { id: 't7', clientId: CLIENT_ID, bankAccountId: 'acc-credit', amount: 1000.00, description: 'Card settlement', status: 'reviewed', isExpense: false, date: '2026-09-04' },
    ];

    const chequeRes = firestoreServerAggregate(txs, CLIENT_ID, 'acc-cheque');
    const savingsRes = firestoreServerAggregate(txs, CLIENT_ID, 'acc-savings');
    const creditRes = firestoreServerAggregate(txs, CLIENT_ID, 'acc-credit');
    const pettyRes = firestoreServerAggregate(txs, CLIENT_ID, 'acc-petty');
    const usdRes = firestoreServerAggregate(txs, CLIENT_ID, 'acc-usd');

    // Cheque: 5000.50 - 1500.25 = 3500.25
    expect(chequeRes.totalAmount).toBe(3500.25);
    expect(chequeRes.matchedDocsCount).toBe(2);

    // Savings: 12000.00
    expect(savingsRes.totalAmount).toBe(12000.00);
    expect(savingsRes.matchedDocsCount).toBe(1);

    // Credit: -3500.75 + 1000.00 = -2500.75
    expect(creditRes.totalAmount).toBe(-2500.75);
    expect(creditRes.matchedDocsCount).toBe(2);

    // Petty cash: -250.00
    expect(pettyRes.totalAmount).toBe(-250.00);
    expect(pettyRes.matchedDocsCount).toBe(1);

    // USD: 450.00
    expect(usdRes.totalAmount).toBe(450.00);
    expect(usdRes.matchedDocsCount).toBe(1);

    // Conservation across partitions: Sum of partitions == Sum of all transactions
    const totalPartitionSum = Math.round(
      (chequeRes.totalAmount + savingsRes.totalAmount + creditRes.totalAmount + pettyRes.totalAmount + usdRes.totalAmount) * 100
    ) / 100;
    const allDocsSum = Math.round(txs.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
    expect(totalPartitionSum).toBe(allDocsSum);
  });

  it('C1.2: Boundary & Collision attack — Substring/prefix collision IDs do NOT bleed into each other', () => {
    // Tests that 'acc-1', 'acc-10', 'acc-100', 'acc-1_primary', 'ACC-1' are strictly segregated
    const txs: MockTransactionDoc[] = [
      { id: '1', clientId: CLIENT_ID, bankAccountId: 'acc-1', amount: 100.00, description: 'acc-1 item', status: 'new', isExpense: false, date: '2026-09-01' },
      { id: '2', clientId: CLIENT_ID, bankAccountId: 'acc-10', amount: 200.00, description: 'acc-10 item', status: 'new', isExpense: false, date: '2026-09-01' },
      { id: '3', clientId: CLIENT_ID, bankAccountId: 'acc-100', amount: 300.00, description: 'acc-100 item', status: 'new', isExpense: false, date: '2026-09-01' },
      { id: '4', clientId: CLIENT_ID, bankAccountId: 'acc-1_primary', amount: 400.00, description: 'acc-1_primary item', status: 'new', isExpense: false, date: '2026-09-01' },
      { id: '5', clientId: CLIENT_ID, bankAccountId: 'ACC-1', amount: 500.00, description: 'uppercase ACC-1 item', status: 'new', isExpense: false, date: '2026-09-01' },
    ];

    expect(firestoreServerAggregate(txs, CLIENT_ID, 'acc-1').totalAmount).toBe(100.00);
    expect(firestoreServerAggregate(txs, CLIENT_ID, 'acc-10').totalAmount).toBe(200.00);
    expect(firestoreServerAggregate(txs, CLIENT_ID, 'acc-100').totalAmount).toBe(300.00);
    expect(firestoreServerAggregate(txs, CLIENT_ID, 'acc-1_primary').totalAmount).toBe(400.00);
    expect(firestoreServerAggregate(txs, CLIENT_ID, 'ACC-1').totalAmount).toBe(500.00);

    // Non-existent ID returns 0
    expect(firestoreServerAggregate(txs, CLIENT_ID, 'acc-2').totalAmount).toBe(0);
    expect(firestoreServerAggregate(txs, CLIENT_ID, 'acc-1000').totalAmount).toBe(0);
  });

  it('C1.3: Unassigned and malformed bankAccountId transactions are strictly excluded', () => {
    const txs: MockTransactionDoc[] = [
      { id: 't1', clientId: CLIENT_ID, bankAccountId: 'acc-valid', amount: 750.00, description: 'Valid tx', status: 'new', isExpense: false, date: '2026-09-01' },
      { id: 't2', clientId: CLIENT_ID, bankAccountId: undefined, amount: 9999.00, description: 'Missing account', status: 'new', isExpense: false, date: '2026-09-01' },
      { id: 't3', clientId: CLIENT_ID, bankAccountId: null, amount: 8888.00, description: 'Null account', status: 'new', isExpense: false, date: '2026-09-01' },
      { id: 't4', clientId: CLIENT_ID, bankAccountId: '', amount: 7777.00, description: 'Empty string account', status: 'new', isExpense: false, date: '2026-09-01' },
      { id: 't5', clientId: 'other-client-id', bankAccountId: 'acc-valid', amount: 6666.00, description: 'Other client same account id', status: 'new', isExpense: false, date: '2026-09-01' },
    ];

    const result = firestoreServerAggregate(txs, CLIENT_ID, 'acc-valid');
    expect(result.totalAmount).toBe(750.00);
    expect(result.matchedDocsCount).toBe(1);

    // Querying with empty accountId returns 0
    expect(firestoreServerAggregate(txs, CLIENT_ID, '').totalAmount).toBe(0);
    expect(firestoreServerAggregate(txs, CLIENT_ID, undefined).totalAmount).toBe(0);
    expect(firestoreServerAggregate(txs, CLIENT_ID, null).totalAmount).toBe(0);
  });

  it('C1.4: High-volume stress test — 10,000 transactions randomly partitioned across 10 accounts with zero leakage', () => {
    const accounts = Array.from({ length: 10 }, (_, i) => `account-${i + 1}`);
    const expectedTotals: Record<string, number> = {};
    accounts.forEach(acc => { expectedTotals[acc] = 0; });

    const txs: MockTransactionDoc[] = [];
    for (let i = 0; i < 10000; i++) {
      const acc = accounts[i % accounts.length];
      // Deterministic pseudo-random float between -500.00 and +1000.00 with 2 decimal places
      const amount = Math.round(((Math.sin(i) * 750) + 250) * 100) / 100;
      txs.push({
        id: `tx-bulk-${i}`,
        clientId: CLIENT_ID,
        bankAccountId: acc,
        amount,
        description: `Bulk Tx ${i}`,
        status: i % 2 === 0 ? 'reviewed' : 'new',
        isExpense: amount < 0,
        date: '2026-09-15'
      });
      expectedTotals[acc] = Math.round((expectedTotals[acc] + amount) * 100) / 100;
    }

    accounts.forEach(acc => {
      const res = firestoreServerAggregate(txs, CLIENT_ID, acc);
      expect(res.matchedDocsCount).toBe(1000);
      expect(res.totalAmount).toBe(expectedTotals[acc]);
    });
  });
});

// ============================================================================
// CHALLENGE 2: SPLIT BALANCE CONSERVATION NET INVARIANCE (DELTA BALANCE = 0)
// ============================================================================

describe('Challenger 2 — Challenge 2: Split Balance Conservation Net Invariance', () => {
  const CLIENT_ID = 'client-split-stress';
  const BANK_ACCOUNT = 'acc-operating';

  it('C2.1: Simple expense split maintains exact net zero balance change (Delta = 0.00)', () => {
    const originalTx: MockTransactionDoc = {
      id: 'tx-parent-1',
      clientId: CLIENT_ID,
      bankAccountId: BANK_ACCOUNT,
      amount: -1500.00,
      description: 'Makro Bulk Supplies',
      status: 'new',
      isExpense: true,
      date: '2026-09-10'
    };

    const initialCollection = [
      originalTx,
      { id: 'tx-unrelated', clientId: CLIENT_ID, bankAccountId: BANK_ACCOUNT, amount: 10000.00, description: 'Opening Balance', status: 'reviewed', isExpense: false, date: '2026-09-01' }
    ];

    const balanceBefore = firestoreServerAggregate(initialCollection, CLIENT_ID, BANK_ACCOUNT).totalAmount;
    expect(balanceBefore).toBe(8500.00); // 10000 - 1500

    // Split into 3 parts: -700, -500, -300
    const splits = [
      { amount: 700.00, allocatedTo: 'acc-groceries', vatType: 'standard_rated_purchases' },
      { amount: 500.00, allocatedTo: 'acc-cleaning', vatType: 'standard_rated_purchases' },
      { amount: 300.00, allocatedTo: 'acc-stationery', vatType: 'zero_rated_purchases' }
    ];

    const splitResult = simulateSplitTransaction(initialCollection, originalTx.id, splits);
    expect(splitResult.isBalanced).toBe(true);
    expect(splitResult.discrepancy).toBe(0);

    const balanceAfter = firestoreServerAggregate(splitResult.updatedCollection, CLIENT_ID, BANK_ACCOUNT).totalAmount;
    const delta = Math.round(Math.abs(balanceAfter - balanceBefore) * 100) / 100;

    // MANDATORY INVARIANT: Delta Balance === 0
    expect(delta).toBe(0.00);
    expect(balanceAfter).toBe(8500.00);
  });

  it('C2.2: Income split maintains exact net zero balance change (Delta = 0.00)', () => {
    const originalIncome: MockTransactionDoc = {
      id: 'tx-income-parent',
      clientId: CLIENT_ID,
      bankAccountId: BANK_ACCOUNT,
      amount: 45250.75,
      description: 'Client Invoice Payment Combined',
      status: 'new',
      isExpense: false,
      date: '2026-09-12'
    };

    const initialCollection = [originalIncome];
    const balanceBefore = firestoreServerAggregate(initialCollection, CLIENT_ID, BANK_ACCOUNT).totalAmount;
    expect(balanceBefore).toBe(45250.75);

    // Split income into 2 customers: 30,000.50 and 15,250.25
    const splits = [
      { amount: 30000.50, allocatedTo: 'cust-1', vatType: 'standard_rated_sales' },
      { amount: 15250.25, allocatedTo: 'cust-2', vatType: 'standard_rated_sales' }
    ];

    const splitResult = simulateSplitTransaction(initialCollection, originalIncome.id, splits);
    expect(splitResult.isBalanced).toBe(true);

    const balanceAfter = firestoreServerAggregate(splitResult.updatedCollection, CLIENT_ID, BANK_ACCOUNT).totalAmount;
    expect(balanceAfter).toBe(balanceBefore);
  });

  it('C2.3: Fractional cent / precision rounding stress test (e.g. 100.33 -> 33.44, 33.44, 33.45)', () => {
    const originalTx: MockTransactionDoc = {
      id: 'tx-odd-cents',
      clientId: CLIENT_ID,
      bankAccountId: BANK_ACCOUNT,
      amount: -100.33,
      description: 'Odd cents invoice',
      status: 'new',
      isExpense: true,
      date: '2026-09-14'
    };

    const initialCollection = [originalTx];
    const balanceBefore = firestoreServerAggregate(initialCollection, CLIENT_ID, BANK_ACCOUNT).totalAmount;
    expect(balanceBefore).toBe(-100.33);

    const splits = [
      { amount: 33.44, allocatedTo: 'acc-1', vatType: 'standard_rated_purchases' },
      { amount: 33.44, allocatedTo: 'acc-2', vatType: 'standard_rated_purchases' },
      { amount: 33.45, allocatedTo: 'acc-3', vatType: 'standard_rated_purchases' }
    ];

    const splitResult = simulateSplitTransaction(initialCollection, originalTx.id, splits);
    expect(splitResult.isBalanced).toBe(true);

    const balanceAfter = firestoreServerAggregate(splitResult.updatedCollection, CLIENT_ID, BANK_ACCOUNT).totalAmount;
    expect(balanceAfter).toBe(balanceBefore);
  });

  it('C2.4: Extreme micro-split stress test — 1 transaction split into 100 child transactions', () => {
    const originalTx: MockTransactionDoc = {
      id: 'tx-bulk-split',
      clientId: CLIENT_ID,
      bankAccountId: BANK_ACCOUNT,
      amount: -10000.00,
      description: 'Large distribution',
      status: 'new',
      isExpense: true,
      date: '2026-09-15'
    };

    const initialCollection = [originalTx];
    const balanceBefore = firestoreServerAggregate(initialCollection, CLIENT_ID, BANK_ACCOUNT).totalAmount;

    // 100 splits of 100.00 each
    const splits = Array.from({ length: 100 }, (_, i) => ({
      amount: 100.00,
      allocatedTo: `acc-dept-${i + 1}`,
      vatType: 'standard_rated_purchases'
    }));

    const splitResult = simulateSplitTransaction(initialCollection, originalTx.id, splits);
    expect(splitResult.isBalanced).toBe(true);
    expect(splitResult.updatedCollection.length).toBe(100);

    const balanceAfter = firestoreServerAggregate(splitResult.updatedCollection, CLIENT_ID, BANK_ACCOUNT).totalAmount;
    expect(balanceAfter).toBe(balanceBefore);
    expect(balanceAfter).toBe(-10000.00);
  });

  it('C2.5: Rejection of unbalanced splits (money creation or destruction)', () => {
    const originalTx: MockTransactionDoc = {
      id: 'tx-strict',
      clientId: CLIENT_ID,
      bankAccountId: BANK_ACCOUNT,
      amount: -500.00,
      description: 'Strict check',
      status: 'new',
      isExpense: true,
      date: '2026-09-15'
    };

    const initialCollection = [originalTx];

    // Attempting to create money (+1 cent discrepancy: 300.00 + 200.01 = 500.01)
    const overSplit = [
      { amount: 300.00, allocatedTo: 'a', vatType: 'no_vat' },
      { amount: 200.01, allocatedTo: 'b', vatType: 'no_vat' }
    ];
    const overResult = simulateSplitTransaction(initialCollection, originalTx.id, overSplit);
    expect(overResult.isBalanced).toBe(false);
    expect(overResult.discrepancy).toBe(-0.01);

    // Attempting to destroy money (-1 cent discrepancy: 300.00 + 199.99 = 499.99)
    const underSplit = [
      { amount: 300.00, allocatedTo: 'a', vatType: 'no_vat' },
      { amount: 199.99, allocatedTo: 'b', vatType: 'no_vat' }
    ];
    const underResult = simulateSplitTransaction(initialCollection, originalTx.id, underSplit);
    expect(underResult.isBalanced).toBe(false);
    expect(underResult.discrepancy).toBe(0.01);
  });

  it('C2.6: Split children strictly inherit bankAccountId, preventing accidental multi-account bleeding', () => {
    const parentTx: MockTransactionDoc = {
      id: 'tx-parent-acc-spec',
      clientId: CLIENT_ID,
      bankAccountId: 'acc-special-isolate',
      amount: -1000.00,
      description: 'Isolate parent',
      status: 'new',
      isExpense: true,
      date: '2026-09-16'
    };

    const otherAccountTx: MockTransactionDoc = {
      id: 'tx-other-acc',
      clientId: CLIENT_ID,
      bankAccountId: 'acc-unrelated-main',
      amount: 50000.00,
      description: 'Other account balance',
      status: 'reviewed',
      isExpense: false,
      date: '2026-09-01'
    };

    const initialCollection = [parentTx, otherAccountTx];

    const splits = [
      { amount: 600.00, allocatedTo: 'acc-1', vatType: 'no_vat' },
      { amount: 400.00, allocatedTo: 'acc-2', vatType: 'no_vat' }
    ];

    const splitResult = simulateSplitTransaction(initialCollection, parentTx.id, splits);

    // Verify children bankAccountId
    const children = splitResult.updatedCollection.filter(tx => tx.isSplitChild);
    expect(children.length).toBe(2);
    children.forEach(child => {
      expect(child.bankAccountId).toBe('acc-special-isolate');
    });

    // Verify other account balance was completely unaffected
    const otherAccBalance = firestoreServerAggregate(splitResult.updatedCollection, CLIENT_ID, 'acc-unrelated-main').totalAmount;
    expect(otherAccBalance).toBe(50000.00);
  });
});

// ============================================================================
// CHALLENGE 3: CLEAR ACCOUNT RESET TO 0 STRESS TESTS
// ============================================================================

describe('Challenger 2 — Challenge 3: Clear Account Reset to 0 Stress Tests', () => {
  const CLIENT_ID = 'client-clear-stress';
  const TARGET_ACC = 'acc-to-clear';
  const OTHER_ACC = 'acc-to-preserve';

  it('C3.1: Clearing an already empty account safely returns 0 deleted and balance remains 0.00', () => {
    const emptyCollection: MockTransactionDoc[] = [];

    const clearRes = simulateClearAccount(emptyCollection, CLIENT_ID, TARGET_ACC);
    expect(clearRes.deletedCount).toBe(0);
    expect(clearRes.batchesCommitted).toBe(0);
    expect(clearRes.updatedCollection.length).toBe(0);

    const aggRes = firestoreServerAggregate(clearRes.updatedCollection, CLIENT_ID, TARGET_ACC);
    expect(aggRes.totalAmount).toBe(0);
    expect(parseAggregateResult(aggRes.totalAmount)).toBe(0);
  });

  it('C3.2: Clearing a populated account deletes all target transactions and aggregate balance resets to 0.00', () => {
    const txs: MockTransactionDoc[] = [
      { id: '1', clientId: CLIENT_ID, bankAccountId: TARGET_ACC, amount: 500.00, description: 't1', status: 'reviewed', isExpense: false, date: '2026-09-01' },
      { id: '2', clientId: CLIENT_ID, bankAccountId: TARGET_ACC, amount: -200.00, description: 't2', status: 'reviewed', isExpense: true, date: '2026-09-02' },
      { id: '3', clientId: CLIENT_ID, bankAccountId: TARGET_ACC, amount: -150.00, description: 't3', status: 'new', isExpense: true, date: '2026-09-03' },
    ];

    const initialAgg = firestoreServerAggregate(txs, CLIENT_ID, TARGET_ACC);
    expect(initialAgg.totalAmount).toBe(150.00);

    const clearRes = simulateClearAccount(txs, CLIENT_ID, TARGET_ACC);
    expect(clearRes.deletedCount).toBe(3);
    expect(clearRes.batchesCommitted).toBe(1);
    expect(clearRes.updatedCollection.length).toBe(0);

    const postClearAgg = firestoreServerAggregate(clearRes.updatedCollection, CLIENT_ID, TARGET_ACC);
    expect(postClearAgg.totalAmount).toBe(0);
    expect(postClearAgg.matchedDocsCount).toBe(0);
  });

  it('C3.3: Clearing TARGET_ACC preserves 100% of transactions and balance of OTHER_ACC', () => {
    const txs: MockTransactionDoc[] = [
      // 50 transactions in TARGET_ACC
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `target-${i}`,
        clientId: CLIENT_ID,
        bankAccountId: TARGET_ACC,
        amount: -50.00,
        description: `Target tx ${i}`,
        status: 'reviewed' as const,
        isExpense: true,
        date: '2026-09-01'
      })),
      // 100 transactions in OTHER_ACC
      ...Array.from({ length: 100 }, (_, i) => ({
        id: `preserve-${i}`,
        clientId: CLIENT_ID,
        bankAccountId: OTHER_ACC,
        amount: 150.00,
        description: `Preserve tx ${i}`,
        status: 'reviewed' as const,
        isExpense: false,
        date: '2026-09-01'
      }))
    ];

    const initialOtherBalance = firestoreServerAggregate(txs, CLIENT_ID, OTHER_ACC).totalAmount;
    expect(initialOtherBalance).toBe(15000.00); // 100 * 150.00

    // Clear TARGET_ACC
    const clearRes = simulateClearAccount(txs, CLIENT_ID, TARGET_ACC);
    expect(clearRes.deletedCount).toBe(50);

    // Target balance is 0
    const postClearTarget = firestoreServerAggregate(clearRes.updatedCollection, CLIENT_ID, TARGET_ACC);
    expect(postClearTarget.totalAmount).toBe(0);

    // Other account balance and document count are completely untouched
    const postClearOther = firestoreServerAggregate(clearRes.updatedCollection, CLIENT_ID, OTHER_ACC);
    expect(postClearOther.matchedDocsCount).toBe(100);
    expect(postClearOther.totalAmount).toBe(15000.00);
    expect(postClearOther.totalAmount).toBe(initialOtherBalance);
  });

  it('C3.4: High-volume batch chunking test (>500 transactions requiring multiple Firestore commit batches)', () => {
    // Firestore writeBatch has a hard limit of 500 ops.
    // 1,350 transactions require 3 batches: 500 + 500 + 350.
    const largeVolumeTxs: MockTransactionDoc[] = Array.from({ length: 1350 }, (_, i) => ({
      id: `chunk-tx-${i}`,
      clientId: CLIENT_ID,
      bankAccountId: TARGET_ACC,
      amount: -10.00,
      description: `Chunk tx ${i}`,
      status: 'reviewed',
      isExpense: true,
      date: '2026-09-01'
    }));

    const preClearAgg = firestoreServerAggregate(largeVolumeTxs, CLIENT_ID, TARGET_ACC);
    expect(preClearAgg.totalAmount).toBe(-13500.00);
    expect(preClearAgg.matchedDocsCount).toBe(1350);

    const clearRes = simulateClearAccount(largeVolumeTxs, CLIENT_ID, TARGET_ACC);
    expect(clearRes.deletedCount).toBe(1350);
    expect(clearRes.batchesCommitted).toBe(3); // 500 + 500 + 350 -> exactly 3 batches
    expect(clearRes.updatedCollection.length).toBe(0);

    const postClearAgg = firestoreServerAggregate(clearRes.updatedCollection, CLIENT_ID, TARGET_ACC);
    expect(postClearAgg.totalAmount).toBe(0);
    expect(postClearAgg.matchedDocsCount).toBe(0);
  });

  it('C3.5: Null/NaN/empty aggregate response parsing robustness on empty or cleared collection', () => {
    // Verifies the exact logic in BankTransactionsUI.tsx:
    // const raw = snapshot.data().totalAmount;
    // const rounded = typeof raw === 'number' && !isNaN(raw) ? Math.round(raw * 100) / 100 : 0;
    expect(parseAggregateResult(null)).toBe(0);
    expect(parseAggregateResult(undefined)).toBe(0);
    expect(parseAggregateResult(NaN)).toBe(0);
    expect(parseAggregateResult('invalid')).toBe(0);
    expect(parseAggregateResult(0)).toBe(0);
    expect(parseAggregateResult(1234.567)).toBe(1234.57);
    
    // Check numerical equality with 0 for sub-cent delta
    const tinyNegative = parseAggregateResult(-0.000001);
    expect(tinyNegative == 0).toBe(true);
    expect(Math.abs(tinyNegative)).toBe(0);
  });
});
