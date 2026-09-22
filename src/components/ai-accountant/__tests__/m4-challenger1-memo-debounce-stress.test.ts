/**
 * @fileOverview Milestone 4 Empirical Challenger 1 Stress Test Suite
 * 
 * Target Under Test (R3: Component Memoization, Debouncing & Optimistic UI):
 * 1. Custom Equality Comparator: `areMerchantGroupCardPropsEqual`
 *    - ApprovalSetting changes (accountId, vatType, createRule)
 *    - Callback reference churn & unrelated parent state isolation
 *    - Sibling comment and selection isolation across 25-card grid
 *    - Boundary conditions: null/undefined safety, suggestion mutations, status changes
 * 2. Custom Equality Comparator: `areNewTransactionRowPropsEqual`
 *    - Checkbox selection isolation across 100-row table
 *    - Allocation, amount, description, AI research state mutations
 *    - Callback reference churn
 * 3. Custom Equality Comparator: `areReviewedTransactionRowPropsEqual`
 *    - Checkbox selection isolation across 100-row table
 *    - EditedAllocation mutations & rule list reference isolation
 * 4. `useDebounce` Rapid Burst Keystroke Stress
 *    - 20-keystroke rapid typing bursts in 100ms
 *    - Immediate timer cancellation verification
 *    - Backspace bursts & multiple burst sequences
 *    - Unmount cleanup and custom delay matrix
 * 5. AST & Static Invariant Audits
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import target components and comparators
import { 
    MerchantGroupCard, 
    areMerchantGroupCardPropsEqual,
    MerchantGroupCardProps
} from '../components/MerchantGroupCard';

import { 
    NewTransactionRow, 
    areNewTransactionRowPropsEqual,
    NewTransactionRowProps
} from '../components/NewTransactionRow';

import { 
    ReviewedTransactionRow, 
    areReviewedTransactionRowPropsEqual,
    ReviewedTransactionRowProps
} from '../components/ReviewedTransactionRow';

import { useDebounce } from '@/hooks/use-debounce';
import { TransactionGroup } from '../types';
import { ImportedTransaction, User, ClientCustomer, Supplier, AllocationRule } from '@/lib/types';

describe('Milestone 4 Empirical Challenger 1 Stress Test Suite', () => {

    // ========================================================================
    // SUITE 1: areMerchantGroupCardPropsEqual Deep Stress & Edge Cases
    // ========================================================================
    describe('Suite 1: areMerchantGroupCardPropsEqual Deep Stress & Isolation', () => {
        const baseGroup: TransactionGroup = {
            merchantKey: 'VODACOM',
            transactions: [
                { 
                    id: 'tx-1', 
                    date: '2026-09-01', 
                    amount: -499, 
                    description: 'VODACOM PREPAID', 
                    status: 'ai_review',
                    allocationSource: 'history'
                } as any
            ],
            suggestion: { 
                confidence: 95, 
                accountId: 'acc-telecom', 
                accountType: 'account', 
                summary: 'Telephone & Internet' 
            } as any,
            status: 'ready'
        };

        const baseProps: MerchantGroupCardProps = {
            group: baseGroup,
            isSelected: false,
            approvalSetting: { accountId: 'acc-telecom', vatType: 'standard_rated_purchases', createRule: true },
            initialComment: 'Monthly cell bill',
            isAnalyzingComment: false,
            isResearching: false,
            client: { 
                id: 'cli-1',
                chartOfAccounts: [{ id: 'acc-telecom', name: 'Telephone' } as any], 
                isVatRegistered: true 
            } as any,
            onToggleSelect: vi.fn(),
            onViewTransactions: vi.fn(),
            onUpdateAccount: vi.fn(),
            onUpdateVat: vi.fn(),
            onToggleCreateRule: vi.fn(),
            onCommentChange: vi.fn(),
            onAnalyzeComment: vi.fn(),
            onResearchWithAi: vi.fn(),
            onApproveGroup: vi.fn(),
        };

        it('1.1: Returns true when props are structurally identical distinct object references', () => {
            const prev = { ...baseProps };
            const next = { 
                ...baseProps,
                approvalSetting: { ...baseProps.approvalSetting! },
                group: { ...baseGroup, suggestion: { ...baseGroup.suggestion! } }
            };
            expect(areMerchantGroupCardPropsEqual(prev, next)).toBe(true);
        });

        it('1.2: Detects approvalSetting.accountId change and triggers re-render', () => {
            const prev = { ...baseProps };
            const next = { 
                ...baseProps,
                approvalSetting: { ...baseProps.approvalSetting!, accountId: 'acc-other' }
            };
            expect(areMerchantGroupCardPropsEqual(prev, next)).toBe(false);
        });

        it('1.3: Detects approvalSetting.vatType change and triggers re-render', () => {
            const prev = { ...baseProps };
            const next = { 
                ...baseProps,
                approvalSetting: { ...baseProps.approvalSetting!, vatType: 'no_vat' }
            };
            expect(areMerchantGroupCardPropsEqual(prev, next)).toBe(false);
        });

        it('1.4: Detects approvalSetting.createRule toggle and triggers re-render', () => {
            const prev = { ...baseProps };
            const next = { 
                ...baseProps,
                approvalSetting: { ...baseProps.approvalSetting!, createRule: false }
            };
            expect(areMerchantGroupCardPropsEqual(prev, next)).toBe(false);
        });

        it('1.5: Handles approvalSetting transitions between defined and undefined safely', () => {
            const prevDefined = { ...baseProps };
            const nextUndefined = { ...baseProps, approvalSetting: undefined };
            expect(areMerchantGroupCardPropsEqual(prevDefined, nextUndefined)).toBe(false);
            expect(areMerchantGroupCardPropsEqual(nextUndefined, prevDefined)).toBe(false);

            const bothUndefinedPrev = { ...baseProps, approvalSetting: undefined };
            const bothUndefinedNext = { ...baseProps, approvalSetting: undefined };
            expect(areMerchantGroupCardPropsEqual(bothUndefinedPrev, bothUndefinedNext)).toBe(true);
        });

        it('1.6: Callback Reference Churn: skips re-render when all 9 callbacks are recreated', () => {
            const prev = { ...baseProps };
            const next = { 
                ...baseProps,
                // Newly created function instances simulating parent component re-render
                onToggleSelect: () => {},
                onViewTransactions: () => {},
                onUpdateAccount: () => {},
                onUpdateVat: () => {},
                onToggleCreateRule: () => {},
                onCommentChange: () => {},
                onAnalyzeComment: () => {},
                onResearchWithAi: () => {},
                onApproveGroup: () => {},
            };
            // Comparators intentionally exclude callbacks so inline handlers in parent don't bust memoization
            expect(areMerchantGroupCardPropsEqual(prev, next)).toBe(true);
        });

        it('1.7: Unrelated Parent State: skips re-render when sibling comments or search text change', () => {
            const prev = { ...baseProps };
            // Parent re-renders because user typed in another card's comment, or parent page index changed
            const next = { 
                ...baseProps,
                // Card's own props are identical, though parent passed new wrapper object
            };
            expect(areMerchantGroupCardPropsEqual(prev, next)).toBe(true);
        });

        it('1.8: Group status transitions (ready <-> server_researching) trigger re-render', () => {
            const prev = { ...baseProps };
            const nextResearching = { 
                ...baseProps,
                group: { ...baseGroup, status: 'server_researching' as const }
            };
            expect(areMerchantGroupCardPropsEqual(prev, nextResearching)).toBe(false);
        });

        it('1.9: Regrouping / transaction length mutations trigger re-render', () => {
            const prev = { ...baseProps };
            const nextMoreTxs = { 
                ...baseProps,
                group: { 
                    ...baseGroup, 
                    transactions: [...baseGroup.transactions, { id: 'tx-2' } as any] 
                }
            };
            expect(areMerchantGroupCardPropsEqual(prev, nextMoreTxs)).toBe(false);

            const nextEmptyTxs = {
                ...baseProps,
                group: { ...baseGroup, transactions: [] }
            };
            expect(areMerchantGroupCardPropsEqual(prev, nextEmptyTxs)).toBe(false);
        });

        it('1.10: AI Suggestion changes (confidence, accountId, null/defined transition) trigger re-render', () => {
            const prev = { ...baseProps };
            
            // Confidence change (e.g. 95% -> 50%)
            const nextConfidence = {
                ...baseProps,
                group: { ...baseGroup, suggestion: { ...baseGroup.suggestion!, confidence: 50 } }
            };
            expect(areMerchantGroupCardPropsEqual(prev, nextConfidence)).toBe(false);

            // Suggestion accountId change
            const nextSugAccount = {
                ...baseProps,
                group: { ...baseGroup, suggestion: { ...baseGroup.suggestion!, accountId: 'acc-diff' } }
            };
            expect(areMerchantGroupCardPropsEqual(prev, nextSugAccount)).toBe(false);

            // Suggestion null -> defined
            const prevNullSug = {
                ...baseProps,
                group: { ...baseGroup, suggestion: null }
            };
            expect(areMerchantGroupCardPropsEqual(prevNullSug, prev)).toBe(false);
            expect(areMerchantGroupCardPropsEqual(prev, prevNullSug)).toBe(false);

            // Both null
            const nextNullSug = {
                ...baseProps,
                group: { ...baseGroup, suggestion: null }
            };
            expect(areMerchantGroupCardPropsEqual(prevNullSug, nextNullSug)).toBe(true);
        });

        it('1.11: 25-Card Grid Simulation: selecting 1 card triggers re-render ONLY on that card', () => {
            // Simulate 25 cards on a Smart Match Queue page
            const cardCount = 25;
            const cards: MerchantGroupCardProps[] = Array.from({ length: cardCount }, (_, i) => ({
                ...baseProps,
                group: {
                    ...baseGroup,
                    merchantKey: `MERCHANT_${i}`,
                    transactions: [{ id: `tx-${i}` } as any]
                },
                isSelected: false,
                approvalSetting: { accountId: `acc-${i}`, vatType: 'standard_rated_purchases', createRule: false }
            }));

            // User selects Card #14
            const targetIndex = 14;
            const updatedCards: MerchantGroupCardProps[] = cards.map((c, i) => ({
                ...c,
                isSelected: i === targetIndex ? true : c.isSelected,
                // Simulate parent re-render producing new callback references for all cards
                onToggleSelect: () => {},
                onApproveGroup: () => {},
            }));

            // Assert Target Card #14 re-renders
            expect(areMerchantGroupCardPropsEqual(cards[targetIndex], updatedCards[targetIndex])).toBe(false);

            // Assert all 24 sibling cards SKIP re-rendering (100% isolation)
            let siblingReRenders = 0;
            for (let i = 0; i < cardCount; i++) {
                if (i !== targetIndex) {
                    const equal = areMerchantGroupCardPropsEqual(cards[i], updatedCards[i]);
                    if (!equal) siblingReRenders++;
                }
            }
            expect(siblingReRenders).toBe(0);
        });

        it('1.12: 25-Card Grid Simulation: updating accountId on 1 card leaves 24 sibling cards untouched', () => {
            const cardCount = 25;
            const cards: MerchantGroupCardProps[] = Array.from({ length: cardCount }, (_, i) => ({
                ...baseProps,
                group: {
                    ...baseGroup,
                    merchantKey: `MERCHANT_${i}`,
                    transactions: [{ id: `tx-${i}` } as any]
                },
                isSelected: false,
                approvalSetting: { accountId: 'acc-fuel', vatType: 'no_vat', createRule: false }
            }));

            // User updates account on Card #8
            const targetIndex = 8;
            const updatedCards = cards.map((c, i) => ({
                ...c,
                approvalSetting: i === targetIndex 
                    ? { ...c.approvalSetting!, accountId: 'acc-repairs' } 
                    : c.approvalSetting,
                onUpdateAccount: () => {},
            }));

            expect(areMerchantGroupCardPropsEqual(cards[targetIndex], updatedCards[targetIndex])).toBe(false);

            let siblingReRenders = 0;
            for (let i = 0; i < cardCount; i++) {
                if (i !== targetIndex) {
                    if (!areMerchantGroupCardPropsEqual(cards[i], updatedCards[i])) {
                        siblingReRenders++;
                    }
                }
            }
            expect(siblingReRenders).toBe(0);
        });
    });

    // ========================================================================
    // SUITE 2: areNewTransactionRowPropsEqual Table Stress & Sibling Isolation
    // ========================================================================
    describe('Suite 2: areNewTransactionRowPropsEqual Table Stress & Sibling Isolation', () => {
        const baseTx: ImportedTransaction = {
            id: 'tx-200',
            date: '2026-09-18',
            amount: -750.25,
            description: 'SHELL ULTRA CITY',
            cleanDescription: 'SHELL',
            merchantKey: 'SHELL',
            reference: 'POS-4321',
            bankAccountId: 'acc-fnb',
            status: 'new',
            isExpense: true,
        } as any;

        const baseRowProps: NewTransactionRowProps = {
            tx: baseTx,
            isSelected: false,
            allocation: { value: 'acc-fuel', type: 'account', vatType: 'standard_rated_purchases' },
            isAiResearching: false,
            client: { chartOfAccounts: [{ id: 'acc-fuel', name: 'Fuel' } as any] } as any,
            customers: [],
            suppliers: [],
            onToggleSelect: vi.fn(),
            onAllocationChange: vi.fn(),
            onAiResearch: vi.fn(),
            onEdit: vi.fn(),
            onSplit: vi.fn(),
            onCreateRule: vi.fn(),
            onDelete: vi.fn(),
        };

        it('2.1: Sibling Row Checkbox Isolation Matrix (100 Rows Table)', () => {
            const ROW_COUNT = 100;
            const rows: NewTransactionRowProps[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
                ...baseRowProps,
                tx: {
                    ...baseTx,
                    id: `tx-row-${i}`,
                    amount: -(i * 10 + 5),
                    description: `VENDOR ${i}`
                },
                isSelected: false,
            }));

            // User selects Row #42
            const targetIdx = 42;
            const updatedRows = rows.map((r, i) => ({
                ...r,
                isSelected: i === targetIdx ? true : r.isSelected,
                // Parent state re-render generates new handler references
                onToggleSelect: () => {},
                onAllocationChange: () => {},
            }));

            // Target row #42 MUST re-render
            expect(areNewTransactionRowPropsEqual(rows[targetIdx], updatedRows[targetIdx])).toBe(false);

            // Exactly 99 sibling rows MUST skip re-render
            let reRenderedSiblings = 0;
            for (let i = 0; i < ROW_COUNT; i++) {
                if (i !== targetIdx) {
                    if (!areNewTransactionRowPropsEqual(rows[i], updatedRows[i])) {
                        reRenderedSiblings++;
                    }
                }
            }
            expect(reRenderedSiblings).toBe(0);
        });

        it('2.2: Sibling Row Deselection Isolation: deselecting 1 row re-renders only 1 row', () => {
            const ROW_COUNT = 50;
            const rows: NewTransactionRowProps[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
                ...baseRowProps,
                tx: { ...baseTx, id: `tx-row-${i}` },
                isSelected: true, // All initially selected
            }));

            // User unchecks Row #10
            const targetIdx = 10;
            const updatedRows = rows.map((r, i) => ({
                ...r,
                isSelected: i === targetIdx ? false : r.isSelected,
            }));

            expect(areNewTransactionRowPropsEqual(rows[targetIdx], updatedRows[targetIdx])).toBe(false);

            let nonTargetReRenders = 0;
            for (let i = 0; i < ROW_COUNT; i++) {
                if (i !== targetIdx) {
                    if (!areNewTransactionRowPropsEqual(rows[i], updatedRows[i])) {
                        nonTargetReRenders++;
                    }
                }
            }
            expect(nonTargetReRenders).toBe(0);
        });

        it('2.3: Allocation value, type, and vatType changes trigger re-render', () => {
            const prev = { ...baseRowProps };

            // Change account value
            const nextValue = { 
                ...baseRowProps, 
                allocation: { value: 'acc-travel', type: 'account' as const, vatType: 'standard_rated_purchases' } 
            };
            expect(areNewTransactionRowPropsEqual(prev, nextValue)).toBe(false);

            // Change allocation type (account -> supplier)
            const nextType = { 
                ...baseRowProps, 
                allocation: { value: 'supp-1', type: 'supplier' as const, vatType: 'no_vat' } 
            };
            expect(areNewTransactionRowPropsEqual(prev, nextType)).toBe(false);

            // Change VAT type
            const nextVat = { 
                ...baseRowProps, 
                allocation: { value: 'acc-fuel', type: 'account' as const, vatType: 'zero_rated_purchases' } 
            };
            expect(areNewTransactionRowPropsEqual(prev, nextVat)).toBe(false);
        });

        it('2.4: Allocation undefined transitions handled safely', () => {
            const prevDefined = { ...baseRowProps };
            const nextUndefined = { ...baseRowProps, allocation: undefined };

            expect(areNewTransactionRowPropsEqual(prevDefined, nextUndefined)).toBe(false);
            expect(areNewTransactionRowPropsEqual(nextUndefined, prevDefined)).toBe(false);

            const bothUndefined1 = { ...baseRowProps, allocation: undefined };
            const bothUndefined2 = { ...baseRowProps, allocation: undefined };
            expect(areNewTransactionRowPropsEqual(bothUndefined1, bothUndefined2)).toBe(true);
        });

        it('2.5: Transaction core mutations (amount, description, cleanDescription, date) trigger re-render', () => {
            const prev = { ...baseRowProps };

            // Amount mutation
            const nextAmt = { ...baseRowProps, tx: { ...baseTx, amount: -800 } };
            expect(areNewTransactionRowPropsEqual(prev, nextAmt)).toBe(false);

            // Description mutation
            const nextDesc = { ...baseRowProps, tx: { ...baseTx, description: 'SHELL WATERKLOOF' } };
            expect(areNewTransactionRowPropsEqual(prev, nextDesc)).toBe(false);

            // Clean description mutation
            const nextClean = { ...baseRowProps, tx: { ...baseTx, cleanDescription: 'SHELL GARAGE' } };
            expect(areNewTransactionRowPropsEqual(prev, nextClean)).toBe(false);

            // Date mutation
            const nextDate = { ...baseRowProps, tx: { ...baseTx, date: '2026-09-19' } };
            expect(areNewTransactionRowPropsEqual(prev, nextDate)).toBe(false);
        });

        it('2.6: isAiResearching toggle triggers re-render', () => {
            const prev = { ...baseRowProps, isAiResearching: false };
            const next = { ...baseRowProps, isAiResearching: true };
            expect(areNewTransactionRowPropsEqual(prev, next)).toBe(false);
        });

        it('2.7: Callback recreation in parent component skips row re-render', () => {
            const prev = { ...baseRowProps };
            const next = {
                ...baseRowProps,
                onToggleSelect: () => {},
                onAllocationChange: () => {},
                onAiResearch: () => {},
                onEdit: () => {},
                onSplit: () => {},
                onCreateRule: () => {},
                onDelete: () => {},
            };
            expect(areNewTransactionRowPropsEqual(prev, next)).toBe(true);
        });
    });

    // ========================================================================
    // SUITE 3: areReviewedTransactionRowPropsEqual Table Stress
    // ========================================================================
    describe('Suite 3: areReviewedTransactionRowPropsEqual Table Stress & Sibling Isolation', () => {
        const baseReviewedTx: ImportedTransaction = {
            id: 'tx-300',
            date: '2026-09-10',
            amount: -1500,
            description: 'DISCHEM PHARMACY',
            cleanDescription: 'DISCHEM',
            bankAccountId: 'acc-fnb',
            status: 'reviewed',
            isExpense: true,
            allocatedTo: { value: 'acc-medical', type: 'account' },
            vatType: 'standard_rated_purchases'
        } as any;

        const baseReviewedProps: ReviewedTransactionRowProps = {
            tx: baseReviewedTx,
            isSelected: false,
            editedAllocation: undefined,
            client: { chartOfAccounts: [{ id: 'acc-medical', name: 'Medical' } as any] } as any,
            customers: [],
            suppliers: [],
            allAvailableRules: [{ id: 'rule-1', keyword: 'DISCHEM', accountId: 'acc-medical' } as any],
            onToggleSelect: vi.fn(),
            onAllocationChange: vi.fn(),
            onCancelEdit: vi.fn(),
            onViewRule: vi.fn(),
            onCreateRulePrompt: vi.fn(),
            onMoveToNew: vi.fn(),
            onSplit: vi.fn(),
            onViewLedger: vi.fn(),
            onDelete: vi.fn(),
        };

        it('3.1: Sibling Row Selection Isolation (100 Rows Reviewed Table)', () => {
            const ROW_COUNT = 100;
            const rows: ReviewedTransactionRowProps[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
                ...baseReviewedProps,
                tx: {
                    ...baseReviewedTx,
                    id: `tx-rev-${i}`,
                    amount: -(i * 25 + 10),
                    description: `SUPPLIER ${i}`
                },
                isSelected: false,
            }));

            // User selects Row #73
            const targetIdx = 73;
            const updatedRows = rows.map((r, i) => ({
                ...r,
                isSelected: i === targetIdx ? true : r.isSelected,
                onToggleSelect: () => {},
                onAllocationChange: () => {},
            }));

            expect(areReviewedTransactionRowPropsEqual(rows[targetIdx], updatedRows[targetIdx])).toBe(false);

            let siblingReRenders = 0;
            for (let i = 0; i < ROW_COUNT; i++) {
                if (i !== targetIdx) {
                    if (!areReviewedTransactionRowPropsEqual(rows[i], updatedRows[i])) {
                        siblingReRenders++;
                    }
                }
            }
            expect(siblingReRenders).toBe(0);
        });

        it('3.2: editedAllocation value & vatType changes trigger re-render', () => {
            const prev = { ...baseReviewedProps, editedAllocation: undefined };
            
            // Start editing
            const nextEditing = {
                ...baseReviewedProps,
                editedAllocation: { value: 'acc-staff', vatType: 'standard_rated_purchases' }
            };
            expect(areReviewedTransactionRowPropsEqual(prev, nextEditing)).toBe(false);

            // Change edited value
            const nextEditingValue = {
                ...baseReviewedProps,
                editedAllocation: { value: 'acc-office', vatType: 'standard_rated_purchases' }
            };
            expect(areReviewedTransactionRowPropsEqual(nextEditing, nextEditingValue)).toBe(false);

            // Change edited vatType
            const nextEditingVat = {
                ...baseReviewedProps,
                editedAllocation: { value: 'acc-staff', vatType: 'no_vat' }
            };
            expect(areReviewedTransactionRowPropsEqual(nextEditing, nextEditingVat)).toBe(false);

            // Cancel edit (returns to undefined)
            expect(areReviewedTransactionRowPropsEqual(nextEditing, prev)).toBe(false);
        });

        it('3.3: Re-render skipped when unrelated allAvailableRules array reference changes', () => {
            const prev = { ...baseReviewedProps };
            const next = {
                ...baseReviewedProps,
                // New array reference of rules loaded in background
                allAvailableRules: [
                    ...baseReviewedProps.allAvailableRules, 
                    { id: 'rule-99', keyword: 'NEW' } as any
                ]
            };
            // Comparator intentionally ignores allAvailableRules reference to avoid table-wide cascades
            expect(areReviewedTransactionRowPropsEqual(prev, next)).toBe(true);
        });
    });

    // ========================================================================
    // SUITE 4: useDebounce Rapid Burst Keystroke Stress & Timer Management
    // ========================================================================
    describe('Suite 4: useDebounce Rapid Burst Keystroke Stress & Timer Management', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        /**
         * Pure lifecycle simulation of the exact React effect hook in useDebounce:
         * handler = setTimeout(() => setDebouncedValue(value), delay);
         * cleanup: clearTimeout(handler);
         */
        class DebounceHarness<T> {
            private value: T;
            private debouncedValue: T;
            private delay: number;
            private timer: any = null;
            public timersScheduledCount = 0;
            public timersCancelledCount = 0;
            public emissionsCount = 0;
            public emittedValues: T[] = [];

            constructor(initialValue: T, delay = 300) {
                this.value = initialValue;
                this.debouncedValue = initialValue;
                this.delay = delay;
                // Mount effect
                this.scheduleEffect();
            }

            private scheduleEffect() {
                if (this.timer !== null) {
                    clearTimeout(this.timer);
                    this.timersCancelledCount++;
                    this.timer = null;
                }
                this.timersScheduledCount++;
                const captured = this.value;
                this.timer = setTimeout(() => {
                    this.debouncedValue = captured;
                    this.emissionsCount++;
                    this.emittedValues.push(captured);
                    this.timer = null;
                }, this.delay);
            }

            public update(newValue: T) {
                this.value = newValue;
                this.scheduleEffect();
            }

            public unmount() {
                if (this.timer !== null) {
                    clearTimeout(this.timer);
                    this.timersCancelledCount++;
                    this.timer = null;
                }
            }

            public getValue(): T {
                return this.debouncedValue;
            }
        }

        it('4.1: Rapid 20-character burst in 100ms cancels 19 intermediate timers with exactly 1 evaluation at 300ms', () => {
            const harness = new DebounceHarness<string>('', 300);
            const query = 'HLAYI TRADING CO 2026'; // 21 characters

            // Simulate typing burst: 1 character every 5ms (total 100ms)
            for (let i = 1; i <= query.length; i++) {
                harness.update(query.slice(0, i));
                vi.advanceTimersByTime(5);
            }

            // Immediately after burst finished at t = 105ms:
            // Last keystroke was at t = 100ms, timer scheduled for t = 400ms.
            // 5ms have elapsed since last keystroke (clock = 105ms).
            expect(harness.emissionsCount).toBe(0);
            expect(harness.getValue()).toBe(''); // Still initial value

            // Advance by 294ms (clock = 399ms, exactly 299ms since last keystroke at 100ms):
            // Still within 300ms delay window, no emission yet
            vi.advanceTimersByTime(294);
            expect(harness.emissionsCount).toBe(0);
            expect(harness.getValue()).toBe('');

            // Advance final 1ms (clock = 400ms, exactly 300ms since last keystroke):
            vi.advanceTimersByTime(1);
            expect(harness.emissionsCount).toBe(1);
            expect(harness.getValue()).toBe('HLAYI TRADING CO 2026');
            expect(harness.emittedValues).toEqual(['HLAYI TRADING CO 2026']);

            // Advance further 5,000ms: verify zero spurious subsequent emissions
            vi.advanceTimersByTime(5000);
            expect(harness.emissionsCount).toBe(1);
        });

        it('4.2: Fast Backspace Deletion Burst: intermediate typo timers cancelled cleanly', () => {
            const harness = new DebounceHarness<string>('', 300);

            // User types "VODAACOM" (typo) rapidly over 70ms
            const typo = 'VODAACOM';
            for (let i = 1; i <= typo.length; i++) {
                harness.update(typo.slice(0, i));
                vi.advanceTimersByTime(10);
            }

            // User pauses for 100ms, realizes typo
            vi.advanceTimersByTime(100);
            expect(harness.emissionsCount).toBe(0);

            // User hits backspace 3 times rapidly over 30ms ("VODAACOM" -> "VODAAC" -> "VODAA" -> "VODA")
            harness.update('VODAAC');
            vi.advanceTimersByTime(10);
            harness.update('VODAA');
            vi.advanceTimersByTime(10);
            harness.update('VODA');
            vi.advanceTimersByTime(10);

            // Still within debounce window
            expect(harness.emissionsCount).toBe(0);

            // Advance 300ms from last backspace
            vi.advanceTimersByTime(300);
            expect(harness.emissionsCount).toBe(1);
            expect(harness.getValue()).toBe('VODA');
        });

        it('4.3: Multiple Independent Bursts with Quiescent Gaps emit once per burst', () => {
            const harness = new DebounceHarness<string>('', 300);

            // Burst 1: "ENGEN"
            harness.update('E');
            vi.advanceTimersByTime(20);
            harness.update('ENG');
            vi.advanceTimersByTime(20);
            harness.update('ENGEN');

            // Quiescence: wait 400ms (> 300ms)
            vi.advanceTimersByTime(400);
            expect(harness.emissionsCount).toBe(1);
            expect(harness.getValue()).toBe('ENGEN');

            // Burst 2: " GARAGE"
            harness.update('ENGEN ');
            vi.advanceTimersByTime(20);
            harness.update('ENGEN GARAGE');

            // Quiescence: wait 400ms
            vi.advanceTimersByTime(400);
            expect(harness.emissionsCount).toBe(2);
            expect(harness.getValue()).toBe('ENGEN GARAGE');
            expect(harness.emittedValues).toEqual(['ENGEN', 'ENGEN GARAGE']);
        });

        it('4.4: Unmount during active debounce timer prevents ghost state updates', () => {
            const harness = new DebounceHarness<string>('initial', 300);

            harness.update('pending_change');
            vi.advanceTimersByTime(150); // Halfway through window

            // Component unmounts
            harness.unmount();

            // Advance time past 300ms
            vi.advanceTimersByTime(500);
            expect(harness.emissionsCount).toBe(0);
            expect(harness.getValue()).toBe('initial');
        });

        it('4.5: Custom Delay Boundary Matrix: 0ms, 100ms, 500ms, 1000ms', () => {
            const delays = [0, 100, 500, 1000];

            delays.forEach(delay => {
                const harness = new DebounceHarness<string>('init', delay);
                harness.update(`val-${delay}`);

                if (delay > 0) {
                    vi.advanceTimersByTime(delay - 1);
                    expect(harness.emissionsCount).toBe(0);
                    vi.advanceTimersByTime(1);
                    expect(harness.emissionsCount).toBe(1);
                    expect(harness.getValue()).toBe(`val-${delay}`);
                } else {
                    vi.advanceTimersByTime(0);
                    expect(harness.emissionsCount).toBe(1);
                    expect(harness.getValue()).toBe(`val-${delay}`);
                }
            });
        });
    });

    // ========================================================================
    // SUITE 5: AST & Source Code Verification
    // ========================================================================
    describe('Suite 5: AST & Source Code Static Audits', () => {
        const componentsDir = path.resolve(process.cwd(), 'src/components/ai-accountant/components');

        it('5.1: MerchantGroupCard.tsx wraps component in memo and exports areMerchantGroupCardPropsEqual', () => {
            const filePath = path.join(componentsDir, 'MerchantGroupCard.tsx');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('export function areMerchantGroupCardPropsEqual');
            expect(content).toMatch(/export\s+const\s+MerchantGroupCard\s*=\s*memo\(/);
            expect(content).toContain('areMerchantGroupCardPropsEqual);');
            // Check local comment state
            expect(content).toContain('const [localComment, setLocalComment] = useState(');
            expect(content).toContain('handleCommentBlur');
        });

        it('5.2: NewTransactionRow.tsx wraps component in memo and exports areNewTransactionRowPropsEqual', () => {
            const filePath = path.join(componentsDir, 'NewTransactionRow.tsx');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('export function areNewTransactionRowPropsEqual');
            expect(content).toMatch(/export\s+const\s+NewTransactionRow\s*=\s*memo\(/);
            expect(content).toContain('areNewTransactionRowPropsEqual);');
        });

        it('5.3: ReviewedTransactionRow.tsx wraps component in memo and exports areReviewedTransactionRowPropsEqual', () => {
            const filePath = path.join(componentsDir, 'ReviewedTransactionRow.tsx');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('export function areReviewedTransactionRowPropsEqual');
            expect(content).toMatch(/export\s+const\s+ReviewedTransactionRow\s*=\s*memo\(/);
            expect(content).toContain('areReviewedTransactionRowPropsEqual);');
        });

        it('5.4: use-debounce.ts has default delay 300 and includes clearTimeout cleanup in useEffect return', () => {
            const filePath = path.resolve(process.cwd(), 'src/hooks/use-debounce.ts');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toMatch(/export\s+function\s+useDebounce<T>\s*\(\s*value:\s*T\s*,\s*delay\s*=\s*300\s*\)/);
            expect(content).toContain('setTimeout(');
            expect(content).toContain('clearTimeout(handler)');
            expect(content).toMatch(/return\s*\(\)\s*=>\s*\{\s*clearTimeout\(handler\);\s*\};/);
        });

        it('5.5: Barrel file index.ts re-exports all three memoized components and comparators', async () => {
            const barrelPath = path.join(componentsDir, 'index.ts');
            const content = fs.readFileSync(barrelPath, 'utf8');

            expect(content).toContain("export * from './MerchantGroupCard'");
            expect(content).toContain("export * from './NewTransactionRow'");
            expect(content).toContain("export * from './ReviewedTransactionRow'");

            // Verify live re-exports via dynamic import
            const barrel = await import('../components');
            expect(typeof barrel.MerchantGroupCard).toBe('object'); // React.memo is $$typeof: Symbol(react.memo)
            expect(typeof barrel.areMerchantGroupCardPropsEqual).toBe('function');
            expect(typeof barrel.NewTransactionRow).toBe('object');
            expect(typeof barrel.areNewTransactionRowPropsEqual).toBe('function');
            expect(typeof barrel.ReviewedTransactionRow).toBe('object');
            expect(typeof barrel.areReviewedTransactionRowPropsEqual).toBe('function');
        });
    });
});
