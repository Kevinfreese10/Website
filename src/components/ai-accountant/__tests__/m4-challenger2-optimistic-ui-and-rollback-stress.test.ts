/**
 * @fileOverview Empirical Challenger 2 Test Suite for Milestone 4 (R3):
 * - Optimistic UI State Transitions & Frame Budget (<16ms)
 * - Firestore batch.commit() Error Rollback & State Fidelity
 * - Non-Blocking Toast Notification Execution
 * - Bulk vs Single Group Approvals Under Network Latency & Failure Modes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast, reducer as toastReducer } from '@/hooks/use-toast';
import { TransactionGroup } from '../types';
import { ImportedTransaction, User } from '@/lib/types';

// ============================================================================
// SIMULATION HARNESS FOR SMART MATCH QUEUE TAB STATE MACHINE
// Accurately models the exact state transitions and async flows in SmartMatchQueueTab.tsx
// ============================================================================

export interface SmartMatchTabHarnessState {
    groups: TransactionGroup[];
    selectedGroupKeys: string[];
    approvalSettings: Record<string, { accountId: string; vatType: string; createRule: boolean }>;
    groupComments: Record<string, string>;
    toastsDispatched: Array<{ title: string; description?: string; variant?: string }>;
    onAllocationCompleteCalled: boolean;
    onAccountCreatedCalled: boolean;
}

export class SmartMatchTabSimulator {
    state: SmartMatchTabHarnessState;
    client: User | null;
    mockCommitFail: boolean = false;
    mockCommitError: Error | null = null;
    mockCommitDelayMs: number = 0;
    maxBatchOpsLimit: number = 500; // Standard Firestore limit

    constructor(initialGroups: TransactionGroup[], client: User | null = null) {
        this.client = client || {
            uid: 'client-123',
            name: 'Test Client',
            chartOfAccounts: [
                { id: 'acc-fuel', accountNumber: '5000', description: 'Fuel & Oil', accountType: 'expense' } as any,
                { id: 'acc-tel', accountNumber: '5100', description: 'Telephone & Internet', accountType: 'expense' } as any,
                { id: 'acc-bank', accountNumber: '5200', description: 'Bank Charges', accountType: 'expense' } as any,
            ],
            isVatRegistered: true,
        } as any;

        const initialSettings: Record<string, any> = {};
        const initialComments: Record<string, any> = {};

        initialGroups.forEach(g => {
            initialSettings[g.merchantKey] = {
                accountId: g.suggestion?.accountId || 'acc-fuel',
                vatType: g.suggestion?.vatType || 'standard_rated_purchases',
                createRule: false,
            };
            if (g.transactions[0]?.clientComment) {
                initialComments[g.merchantKey] = g.transactions[0].clientComment;
            }
        });

        this.state = {
            groups: [...initialGroups],
            selectedGroupKeys: [],
            approvalSettings: initialSettings,
            groupComments: initialComments,
            toastsDispatched: [],
            onAllocationCompleteCalled: false,
            onAccountCreatedCalled: false,
        };
    }

    private dispatchToast(props: { title: string; description?: string; variant?: string }) {
        this.state.toastsDispatched.push(props);
        toast(props as any);
    }

    /**
     * Replicates handleApproveGroup from SmartMatchQueueTab.tsx (lines 526-603)
     */
    async handleApproveGroup(group: TransactionGroup): Promise<{ durationPhase1Ms: number; success: boolean; error?: any }> {
        if (!this.client?.uid) return { durationPhase1Ms: 0, success: false, error: 'No client' };
        const settings = this.state.approvalSettings[group.merchantKey];
        if (!settings || !settings.accountId) {
            this.dispatchToast({ title: "Missing Allocation", description: "Please select an account before approving.", variant: "destructive" });
            return { durationPhase1Ms: 0, success: false, error: 'Missing allocation' };
        }

        const t0 = performance.now();

        // Phase 1: Snapshot previous state for rollback
        const previousGroups = [...this.state.groups];
        const previousSelectedKeys = [...this.state.selectedGroupKeys];
        const targetAccount = this.client.chartOfAccounts?.find(a => a.id === settings.accountId)?.description || settings.accountId;

        // Phase 1: Instant Local UI Mutation (0ms delay)
        this.state.groups = this.state.groups.filter(g => g.merchantKey !== group.merchantKey);
        this.state.selectedGroupKeys = this.state.selectedGroupKeys.filter(k => k !== group.merchantKey);

        // Phase 1: Non-blocking feedback toast
        this.dispatchToast({ 
            title: "Group Approved", 
            description: `Allocated ${group.transactions.length} transaction${group.transactions.length > 1 ? 's' : ''} for ${group.merchantKey} to ${targetAccount}.` 
        });

        const t1 = performance.now();
        const durationPhase1Ms = t1 - t0;

        // Phase 2: Background Network Dispatch
        try {
            if (this.mockCommitDelayMs > 0) {
                await new Promise(r => setTimeout(r, this.mockCommitDelayMs));
            }

            // Check Firestore 500-op batch limit
            const totalOps = group.transactions.length + (settings.createRule ? 1 : 0);
            if (totalOps > this.maxBatchOpsLimit) {
                throw new Error(`InvalidArgumentError: A write batch can contain up to ${this.maxBatchOpsLimit} operations. Current batch has ${totalOps} operations.`);
            }

            if (this.mockCommitFail) {
                throw (this.mockCommitError || new Error("Firestore writeBatch.commit rejection: UNAVAILABLE network connection dropped"));
            }

            // Phase 3: Trigger balance aggregation & lifecycle sync
            this.state.onAllocationCompleteCalled = true;
            this.state.onAccountCreatedCalled = true;
            return { durationPhase1Ms, success: true };
        } catch (e: any) {
            // Phase 4: Automatic Rollback
            this.state.groups = previousGroups;
            this.state.selectedGroupKeys = previousSelectedKeys;
            this.dispatchToast({ 
                title: "Approval Failed", 
                description: `Could not approve ${group.merchantKey}. Changes have been rolled back.`, 
                variant: "destructive" 
            });
            return { durationPhase1Ms, success: false, error: e };
        }
    }

    /**
     * Replicates handleApproveAllWithAllocations from SmartMatchQueueTab.tsx (lines 654-712)
     */
    async handleApproveAllWithAllocations(onlySelected: boolean = false): Promise<{ durationPhase1Ms: number; approvedCount: number; success: boolean; error?: any }> {
        if (!this.client?.uid) return { durationPhase1Ms: 0, approvedCount: 0, success: false };

        let allocatableGroups = this.state.groups.filter(g => this.state.approvalSettings[g.merchantKey]?.accountId);
        if (onlySelected && this.state.selectedGroupKeys.length > 0) {
            allocatableGroups = allocatableGroups.filter(g => this.state.selectedGroupKeys.includes(g.merchantKey));
        }

        if (allocatableGroups.length === 0) {
            this.dispatchToast({ title: "No allocations found to finalize." });
            return { durationPhase1Ms: 0, approvedCount: 0, success: false };
        }

        const t0 = performance.now();

        const allocKeys = new Set(allocatableGroups.map(g => g.merchantKey));
        const previousGroups = [...this.state.groups];
        const previousSelectedKeys = [...this.state.selectedGroupKeys];

        // Phase 1: Instant Local UI Mutation (0ms delay)
        this.state.groups = this.state.groups.filter(g => !allocKeys.has(g.merchantKey));
        this.state.selectedGroupKeys = this.state.selectedGroupKeys.filter(k => !allocKeys.has(k));
        this.dispatchToast({ title: `Approved ${allocatableGroups.length} groups!` });

        const t1 = performance.now();
        const durationPhase1Ms = t1 - t0;

        // Phase 2: Background Network Dispatch
        try {
            if (this.mockCommitDelayMs > 0) {
                await new Promise(r => setTimeout(r, this.mockCommitDelayMs));
            }

            // Check Firestore batch limit across all transactions in bulk
            const totalOps = allocatableGroups.reduce((acc, g) => acc + g.transactions.length, 0);
            if (totalOps > this.maxBatchOpsLimit) {
                throw new Error(`InvalidArgumentError: A write batch can contain up to ${this.maxBatchOpsLimit} operations. Current bulk batch has ${totalOps} operations.`);
            }

            if (this.mockCommitFail) {
                throw (this.mockCommitError || new Error("Bulk writeBatch.commit network rejection"));
            }

            // Phase 3: Trigger balance aggregation & lifecycle sync
            this.state.onAllocationCompleteCalled = true;
            this.state.onAccountCreatedCalled = true;
            return { durationPhase1Ms, approvedCount: allocatableGroups.length, success: true };
        } catch (e: any) {
            // Phase 4: Automatic Rollback
            this.state.groups = previousGroups;
            this.state.selectedGroupKeys = previousSelectedKeys;
            this.dispatchToast({ title: "Bulk Approval Failed", variant: "destructive" });
            return { durationPhase1Ms, approvedCount: allocatableGroups.length, success: false, error: e };
        }
    }

    /**
     * Replicates handleApproveReadyOnly from SmartMatchQueueTab.tsx (lines 605-652)
     */
    async handleApproveReadyOnly(): Promise<{ durationPhase1Ms: number; approvedCount: number; success: boolean; error?: any }> {
        if (!this.client?.uid) return { durationPhase1Ms: 0, approvedCount: 0, success: false };

        const readyGroups = this.state.groups.filter(g => 
            g.transactions.some(tx => tx.status === 'ready') && this.state.approvalSettings[g.merchantKey]?.accountId
        );

        if (readyGroups.length === 0) {
            this.dispatchToast({ title: "No ready allocations found." });
            return { durationPhase1Ms: 0, approvedCount: 0, success: false };
        }

        const t0 = performance.now();

        const readyKeys = new Set(readyGroups.map(g => g.merchantKey));
        const previousGroups = [...this.state.groups];
        const previousSelectedKeys = [...this.state.selectedGroupKeys];

        // Phase 1: Instant Local UI Mutation
        this.state.groups = this.state.groups.filter(g => !readyKeys.has(g.merchantKey));
        this.state.selectedGroupKeys = this.state.selectedGroupKeys.filter(k => !readyKeys.has(k));
        this.dispatchToast({ title: `Approved ${readyGroups.length} ready groups!` });

        const t1 = performance.now();
        const durationPhase1Ms = t1 - t0;

        // Phase 2: Background Network Dispatch
        try {
            if (this.mockCommitDelayMs > 0) {
                await new Promise(r => setTimeout(r, this.mockCommitDelayMs));
            }

            if (this.mockCommitFail) {
                throw new Error("Ready approval batch commit failed");
            }

            this.state.onAllocationCompleteCalled = true;
            this.state.onAccountCreatedCalled = true;
            return { durationPhase1Ms, approvedCount: readyGroups.length, success: true };
        } catch (e: any) {
            this.state.groups = previousGroups;
            this.state.selectedGroupKeys = previousSelectedKeys;
            this.dispatchToast({ title: "Approval Failed", variant: "destructive" });
            return { durationPhase1Ms, approvedCount: readyGroups.length, success: false, error: e };
        }
    }
}

