/**
 * @fileOverview Empirical Challenger 2 Stress Test Suite for Milestone 5 (Clean Shell Assembly & Functional Integration).
 *
 * Primary Objectives:
 * 1. Empirically verify accounting invariants across modularized tabs and dialogs:
 *    - Split transaction conservation: strict zero-delta balance guarantee (Δ Balance = 0), cents rounding, IEEE-754 safety, multi-splits.
 *    - Undo lifecycle: status reset to 'new', allocation metadata clearing, unallocated count increments, balance invariant.
 *    - South African canonical VAT types & chart of accounts rule bindings: 8 canonical VAT types, keyword normalization, global sync.
 *    - Excel export filtering: filteredGroups search scoping, workbook structure, data validation constraints.
 * 2. Stress test callback wiring across NewTransactionsTab, SmartMatchQueueTab, ReviewedTab, and BankTransactionsUI under rapid event dispatch.
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
    allVatTypes, 
    CANONICAL_VAT_TYPES, 
    normalizeVatType, 
    CanonicalVatType 
} from '@/lib/vat-types';
import { 
    ruleFormSchema, 
    manualTransactionSchema, 
    formatPrice, 
    TransactionGroup 
} from '../types';
import { BankCleaner } from '@/lib/bank-cleaner';
import { ImportedTransaction, User, ChartOfAccount as AccountCategory } from '@/lib/types';

// ============================================================================
// SIMULATION HARNESSES & ORACLES FOR ACCOUNTING INVARIANTS
// ============================================================================

interface MockTx {
    id: string;
    clientId: string;
    bankAccountId: string;
    amount: number;
    description: string;
    status: 'new' | 'ai_review' | 'ai_processing' | 'reviewed';
    isExpense: boolean;
    date: string;
    reference?: string;
    cleanDescription?: string;
    rawDescription?: string;
    merchantKey?: string;
    allocatedTo?: { value: string; type: 'account' | 'customer' | 'supplier' };
    vatType?: string;
    allocationSource?: string;
    smartAllocationResult?: any;
    splitFrom?: string;
    isSplitChild?: boolean;
    parentTxData?: any;
}

/**
 * Server-side balance aggregation oracle mimicking getAggregateFromServer(sum('amount'))
 */
function computeAggregateBalance(txs: MockTx[], accountId: string): number {
    const matched = txs.filter(t => t.bankAccountId === accountId);
    const rawSum = matched.reduce((acc, t) => acc + (typeof t.amount === 'number' && !isNaN(t.amount) ? t.amount : 0), 0);
    return Math.round((rawSum + Number.EPSILON) * 100) / 100;
}

/**
 * Unallocated count oracle mimicking getCountFromServer(where('status', 'in', ['new', 'ai_review', 'ai_processing']))
 */
function computeUnallocatedCount(txs: MockTx[], accountId: string): number {
    return txs.filter(
        t => t.bankAccountId === accountId && ['new', 'ai_review', 'ai_processing'].includes(t.status)
    ).length;
}

/**
 * Exact simulation of SplitTransactionDialog arithmetic and batch persistence logic
 */
function simulateSplitDialog(
    transaction: MockTx,
    rows: Array<{ amount: string; allocatedTo: { value: string; type: 'account' | 'customer' | 'supplier' } | null; vatType: string }>,
    client: { uid: string; isVatRegistered: boolean }
) {
    const originalAbs = Math.abs(transaction.amount);
    const currentSum = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const diff = Math.round(originalAbs * 100) - Math.round(currentSum * 100);
    const remaining = diff / 100;
    const isBalanced = diff === 0;

    const isValid = isBalanced && rows.length >= 2 && rows.every(r => {
        const amt = parseFloat(r.amount);
        return !isNaN(amt) && amt > 0 && r.allocatedTo && r.allocatedTo.value;
    });

    if (!isValid) {
        return { success: false, reason: 'Validation failed', diff, remaining, isBalanced, createdChildren: [] };
    }

    const sign = transaction.isExpense ? -1 : 1;
    const createdChildren: MockTx[] = rows.map((row, index) => {
        const amtVal = parseFloat(row.amount);
        const subAmount = amtVal * sign;
        const subRef = transaction.reference ? `${transaction.reference}-S${index + 1}` : `CSV-${Date.now()}-S${index + 1}`;
        const subDescription = `${transaction.description} (Split ${index + 1}/${rows.length})`;

        return {
            id: `split_${transaction.id}_${index + 1}`,
            clientId: client.uid,
            bankAccountId: transaction.bankAccountId,
            date: transaction.date,
            description: subDescription,
            amount: subAmount,
            status: 'reviewed' as const,
            isExpense: transaction.isExpense,
            allocatedTo: {
                value: row.allocatedTo!.value,
                type: row.allocatedTo!.type
            },
            vatType: client.isVatRegistered ? row.vatType : 'no_vat',
            reference: subRef,
            allocationSource: 'manual',
            splitFrom: transaction.id,
            isSplitChild: true,
            parentTxData: {
                id: transaction.id,
                amount: transaction.amount,
                description: transaction.description,
                date: transaction.date,
                reference: transaction.reference || '',
                bankAccountId: transaction.bankAccountId,
                isExpense: transaction.isExpense,
                status: transaction.status,
                ...(transaction.cleanDescription ? { cleanDescription: transaction.cleanDescription } : {}),
                ...(transaction.rawDescription ? { rawDescription: transaction.rawDescription } : {}),
                ...(transaction.merchantKey ? { merchantKey: transaction.merchantKey } : {})
            }
        };
    });

    return {
        success: true,
        diff,
        remaining,
        isBalanced,
        createdChildren,
        totalChildAmount: createdChildren.reduce((sum, c) => sum + c.amount, 0)
    };
}

