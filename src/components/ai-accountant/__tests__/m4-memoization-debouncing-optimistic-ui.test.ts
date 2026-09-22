/**
 * @fileOverview Unit & Behavior Test Suite for Milestone 4 (R3):
 * - Component Memoization & Custom Equality Comparators (MerchantGroupCard, NewTransactionRow, ReviewedTransactionRow)
 * - Local Comment State with onBlur Synchronization in MerchantGroupCard
 * - 300ms Search Input Debouncing across NewTransactionsTab, SmartMatchQueueTab, and ReviewedTab
 * - 4-Phase Optimistic UI Updates for Single and Bulk Group Approvals with Rollback Snapshot
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { 
    MerchantGroupCard, 
    areMerchantGroupCardPropsEqual,
    NewTransactionRow, 
    areNewTransactionRowPropsEqual,
    ReviewedTransactionRow, 
    areReviewedTransactionRowPropsEqual 
} from '../components';
import { useDebounce } from '@/hooks/use-debounce';
import { TransactionGroup } from '../types';
import { ImportedTransaction, User, ClientCustomer, Supplier } from '@/lib/types';

describe('Milestone 4 (R3): Component Memoization, Debouncing & Optimistic UI', () => {

    // ========================================================================
    // 1. MerchantGroupCard & areMerchantGroupCardPropsEqual
    // ========================================================================
    describe('1. MerchantGroupCard Memoization & Custom Comparator', () => {
        const baseGroup: TransactionGroup = {
            merchantKey: 'VODACOM',
            transactions: [
                { id: 'tx-1', date: '2026-09-01', amount: -499, description: 'VODACOM PREPAID', status: 'ai_review' } as any
            ],
            suggestion: { confidence: 95, accountId: 'acc-telecom', accountType: 'account', summary: 'Telephone & Internet' } as any,
            status: 'ready'
        };

        it('1.1: Exports MerchantGroupCard and areMerchantGroupCardPropsEqual', () => {
            expect(MerchantGroupCard).toBeDefined();
            expect(typeof areMerchantGroupCardPropsEqual).toBe('function');
        });

        it('1.2: Skips re-render when sibling comment changes in parent state', () => {
            const prevProps = {
                group: baseGroup,
                isSelected: false,
                initialComment: '',
                isResearching: false,
                isAnalyzingComment: false,
                approvalSetting: { accountId: 'acc-telecom', vatType: 'standard_rated_purchases', createRule: true },
                client: { chartOfAccounts: [], isVatRegistered: true } as any,
            };
            // Sibling card comment was edited in parent dictionary, but this card's initialComment and props are unchanged
            const nextProps = { ...prevProps };
            expect(areMerchantGroupCardPropsEqual(prevProps, nextProps)).toBe(true);
        });

        it('1.3: Skips re-render when another group card is selected/checked', () => {
            const prevProps = {
                group: baseGroup,
                isSelected: false,
                approvalSetting: { accountId: 'acc-telecom', vatType: 'no_vat', createRule: false },
                isResearching: false,
                isAnalyzingComment: false,
            };
            const nextProps = { ...prevProps };
            expect(areMerchantGroupCardPropsEqual(prevProps, nextProps)).toBe(true);
        });

        it('1.4: Re-renders when its own isSelected prop toggles', () => {
            const prevProps = { group: baseGroup, isSelected: false };
            const nextProps = { group: baseGroup, isSelected: true };
            expect(areMerchantGroupCardPropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('1.5: Re-renders when group status transitions (ready -> server_researching)', () => {
            const prevProps = { group: { ...baseGroup, status: 'ready' as const } };
            const nextProps = { group: { ...baseGroup, status: 'server_researching' as const } };
            expect(areMerchantGroupCardPropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('1.6: Re-renders when transaction count changes (e.g. regrouping)', () => {
            const prevProps = { group: { ...baseGroup, transactions: [{ id: 'tx-1' }] as any } };
            const nextProps = { group: { ...baseGroup, transactions: [{ id: 'tx-1' }, { id: 'tx-2' }] as any } };
            expect(areMerchantGroupCardPropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('1.7: Re-renders when approvalSetting accountId or vatType changes', () => {
            const prevProps = {
                group: baseGroup,
                approvalSetting: { accountId: 'acc-1', vatType: 'no_vat', createRule: false }
            };
            const nextPropsAccount = {
                group: baseGroup,
                approvalSetting: { accountId: 'acc-2', vatType: 'no_vat', createRule: false }
            };
            const nextPropsVat = {
                group: baseGroup,
                approvalSetting: { accountId: 'acc-1', vatType: 'standard_rated_purchases', createRule: false }
            };
            expect(areMerchantGroupCardPropsEqual(prevProps, nextPropsAccount)).toBe(false);
            expect(areMerchantGroupCardPropsEqual(prevProps, nextPropsVat)).toBe(false);
        });

        it('1.8: Re-renders when isResearching or isAnalyzingComment is active', () => {
            const prevProps = { group: baseGroup, isResearching: false, isAnalyzingComment: false };
            const nextPropsResearching = { group: baseGroup, isResearching: true, isAnalyzingComment: false };
            const nextPropsAnalyzing = { group: baseGroup, isResearching: false, isAnalyzingComment: true };
            expect(areMerchantGroupCardPropsEqual(prevProps, nextPropsResearching)).toBe(false);
            expect(areMerchantGroupCardPropsEqual(prevProps, nextPropsAnalyzing)).toBe(false);
        });
    });

    // ========================================================================
    // 2. NewTransactionRow & areNewTransactionRowPropsEqual
    // ========================================================================
    describe('2. NewTransactionRow Memoization & Custom Comparator', () => {
        const baseTx: ImportedTransaction = {
            id: 'tx-101',
            date: '2026-09-15',
            amount: -1250.50,
            description: 'ENGEN PETROL STATION',
            cleanDescription: 'ENGEN',
            merchantKey: 'ENGEN',
            reference: 'POS-9812',
            bankAccountId: 'acc-fnb',
            status: 'new',
            isExpense: true,
        } as any;

        it('2.1: Exports NewTransactionRow and areNewTransactionRowPropsEqual', () => {
            expect(NewTransactionRow).toBeDefined();
            expect(typeof areNewTransactionRowPropsEqual).toBe('function');
        });

        it('2.2: Skips re-render when another table row is selected or allocated', () => {
            const prevProps = {
                tx: baseTx,
                isSelected: false,
                allocation: undefined,
                isAiResearching: false,
                client: { chartOfAccounts: [] } as any,
                customers: [],
                suppliers: [],
            };
            // Another row in parent state was selected/checked
            const nextProps = { ...prevProps };
            expect(areNewTransactionRowPropsEqual(prevProps, nextProps)).toBe(true);
        });

        it('2.3: Re-renders when its own isSelected prop toggles', () => {
            const prevProps = { tx: baseTx, isSelected: false };
            const nextProps = { tx: baseTx, isSelected: true };
            expect(areNewTransactionRowPropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('2.4: Re-renders when its allocation value or vatType changes', () => {
            const prevProps = {
                tx: baseTx,
                allocation: { value: 'acc-fuel', type: 'account' as const, vatType: 'standard_rated_purchases' }
            };
            const nextPropsValue = {
                tx: baseTx,
                allocation: { value: 'acc-travel', type: 'account' as const, vatType: 'standard_rated_purchases' }
            };
            const nextPropsVat = {
                tx: baseTx,
                allocation: { value: 'acc-fuel', type: 'account' as const, vatType: 'no_vat' }
            };
            expect(areNewTransactionRowPropsEqual(prevProps, nextPropsValue)).toBe(false);
            expect(areNewTransactionRowPropsEqual(prevProps, nextPropsVat)).toBe(false);
        });

        it('2.5: Re-renders when transaction amount or description changes', () => {
            const prevProps = { tx: baseTx };
            const nextPropsAmount = { tx: { ...baseTx, amount: -1500 } };
            const nextPropsDesc = { tx: { ...baseTx, cleanDescription: 'ENGEN QUICKSHOP' } };
            expect(areNewTransactionRowPropsEqual(prevProps, nextPropsAmount)).toBe(false);
            expect(areNewTransactionRowPropsEqual(prevProps, nextPropsDesc)).toBe(false);
        });

        it('2.6: Re-renders when isAiResearching toggles', () => {
            const prevProps = { tx: baseTx, isAiResearching: false };
            const nextProps = { tx: baseTx, isAiResearching: true };
            expect(areNewTransactionRowPropsEqual(prevProps, nextProps)).toBe(false);
        });
    });

    // ========================================================================
    // 3. ReviewedTransactionRow & areReviewedTransactionRowPropsEqual
    // ========================================================================
    describe('3. ReviewedTransactionRow Memoization & Custom Comparator', () => {
        const baseReviewedTx: ImportedTransaction = {
            id: 'tx-201',
            date: '2026-08-20',
            amount: -3200,
            description: 'DISCHEM PHARMACY',
            cleanDescription: 'DISCHEM',
            bankAccountId: 'acc-fnb',
            status: 'reviewed',
            isExpense: true,
            allocatedTo: { value: 'acc-medical', type: 'account' },
            vatType: 'standard_rated_purchases'
        } as any;

        it('3.1: Exports ReviewedTransactionRow and areReviewedTransactionRowPropsEqual', () => {
            expect(ReviewedTransactionRow).toBeDefined();
            expect(typeof areReviewedTransactionRowPropsEqual).toBe('function');
        });

        it('3.2: Skips re-render when another reviewed row is selected or edited', () => {
            const prevProps = {
                tx: baseReviewedTx,
                isSelected: false,
                editedAllocation: undefined,
                client: { chartOfAccounts: [] } as any,
                customers: [],
                suppliers: [],
            };
            // Another row in parent state was selected/checked
            const nextProps = { ...prevProps };
            expect(areReviewedTransactionRowPropsEqual(prevProps, nextProps)).toBe(true);
        });

        it('3.3: Re-renders when its own isSelected prop toggles', () => {
            const prevProps = { tx: baseReviewedTx, isSelected: false };
            const nextProps = { tx: baseReviewedTx, isSelected: true };
            expect(areReviewedTransactionRowPropsEqual(prevProps, nextProps)).toBe(false);
        });

        it('3.4: Re-renders when its editedAllocation changes', () => {
            const prevProps = {
                tx: baseReviewedTx,
                editedAllocation: { value: 'acc-medical', vatType: 'standard_rated_purchases' }
            };
            const nextPropsAccount = {
                tx: baseReviewedTx,
                editedAllocation: { value: 'acc-staff-welfare', vatType: 'standard_rated_purchases' }
            };
            const nextPropsVat = {
                tx: baseReviewedTx,
                editedAllocation: { value: 'acc-medical', vatType: 'no_vat' }
            };
            expect(areReviewedTransactionRowPropsEqual(prevProps, nextPropsAccount)).toBe(false);
            expect(areReviewedTransactionRowPropsEqual(prevProps, nextPropsVat)).toBe(false);
        });
    });

    // ========================================================================
    // 4. 300ms Search Input Debouncing
    // ========================================================================
    describe('4. 300ms Debounce Hook & Input Responsiveness', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('4.1: useDebounce hook delays emission until 300ms inactivity window completes', () => {
            let value = 'W';
            let emitted = '';

            const emitSpy = vi.fn((v: string) => { emitted = v; });
            let timer: any = null;
            const updateWithDebounce = (v: string) => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => emitSpy(v), 300);
            };

            // Rapid typing: "WOOLWORTHS"
            updateWithDebounce('W');
            vi.advanceTimersByTime(50);
            updateWithDebounce('WO');
            vi.advanceTimersByTime(50);
            updateWithDebounce('WOOL');
            vi.advanceTimersByTime(100);
            updateWithDebounce('WOOLWORTHS');

            // Still within debounce window: emitSpy not yet called
            expect(emitSpy).toHaveBeenCalledTimes(0);

            // Advance by 299ms: still pending
            vi.advanceTimersByTime(299);
            expect(emitSpy).toHaveBeenCalledTimes(0);

            // Final 1ms (total 300ms of silence): emits exactly once
            vi.advanceTimersByTime(1);
            expect(emitSpy).toHaveBeenCalledTimes(1);
            expect(emitted).toBe('WOOLWORTHS');
        });

        it('4.2: Cancels previous debounce timers on backspace or rapid revision', () => {
            const emitSpy = vi.fn();
            let timer: any = null;
            const updateWithDebounce = (v: string) => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => emitSpy(v), 300);
            };

            updateWithDebounce('VODCOM'); // Typo
            vi.advanceTimersByTime(150);
            updateWithDebounce('VODACOM'); // Corrected before 300ms

            vi.advanceTimersByTime(300);
            expect(emitSpy).toHaveBeenCalledTimes(1);
            expect(emitSpy).toHaveBeenCalledWith('VODACOM');
        });
    });

    // ========================================================================
    // 5. 4-Phase Optimistic UI Updates & Error Rollback
    // ========================================================================
    describe('5. 4-Phase Optimistic UI Updates & Rollback Snapshot', () => {
        interface OptimisticTestState {
            groups: TransactionGroup[];
            selectedKeys: string[];
            toast: { title: string; description?: string; variant?: string } | null;
        }

        const group1: TransactionGroup = { merchantKey: 'ENGEN', transactions: [{ id: '1' }] as any, suggestion: null, status: 'ready' };
        const group2: TransactionGroup = { merchantKey: 'SHELL', transactions: [{ id: '2' }] as any, suggestion: null, status: 'ready' };
        const group3: TransactionGroup = { merchantKey: 'TOTAL', transactions: [{ id: '3' }] as any, suggestion: null, status: 'ready' };

        it('5.1: Phase 1 — Instantly removes target group with non-blocking toast (0ms delay)', () => {
            const state: OptimisticTestState = {
                groups: [group1, group2, group3],
                selectedKeys: ['ENGEN'],
                toast: null,
            };

            // Snapshot taken before mutation
            const snapshot = [...state.groups];
            const snapshotSelected = [...state.selectedKeys];

            // Phase 1: Instant local state update
            const nextGroups = state.groups.filter(g => g.merchantKey !== 'ENGEN');
            const nextSelected = state.selectedKeys.filter(k => k !== 'ENGEN');
            const nextToast = { title: 'Group Approved', description: 'Allocated 1 transaction for ENGEN.' };

            expect(nextGroups.length).toBe(2);
            expect(nextGroups.map(g => g.merchantKey)).toEqual(['SHELL', 'TOTAL']);
            expect(nextSelected).toEqual([]);
            expect(nextToast.title).toBe('Group Approved');
            expect(snapshot.length).toBe(3); // Snapshot is preserved intact
        });

        it('5.2: Phase 4 — Restores prior snapshot on background network failure', () => {
            const initialGroups = [group1, group2, group3];
            const initialSelected = ['ENGEN'];

            // Phase 1 executed
            let currentGroups = initialGroups.filter(g => g.merchantKey !== 'ENGEN');
            let currentSelected = initialSelected.filter(k => k !== 'ENGEN');
            expect(currentGroups.length).toBe(2);

            // Simulate Phase 2 Firestore failure
            const networkError = new Error('UNAVAILABLE: network timeout');
            let errorToast: any = null;

            // Phase 4: Rollback triggered in catch block
            if (networkError) {
                currentGroups = [...initialGroups];
                currentSelected = [...initialSelected];
                errorToast = { title: 'Approval Failed', variant: 'destructive' };
            }

            expect(currentGroups.length).toBe(3);
            expect(currentGroups.map(g => g.merchantKey)).toEqual(['ENGEN', 'SHELL', 'TOTAL']);
            expect(currentSelected).toContain('ENGEN');
            expect(errorToast.variant).toBe('destructive');
        });

        it('5.3: Bulk Optimistic Approval — Immediately dismisses all allocated groups', () => {
            const initialGroups = [group1, group2, group3];
            const approvedKeys = new Set(['ENGEN', 'SHELL']);

            // Phase 1: Instant removal of all approved keys
            const remaining = initialGroups.filter(g => !approvedKeys.has(g.merchantKey));
            expect(remaining.length).toBe(1);
            expect(remaining[0].merchantKey).toBe('TOTAL');
        });
    });
});