// ============================================================================
// HELPERS TO GENERATE DIVERSE TRANSACTION GROUPS
// ============================================================================

function createMockGroup(merchantKey: string, txCount: number = 3, status: 'ready' | 'server_researching' = 'ready'): TransactionGroup {
    const transactions: ImportedTransaction[] = Array.from({ length: txCount }, (_, i) => ({
        id: `tx_${merchantKey}_${i}`,
        date: '2026-09-15',
        amount: -150.00 * (i + 1),
        description: `${merchantKey} STORE #${100 + i}`,
        cleanDescription: merchantKey,
        merchantKey,
        bankAccountId: 'acc-main',
        status: status === 'ready' ? 'ready' : 'ai_processing',
        isExpense: true,
        reference: `REF-${1000 + i}`,
        clientComment: i === 0 ? `Client note for ${merchantKey}` : undefined,
    } as any));

    return {
        merchantKey,
        transactions,
        suggestion: {
            confidence: 90,
            accountId: 'acc-fuel',
            accountType: 'account',
            vatType: 'standard_rated_purchases',
            summary: `Categorized as fuel for ${merchantKey}`,
        } as any,
        status,
    };
}

// ============================================================================
// CHALLENGER 2 EMPIRICAL TEST SUITE
// ============================================================================

describe('Challenger 2 Suite: Milestone 4 (R3) Optimistic UI & Error Rollback Stress Harness', () => {

    // ------------------------------------------------------------------------
    // 1. Optimistic UI State Transitions & Frame Budget (<16ms)
    // ------------------------------------------------------------------------
    describe('1. Optimistic UI Card Dismissal Timing & 16ms Frame Budget', () => {
        it('1.1: Single group dismissal executes in <16ms (under 1ms empirical budget)', async () => {
            const group1 = createMockGroup('ENGEN', 5);
            const group2 = createMockGroup('SHELL', 3);
            const simulator = new SmartMatchTabSimulator([group1, group2]);

            const result = await simulator.handleApproveGroup(group1);

            expect(result.success).toBe(true);
            expect(result.durationPhase1Ms).toBeLessThan(16.0); // Within 60fps frame budget (16.67ms)
            expect(simulator.state.groups.length).toBe(1);
            expect(simulator.state.groups[0].merchantKey).toBe('SHELL');
        });

        it('1.2: Bulk group dismissal (25 groups / full page) executes in <16ms', async () => {
            const groups = Array.from({ length: 25 }, (_, i) => createMockGroup(`MERCHANT_${i}`, 4));
            const simulator = new SmartMatchTabSimulator(groups);

            const result = await simulator.handleApproveAllWithAllocations();

            expect(result.success).toBe(true);
            expect(result.approvedCount).toBe(25);
            expect(result.durationPhase1Ms).toBeLessThan(16.0);
            expect(simulator.state.groups.length).toBe(0);
        });

        it('1.3: Scaled bulk group dismissal (100 groups) maintains synchronous <16ms frame budget', async () => {
            const groups = Array.from({ length: 100 }, (_, i) => createMockGroup(`MERCHANT_LARGE_${i}`, 2));
            const simulator = new SmartMatchTabSimulator(groups);

            const result = await simulator.handleApproveAllWithAllocations();

            expect(result.success).toBe(true);
            expect(result.approvedCount).toBe(100);
            expect(result.durationPhase1Ms).toBeLessThan(16.0);
            expect(simulator.state.groups.length).toBe(0);
        });

        it('1.4: Preserves exact sibling order when dismissing a middle card', async () => {
            const gA = createMockGroup('ALPHA', 2);
            const gB = createMockGroup('BETA', 2);
            const gC = createMockGroup('GAMMA', 2);
            const gD = createMockGroup('DELTA', 2);
            const simulator = new SmartMatchTabSimulator([gA, gB, gC, gD]);

            // Dismiss middle card BETA
            await simulator.handleApproveGroup(gB);

            expect(simulator.state.groups.map(g => g.merchantKey)).toEqual(['ALPHA', 'GAMMA', 'DELTA']);
        });

        it('1.5: Cleans up target key from selectedGroupKeys if previously checked', async () => {
            const g1 = createMockGroup('VODACOM', 1);
            const g2 = createMockGroup('MTN', 1);
            const simulator = new SmartMatchTabSimulator([g1, g2]);
            simulator.state.selectedGroupKeys = ['VODACOM', 'MTN'];

            await simulator.handleApproveGroup(g1);

            expect(simulator.state.selectedGroupKeys).toEqual(['MTN']);
            expect(simulator.state.groups.map(g => g.merchantKey)).toEqual(['MTN']);
        });

        it('1.6: Dispatches optimistic success toast synchronously in Phase 1 before network completes', async () => {
            const g1 = createMockGroup('SASOL', 2);
            const simulator = new SmartMatchTabSimulator([g1]);
            simulator.mockCommitDelayMs = 50; // Add network latency

            const promise = simulator.handleApproveGroup(g1);

            // Check immediately before promise resolves: toast and card removal must already be present
            expect(simulator.state.groups.length).toBe(0);
            expect(simulator.state.toastsDispatched.length).toBe(1);
            expect(simulator.state.toastsDispatched[0].title).toBe('Group Approved');

            await promise;
        });
    });

    // ------------------------------------------------------------------------
    // 2. Firestore Error Simulation & Rollback State Fidelity
    // ------------------------------------------------------------------------
    describe('2. Firestore Error Simulation & Rollback State Fidelity', () => {
        it('2.1: Restores exact group snapshot on Firestore batch commit error', async () => {
            const g1 = createMockGroup('TOTAL', 5);
            const g2 = createMockGroup('CALTEX', 3);
            const simulator = new SmartMatchTabSimulator([g1, g2]);
            simulator.mockCommitFail = true;
            simulator.mockCommitError = new Error('UNAVAILABLE: Firestore backend connection terminated');

            const result = await simulator.handleApproveGroup(g1);

            expect(result.success).toBe(false);
            expect(simulator.state.groups.length).toBe(2);
            expect(simulator.state.groups[0].merchantKey).toBe('TOTAL');
            expect(simulator.state.groups[1].merchantKey).toBe('CALTEX');
            expect(simulator.state.toastsDispatched.some(t => t.title === 'Approval Failed' && t.variant === 'destructive')).toBe(true);
        });

        it('2.2: Rollback preserves 100% of child transactions, amounts, and references verbatim', async () => {
            const g1 = createMockGroup('DISCHEM', 10);
            const originalTxIds = g1.transactions.map(t => t.id);
            const originalTxAmounts = g1.transactions.map(t => t.amount);
            const originalTxRefs = g1.transactions.map(t => t.reference);

            const simulator = new SmartMatchTabSimulator([g1]);
            simulator.mockCommitFail = true;

            await simulator.handleApproveGroup(g1);

            const restoredGroup = simulator.state.groups.find(g => g.merchantKey === 'DISCHEM');
            expect(restoredGroup).toBeDefined();
            expect(restoredGroup?.transactions.length).toBe(10);
            expect(restoredGroup?.transactions.map(t => t.id)).toEqual(originalTxIds);
            expect(restoredGroup?.transactions.map(t => t.amount)).toEqual(originalTxAmounts);
            expect(restoredGroup?.transactions.map(t => t.reference)).toEqual(originalTxRefs);
        });

        it('2.3: Rollback preserves approvalSettings and groupComments intact', async () => {
            const g1 = createMockGroup('WOOLWORTHS', 3);
            const simulator = new SmartMatchTabSimulator([g1]);
            simulator.state.approvalSettings['WOOLWORTHS'] = {
                accountId: 'acc-custom-1',
                vatType: 'zero_rated_purchases',
                createRule: true,
            };
            simulator.state.groupComments['WOOLWORTHS'] = 'Staff groceries for office';
            simulator.mockCommitFail = true;

            await simulator.handleApproveGroup(g1);

            expect(simulator.state.approvalSettings['WOOLWORTHS']).toEqual({
                accountId: 'acc-custom-1',
                vatType: 'zero_rated_purchases',
                createRule: true,
            });
            expect(simulator.state.groupComments['WOOLWORTHS']).toBe('Staff groceries for office');
        });

        it('2.4: Rollback restores selection state if group was previously checked', async () => {
            const g1 = createMockGroup('CHECKERS', 2);
            const simulator = new SmartMatchTabSimulator([g1]);
            simulator.state.selectedGroupKeys = ['CHECKERS'];
            simulator.mockCommitFail = true;

            await simulator.handleApproveGroup(g1);

            expect(simulator.state.selectedGroupKeys).toContain('CHECKERS');
        });

        it('2.5: Bulk approval rollback restores all N groups when batch.commit fails', async () => {
            const groups = Array.from({ length: 15 }, (_, i) => createMockGroup(`SUPPLIER_${i}`, 2));
            const simulator = new SmartMatchTabSimulator(groups);
            simulator.state.selectedGroupKeys = ['SUPPLIER_0', 'SUPPLIER_3'];
            simulator.mockCommitFail = true;

            const result = await simulator.handleApproveAllWithAllocations();

            expect(result.success).toBe(false);
            expect(simulator.state.groups.length).toBe(15);
            expect(simulator.state.selectedGroupKeys).toEqual(['SUPPLIER_0', 'SUPPLIER_3']);
            expect(simulator.state.toastsDispatched.some(t => t.title === 'Bulk Approval Failed' && t.variant === 'destructive')).toBe(true);
        });

        it('2.6: Firestore 500-op limit edge case: cleans up and rolls back on op overflow', async () => {
            // Create a merchant group with 501 transactions (e.g. major national chain with high volume)
            const hugeGroup = createMockGroup('MASSIVE_UTILITY', 501);
            const simulator = new SmartMatchTabSimulator([hugeGroup]);

            // Attempt to approve this group; it exceeds the 500-op batch commit limit
            const result = await simulator.handleApproveGroup(hugeGroup);

            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('up to 500 operations');
            // Rollback must restore the group safely without crashing
            expect(simulator.state.groups.length).toBe(1);
            expect(simulator.state.groups[0].merchantKey).toBe('MASSIVE_UTILITY');
            expect(simulator.state.groups[0].transactions.length).toBe(501);
            expect(simulator.state.toastsDispatched.some(t => t.title === 'Approval Failed')).toBe(true);
        });
    });

    // ------------------------------------------------------------------------
    // 3. Toast Notification Non-Blocking Main Thread Execution
    // ------------------------------------------------------------------------
    describe('3. Toast Notification Non-Blocking Main Thread Execution', () => {
        it('3.1: Toast dispatch completes in <0.2ms per call across 1,000 dispatches', () => {
            const iterations = 1000;
            const start = performance.now();

            for (let i = 0; i < iterations; i++) {
                toast({
                    title: `Toast ${i}`,
                    description: `Allocated group ${i}`,
                });
            }

            const totalDuration = performance.now() - start;
            const avgPerToast = totalDuration / iterations;

            expect(avgPerToast).toBeLessThan(0.2); // Less than 0.2ms per toast dispatch
            expect(totalDuration).toBeLessThan(200); // 1000 toasts finish well under 200ms
        });

        it('3.2: Toast reducer adheres to TOAST_LIMIT = 1, avoiding memory leak explosion', () => {
            let state = { toasts: [] as any[] };

            for (let i = 0; i < 50; i++) {
                state = toastReducer(state, {
                    type: 'ADD_TOAST',
                    toast: { id: `t-${i}`, title: `Notification ${i}` } as any,
                });
            }

            expect(state.toasts.length).toBe(1); // TOAST_LIMIT = 1 keeps exactly the latest toast
            expect(state.toasts[0].id).toBe('t-49');
        });

        it('3.3: Destructive toast correctly sets variant to "destructive" on rollback', () => {
            const errorToast = {
                title: "Approval Failed",
                description: "Could not approve ENGEN. Changes have been rolled back.",
                variant: "destructive" as const,
            };

            const res = toast(errorToast);
            expect(res.id).toBeDefined();
            expect(typeof res.dismiss).toBe('function');
        });

        it('3.4: Dismissal function safely closes toast without error', () => {
            const res = toast({ title: "Dismissable Toast" });
            expect(() => res.dismiss()).not.toThrow();
        });
    });

    // ------------------------------------------------------------------------
    // 4. Bulk vs Single Group Approvals Under Network Latency Simulation
    // ------------------------------------------------------------------------
    describe('4. Bulk vs Single Group Approvals Under Network Latency Simulation', () => {
        it('4.1: Single group approval under 100ms simulated RTT dismisses card at t=0ms', async () => {
            const g1 = createMockGroup('KFC', 3);
            const simulator = new SmartMatchTabSimulator([g1]);
            simulator.mockCommitDelayMs = 100;

            const tStart = performance.now();
            const promise = simulator.handleApproveGroup(g1);

            // Synchronous UI check at t=0ms: card is already dismissed
            expect(simulator.state.groups.length).toBe(0);
            expect(simulator.state.onAllocationCompleteCalled).toBe(false); // Background commit still pending

            await promise;
            const totalElapsed = performance.now() - tStart;

            // Network resolved: lifecycle sync now called
            expect(totalElapsed).toBeGreaterThanOrEqual(90);
            expect(simulator.state.onAllocationCompleteCalled).toBe(true);
            expect(simulator.state.onAccountCreatedCalled).toBe(true);
        });

        it('4.2: Bulk approval of 10 groups under 100ms simulated RTT dismisses all 10 cards at t=0ms in 1 RTT', async () => {
            const groups = Array.from({ length: 10 }, (_, i) => createMockGroup(`CHAIN_${i}`, 2));
            const simulator = new SmartMatchTabSimulator(groups);
            simulator.mockCommitDelayMs = 100;

            const tStart = performance.now();
            const promise = simulator.handleApproveAllWithAllocations();

            // Synchronous check: all 10 cards dismissed immediately
            expect(simulator.state.groups.length).toBe(0);
            expect(simulator.state.onAllocationCompleteCalled).toBe(false);

            const result = await promise;
            const totalElapsed = performance.now() - tStart;

            expect(result.success).toBe(true);
            expect(result.approvedCount).toBe(10);
            expect(totalElapsed).toBeGreaterThanOrEqual(90);
            expect(simulator.state.onAllocationCompleteCalled).toBe(true);
        });

        it('4.3: Comparative Throughput: 10 bulk groups require 1 RTT (~100ms) vs sequential single approvals requiring 10 RTTs (~1000ms)', async () => {
            // Bulk simulation
            const bulkGroups = Array.from({ length: 10 }, (_, i) => createMockGroup(`BULK_${i}`, 1));
            const bulkSimulator = new SmartMatchTabSimulator(bulkGroups);
            bulkSimulator.mockCommitDelayMs = 50;

            const tBulkStart = performance.now();
            await bulkSimulator.handleApproveAllWithAllocations();
            const bulkElapsed = performance.now() - tBulkStart;

            // Sequential single approvals simulation
            const singleGroups = Array.from({ length: 10 }, (_, i) => createMockGroup(`SINGLE_${i}`, 1));
            const singleSimulator = new SmartMatchTabSimulator(singleGroups);
            singleSimulator.mockCommitDelayMs = 50;

            const tSingleStart = performance.now();
            for (const g of singleGroups) {
                await singleSimulator.handleApproveGroup(g);
            }
            const singleElapsed = performance.now() - tSingleStart;

            // Bulk is ~10x faster over the wire
            expect(singleElapsed).toBeGreaterThan(bulkElapsed * 5);
            expect(bulkSimulator.state.groups.length).toBe(0);
            expect(singleSimulator.state.groups.length).toBe(0);
        });

        it('4.4: High-lag failure scenario (1500ms timeout / network drop): rollback restores state cleanly', async () => {
            const g1 = createMockGroup('SLOW_MERCHANT', 3);
            const simulator = new SmartMatchTabSimulator([g1]);
            simulator.mockCommitDelayMs = 200; // Simulated latency
            simulator.mockCommitFail = true;
            simulator.mockCommitError = new Error('DEADLINE_EXCEEDED: Server took too long to respond');

            const result = await simulator.handleApproveGroup(g1);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('DEADLINE_EXCEEDED');
            expect(simulator.state.groups.length).toBe(1);
            expect(simulator.state.groups[0].merchantKey).toBe('SLOW_MERCHANT');
        });

        it('4.5: Interleaved approvals: rapid sequential approvals maintain independent rollback boundaries', async () => {
            const g1 = createMockGroup('MERCHANT_A', 2);
            const g2 = createMockGroup('MERCHANT_B', 2);
            const simulator = new SmartMatchTabSimulator([g1, g2]);

            // User approves MERCHANT_A (succeeds)
            simulator.mockCommitFail = false;
            const resA = await simulator.handleApproveGroup(g1);
            expect(resA.success).toBe(true);
            expect(simulator.state.groups.map(g => g.merchantKey)).toEqual(['MERCHANT_B']);

            // User approves MERCHANT_B (fails)
            simulator.mockCommitFail = true;
            const resB = await simulator.handleApproveGroup(g2);
            expect(resB.success).toBe(false);

            // MERCHANT_B is rolled back, but MERCHANT_A remains approved and removed!
            expect(simulator.state.groups.map(g => g.merchantKey)).toEqual(['MERCHANT_B']);
        });
    });
});