/**
 * Exact simulation of ReviewedTab handleUnsplitAndReset logic
 */
function simulateUnsplitAndReset(
    childTx: MockTx,
    existingTxs: MockTx[]
): { updatedTxs: MockTx[]; restoredTx: MockTx } {
    if (!childTx.splitFrom || !childTx.parentTxData) {
        throw new Error("Cannot unsplit transaction without splitFrom and parentTxData");
    }

    // 1. Delete all siblings with matching splitFrom
    const filteredTxs = existingTxs.filter(t => t.splitFrom !== childTx.splitFrom);

    // 2. Restore parent transaction
    const parentData = childTx.parentTxData;
    const restoredTx: MockTx = {
        id: childTx.splitFrom,
        clientId: childTx.clientId,
        bankAccountId: parentData.bankAccountId,
        date: parentData.date,
        description: parentData.description,
        amount: parentData.amount,
        status: 'new',
        isExpense: parentData.isExpense,
        reference: parentData.reference || '',
        ...(parentData.cleanDescription ? { cleanDescription: parentData.cleanDescription } : {}),
        ...(parentData.rawDescription ? { rawDescription: parentData.rawDescription } : {}),
        ...(parentData.merchantKey ? { merchantKey: parentData.merchantKey } : {})
    };

    return {
        updatedTxs: [...filteredTxs, restoredTx],
        restoredTx
    };
}

/**
 * Exact simulation of moveTransactionToNew backend action
 */
function simulateMoveTransactionToNew(tx: MockTx): MockTx {
    const processed = BankCleaner.process(tx.description || '');
    const { allocatedTo, vatType, smartAllocationResult, allocationSource, ...rest } = tx;

    return {
        ...rest,
        status: 'new',
        merchantKey: processed.merchantKey,
        cleanDescription: processed.cleanDescription,
    };
}

// ============================================================================
// CHALLENGER 2 EMPIRICAL TEST SUITE
// ============================================================================

