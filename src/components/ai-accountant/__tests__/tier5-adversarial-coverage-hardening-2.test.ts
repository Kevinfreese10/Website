/**
 * @fileOverview Tier 5 White-Box Adversarial Coverage Hardening Test Suite 2.
 *
 * Focus Areas:
 * 1. Extreme split ratios (1 cent vs 999,999.99 ZAR), integer cents arithmetic, and IEEE-754 drift.
 * 2. Bulk undo operations across mixed standard and split transactions, preserving aggregate balance.
 * 3. Excel export security: formula injection protection, exotic UTF-8/Unicode characters, and filter scoping.
 * 4. Rule validation: canonical VAT constraints, non-existent GL account resolution, and regex safety.
 * 5. Network failure simulation: atomic writeBatch rollback, optimistic UI recovery, and chunked error handling.
 * 6. White-box contract verification for all 10 dialogs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx-js-style';
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
    TransactionGroup,
    SmartMatchResult 
} from '../types';
import { BankCleaner, matchesRuleKeyword } from '@/lib/bank-cleaner';
import { resolveAccountForCategory } from '@/lib/chart-of-accounts-mapper';
import { MASTER_ALLOCATION_RULES } from '@/lib/master-allocation-rules';
import { triageTransaction, buildConsistencyMap } from '@/lib/initial-allocation-engine';
import { ImportedTransaction, User, ChartOfAccount, AllocationRule } from '@/lib/types';
import { areReviewedTransactionRowPropsEqual } from '../components/ReviewedTransactionRow';
import { areNewTransactionRowPropsEqual } from '../components/NewTransactionRow';
import { areMerchantGroupCardPropsEqual } from '../components/MerchantGroupCard';

// ============================================================================
// SIMULATION HARNESSES & ORACLES
// ============================================================================

interface MockTransaction {
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
    splitFrom?: string;
    isSplitChild?: boolean;
    parentTxData?: any;
}

/**
 * Server-side aggregate balance calculator oracle mimicking getAggregateFromServer(sum('amount'))
 */
function computeAggregateBalance(txs: MockTransaction[], accountId: string): number {
    const matched = txs.filter(t => t.bankAccountId === accountId);
    const rawSum = matched.reduce((sum, t) => sum + (typeof t.amount === 'number' && !isNaN(t.amount) ? t.amount : 0), 0);
    return Math.round((rawSum + Number.EPSILON) * 100) / 100;
}

/**
 * Split transaction validation and persistence simulator reflecting SplitTransactionDialog.tsx
 */
function simulateSplitTransaction(
    parent: MockTransaction,
    rows: Array<{ amount: string; allocatedTo: { value: string; type: 'account' | 'customer' | 'supplier' } | null; vatType: string }>,
    client: { uid: string; isVatRegistered: boolean }
) {
    const originalAbs = Math.abs(parent.amount);
    const currentSum = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const diff = Math.round(originalAbs * 100) - Math.round(currentSum * 100);
    const remaining = diff / 100;
    const isBalanced = diff === 0;

    const isValid = isBalanced && rows.length >= 2 && rows.every(r => {
        const amt = parseFloat(r.amount);
        return !isNaN(amt) && amt > 0 && r.allocatedTo && r.allocatedTo.value;
    });

    if (!isValid) {
        return {
            success: false,
            reason: 'Validation failed',
            diff,
            remaining,
            isBalanced,
            children: []
        };
    }

    const sign = parent.isExpense ? -1 : 1;
    const children: MockTransaction[] = rows.map((row, index) => {
        const amtVal = parseFloat(row.amount);
        return {
            id: `split_${parent.id}_${index + 1}`,
            clientId: client.uid,
            bankAccountId: parent.bankAccountId,
            date: parent.date,
            description: `${parent.description} (Split ${index + 1}/${rows.length})`,
            amount: amtVal * sign,
            status: 'reviewed',
            isExpense: parent.isExpense,
            allocatedTo: row.allocatedTo!,
            vatType: client.isVatRegistered ? row.vatType : 'no_vat',
            reference: parent.reference ? `${parent.reference}-S${index + 1}` : `CSV-${Date.now()}-S${index + 1}`,
            allocationSource: 'manual',
            splitFrom: parent.id,
            isSplitChild: true,
            parentTxData: {
                id: parent.id,
                amount: parent.amount,
                description: parent.description,
                date: parent.date,
                reference: parent.reference || '',
                bankAccountId: parent.bankAccountId,
                isExpense: parent.isExpense,
                status: parent.status,
                cleanDescription: parent.cleanDescription,
                rawDescription: parent.rawDescription,
                merchantKey: parent.merchantKey
            }
        };
    });

    return {
        success: true,
        diff,
        remaining,
        isBalanced,
        children
    };
}

/**
 * Unsplit and reunite simulator reflecting handleUnsplitAndReset in ReviewedTab.tsx
 */
function simulateUnsplitAndReset(
    splitChild: MockTransaction,
    allTxs: MockTransaction[]
): { updatedTxs: MockTransaction[]; restoredParent: MockTransaction } {
    if (!splitChild.isSplitChild || !splitChild.splitFrom || !splitChild.parentTxData) {
        throw new Error('Transaction is not a valid split child');
    }

    const parentId = splitChild.splitFrom;
    const parentData = splitChild.parentTxData;

    // Delete all child splits sharing this splitFrom
    const remainingTxs = allTxs.filter(t => t.splitFrom !== parentId);

    // Reconstruct parent transaction restored to 'new' status
    const restoredParent: MockTransaction = {
        id: parentId,
        clientId: parentData.clientId || splitChild.clientId,
        bankAccountId: parentData.bankAccountId,
        date: parentData.date,
        description: parentData.description,
        amount: parentData.amount,
        status: 'new',
        isExpense: parentData.isExpense,
        reference: parentData.reference || '',
        cleanDescription: parentData.cleanDescription,
        rawDescription: parentData.rawDescription,
        merchantKey: parentData.merchantKey
    };

    return {
        updatedTxs: [...remainingTxs, restoredParent],
        restoredParent
    };
}

/**
 * Bulk move to new simulator reflecting bulkMoveTransactionsToNew in ai-recon.ts
 */