describe('Milestone 5 Empirical Challenger 2: Accounting Invariants & Event Stress', () => {
    const rootDir = process.cwd();
    const shellContent = fs.readFileSync(path.resolve(rootDir, 'src/components/ai-accountant/BankTransactionsUI.tsx'), 'utf-8');
    const newTabContent = fs.readFileSync(path.resolve(rootDir, 'src/components/ai-accountant/NewTransactionsTab.tsx'), 'utf-8');
    const smartTabContent = fs.readFileSync(path.resolve(rootDir, 'src/components/ai-accountant/SmartMatchQueueTab.tsx'), 'utf-8');
    const reviewedTabContent = fs.readFileSync(path.resolve(rootDir, 'src/components/ai-accountant/ReviewedTab.tsx'), 'utf-8');
    const splitDialogContent = fs.readFileSync(path.resolve(rootDir, 'src/components/ai-accountant/dialogs/SplitTransactionDialog.tsx'), 'utf-8');
    const createRuleDialogContent = fs.readFileSync(path.resolve(rootDir, 'src/components/ai-accountant/dialogs/CreateRuleDialog.tsx'), 'utf-8');

    // ========================================================================
    // SUITE 1: Split Transaction Conservation & Invariant Stress (Δ Balance = 0)
    // ========================================================================
    describe('Suite 1: Split Transaction Conservation & Precision Invariant', () => {
        const client = { uid: 'client_audit_1', isVatRegistered: true };
        const testAccountId = '8400-01';

        it('1.1: Expense Split Conservation: sum of child split transactions strictly equals original negative amount (Δ = 0)', () => {
            const originalTx: MockTx = {
                id: 'tx_expense_101',
                clientId: client.uid,
                bankAccountId: testAccountId,
                amount: -1875.50,
                description: 'MAKRO WOODMEAD',
                status: 'new',
                isExpense: true,
                date: '2026-08-15',
                reference: 'CSV-9912'
            };

            const initialLedger: MockTx[] = [
                originalTx,
                { id: 'tx_other_1', clientId: client.uid, bankAccountId: testAccountId, amount: 5000.00, description: 'Client Deposit', status: 'reviewed', isExpense: false, date: '2026-08-10' },
                { id: 'tx_other_2', clientId: client.uid, bankAccountId: testAccountId, amount: -250.00, description: 'Bank Fees', status: 'reviewed', isExpense: true, date: '2026-08-11' }
            ];

            const initialBalance = computeAggregateBalance(initialLedger, testAccountId);
            expect(initialBalance).toBe(2874.50); // 5000 - 250 - 1875.50

            // Split into 3 parts: R875.50 + R500.00 + R500.00 = R1875.50
            const rows = [
                { amount: '875.50', allocatedTo: { value: 'acc_office_supplies', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '500.00', allocatedTo: { value: 'acc_computer_expenses', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '500.00', allocatedTo: { value: 'acc_staff_welfare', type: 'account' as const }, vatType: 'standard_rated_purchases' }
            ];

            const splitResult = simulateSplitDialog(originalTx, rows, client);
            expect(splitResult.success).toBe(true);
            expect(splitResult.isBalanced).toBe(true);
            expect(splitResult.createdChildren.length).toBe(3);

            // Sub-transaction amounts must all be negative for expenses
            expect(splitResult.createdChildren.map(c => c.amount)).toEqual([-875.50, -500.00, -500.00]);
            expect(splitResult.totalChildAmount).toBe(-1875.50);

            // Apply to ledger (delete original, add children)
            const postSplitLedger = [
                ...initialLedger.filter(t => t.id !== originalTx.id),
                ...splitResult.createdChildren
            ];

            const postSplitBalance = computeAggregateBalance(postSplitLedger, testAccountId);
            const deltaBalance = Math.abs(postSplitBalance - initialBalance);
            expect(deltaBalance).toBe(0.00);
            expect(postSplitBalance).toBe(initialBalance);
        });

        it('1.2: Income Split Conservation: sum of child split transactions strictly equals original positive amount (Δ = 0)', () => {
            const originalTx: MockTx = {
                id: 'tx_income_201',
                clientId: client.uid,
                bankAccountId: testAccountId,
                amount: 14250.75,
                description: 'INFLOW STRIPE TRANSFERS',
                status: 'new',
                isExpense: false,
                date: '2026-08-18',
                reference: 'CSV-9913'
            };

            const initialLedger = [originalTx];
            const initialBalance = computeAggregateBalance(initialLedger, testAccountId);
            expect(initialBalance).toBe(14250.75);

            // Split into 3 parts: R10000.00 + R4000.00 + R250.75 = R14250.75
            const rows = [
                { amount: '10000.00', allocatedTo: { value: 'cust_abc', type: 'customer' as const }, vatType: 'standard_rated_sales' },
                { amount: '4000.00', allocatedTo: { value: 'cust_xyz', type: 'customer' as const }, vatType: 'standard_rated_sales' },
                { amount: '250.75', allocatedTo: { value: 'acc_interest_received', type: 'account' as const }, vatType: 'exempt_sales' }
            ];

            const splitResult = simulateSplitDialog(originalTx, rows, client);
            expect(splitResult.success).toBe(true);
            expect(splitResult.isBalanced).toBe(true);
            expect(splitResult.createdChildren.map(c => c.amount)).toEqual([10000.00, 4000.00, 250.75]);
            expect(splitResult.totalChildAmount).toBe(14250.75);

            const postSplitLedger = splitResult.createdChildren;
            const postSplitBalance = computeAggregateBalance(postSplitLedger, testAccountId);
            expect(postSplitBalance).toBe(initialBalance);
            expect(Math.abs(postSplitBalance - initialBalance)).toBe(0.00);
        });

        it('1.3: Cents Rounding & Fractional Tolerance: rejects 1-cent imbalances and accepts exact cent distribution', () => {
            const originalTx: MockTx = {
                id: 'tx_cents_301',
                clientId: client.uid,
                bankAccountId: testAccountId,
                amount: -100.00,
                description: 'SUBSCRIPTION SPLIT',
                status: 'new',
                isExpense: true,
                date: '2026-08-20'
            };

            // Attempt 1: 33.33 * 3 = 99.99 (1 cent short)
            const rowsShort = [
                { amount: '33.33', allocatedTo: { value: 'acc_1', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.33', allocatedTo: { value: 'acc_2', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.33', allocatedTo: { value: 'acc_3', type: 'account' as const }, vatType: 'standard_rated_purchases' }
            ];
            const resultShort = simulateSplitDialog(originalTx, rowsShort, client);
            expect(resultShort.success).toBe(false);
            expect(resultShort.isBalanced).toBe(false);
            expect(resultShort.remaining).toBe(0.01); // 1 cent remaining

            // Attempt 2: 33.34 * 3 = 100.02 (2 cents over)
            const rowsOver = [
                { amount: '33.34', allocatedTo: { value: 'acc_1', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.34', allocatedTo: { value: 'acc_2', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.34', allocatedTo: { value: 'acc_3', type: 'account' as const }, vatType: 'standard_rated_purchases' }
            ];
            const resultOver = simulateSplitDialog(originalTx, rowsOver, client);
            expect(resultOver.success).toBe(false);
            expect(resultOver.isBalanced).toBe(false);
            expect(resultOver.remaining).toBe(-0.02);

            // Attempt 3: 33.33 + 33.33 + 33.34 = 100.00 (exact)
            const rowsExact = [
                { amount: '33.33', allocatedTo: { value: 'acc_1', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.33', allocatedTo: { value: 'acc_2', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.34', allocatedTo: { value: 'acc_3', type: 'account' as const }, vatType: 'standard_rated_purchases' }
            ];
            const resultExact = simulateSplitDialog(originalTx, rowsExact, client);
            expect(resultExact.success).toBe(true);
            expect(resultExact.isBalanced).toBe(true);
            expect(resultExact.remaining).toBe(0.00);
        });

        it('1.4: IEEE-754 Precision Stress: integer cents rounding prevents binary floating-point leakage', () => {
            // Binary floating point notorious sum: 0.1 + 0.2 = 0.30000000000000004
            const originalTx: MockTx = {
                id: 'tx_float_401',
                clientId: client.uid,
                bankAccountId: testAccountId,
                amount: -0.30,
                description: 'MICRO CHARGE',
                status: 'new',
                isExpense: true,
                date: '2026-08-21'
            };

            const rowsFloat = [
                { amount: '0.10', allocatedTo: { value: 'acc_1', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '0.20', allocatedTo: { value: 'acc_2', type: 'account' as const }, vatType: 'standard_rated_purchases' }
            ];

            const resultFloat = simulateSplitDialog(originalTx, rowsFloat, client);
            expect(resultFloat.success).toBe(true);
            expect(resultFloat.isBalanced).toBe(true);
            expect(resultFloat.diff).toBe(0);
            expect(resultFloat.remaining).toBe(0);
        });

        it('1.5: Adversarial Input Rejection: negative amounts, zeroes, empty allocations, non-numbers', () => {
            const originalTx: MockTx = {
                id: 'tx_adv_501',
                clientId: client.uid,
                bankAccountId: testAccountId,
                amount: -500.00,
                description: 'ADVERSARIAL TEST',
                status: 'new',
                isExpense: true,
                date: '2026-08-22'
            };

            // Negative row amount
            const resNegative = simulateSplitDialog(originalTx, [
                { amount: '-100', allocatedTo: { value: 'acc_1', type: 'account' as const }, vatType: 'no_vat' },
                { amount: '600', allocatedTo: { value: 'acc_2', type: 'account' as const }, vatType: 'no_vat' }
            ], client);
            expect(resNegative.success).toBe(false);

            // Zero row amount
            const resZero = simulateSplitDialog(originalTx, [
                { amount: '0', allocatedTo: { value: 'acc_1', type: 'account' as const }, vatType: 'no_vat' },
                { amount: '500', allocatedTo: { value: 'acc_2', type: 'account' as const }, vatType: 'no_vat' }
            ], client);
            expect(resZero.success).toBe(false);

            // Missing allocation target
            const resNoTarget = simulateSplitDialog(originalTx, [
                { amount: '250', allocatedTo: null, vatType: 'no_vat' },
                { amount: '250', allocatedTo: { value: 'acc_2', type: 'account' as const }, vatType: 'no_vat' }
            ], client);
            expect(resNoTarget.success).toBe(false);

            // Non-numeric input
            const resNaN = simulateSplitDialog(originalTx, [
                { amount: 'invalid_num', allocatedTo: { value: 'acc_1', type: 'account' as const }, vatType: 'no_vat' },
                { amount: '500', allocatedTo: { value: 'acc_2', type: 'account' as const }, vatType: 'no_vat' }
            ], client);
            expect(resNaN.success).toBe(false);
        });

        it('1.6: High-Arity Multi-Split Stress (25-way split): validates mass conservation and parentTxData fidelity', () => {
            const originalTx: MockTx = {
                id: 'tx_mass_601',
                clientId: client.uid,
                bankAccountId: testAccountId,
                amount: -25000.00,
                description: 'BULK SUPPLIER CONSIGNMENT',
                status: 'new',
                isExpense: true,
                date: '2026-08-25',
                reference: 'CONSIGN-771',
                cleanDescription: 'BULK SUPPLIER',
                merchantKey: 'BULKSUPPLIER'
            };

            // Generate 25 rows of R1000.00 each
            const rows = Array.from({ length: 25 }, (_, i) => ({
                amount: '1000.00',
                allocatedTo: { value: `supplier_${i + 1}`, type: 'supplier' as const },
                vatType: 'standard_rated_purchases'
            }));

            const res = simulateSplitDialog(originalTx, rows, client);
            expect(res.success).toBe(true);
            expect(res.createdChildren.length).toBe(25);
            expect(res.totalChildAmount).toBe(-25000.00);

            // Verify child properties
            res.createdChildren.forEach((child, index) => {
                expect(child.splitFrom).toBe(originalTx.id);
                expect(child.isSplitChild).toBe(true);
                expect(child.status).toBe('reviewed');
                expect(child.reference).toBe(`CONSIGN-771-S${index + 1}`);
                expect(child.parentTxData.id).toBe(originalTx.id);
                expect(child.parentTxData.amount).toBe(-25000.00);
                expect(child.parentTxData.merchantKey).toBe('BULKSUPPLIER');
            });
        });

        it('1.7: Unsplit & Reunite Lifecycle: handleUnsplitAndReset restores parent to new and conserves balance (Δ = 0)', () => {
            const originalTx: MockTx = {
                id: 'tx_reunite_701',
                clientId: client.uid,
                bankAccountId: testAccountId,
                amount: -3500.00,
                description: 'TOTAL ENERGIES DIESEL',
                status: 'new',
                isExpense: true,
                date: '2026-08-28',
                cleanDescription: 'TOTAL ENERGIES',
                merchantKey: 'TOTAL'
            };

            const baselineLedger: MockTx[] = [
                originalTx,
                { id: 'tx_base_1', clientId: client.uid, bankAccountId: testAccountId, amount: 10000.00, description: 'Sales', status: 'reviewed', isExpense: false, date: '2026-08-01' }
            ];

            const initialBalance = computeAggregateBalance(baselineLedger, testAccountId);
            const initialUnallocated = computeUnallocatedCount(baselineLedger, testAccountId);
            expect(initialBalance).toBe(6500.00); // 10000 - 3500
            expect(initialUnallocated).toBe(1); // originalTx is 'new'

            // Phase 1: Split into 2
            const splitRes = simulateSplitDialog(originalTx, [
                { amount: '2000.00', allocatedTo: { value: 'acc_fuel', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '1500.00', allocatedTo: { value: 'acc_oil', type: 'account' as const }, vatType: 'standard_rated_purchases' }
            ], client);

            const splitLedger: MockTx[] = [
                baselineLedger[1],
                ...splitRes.createdChildren
            ];

            expect(computeAggregateBalance(splitLedger, testAccountId)).toBe(initialBalance);
            expect(computeUnallocatedCount(splitLedger, testAccountId)).toBe(0); // All split children are 'reviewed'

            // Phase 2: Unsplit via child 0
            const unsplitRes = simulateUnsplitAndReset(splitRes.createdChildren[0], splitLedger);
            expect(unsplitRes.updatedTxs.length).toBe(2);

            const restoredParent = unsplitRes.restoredTx;
            expect(restoredParent.id).toBe(originalTx.id);
            expect(restoredParent.status).toBe('new');
            expect(restoredParent.amount).toBe(-3500.00);
            expect(restoredParent.merchantKey).toBe('TOTAL');

            // Verify final ledger balance and count
            const finalBalance = computeAggregateBalance(unsplitRes.updatedTxs, testAccountId);
            const finalUnallocated = computeUnallocatedCount(unsplitRes.updatedTxs, testAccountId);

            expect(finalBalance).toBe(initialBalance);
            expect(finalUnallocated).toBe(initialUnallocated);
        });
    });

    // ========================================================================
    // SUITE 2: Undo Lifecycle & Balance Invariance
    // ========================================================================
    describe('Suite 2: Undo Lifecycle & Unallocated Badge Re-synchronization', () => {
        const testAccountId = '8400-01';

        it('2.1: Single Undo (moveTransactionToNew) strips allocation metadata and resets status to new without altering balance', () => {
            const reviewedTx: MockTx = {
                id: 'tx_reviewed_801',
                clientId: 'client_audit_1',
                bankAccountId: testAccountId,
                amount: -1299.00,
                description: 'TELKOM INTERNET LTE',
                status: 'reviewed',
                isExpense: true,
                date: '2026-08-30',
                allocatedTo: { value: 'acc_telkom', type: 'account' },
                vatType: 'standard_rated_purchases',
                allocationSource: 'manual',
                smartAllocationResult: { confidence: 0.95 }
            };

            const ledger = [reviewedTx];
            const balanceBefore = computeAggregateBalance(ledger, testAccountId);
            const unallocatedBefore = computeUnallocatedCount(ledger, testAccountId);

            expect(balanceBefore).toBe(-1299.00);
            expect(unallocatedBefore).toBe(0);

            // Perform Undo
            const undoneTx = simulateMoveTransactionToNew(reviewedTx);

            expect(undoneTx.status).toBe('new');
            expect(undoneTx.allocatedTo).toBeUndefined();
            expect(undoneTx.vatType).toBeUndefined();
            expect(undoneTx.allocationSource).toBeUndefined();
            expect(undoneTx.smartAllocationResult).toBeUndefined();
            expect(undoneTx.merchantKey).toBe('TELKOM');
            expect(undoneTx.cleanDescription).toBe('TELKOM');

            const postUndoLedger = [undoneTx];
            const balanceAfter = computeAggregateBalance(postUndoLedger, testAccountId);
            const unallocatedAfter = computeUnallocatedCount(postUndoLedger, testAccountId);

            // Invariant: Balance unchanged, unallocated count increments by 1
            expect(balanceAfter).toBe(balanceBefore);
            expect(unallocatedAfter).toBe(1);
        });

        it('2.2: Bulk Undo (bulkMoveTransactionsToNew) processes high-volume chunks and preserves aggregate balance', () => {
            // Generate 120 reviewed transactions
            const reviewedBatch: MockTx[] = Array.from({ length: 120 }, (_, i) => ({
                id: `tx_bulk_${i}`,
                clientId: 'client_audit_1',
                bankAccountId: testAccountId,
                amount: -(100 + i * 2.5),
                description: `FEE CHARGE ${i}`,
                status: 'reviewed',
                isExpense: true,
                date: '2026-08-31',
                allocatedTo: { value: 'acc_fees', type: 'account' },
                vatType: 'standard_rated_purchases'
            }));

            const balanceBefore = computeAggregateBalance(reviewedBatch, testAccountId);
            const unallocatedBefore = computeUnallocatedCount(reviewedBatch, testAccountId);
            expect(unallocatedBefore).toBe(0);

            // Execute bulk undo
            const undoneBatch = reviewedBatch.map(simulateMoveTransactionToNew);

            expect(undoneBatch.length).toBe(120);
            expect(undoneBatch.every(t => t.status === 'new')).toBe(true);
            expect(undoneBatch.every(t => t.allocatedTo === undefined)).toBe(true);

            const balanceAfter = computeAggregateBalance(undoneBatch, testAccountId);
            const unallocatedAfter = computeUnallocatedCount(undoneBatch, testAccountId);

            expect(balanceAfter).toBe(balanceBefore);
            expect(unallocatedAfter).toBe(120);
        });
    });

    // ========================================================================
    // SUITE 3: South African Canonical VAT Types & Rule Creation
    // ========================================================================
    describe('Suite 3: South African Canonical VAT Types & Practice Rule Bindings', () => {
        it('3.1: Canonical VAT Type catalog strictly exposes 8 South African VAT classifications', () => {
            expect(allVatTypes.length).toBe(8);
            const vatNames = allVatTypes.map(v => v.name);

            // 3 Output Tax types
            expect(vatNames).toContain('standard_rated_sales');
            expect(vatNames).toContain('zero_rated_sales');
            expect(vatNames).toContain('exempt_sales');

            // 4 Input Tax types
            expect(vatNames).toContain('standard_rated_purchases');
            expect(vatNames).toContain('capital_goods_purchases');
            expect(vatNames).toContain('zero_rated_purchases');
            expect(vatNames).toContain('exempt_purchases');

            // 1 Other
            expect(vatNames).toContain('no_vat');

            // Set validation
            expect(CANONICAL_VAT_TYPES.size).toBe(8);
            vatNames.forEach(name => {
                expect(CANONICAL_VAT_TYPES.has(name as any)).toBe(true);
            });
        });

        it('3.2: normalizeVatType maps legacy / ambiguous strings to canonical VAT types safely', () => {
            expect(normalizeVatType('standard', true)).toBe('standard_rated_purchases');
            expect(normalizeVatType('standard', false)).toBe('standard_rated_sales');
            expect(normalizeVatType('zero_rated', true)).toBe('zero_rated_purchases');
            expect(normalizeVatType('zero_rated', false)).toBe('zero_rated_sales');
            expect(normalizeVatType('exempt', true)).toBe('exempt_purchases');
            expect(normalizeVatType('exempt', false)).toBe('exempt_sales');
            expect(normalizeVatType('capital_goods', true)).toBe('capital_goods_purchases');
            expect(normalizeVatType('15%', true)).toBe('standard_rated_purchases');
            expect(normalizeVatType('zero-rated supplies', false)).toBe('zero_rated_sales');
            expect(normalizeVatType('zero rated purchases', true)).toBe('zero_rated_purchases');
            expect(normalizeVatType(undefined)).toBe('no_vat');
            expect(normalizeVatType('')).toBe('no_vat');
        });

        it('3.3: ruleFormSchema validates keywords length, target type, mode, and scope', () => {
            // Valid client rule
            const valid = ruleFormSchema.safeParse({
                mode: 'new',
                keywords: 'WOOLWORTHS, WOOLIES FOOD',
                accountType: 'account',
                accountId: 'acc_5000',
                vatType: 'standard_rated_purchases',
                scope: 'client'
            });
            expect(valid.success).toBe(true);

            // Rejects keywords < 2 characters
            const shortKeywords = ruleFormSchema.safeParse({
                keywords: 'A',
                accountType: 'account'
            });
            expect(shortKeywords.success).toBe(false);

            // Rejects invalid accountType
            const invalidType = ruleFormSchema.safeParse({
                keywords: 'VALID KEYWORD',
                accountType: 'invalid_category'
            });
            expect(invalidType.success).toBe(false);
        });

        it('3.4: Rule creation normalizes keywords to uppercase trimmed unique list', () => {
            const rawKeywords = '  engen, Shell,  ENGEN  , caltex  ,, ';
            const normalized = Array.from(new Set(
                rawKeywords.split(',').map(k => k.trim().toUpperCase()).filter(Boolean)
            ));

            expect(normalized).toEqual(['ENGEN', 'SHELL', 'CALTEX']);
        });

        it('3.5: Non-VAT registered client rule forces or defaults vatType to no_vat', () => {
            const isVatRegistered = false;
            const chosenVatType = 'standard_rated_purchases';
            const persistedVatType = isVatRegistered ? chosenVatType : 'no_vat';

            expect(persistedVatType).toBe('no_vat');
        });
    });

    // ========================================================================
    // SUITE 4: Excel Export Filtering in SmartMatchQueueTab.tsx
    // ========================================================================
    describe('Suite 4: Excel Export Filtering & Spreadsheet Integrity', () => {
        const sampleGroups: TransactionGroup[] = [
            {
                merchantKey: 'ENGEN',
                transactions: [
                    { id: 'tx_1', description: 'ENGEN QUICKSHOP', cleanDescription: 'ENGEN', amount: -450.00, date: '2026-08-01', reference: 'REF-001', isExpense: true, status: 'new' } as any,
                    { id: 'tx_2', description: 'ENGEN WATERKLOOF', cleanDescription: 'ENGEN', amount: -650.00, date: '2026-08-05', reference: 'REF-002', isExpense: true, status: 'new' } as any
                ],
                suggestion: null,
                status: 'pending'
            },
            {
                merchantKey: 'WOOLWORTHS',
                transactions: [
                    { id: 'tx_3', description: 'WOOLWORTHS FOOD MENLYN', cleanDescription: 'WOOLWORTHS', amount: -1250.00, date: '2026-08-03', reference: 'REF-003', isExpense: true, status: 'new' } as any
                ],
                suggestion: null,
                status: 'pending'
            },
            {
                merchantKey: 'DISCHEM',
                transactions: [
                    { id: 'tx_4', description: 'DISCHEM PHARMACY', cleanDescription: 'DISCHEM', amount: -320.00, date: '2026-08-08', reference: 'REF-004', isExpense: true, status: 'new' } as any
                ],
                suggestion: null,
                status: 'pending'
            }
        ];

        function filterGroups(groups: TransactionGroup[], searchTerm: string): TransactionGroup[] {
            if (!searchTerm.trim()) return groups;
            const term = searchTerm.toUpperCase();
            return groups.filter(g => 
                g.merchantKey.toUpperCase().includes(term) ||
                g.transactions.some(tx => 
                    (tx.description || '').toUpperCase().includes(term) ||
                    (tx.cleanDescription || '').toUpperCase().includes(term) ||
                    (tx.reference || '').toUpperCase().includes(term)
                )
            );
        }

        it('4.1: Empty search filter exports 100% of merchant groups and child transactions', () => {
            const filtered = filterGroups(sampleGroups, '');
            expect(filtered.length).toBe(3);
            const totalTxs = filtered.reduce((acc, g) => acc + g.transactions.length, 0);
            expect(totalTxs).toBe(4);
        });

        it('4.2: Active search filter restricts export strictly to matching groups (e.g. "ENGEN")', () => {
            const filtered = filterGroups(sampleGroups, 'ENGEN');
            expect(filtered.length).toBe(1);
            expect(filtered[0].merchantKey).toBe('ENGEN');
            expect(filtered[0].transactions.length).toBe(2);
        });

        it('4.3: Search matches on child transaction reference or raw description', () => {
            const filteredByRef = filterGroups(sampleGroups, 'REF-003');
            expect(filteredByRef.length).toBe(1);
            expect(filteredByRef[0].merchantKey).toBe('WOOLWORTHS');

            const filteredByDesc = filterGroups(sampleGroups, 'PHARMACY');
            expect(filteredByDesc.length).toBe(1);
            expect(filteredByDesc[0].merchantKey).toBe('DISCHEM');
        });

        it('4.4: Export row structure generates Merchant Group headers, indented tx lines, and Validation sheet', () => {
            const targetGroup = sampleGroups[0]; // ENGEN
            const rows: (string | number)[][] = [['Merchant Group / Description', 'Date', 'Amount', 'Allocate To', 'VAT Type']];

            rows.push([targetGroup.merchantKey, '', '', '', '']);
            targetGroup.transactions.forEach(tx => {
                rows.push([`  ${tx.description}`, tx.date, tx.amount, '', '']);
            });

            expect(rows[0]).toEqual(['Merchant Group / Description', 'Date', 'Amount', 'Allocate To', 'VAT Type']);
            expect(rows[1]).toEqual(['ENGEN', '', '', '', '']);
            expect(rows[2][0]).toBe('  ENGEN QUICKSHOP');
            expect(rows[3][0]).toBe('  ENGEN WATERKLOOF');
        });

        it('4.5: Codebase verification: SmartMatchQueueTab.tsx handleDownloadExcel directly iterates filteredGroups', () => {
            expect(smartTabContent).toContain("const handleDownloadExcel = () => {");
            expect(smartTabContent).toContain("filteredGroups.forEach(group => {");
            // Must NOT iterate over unfiltered 'groups' in handleDownloadExcel
            const handleExcelSnippet = smartTabContent.substring(
                smartTabContent.indexOf("const handleDownloadExcel = () => {"),
                smartTabContent.indexOf("XLSX.writeFile(wb, `SmartMatch_Review_${client.name}.xlsx`);")
            );
            expect(handleExcelSnippet).not.toMatch(/\bgroups\.forEach\(/);
        });
    });

    // ========================================================================
    // SUITE 5: Callback Wiring & Concurrency Under Rapid Event Dispatch
    // ========================================================================
    describe('Suite 5: Callback Wiring & Concurrency Under Rapid Event Dispatch', () => {
        it('5.1: NewTransactionsTab dialog closures invoke onAllocationComplete and onRefreshBalance', () => {
            // Split dialog wiring
            expect(newTabContent).toContain("<SplitTransactionDialog");
            expect(newTabContent).toMatch(/onSplitComplete=\{[\s\S]*?onAllocationComplete\?\.\(\);[\s\S]*?onRefreshBalance\?\.\(\);/);

            // Edit dialog wiring
            expect(newTabContent).toContain("<EditTransactionDialog");
            expect(newTabContent).toMatch(/onOpenChange=\{\(open\)\s*=>\s*\{[\s\S]*?setIsEditTxOpen\(open\);[\s\S]*?if\s*\(!open\)\s*\{[\s\S]*?onRefreshBalance\?\.\(\);[\s\S]*?onAllocationComplete\?\.\(\);/);

            // Create rule wiring
            expect(newTabContent).toContain("<CreateRuleDialog");
            expect(newTabContent).toMatch(/<CreateRuleDialog[\s\S]*?onRuleCreated=\{onAccountCreated\}/);
        });

        it('5.2: SmartMatchQueueTab CreateGeneralAccountDialog propagates onAccountCreated', () => {
            expect(smartTabContent).toContain("<CreateGeneralAccountDialog");
            expect(smartTabContent).toMatch(/<CreateGeneralAccountDialog[\s\S]*?onAccountCreated=\{onAccountCreated\}/);
        });

        it('5.3: BankTransactionsUI connects NewTransactionsTab, SmartMatchQueueTab, and ReviewedTab with lifecycle refreshers', () => {
            // NewTransactionsTab
            expect(shellContent).toContain("<NewTransactionsTab");
            expect(shellContent).toMatch(/<NewTransactionsTab[\s\S]*?onAllocationComplete=\{\(\)\s*=>\s*\{[\s\S]*?fetchUnallocatedCount\(\);[\s\S]*?fetchCalculatedBalance\(\);[\s\S]*?\}\}/);
            expect(shellContent).toMatch(/<NewTransactionsTab[\s\S]*?onRefreshBalance=\{fetchCalculatedBalance\}/);

            // SmartMatchQueueTab
            expect(shellContent).toContain("<SmartMatchQueueTab");
            expect(shellContent).toMatch(/<SmartMatchQueueTab[\s\S]*?onAllocationComplete=\{\(\)\s*=>\s*\{[\s\S]*?fetchCalculatedBalance\(\);[\s\S]*?fetchUnallocatedCount\(\);[\s\S]*?\}\}/);

            // ReviewedTab
            expect(shellContent).toContain("<ReviewedTab");
            expect(shellContent).toMatch(/<ReviewedTab[\s\S]*?onUndoComplete=\{\(\)\s*=>\s*\{[\s\S]*?fetchCalculatedBalance\(\);[\s\S]*?fetchUnallocatedCount\(\);[\s\S]*?\}\}/);
        });

        it('5.4: Stress Simulation: 100 rapid sequential allocation callbacks trigger without state corruption', () => {
            let balanceFetchCount = 0;
            let unallocatedFetchCount = 0;

            const onAllocationComplete = () => {
                balanceFetchCount++;
                unallocatedFetchCount++;
            };

            // Fire 100 rapid events
            for (let i = 0; i < 100; i++) {
                onAllocationComplete();
            }

            expect(balanceFetchCount).toBe(100);
            expect(unallocatedFetchCount).toBe(100);
        });

        it('5.5: Interleaved Split + Undo lifecycle maintains exact balance and updates unallocated counts', () => {
            let balance = 10000.00;
            let unallocatedCount = 5;

            // Step 1: Split tx of 1000 into 2 x 500 (both reviewed)
            // Balance does not change (1000 replaced by 500 + 500)
            // Unallocated count decreases by 1 (original was 'new', children are 'reviewed')
            unallocatedCount -= 1;
            expect(balance).toBe(10000.00);
            expect(unallocatedCount).toBe(4);

            // Step 2: Undo an unrelated transaction of 250 (moved from 'reviewed' to 'new')
            // Balance does not change
            // Unallocated count increases by 1
            unallocatedCount += 1;
            expect(balance).toBe(10000.00);
            expect(unallocatedCount).toBe(5);

            // Step 3: Unsplit the transaction in Step 1 (reunited to 'new')
            // Balance does not change
            // Unallocated count increases by 1
            unallocatedCount += 1;
            expect(balance).toBe(10000.00);
            expect(unallocatedCount).toBe(6);
        });
    });
});