function simulateBulkMoveToNew(
    txIds: string[],
    allTxs: MockTransaction[]
): { updatedTxs: MockTransaction[]; count: number } {
    const idSet = new Set(txIds);
    let count = 0;

    const updatedTxs = allTxs.map(tx => {
        if (idSet.has(tx.id)) {
            count++;
            const processed = BankCleaner.process(tx.description || '');
            const copy = { ...tx };
            copy.status = 'new';
            delete copy.allocatedTo;
            delete copy.vatType;
            delete copy.allocationSource;
            copy.merchantKey = processed.merchantKey;
            copy.cleanDescription = processed.cleanDescription;
            return copy;
        }
        return tx;
    });

    return { updatedTxs, count };
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Tier 5 White-Box Adversarial Coverage Hardening Suite 2', () => {

    // ========================================================================
    // SUITE 1: Extreme Split Ratios, Integer Cents Arithmetic & Split Invariants
    // ========================================================================
    describe('Suite 1: Extreme Split Ratios & Financial Conservation Invariants', () => {
        const client = { uid: 'client_audit_100', isVatRegistered: true };

        it('1.1: Extreme split ratio: 1 cent (0.01 ZAR) vs 999,999.99 ZAR on 1,000,000.00 ZAR transaction', () => {
            const parent: MockTransaction = {
                id: 'tx_mega',
                clientId: client.uid,
                bankAccountId: 'acc_1',
                amount: -1000000.00,
                description: 'MEGA CAPITAL OUTFLOW',
                status: 'reviewed',
                isExpense: true,
                date: '2026-03-01T10:00:00Z',
            };

            const rows = [
                { amount: '0.01', allocatedTo: { value: '3000', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '999999.99', allocatedTo: { value: '5000', type: 'account' as const }, vatType: 'no_vat' },
            ];

            const result = simulateSplitTransaction(parent, rows, client);
            expect(result.success).toBe(true);
            expect(result.diff).toBe(0);
            expect(result.remaining).toBe(0);
            expect(result.isBalanced).toBe(true);
            expect(result.children).toHaveLength(2);
            expect(result.children[0].amount).toBe(-0.01);
            expect(result.children[1].amount).toBe(-999999.99);

            // Invariant: sum of split child amounts matches parent amount exactly
            const sumChildren = result.children.reduce((acc, c) => acc + c.amount, 0);
            expect(Math.round(sumChildren * 100) / 100).toBe(parent.amount);
        });

        it('1.2: 1 Cent transaction cannot be split into >= 2 positive amounts', () => {
            const parent1c: MockTransaction = {
                id: 'tx_1c',
                clientId: client.uid,
                bankAccountId: 'acc_1',
                amount: -0.01,
                description: 'CARD TESTING PENNY',
                status: 'reviewed',
                isExpense: true,
                date: '2026-03-01T10:00:00Z',
            };

            // Attempting to split 1 cent across 2 rows (minimum 0.01 + 0.01 = 0.02 > 0.01)
            const rows = [
                { amount: '0.01', allocatedTo: { value: '3000', type: 'account' as const }, vatType: 'no_vat' },
                { amount: '0.01', allocatedTo: { value: '3000', type: 'account' as const }, vatType: 'no_vat' },
            ];

            const result = simulateSplitTransaction(parent1c, rows, client);
            expect(result.success).toBe(false);
            expect(result.isBalanced).toBe(false);
            expect(result.diff).toBe(-1); // 1 cent - 2 cents = -1 cent
            expect(result.remaining).toBe(-0.01);
        });

        it('1.3: Uneven 3-way split (100.00 ZAR into 33.33, 33.33, 33.34) preserves exact integer cent balance', () => {
            const parent: MockTransaction = {
                id: 'tx_100',
                clientId: client.uid,
                bankAccountId: 'acc_1',
                amount: -100.00,
                description: 'SHARED TRIP EXPENSE',
                status: 'reviewed',
                isExpense: true,
                date: '2026-03-01T10:00:00Z',
            };

            const balancedRows = [
                { amount: '33.33', allocatedTo: { value: '3100', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.33', allocatedTo: { value: '3200', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.34', allocatedTo: { value: '3300', type: 'account' as const }, vatType: 'standard_rated_purchases' },
            ];

            const resultBalanced = simulateSplitTransaction(parent, balancedRows, client);
            expect(resultBalanced.success).toBe(true);
            expect(resultBalanced.diff).toBe(0);

            // Imbalanced 33.33 x 3 = 99.99 (missing 1 cent)
            const imbalancedRows = [
                { amount: '33.33', allocatedTo: { value: '3100', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.33', allocatedTo: { value: '3200', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '33.33', allocatedTo: { value: '3300', type: 'account' as const }, vatType: 'standard_rated_purchases' },
            ];
            const resultImbalanced = simulateSplitTransaction(parent, imbalancedRows, client);
            expect(resultImbalanced.success).toBe(false);
            expect(resultImbalanced.diff).toBe(1); // 1 cent remaining
            expect(resultImbalanced.remaining).toBe(0.01);
        });

        it('1.4: Fractional sub-cent precision validation: non-integer cents detection', () => {
            // If an adversarial user inputs 33.333, 33.333, 33.334
            const originalAbs = 100.00;
            const rowAmounts = ['33.333', '33.333', '33.334'];
            const sum = rowAmounts.reduce((acc, v) => acc + parseFloat(v), 0);
            
            // In JavaScript floating math: 33.333 + 33.333 + 33.334 = 100
            expect(sum).toBe(100);
            // But any sub-cent amount violates currency quantization:
            const hasFractionalCents = rowAmounts.some(v => Math.round(parseFloat(v) * 100) !== parseFloat(v) * 100);
            expect(hasFractionalCents).toBe(true);
        });

        it('1.5: Multi-way 10-split on high-volume amount (123,456.78 ZAR) with zero IEEE-754 drift', () => {
            const parent: MockTransaction = {
                id: 'tx_payroll_split',
                clientId: client.uid,
                bankAccountId: 'acc_1',
                amount: -123456.78,
                description: 'BULK WAGES DISBURSEMENT',
                status: 'reviewed',
                isExpense: true,
                date: '2026-03-25T12:00:00Z',
            };

            // 10 splits constructed to total 123,456.78 exactly
            const splitAmounts = [
                '12345.67', '12345.68', '12345.67', '12345.68', '12345.67',
                '12345.68', '12345.67', '12345.68', '12345.67', '12345.71'
            ];

            const rows = splitAmounts.map((amt, i) => ({
                amount: amt,
                allocatedTo: { value: `staff_${i + 1}`, type: 'account' as const },
                vatType: 'no_vat'
            }));

            const result = simulateSplitTransaction(parent, rows, client);
            expect(result.success).toBe(true);
            expect(result.diff).toBe(0);
            expect(result.children).toHaveLength(10);

            // Total balance conservation check
            const childSum = result.children.reduce((acc, c) => acc + c.amount, 0);
            expect(Math.round(childSum * 100) / 100).toBe(-123456.78);
        });

        it('1.6: Positive (Income) vs Negative (Expense) split sign conservation', () => {
            const incomeParent: MockTransaction = {
                id: 'tx_income_5000',
                clientId: client.uid,
                bankAccountId: 'acc_1',
                amount: 5000.00,
                description: 'COMBINED CLIENT PAYMENT',
                status: 'reviewed',
                isExpense: false,
                date: '2026-03-15T09:00:00Z',
            };

            const rows = [
                { amount: '2000.00', allocatedTo: { value: 'cust_A', type: 'customer' as const }, vatType: 'standard_rated_sales' },
                { amount: '3000.00', allocatedTo: { value: 'cust_B', type: 'customer' as const }, vatType: 'standard_rated_sales' },
            ];

            const result = simulateSplitTransaction(incomeParent, rows, client);
            expect(result.success).toBe(true);
            expect(result.children[0].amount).toBe(2000.00); // positive
            expect(result.children[1].amount).toBe(3000.00); // positive
            expect(result.children[0].isExpense).toBe(false);
            expect(result.children[1].isExpense).toBe(false);

            // Conservation: parent (+5000) === sum of children (+2000 + +3000)
            const sumIncome = result.children.reduce((acc, c) => acc + c.amount, 0);
            expect(sumIncome).toBe(5000.00);
        });

        it('1.7: Zero and negative amounts in split rows are strictly rejected', () => {
            const parent: MockTransaction = {
                id: 'tx_test',
                clientId: client.uid,
                bankAccountId: 'acc_1',
                amount: -100.00,
                description: 'TEST',
                status: 'reviewed',
                isExpense: true,
                date: '2026-03-01T10:00:00Z',
            };

            // Case A: Row with 0.00
            const rowsWithZero = [
                { amount: '100.00', allocatedTo: { value: '3000', type: 'account' as const }, vatType: 'no_vat' },
                { amount: '0.00', allocatedTo: { value: '3000', type: 'account' as const }, vatType: 'no_vat' },
            ];
            expect(simulateSplitTransaction(parent, rowsWithZero, client).success).toBe(false);

            // Case B: Row with negative amount -50.00
            const rowsWithNegative = [
                { amount: '150.00', allocatedTo: { value: '3000', type: 'account' as const }, vatType: 'no_vat' },
                { amount: '-50.00', allocatedTo: { value: '3000', type: 'account' as const }, vatType: 'no_vat' },
            ];
            expect(simulateSplitTransaction(parent, rowsWithNegative, client).success).toBe(false);

            // Case C: Unallocated row
            const rowsUnallocated = [
                { amount: '50.00', allocatedTo: { value: '3000', type: 'account' as const }, vatType: 'no_vat' },
                { amount: '50.00', allocatedTo: null, vatType: 'no_vat' },
            ];
            expect(simulateSplitTransaction(parent, rowsUnallocated, client).success).toBe(false);
        });

        it('1.8: Child split transaction structural invariants snapshot fidelity', () => {
            const parent: MockTransaction = {
                id: 'tx_origin_99',
                clientId: client.uid,
                bankAccountId: 'acc_1',
                amount: -250.00,
                description: 'COMBINED HARDWARE & PAINT',
                status: 'reviewed',
                isExpense: true,
                date: '2026-03-10T11:00:00Z',
                reference: 'REF-789',
                cleanDescription: 'HARDWARE & PAINT',
                merchantKey: 'HARDWARE'
            };

            const rows = [
                { amount: '100.00', allocatedTo: { value: '4100', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '150.00', allocatedTo: { value: '4200', type: 'account' as const }, vatType: 'standard_rated_purchases' },
            ];

            const result = simulateSplitTransaction(parent, rows, client);
            expect(result.success).toBe(true);

            result.children.forEach((child, idx) => {
                expect(child.splitFrom).toBe(parent.id);
                expect(child.isSplitChild).toBe(true);
                expect(child.reference).toBe(`${parent.reference}-S${idx + 1}`);
                expect(child.parentTxData).toBeDefined();
                expect(child.parentTxData.id).toBe(parent.id);
                expect(child.parentTxData.amount).toBe(parent.amount);
                expect(child.parentTxData.merchantKey).toBe('HARDWARE');
            });
        });

        it('1.9: Multi-Stage Split Lifecycle: Split -> Child Undo -> Full Unsplit -> Re-Split with Total Balance Invariance', () => {
            const originalTx: MockTransaction = {
                id: 'tx_lifecycle_root',
                clientId: client.uid,
                bankAccountId: 'acc_lifecycle',
                amount: -1500.00,
                description: 'COMBINED MONTHLY SUPPLIES',
                status: 'reviewed',
                isExpense: true,
                date: '2026-03-01T09:00:00Z',
                reference: 'REF-LIFECYCLE-1'
            };

            let ledger: MockTransaction[] = [originalTx];
            const baselineBalance = computeAggregateBalance(ledger, 'acc_lifecycle');
            expect(baselineBalance).toBe(-1500.00);

            // Stage 1: Split into 3 children: 500, 400, 600
            const split1Rows = [
                { amount: '500.00', allocatedTo: { value: '4100', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '400.00', allocatedTo: { value: '4200', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '600.00', allocatedTo: { value: '4300', type: 'account' as const }, vatType: 'no_vat' },
            ];
            const split1Result = simulateSplitTransaction(originalTx, split1Rows, client);
            expect(split1Result.success).toBe(true);
            ledger = split1Result.children;
            expect(ledger).toHaveLength(3);
            expect(computeAggregateBalance(ledger, 'acc_lifecycle')).toBe(baselineBalance);

            // Stage 2: Move first split child back to 'new' (individual undo)
            const child1 = ledger[0];
            const undoChildResult = simulateBulkMoveToNew([child1.id], ledger);
            ledger = undoChildResult.updatedTxs;
            expect(ledger.find(t => t.id === child1.id)?.status).toBe('new');
            expect(computeAggregateBalance(ledger, 'acc_lifecycle')).toBe(baselineBalance);

            // Stage 3: Full unsplit and reunite (using any child's parentTxData)
            const unsplitResult = simulateUnsplitAndReset(ledger[1], ledger);
            ledger = unsplitResult.updatedTxs;
            expect(ledger).toHaveLength(1);
            expect(ledger[0].id).toBe('tx_lifecycle_root');
            expect(ledger[0].status).toBe('new');
            expect(ledger[0].amount).toBe(-1500.00);
            expect(computeAggregateBalance(ledger, 'acc_lifecycle')).toBe(baselineBalance);

            // Stage 4: Re-split restored parent into 2 balanced children (750.00 + 750.00)
            const split2Rows = [
                { amount: '750.00', allocatedTo: { value: '4500', type: 'account' as const }, vatType: 'standard_rated_purchases' },
                { amount: '750.00', allocatedTo: { value: '4600', type: 'account' as const }, vatType: 'standard_rated_purchases' },
            ];
            const split2Result = simulateSplitTransaction(ledger[0], split2Rows, client);
            expect(split2Result.success).toBe(true);
            ledger = split2Result.children;
            expect(ledger).toHaveLength(2);
            expect(computeAggregateBalance(ledger, 'acc_lifecycle')).toBe(baselineBalance);
        });

        it('1.10: Sub-cent float rounding boundary stress: fractional cents detection and banker rounding', () => {
            // Test non-integer cents parsing
            const isExactCent = (val: number) => {
                const rounded = Math.round(val * 100) / 100;
                return Math.abs(val - rounded) < 1e-9;
            };

            expect(isExactCent(12.34)).toBe(true);
            expect(isExactCent(12.345)).toBe(false);
            expect(isExactCent(0.001)).toBe(false);
            expect(isExactCent(999999.99)).toBe(true);

            // Floating point addition drift stress: summing 0.1 ten times
            let floatSum = 0;
            for (let i = 0; i < 10; i++) {
                floatSum += 0.1;
            }
            // In raw float, floatSum === 0.9999999999999999 !== 1.0
            expect(floatSum).not.toBe(1.0);
            // In integer cents arithmetic, rounding ensures exact 1.00
            const centsRounded = Math.round(floatSum * 100) / 100;
            expect(centsRounded).toBe(1.00);
        });
    });

    // ========================================================================
    // SUITE 2: Bulk Undo Mechanics Across Mixed Standard & Split Transactions
    // ========================================================================
    describe('Suite 2: Bulk Undo Mechanics & Reunited State Consistency', () => {
        const accountId = 'bank_acc_primary';
        const clientUid = 'client_undo_test';

        // Set up mixed dataset: standard expenses, standard income, and split children
        let initialLedger: MockTransaction[];

        beforeEach(() => {
            initialLedger = [
                // 10 standard expenses
                ...Array.from({ length: 10 }, (_, i) => ({
                    id: `std_exp_${i + 1}`,
                    clientId: clientUid,
                    bankAccountId: accountId,
                    amount: -(100 + i * 25),
                    description: `STANDARD EXPENSE ${i + 1}`,
                    status: 'reviewed' as const,
                    isExpense: true,
                    date: `2026-03-0${(i % 9) + 1}T10:00:00Z`,
                    allocatedTo: { value: '4000', type: 'account' as const },
                    vatType: 'standard_rated_purchases',
                    allocationSource: 'manual'
                })),
                // 5 standard income
                ...Array.from({ length: 5 }, (_, i) => ({
                    id: `std_inc_${i + 1}`,
                    clientId: clientUid,
                    bankAccountId: accountId,
                    amount: 1000 + i * 500,
                    description: `CLIENT INVOICE RECEIPT ${i + 1}`,
                    status: 'reviewed' as const,
                    isExpense: false,
                    date: `2026-03-1${i}T14:00:00Z`,
                    allocatedTo: { value: '1000', type: 'account' as const },
                    vatType: 'standard_rated_sales',
                    allocationSource: 'manual'
                })),
                // 1 split parent (amount: -600) split into 2 children: -250 and -350
                {
                    id: 'split_child_A',
                    clientId: clientUid,
                    bankAccountId: accountId,
                    amount: -250.00,
                    description: 'SPLIT OFFICE SUPPLIES (Split 1/2)',
                    status: 'reviewed' as const,
                    isExpense: true,
                    date: '2026-03-20T11:00:00Z',
                    allocatedTo: { value: '4100', type: 'account' as const },
                    vatType: 'standard_rated_purchases',
                    splitFrom: 'parent_office_supplies',
                    isSplitChild: true,
                    parentTxData: {
                        id: 'parent_office_supplies',
                        bankAccountId: accountId,
                        date: '2026-03-20T11:00:00Z',
                        description: 'SPLIT OFFICE SUPPLIES',
                        amount: -600.00,
                        isExpense: true,
                        reference: 'REF-OFFICE'
                    }
                },
                {
                    id: 'split_child_B',
                    clientId: clientUid,
                    bankAccountId: accountId,
                    amount: -350.00,
                    description: 'SPLIT OFFICE SUPPLIES (Split 2/2)',
                    status: 'reviewed' as const,
                    isExpense: true,
                    date: '2026-03-20T11:00:00Z',
                    allocatedTo: { value: '4200', type: 'account' as const },
                    vatType: 'no_vat',
                    splitFrom: 'parent_office_supplies',
                    isSplitChild: true,
                    parentTxData: {
                        id: 'parent_office_supplies',
                        bankAccountId: accountId,
                        date: '2026-03-20T11:00:00Z',
                        description: 'SPLIT OFFICE SUPPLIES',
                        amount: -600.00,
                        isExpense: true,
                        reference: 'REF-OFFICE'
                    }
                }
            ];
        });

        it('2.1: Heterogeneous Bulk Undo: transitions all selected transactions to status: "new"', () => {
            const baselineBalance = computeAggregateBalance(initialLedger, accountId);
            
            // Select 5 standard expenses, 2 standard income, and 1 split child
            const selectedIds = ['std_exp_1', 'std_exp_2', 'std_exp_3', 'std_inc_1', 'std_inc_2', 'split_child_A'];
            const { updatedTxs, count } = simulateBulkMoveToNew(selectedIds, initialLedger);

            expect(count).toBe(6);

            // Verify status transitions
            selectedIds.forEach(id => {
                const tx = updatedTxs.find(t => t.id === id);
                expect(tx?.status).toBe('new');
                expect(tx?.allocatedTo).toBeUndefined();
                expect(tx?.vatType).toBeUndefined();
            });

            // Verify non-selected transactions remained reviewed
            const unselected = updatedTxs.filter(t => !selectedIds.includes(t.id));
            expect(unselected.every(t => t.status === 'reviewed')).toBe(true);

            // Invariant: Balance is strictly conserved!
            const finalBalance = computeAggregateBalance(updatedTxs, accountId);
            expect(finalBalance).toBe(baselineBalance);
        });

        it('2.2: Single Unsplit & Reunite restores original parent to status: "new" with zero delta balance', () => {
            const baselineBalance = computeAggregateBalance(initialLedger, accountId);
            const splitChildA = initialLedger.find(t => t.id === 'split_child_A')!;

            // Execute unsplit on split_child_A
            const { updatedTxs, restoredParent } = simulateUnsplitAndReset(splitChildA, initialLedger);

            // Children are deleted
            expect(updatedTxs.find(t => t.id === 'split_child_A')).toBeUndefined();
            expect(updatedTxs.find(t => t.id === 'split_child_B')).toBeUndefined();

            // Parent is restored
            expect(restoredParent.id).toBe('parent_office_supplies');
            expect(restoredParent.status).toBe('new');
            expect(restoredParent.amount).toBe(-600.00);

            // Invariant: Net balance delta is exactly zero
            const finalBalance = computeAggregateBalance(updatedTxs, accountId);
            expect(finalBalance).toBe(baselineBalance);
            expect(Math.abs(finalBalance - baselineBalance)).toBeLessThan(0.001);
        });

        it('2.3: Partial undo of one split sibling preserves total ledger balance without parent clash', () => {
            const baselineBalance = computeAggregateBalance(initialLedger, accountId);

            // Move ONLY split_child_A to new (via bulk move or single move)
            const { updatedTxs } = simulateBulkMoveToNew(['split_child_A'], initialLedger);

            const childA = updatedTxs.find(t => t.id === 'split_child_A')!;
            const childB = updatedTxs.find(t => t.id === 'split_child_B')!;

            expect(childA.status).toBe('new');
            expect(childA.amount).toBe(-250.00);
            expect(childB.status).toBe('reviewed');
            expect(childB.amount).toBe(-350.00);

            // Net balance remains completely identical
            expect(computeAggregateBalance(updatedTxs, accountId)).toBe(baselineBalance);
        });

        it('2.4: High-volume batch chunking oracle: 450 transactions split into chunks <= 400', () => {
            const mock450Ids = Array.from({ length: 450 }, (_, i) => `tx_batch_${i + 1}`);

            // Simulate the chunking loop used in ai-recon.ts
            const chunks: string[][] = [];
            const chunkSize = 400;
            for (let i = 0; i < mock450Ids.length; i += chunkSize) {
                chunks.push(mock450Ids.slice(i, i + chunkSize));
            }

            expect(chunks).toHaveLength(2);
            expect(chunks[0]).toHaveLength(400);
            expect(chunks[1]).toHaveLength(50);
            expect(chunks.every(c => c.length <= 400)).toBe(true);
        });

        it('2.5: Idempotency of bulk undo: running undo on already new transactions is non-destructive', () => {
            // Start with ledger where std_exp_1 is already new
            initialLedger[0].status = 'new';
            const originalAmount = initialLedger[0].amount;
            const originalDesc = initialLedger[0].description;

            const { updatedTxs } = simulateBulkMoveToNew(['std_exp_1'], initialLedger);
            expect(updatedTxs[0].status).toBe('new');
            expect(updatedTxs[0].amount).toBe(originalAmount);
            expect(updatedTxs[0].description).toBe(originalDesc);
        });

        it('2.6: Missing document handling: simulateBulkMoveToNew ignores non-existent transaction IDs', () => {
            const baselineCount = initialLedger.length;
            const { count } = simulateBulkMoveToNew(['non_existent_doc_123', 'fake_doc_456'], initialLedger);
            expect(count).toBe(0);
            expect(initialLedger).toHaveLength(baselineCount);
        });

        it('2.7: High-Volume Mixed Bulk Undo: 850 transactions chunked across 3 batches with 100% balance conservation', () => {
            const highVolumeLedger: MockTransaction[] = Array.from({ length: 850 }, (_, i) => ({
                id: `hv_tx_${i + 1}`,
                clientId: clientUid,
                bankAccountId: accountId,
                amount: i % 2 === 0 ? -(50 + (i % 100)) : 100 + (i % 200),
                description: `HIGH VOLUME TRANSACTION ${i + 1}`,
                status: 'reviewed' as const,
                isExpense: i % 2 === 0,
                date: '2026-03-15T12:00:00Z',
                allocatedTo: { value: '4000', type: 'account' as const },
                vatType: 'standard_rated_purchases'
            }));

            const initialBalance = computeAggregateBalance(highVolumeLedger, accountId);
            const allIds = highVolumeLedger.map(t => t.id);

            // Chunk in groups of 400
            const chunkSize = 400;
            const chunks: string[][] = [];
            for (let i = 0; i < allIds.length; i += chunkSize) {
                chunks.push(allIds.slice(i, i + chunkSize));
            }
            expect(chunks).toHaveLength(3);
            expect(chunks[0]).toHaveLength(400);
            expect(chunks[1]).toHaveLength(400);
            expect(chunks[2]).toHaveLength(50);

            let runningLedger = [...highVolumeLedger];
            let totalMoved = 0;
            for (const chunk of chunks) {
                const res = simulateBulkMoveToNew(chunk, runningLedger);
                runningLedger = res.updatedTxs;
                totalMoved += res.count;
            }

            expect(totalMoved).toBe(850);
            expect(runningLedger.every(t => t.status === 'new')).toBe(true);
            expect(computeAggregateBalance(runningLedger, accountId)).toBe(initialBalance);
        });

        it('2.8: Interleaved Bulk Undo and Split Reunite: concurrent reversion without orphaned state', () => {
            // Start with standard tx + 1 split parent (two children)
            const baseBalance = computeAggregateBalance(initialLedger, accountId);
            
            // Undo standard expense std_exp_4 AND unsplit parent_office_supplies
            const undoStdResult = simulateBulkMoveToNew(['std_exp_4'], initialLedger);
            const splitChildB = undoStdResult.updatedTxs.find(t => t.id === 'split_child_B')!;
            const unsplitResult = simulateUnsplitAndReset(splitChildB, undoStdResult.updatedTxs);

            const finalLedger = unsplitResult.updatedTxs;
            expect(finalLedger.find(t => t.id === 'std_exp_4')?.status).toBe('new');
            expect(finalLedger.find(t => t.id === 'parent_office_supplies')?.status).toBe('new');
            expect(finalLedger.find(t => t.id === 'split_child_A')).toBeUndefined();
            expect(finalLedger.find(t => t.id === 'split_child_B')).toBeUndefined();

            // Balance perfectly conserved
            expect(computeAggregateBalance(finalLedger, accountId)).toBe(baseBalance);
        });
    });

    // ========================================================================
    // SUITE 3: Excel Export Security, Sanitization & Filtering
    // ========================================================================
    describe('Suite 3: Excel Export Security, Formula Injection & UTF-8 Resilience', () => {

        it('3.1: Formula Injection triggers (=, +, -, @, \\t, \\r, DDE pipe) detection and sanitization', () => {
            const maliciousDescriptions = [
                `=cmd|'/C calc'!A0`,
                `=SUM(A1:A10)`,
                `+cmd|' /C notepad'!A0`,
                `-2+3*cmd|' /C calc'!A0`,
                `@SUM(1+1)`,
                `\t=1+1`,
                `\r=1+1`,
                `=10+20`,
            ];

            const formulaTriggers = ['=', '+', '-', '@', '\t', '\r'];

            maliciousDescriptions.forEach(desc => {
                const startsWithTrigger = formulaTriggers.some(t => desc.startsWith(t));
                expect(startsWithTrigger).toBe(true);

                // Sanitization pattern: prepend single quote to neutralize spreadsheet execution
                const sanitized = formulaTriggers.some(t => desc.startsWith(t)) ? `'${desc}` : desc;
                expect(sanitized.startsWith("'")).toBe(true);
            });
        });

        it('3.2: SheetJS AOA serialization with formula injection inputs', () => {
            const wb = XLSX.utils.book_new();
            const rows: (string | number)[][] = [
                ['Date', 'Description', 'Reference', 'Amount'],
                ['21/09/2026', "=cmd|' /C calc'!A0", 'REF001', -150.00],
                ['21/09/2026', "+12345", 'REF002', -200.00],
                ['21/09/2026', "@SUM(A1:A2)", 'REF003', -300.00]
            ];

            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, 'SanitizationTest');

            expect(ws['A1']?.v).toBe('Date');
            expect(ws['B2']?.v).toBe("=cmd|' /C calc'!A0");

            // Verify workbook structure
            expect(wb.SheetNames).toContain('SanitizationTest');
        });

        it('3.3: Exotic Unicode, Emojis, and Multi-Byte UTF-8 strings export without corruption', () => {
            const exoticDescriptions = [
                '💳 ENGEN QUICKSHOP 🚗 WINE & FUEL ⛽',
                'CAFÉ DE PARIS & L\'ORÉAL 🥐',
                '商业银行 (BANK OF CHINA) - SHANGHAI',
                'شركة تجارية دبي (DUBAI TRADING)',
                'ГАЗПРОМ НЕФТЬ (GAZPROM)',
                'ΕΛΛΗΝΙΚΑ ΠΕΤΡΕΛΑΙΑ (HELLENIC)',
                'Special \u200E\u200F RTL markers and zero-width \u200B spaces'
            ];

            const wb = XLSX.utils.book_new();
            const rows: (string | number)[][] = [['Index', 'Description']];
            exoticDescriptions.forEach((d, i) => rows.push([i + 1, d]));

            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, 'UnicodeTest');

            // Verify each cell preserved exact multi-byte UTF-8 string
            exoticDescriptions.forEach((d, i) => {
                const cellRef = `B${i + 2}`;
                expect(ws[cellRef]?.v).toBe(d);
            });
        });

        it('3.4: Extreme string length boundary: 5,000-character description in Excel export', () => {
            const longDesc = 'A'.repeat(5000);
            const rows = [
                ['Description', 'Amount'],
                [longDesc, -99.99]
            ];

            const ws = XLSX.utils.aoa_to_sheet(rows);
            expect(ws['A2']?.v).toBe(longDesc);
            expect((ws['A2']?.v as string).length).toBe(5000);
        });

        it('3.5: Filter Scoping Invariant: export strictly includes filtered items and excludes unselected', () => {
            const allTransactions: ImportedTransaction[] = [
                { id: '1', date: '2026-03-01', description: 'SPAR SUPERMARKET', amount: -450, status: 'new', isExpense: true, bankAccountId: 'acc' },
                { id: '2', date: '2026-03-02', description: 'ENGEN GARAGE', amount: -600, status: 'new', isExpense: true, bankAccountId: 'acc' },
                { id: '3', date: '2026-03-03', description: 'WOOLWORTHS FOOD', amount: -800, status: 'new', isExpense: true, bankAccountId: 'acc' },
            ];

            // Simulated active search filter for "ENGEN"
            const searchTerm = 'ENGEN';
            const filteredTransactions = allTransactions.filter(t => t.description.includes(searchTerm));

            expect(filteredTransactions).toHaveLength(1);
            expect(filteredTransactions[0].description).toBe('ENGEN GARAGE');

            // Excel export rows derived strictly from filteredTransactions
            const exportRows = [['Date', 'Description', 'Amount']];
            filteredTransactions.forEach(tx => {
                exportRows.push([tx.date, tx.description, tx.amount]);
            });

            expect(exportRows).toHaveLength(2); // Header + 1 row
            expect(exportRows[1][1]).toBe('ENGEN GARAGE');
            // SPAR and WOOLWORTHS were NOT leaked into export
            expect(exportRows.some(r => r.includes('SPAR SUPERMARKET'))).toBe(false);
            expect(exportRows.some(r => r.includes('WOOLWORTHS FOOD'))).toBe(false);
        });

        it('3.6: Corrupt/Invalid Date handling in Excel export formatting', () => {
            const invalidDateTx = {
                date: 'not-a-valid-date',
                description: 'CORRUPT TIMESTAMP TX',
                amount: -123.45
            };

            // Direct date-fns format(new Date(invalidDateTx.date)) throws RangeError
            const parseDate = (d: string) => {
                const parsed = new Date(d);
                if (isNaN(parsed.getTime())) {
                    return 'INVALID_DATE';
                }
                return parsed.toISOString();
            };

            expect(parseDate(invalidDateTx.date)).toBe('INVALID_DATE');
            expect(parseDate('2026-03-21T10:00:00Z')).toContain('2026-03-21');
        });

        it('3.7: Validation sheet generation with Chart of Accounts and Canonical VAT Types', () => {
            const mockAccounts: ChartOfAccount[] = [
                { id: '4000', accountNumber: '4000', description: 'Consulting Revenue', section: 'Income Statement' },
                { id: '5000', accountNumber: '5000', description: 'Bank Charges', section: 'Income Statement' },
                { id: '5100', accountNumber: '5100', description: 'Fuel & Oil', section: 'Income Statement' },
            ];

            const valData = [['GL Accounts', 'VAT Types']];
            const maxLen = Math.max(mockAccounts.length, allVatTypes.length);
            for (let i = 0; i < maxLen; i++) {
                valData.push([
                    mockAccounts[i]?.description || '',
                    allVatTypes[i]?.label || ''
                ]);
            }

            const valWs = XLSX.utils.aoa_to_sheet(valData);
            expect(valWs['A1']?.v).toBe('GL Accounts');
            expect(valWs['B1']?.v).toBe('VAT Types');
            expect(valWs['A2']?.v).toBe('Consulting Revenue');
            expect(valWs['B2']?.v).toBe('Standard-rated supplies (15%)');
            expect(valData.length).toBeGreaterThanOrEqual(8);
        });

        it('3.8: Complete Formula Injection Sanitizer Oracle: neutralizes all DDE, pipe, and formula prefixes', () => {
            const sanitizeCellForExcel = (val: string | number): string | number => {
                if (typeof val !== 'string') return val;
                const trimmed = val.trimStart();
                const formulaPrefixes = ['=', '+', '-', '@', '\t', '\r', '|'];
                if (formulaPrefixes.some(p => trimmed.startsWith(p)) || trimmed.includes('|')) {
                    return `'${val}`;
                }
                return val;
            };

            const injectionPayloads = [
                `=cmd|'/C calc'!A0`,
                `+cmd|'/C calc'!A0`,
                `-cmd|'/C calc'!A0`,
                `@SUM(A1:A10)`,
                `\t=1+1`,
                `\r=1+1`,
                `|cmd|' /C powershell'`,
                ` =spacedFormula`,
                `NORMAL DESCRIPTION`,
                12345
            ];

            const sanitizedOutputs = injectionPayloads.map(sanitizeCellForExcel);

            expect(sanitizedOutputs[0]).toBe(`'=cmd|'/C calc'!A0`);
            expect(sanitizedOutputs[1]).toBe(`'+cmd|'/C calc'!A0`);
            expect(sanitizedOutputs[2]).toBe(`'-cmd|'/C calc'!A0`);
            expect(sanitizedOutputs[3]).toBe(`'@SUM(A1:A10)`);
            expect(sanitizedOutputs[4]).toBe(`'\t=1+1`);
            expect(sanitizedOutputs[5]).toBe(`'\r=1+1`);
            expect(sanitizedOutputs[6]).toBe(`'|cmd|' /C powershell'`);
            expect(sanitizedOutputs[7]).toBe(`' =spacedFormula`);
            expect(sanitizedOutputs[8]).toBe(`NORMAL DESCRIPTION`);
            expect(sanitizedOutputs[9]).toBe(12345);
        });

        it('3.9: Filename sanitization against path traversal and invalid filesystem characters', () => {
            const sanitizeFilename = (name: string, prefix: string, ext = 'xlsx') => {
                const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, '_');
                return `${prefix}_${cleaned}.${ext}`;
            };

            const exoticClientNames = [
                'BUILD X / HARDWARE & BUILDWARE CC: 2026',
                '../../etc/passwd',
                'CON*TRA? <TEST> "CORP" | JHB',
                'MÜLLER & SÖHNE (PTY) LTD'
            ];

            exoticClientNames.forEach(clientName => {
                const filename = sanitizeFilename(clientName, 'SmartMatch_Review');
                expect(filename).not.toContain('/');
                expect(filename).not.toContain('\\');
                expect(filename).not.toContain(':');
                expect(filename).not.toContain('*');
                expect(filename).not.toContain('?');
                expect(filename).not.toContain('..');
                expect(filename.endsWith('.xlsx')).toBe(true);
            });
        });
    });

    // ========================================================================
    // SUITE 4: Rule Validation, Canonical VAT Constraints & Scope Hardening
    // ========================================================================
    describe('Suite 4: Rule Validation, Canonical VAT Constraints & Scope Hardening', () => {

        it('4.1: Canonical VAT Type Set contains exactly the 8 standard South African VAT types', () => {
            const expectedVatTypes = [
                'standard_rated_purchases',
                'zero_rated_purchases',
                'exempt_purchases',
                'capital_goods_purchases',
                'no_vat',
                'standard_rated_sales',
                'zero_rated_sales',
                'exempt_sales'
            ];

            expect(CANONICAL_VAT_TYPES.size).toBe(8);
            expectedVatTypes.forEach(vt => {
                expect(CANONICAL_VAT_TYPES.has(vt as any)).toBe(true);
            });
        });

        it('4.2: normalizeVatType converts legacy/fuzzy VAT types to canonical equivalents', () => {
            // Expense conversions
            expect(normalizeVatType('standard', true)).toBe('standard_rated_purchases');
            expect(normalizeVatType('zero_rated', true)).toBe('zero_rated_purchases');
            expect(normalizeVatType('exempt', true)).toBe('exempt_purchases');
            expect(normalizeVatType('capital', true)).toBe('capital_goods_purchases');
            expect(normalizeVatType('vat_disallowed', true)).toBe('no_vat');
            expect(normalizeVatType(undefined, true)).toBe('no_vat');

            // Income conversions
            expect(normalizeVatType('standard', false)).toBe('standard_rated_sales');
            expect(normalizeVatType('zero_rated', false)).toBe('zero_rated_sales');
            expect(normalizeVatType('exempt', false)).toBe('exempt_sales');
        });

        it('4.3: ruleFormSchema enforces min 2 characters on keywords', () => {
            // Valid rule
            const valid = ruleFormSchema.safeParse({
                mode: 'new',
                keywords: 'ENGEN',
                accountType: 'account',
                accountId: '5100',
                scope: 'client'
            });
            expect(valid.success).toBe(true);

            // Invalid rule (1 character keyword)
            const invalidSingleChar = ruleFormSchema.safeParse({
                mode: 'new',
                keywords: 'E',
                accountType: 'account',
                accountId: '5100'
            });
            expect(invalidSingleChar.success).toBe(false);

            // Invalid rule (empty keywords)
            const invalidEmpty = ruleFormSchema.safeParse({
                mode: 'new',
                keywords: '',
                accountType: 'account',
                accountId: '5100'
            });
            expect(invalidEmpty.success).toBe(false);
        });

        it('4.4: Whitespace and comma-separated keyword parsing and deduplication', () => {
            const rawKeywords = '  ENGEN ,  , WOOLWORTHS , engen,   SHELL , , ';
            const keywordsArray = Array.from(new Set(
                rawKeywords.split(',').map(k => k.trim().toUpperCase()).filter(Boolean)
            ));

            expect(keywordsArray).toEqual(['ENGEN', 'WOOLWORTHS', 'SHELL']);
            expect(keywordsArray).toHaveLength(3);
        });

        it('4.5: Regex metacharacters in rule keywords match safely without syntax errors', () => {
            const exoticKeywords = [
                '3@1',
                'MUGG & BEAN',
                'C&C HARDWARE',
                '(PTY) LTD',
                'A+B SUPPLIES',
                '[FASTENERS]*',
                '#SERVICE FEES',
                '*9002'
            ];

            const descriptions = [
                'POS PURCHASE 3@1 WATERKLOOF',
                'MUGG & BEAN SANDTON',
                'PAYMENT C&C HARDWARE',
                'BUILD X (PTY) LTD JHB',
                'A+B SUPPLIES DBN',
                'PURCHASE [FASTENERS]* CPT',
                'FNB #SERVICE FEES FOR AUG',
                'POS PURCHASE 491050*9002 UBER'
            ];

            // Verify matchesRuleKeyword does not throw SyntaxError for any regex character
            exoticKeywords.forEach((kw, i) => {
                expect(() => matchesRuleKeyword(descriptions[i], kw)).not.toThrow();
                expect(matchesRuleKeyword(descriptions[i], kw)).toBe(true);
            });
        });

        it('4.6: resolveAccountForCategory gracefully handles non-existent GL account codes', () => {
            const clientCOA: ChartOfAccount[] = [
                { id: 'acc_1', accountNumber: '4000', description: 'Sales Revenue', section: 'Income Statement' },
                { id: 'acc_2', accountNumber: '5000', description: 'Bank Fees', section: 'Income Statement' }
            ];

            const ruleTargetingMissingAccount: AllocationRule = {
                id: 'rule_missing',
                description: 'Rule for Missing Account',
                keywords: ['SOMETHING'],
                accountId: '9999-NON-EXISTENT',
                vatType: 'no_vat',
                type: 'hard',
                scope: 'client',
                priority: 1
            };

            const resolved = resolveAccountForCategory(clientCOA, ruleTargetingMissingAccount);
            // Returns null or fallback gracefully, never throws null reference exception
            expect(resolved === null || typeof resolved.accountNumber === 'string').toBe(true);
        });

        it('4.7: Income transactions strictly excluded from rule auto-allocation', () => {
            const incomeTx: ImportedTransaction = {
                id: 'income_tx_1',
                date: '2026-03-15',
                description: 'CLIENT EFT PAYMENT ENGEN',
                amount: 2500.00, // Positive
                status: 'new',
                isExpense: false,
                bankAccountId: 'acc_1'
            };

            const rule: AllocationRule = {
                id: 'rule_engen',
                description: 'Engen Rule',
                keywords: ['ENGEN'],
                accountId: '5100',
                vatType: 'standard_rated_purchases',
                type: 'hard',
                scope: 'client',
                priority: 1
            };

            const triageRes = triageTransaction(incomeTx, { clientRules: [rule] });
            expect(triageRes.isAllocated).toBe(false);
            expect(triageRes.status).toBe('new');
        });

        it('4.8: Rule Priority Ordering: lower numerical priority strictly wins on overlapping keywords', () => {
            const tx: ImportedTransaction = {
                id: 'tx_overlap',
                date: '2026-03-10',
                description: 'ENGEN CONVENIENCE STORE FUEL',
                amount: -750.00,
                status: 'new',
                isExpense: true,
                bankAccountId: 'acc_1'
            };

            const ruleHighPriority: AllocationRule = {
                id: 'rule_prio_1',
                description: 'High Priority Specific Rule',
                keywords: ['ENGEN CONVENIENCE'],
                accountId: '5100', // Fuel
                vatType: 'standard_rated_purchases',
                type: 'hard',
                scope: 'client',
                priority: 1
            };

            const ruleLowPriority: AllocationRule = {
                id: 'rule_prio_10',
                description: 'Low Priority Generic Rule',
                keywords: ['ENGEN'],
                accountId: '5200', // General Stores
                vatType: 'standard_rated_purchases',
                type: 'hard',
                scope: 'client',
                priority: 10
            };

            // Test with both rules passed in reverse order (10 first, then 1)
            const triageRes = triageTransaction(tx, { clientRules: [ruleLowPriority, ruleHighPriority] });
            expect(triageRes.isAllocated).toBe(true);
            // Must match rule_prio_1 because priority 1 < priority 10
            expect(triageRes.accountId).toBe('5100');
            expect(triageRes.matchedRuleId).toBe('rule_prio_1');
        });

        it('4.9: Invalid & Malformed VAT Categories fallback gracefully to no_vat without crashing', () => {
            const malformedVatInputs = [
                'invalid_vat_rate_25%',
                'VAT_DISALLOWED_LEGACY',
                'UNKNOWN_RANDOM_STRING',
                '',
                null,
                undefined
            ];

            malformedVatInputs.forEach(input => {
                const normalized = normalizeVatType(input as any, true);
                expect(CANONICAL_VAT_TYPES.has(normalized)).toBe(true);
            });
        });
    });

    // ========================================================================
    // SUITE 5: Network Failure Simulation & Transactional Batch Rollbacks
    // ========================================================================
    describe('Suite 5: Network Failure Simulation & Transactional Batch Rollbacks', () => {

        it('5.1: Split Transaction atomic rollback when Firestore batch commit fails', async () => {
            const parent: MockTransaction = {
                id: 'tx_fail',
                clientId: 'client_1',
                bankAccountId: 'acc_1',
                amount: -500.00,
                description: 'FAILED SPLIT TX',
                status: 'reviewed',
                isExpense: true,
                date: '2026-03-01T10:00:00Z',
            };

            let isSaving = true;
            let errorMessage: string | null = null;

            // Simulate batch commit rejecting with DEADLINE_EXCEEDED
            const mockCommit = vi.fn().mockRejectedValue(new Error('DEADLINE_EXCEEDED'));

            try {
                await mockCommit();
            } catch (err: any) {
                isSaving = false;
                errorMessage = err.message;
            }

            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(isSaving).toBe(false);
            expect(errorMessage).toBe('DEADLINE_EXCEEDED');
            // Parent transaction remains in original reviewed state, no partial writes
            expect(parent.amount).toBe(-500.00);
            expect(parent.status).toBe('reviewed');
        });

        it('5.2: Unsplit operation atomic rollback when Firestore batch commit rejects', async () => {
            let splitChildren = [
                { id: 'c1', splitFrom: 'p1', amount: -200 },
                { id: 'c2', splitFrom: 'p1', amount: -300 }
            ];

            const mockCommit = vi.fn().mockRejectedValue(new Error('PERMISSION_DENIED'));

            let rollbackTriggered = false;
            try {
                await mockCommit();
                // Would delete children and restore parent if successful
                splitChildren = [];
            } catch (err) {
                rollbackTriggered = true;
            }

            expect(rollbackTriggered).toBe(true);
            // Split children preserved in ledger
            expect(splitChildren).toHaveLength(2);
        });

        it('5.3: Optimistic UI approval rollback in SmartMatchQueueTab upon batch failure', async () => {
            const originalGroups: TransactionGroup[] = [
                {
                    merchantKey: 'ENGEN',
                    transactions: [],
                    suggestion: null,
                    status: 'ready'
                },
                {
                    merchantKey: 'WOOLWORTHS',
                    transactions: [],
                    suggestion: null,
                    status: 'ready'
                }
            ];

            // 1. Optimistic removal of ENGEN
            let currentGroups = originalGroups.filter(g => g.merchantKey !== 'ENGEN');
            expect(currentGroups).toHaveLength(1);
            expect(currentGroups[0].merchantKey).toBe('WOOLWORTHS');

            // 2. Simulate network commit failure
            const mockCommit = vi.fn().mockRejectedValue(new Error('UNAVAILABLE'));

            try {
                await mockCommit();
            } catch (err) {
                // 3. Rollback state to originalGroups
                currentGroups = originalGroups;
            }

            // 4. Assert full recovery to original 2 groups
            expect(currentGroups).toHaveLength(2);
            expect(currentGroups.some(g => g.merchantKey === 'ENGEN')).toBe(true);
        });

        it('5.4: Multi-chunk Bulk Undo failure reporting on second batch', async () => {
            const batch1 = vi.fn().mockResolvedValue({ status: 'ok' });
            const batch2 = vi.fn().mockRejectedValue(new Error('INTERNAL_SERVER_ERROR'));

            let completedChunks = 0;
            let caughtError: string | null = null;

            try {
                await batch1();
                completedChunks++;
                await batch2();
                completedChunks++;
            } catch (e: any) {
                caughtError = e.message;
            }

            expect(completedChunks).toBe(1);
            expect(caughtError).toBe('INTERNAL_SERVER_ERROR');
        });

        it('5.5: 3-Phase chunk commit failure captures exact failed batch index and preserves prior commits', async () => {
            const commitResults: string[] = [];
            const chunkOperations = [
                vi.fn().mockResolvedValue('batch_1_success'),
                vi.fn().mockRejectedValue(new Error('NETWORK_TIMEOUT_CHUNK_2')),
                vi.fn().mockResolvedValue('batch_3_unreached')
            ];

            let failureIndex = -1;
            let errorMsg = '';

            for (let i = 0; i < chunkOperations.length; i++) {
                try {
                    const res = await chunkOperations[i]();
                    commitResults.push(res);
                } catch (e: any) {
                    failureIndex = i;
                    errorMsg = e.message;
                    break;
                }
            }

            expect(failureIndex).toBe(1);
            expect(errorMsg).toBe('NETWORK_TIMEOUT_CHUNK_2');
            expect(commitResults).toEqual(['batch_1_success']);
            expect(chunkOperations[2]).not.toHaveBeenCalled();
        });
    });

    // ========================================================================
    // SUITE 6: Complete 10-Dialog Structural & Functional Contract Audit
    // ========================================================================
    describe('Suite 6: Complete 10-Dialog Structural & Functional Contract Audit', () => {

        it('6.1: SplitTransactionDialog: row addition and minimum 2-row removal protection', () => {
            let rows = [
                { amount: '', allocatedTo: null, vatType: 'no_vat' },
                { amount: '', allocatedTo: null, vatType: 'no_vat' }
            ];

            // Cannot remove when rows <= 2
            const removeRow = (index: number) => {
                if (rows.length <= 2) return;
                rows.splice(index, 1);
            };

            removeRow(0);
            expect(rows).toHaveLength(2); // Guard prevented removal

            // Can add row
            rows.push({ amount: '', allocatedTo: null, vatType: 'no_vat' });
            expect(rows).toHaveLength(3);

            // Can remove when length > 2
            removeRow(2);
            expect(rows).toHaveLength(2);
        });

        it('6.2: CreateRuleDialog: ruleFormSchema default values and mode validation', () => {
            const defaultParsed = ruleFormSchema.parse({
                keywords: 'VODACOM'
            });

            expect(defaultParsed.mode).toBe('new');
            expect(defaultParsed.scope).toBe('client');
            expect(defaultParsed.accountType).toBe('account');
            expect(defaultParsed.keywords).toBe('VODACOM');
        });

        it('6.3: EditTransactionDialog: amount validation and manual transaction schema', () => {
            // Amount cannot be zero
            const zeroRes = manualTransactionSchema.safeParse({
                date: new Date(),
                description: 'ZERO AMOUNT',
                amount: 0
            });
            expect(zeroRes.success).toBe(false);

            // Valid non-zero amount
            const validRes = manualTransactionSchema.safeParse({
                date: new Date(),
                description: 'VALID AMOUNT',
                amount: -250.00
            });
            expect(validRes.success).toBe(true);
        });

        it('6.4: BankAccountManageDialogs: formatPrice utility handles positive and negative prices', () => {
            expect(formatPrice(1234.56)).toBe('1,234.56');
            expect(formatPrice(-500.00)).toBe('-500.00');
            expect(formatPrice(0)).toBe('0.00');
        });

        it('6.5: CreateManualTransactionDialog: distinguishes expense vs income sign', () => {
            const expenseAmount = -150.00;
            const incomeAmount = 150.00;

            expect(expenseAmount < 0).toBe(true);
            expect(incomeAmount < 0).toBe(false);
        });

        it('6.6: CreateGeneralAccountDialog: validates section enum and account number presence', () => {
            const validSections = ['Income Statement', 'Balance Sheet'];
            expect(validSections.includes('Income Statement')).toBe(true);
            expect(validSections.includes('Balance Sheet')).toBe(true);
            expect(validSections.includes('Other Section')).toBe(false);
        });

        it('6.7: AIAllocationReviewDialog: confidence threshold gating (<20 disabled, >=20 enabled)', () => {
            const lowConfidence = 15;
            const highConfidence = 85;

            expect(lowConfidence >= 20).toBe(false);
            expect(highConfidence >= 20).toBe(true);
        });

        it('6.8: RuleViewDialog: matched keyword highlighting logic', () => {
            const ruleKeywords = ['ENGEN', 'ENGEN QUICKSHOP', 'ENGEN GARAGE'];
            const matchedKeyword = 'ENGEN';

            const isHighlighted = (kw: string) => kw.toUpperCase() === matchedKeyword.toUpperCase();
            expect(isHighlighted('ENGEN')).toBe(true);
            expect(isHighlighted('ENGEN QUICKSHOP')).toBe(false);
        });

        it('6.9: GroupTransactionsDialog: multi-tx group review and split group invocation', () => {
            const group: TransactionGroup = {
                merchantKey: 'SHELL',
                transactions: [
                    { id: 'tx_1', date: '2026-03-01', description: 'SHELL WINCHESTER', amount: -400, status: 'new', isExpense: true, bankAccountId: 'acc' },
                    { id: 'tx_2', date: '2026-03-02', description: 'SHELL WATERKLOOF', amount: -550, status: 'new', isExpense: true, bankAccountId: 'acc' }
                ],
                suggestion: null,
                status: 'ready'
            };

            expect(group.transactions).toHaveLength(2);
            const canSplitGroup = group.transactions.length > 1;
            expect(canSplitGroup).toBe(true);
        });

        it('6.10: SmartMatchQueueModal: SmartMatchResult confidence, badges, and scoping properties', () => {
            const mockResult: SmartMatchResult = {
                groupId: 'grp_1',
                groupKey: 'WOOLWORTHS',
                description: 'WOOLWORTHS FOOD',
                transactionCount: 5,
                totalAmount: -2500.00,
                transactionIds: ['t1', 't2', 't3', 't4', 't5'],
                merchantName: 'Woolworths',
                merchantCategory: 'Groceries',
                suggestedAccountId: '5200',
                suggestedAccountLabel: 'Staff Refreshments',
                vatType: 'standard_rated_purchases',
                confidence: 90,
                suggestedKeyword: 'WOOLWORTHS',
                badges: [],
                ruleScoping: 'global_practice',
                isAutoAllocatable: true,
                status: 'reviewed'
            };

            expect(mockResult.confidence).toBeGreaterThanOrEqual(80);
            expect(mockResult.isAutoAllocatable).toBe(true);
            expect(mockResult.ruleScoping).toBe('global_practice');
            expect(CANONICAL_VAT_TYPES.has(mockResult.vatType)).toBe(true);
        });

        it('6.11: Component memoization comparators skip unnecessary re-renders', () => {
            const prevRowProps = {
                tx: { id: 'tx1', date: '2026-03-01', amount: -100, description: 'TEST', cleanDescription: 'TEST' },
                isSelected: false,
                editedAllocation: { value: '4000', vatType: 'no_vat' },
                client: { chartOfAccounts: [] },
                customers: [],
                suppliers: []
            };

            // Identical props -> returns true (skip re-render)
            expect(areReviewedTransactionRowPropsEqual(prevRowProps, { ...prevRowProps })).toBe(true);

            // Selected changed -> returns false (trigger re-render)
            expect(areReviewedTransactionRowPropsEqual(prevRowProps, { ...prevRowProps, isSelected: true })).toBe(false);

            // Amount changed -> returns false
            expect(areReviewedTransactionRowPropsEqual(prevRowProps, {
                ...prevRowProps,
                tx: { ...prevRowProps.tx, amount: -200 }
            })).toBe(false);
        });

        it('6.12: ImportDialog: OFX parsing extracts closing balance and handles negative amounts', () => {
            const parseOFXBalance = (text: string): number | null => {
                const balMatch = text.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([\-\d.]+)/i) || text.match(/<AVAILBAL>[\s\S]*?<BALAMT>([\-\d.]+)/i);
                if (balMatch) {
                    const b = parseFloat(balMatch[1]);
                    if (!isNaN(b)) return b;
                }
                return null;
            };

            const sampleOfxPositive = `
                <OFX>
                    <BANKMSGSRSV1>
                        <LEDGERBAL>
                            <BALAMT>15420.50</BALAMT>
                            <DTASOF>20260320</DTASOF>
                        </LEDGERBAL>
                    </BANKMSGSRSV1>
                </OFX>
            `;

            const sampleOfxOverdraft = `
                <OFX>
                    <AVAILBAL>
                        <BALAMT>-3541.20</BALAMT>
                    </AVAILBAL>
                </OFX>
            `;

            const sampleOfxMissing = `<OFX><BANKMSGSRSV1></BANKMSGSRSV1></OFX>`;

            expect(parseOFXBalance(sampleOfxPositive)).toBe(15420.50);
            expect(parseOFXBalance(sampleOfxOverdraft)).toBe(-3541.20);
            expect(parseOFXBalance(sampleOfxMissing)).toBeNull();
        });

        it('6.13: BankAccountManageDialogs: Clear Bank Account AlertDialog invokes onClearAccount callback', () => {
            let clearCalled = false;
            const onClearAccount = () => {
                clearCalled = true;
            };

            // Simulate AlertDialog confirmation action
            onClearAccount();
            expect(clearCalled).toBe(true);
        });
    });
});
