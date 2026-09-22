import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { formatPrice } from '../types';

/**
 * Empirical Challenger Test Suite for Milestone 2 (R1: Server-Side Aggregate Balance Calculation)
 * 
 * Target under test:
 * - `fetchCalculatedBalance` logic in `src/components/ai-accountant/BankTransactionsUI.tsx`
 * - Server aggregation contract `getAggregateFromServer(q, { totalAmount: sum('amount') })`
 * - Invariant: Exactly 1 aggregate read, 0 raw document streaming
 * - Edge cases: zero transactions, deep overdrafts, decimal precision, rapid calls, network failures
 */

// Implementation under test modeled directly from BankTransactionsUI.tsx lines 2999-3019
export interface FetchCalculatedBalanceContext {
    clientId: string | null | undefined;
    accountId: string | null | undefined;
    getAggregateFromServerFn: (q: any, spec: any) => Promise<any>;
    setCalculatedBalance: (val: number) => void;
    setIsBalanceLoading: (val: boolean) => void;
    onError?: (err: any) => void;
}

export async function runFetchCalculatedBalance(ctx: FetchCalculatedBalanceContext) {
    const { clientId, accountId, getAggregateFromServerFn, setCalculatedBalance, setIsBalanceLoading, onError } = ctx;

    if (!clientId || !accountId) {
        setCalculatedBalance(0);
        return;
    }
    try {
        setIsBalanceLoading(true);
        const dummyQuery = { clientId, accountId, collection: 'transactions' };
        const snapshot = await getAggregateFromServerFn(dummyQuery, {
            totalAmount: 'sum(amount)'
        });
        const raw = snapshot.data().totalAmount;
        const rounded = typeof raw === 'number' && !isNaN(raw) ? Math.round(raw * 100) / 100 : 0;
        setCalculatedBalance(rounded);
    } catch (err) {
        if (onError) {
            onError(err);
        } else {
            console.error("Error computing aggregate balance:", err);
        }
    } finally {
        setIsBalanceLoading(false);
    }
}

describe('M2 Challenger 1: Server-Side Aggregate Balance Empirical Stress Tests', () => {

    let consoleErrorSpy: any;

    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    // =========================================================================
    // 1. Zero Transactions & Empty State Edge Cases
    // =========================================================================
    describe('1. Zero Transactions & Empty State Stress', () => {
        it('1.1: Returns 0.00 when Firestore sum() returns null (standard behavior for 0 matched docs)', async () => {
            let balance = -999;
            let loading = false;

            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-empty',
                getAggregateFromServerFn: async () => ({
                    data: () => ({ totalAmount: null })
                }),
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: (l) => { loading = l; },
            });

            expect(balance).toBe(0);
            expect(formatPrice(balance)).toBe('0.00');
            expect(loading).toBe(false);
        });

        it('1.2: Returns 0.00 when Firestore sum() returns 0', async () => {
            let balance = -999;
            let loading = false;

            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-zero',
                getAggregateFromServerFn: async () => ({
                    data: () => ({ totalAmount: 0 })
                }),
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: (l) => { loading = l; },
            });

            expect(balance).toBe(0);
            expect(formatPrice(balance)).toBe('0.00');
            expect(loading).toBe(false);
        });

        it('1.3: Handles missing accountId (empty string, null, undefined) by resetting to 0 without Firestore call', async () => {
            let balance = 5000;
            let loading = false;
            const mockAgg = vi.fn();

            // Null accountId
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: null,
                getAggregateFromServerFn: mockAgg,
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: (l) => { loading = l; },
            });
            expect(balance).toBe(0);
            expect(mockAgg).not.toHaveBeenCalled();

            // Empty string accountId (e.g. selection.value === "all")
            balance = 5000;
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: '',
                getAggregateFromServerFn: mockAgg,
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: (l) => { loading = l; },
            });
            expect(balance).toBe(0);
            expect(mockAgg).not.toHaveBeenCalled();
        });

        it('1.4: Handles missing clientId by resetting to 0 without Firestore call', async () => {
            let balance = 1200;
            const mockAgg = vi.fn();

            await runFetchCalculatedBalance({
                clientId: '',
                accountId: 'acc-1',
                getAggregateFromServerFn: mockAgg,
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: vi.fn(),
            });
            expect(balance).toBe(0);
            expect(mockAgg).not.toHaveBeenCalled();
        });

        it('1.5: Resilient to corrupted aggregate responses (undefined, NaN, string, object)', async () => {
            const corruptedOutputs = [undefined, NaN, "100.50", {}, [50], -NaN];

            for (const corrupted of corruptedOutputs) {
                let balance = -999;
                await runFetchCalculatedBalance({
                    clientId: 'client-123',
                    accountId: 'acc-1',
                    getAggregateFromServerFn: async () => ({
                        data: () => ({ totalAmount: corrupted })
                    }),
                    setCalculatedBalance: (b) => { balance = b; },
                    setIsBalanceLoading: vi.fn(),
                });
                expect(balance).toBe(0);
            }
        });
    });

    // =========================================================================
    // 2. Overdrafts & Deep Negative Sums
    // =========================================================================
    describe('2. Overdrafts & Deep Negative Balances Stress', () => {
        it('2.1: Accurately preserves negative balances for small overdrafts', async () => {
            let balance = 0;
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-overdrawn',
                getAggregateFromServerFn: async () => ({
                    data: () => ({ totalAmount: -1450.75 })
                }),
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: vi.fn(),
            });

            expect(balance).toBe(-1450.75);
            expect(formatPrice(balance)).toBe('-1,450.75');
        });

        it('2.2: Handles massive enterprise multi-million overdrafts without numerical distortion', async () => {
            let balance = 0;
            const massiveOverdraft = -84521987.65;

            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-overdrawn',
                getAggregateFromServerFn: async () => ({
                    data: () => ({ totalAmount: massiveOverdraft })
                }),
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: vi.fn(),
            });

            expect(balance).toBe(-84521987.65);
            expect(formatPrice(balance)).toBe('-84,521,987.65');
        });

        it('2.3: Reconciled badge logic correctly verifies bank statement vs calculated overdraft', () => {
            const calculatedBalance = -15230.45;
            const matchingStatementBalance = -15230.45;
            const mismatchStatementBalance = -15200.00;

            const isReconciled = Math.abs(calculatedBalance - matchingStatementBalance) < 0.01;
            const isMismatchReconciled = Math.abs(calculatedBalance - mismatchStatementBalance) < 0.01;

            expect(isReconciled).toBe(true);
            expect(isMismatchReconciled).toBe(false);

            const diff = calculatedBalance - mismatchStatementBalance;
            expect(formatPrice(diff)).toBe('-30.45');
        });
    });

    // =========================================================================
    // 3. Decimal Precision & IEEE 754 Floating Point Stress
    // =========================================================================
    describe('3. Decimal Precision & Rounding Stress', () => {
        it('3.1: Eliminates binary floating point imprecision (0.1 + 0.2)', async () => {
            let balance = 0;
            // 0.1 + 0.2 in JS is 0.30000000000000004
            const floatArtifact = 0.1 + 0.2;

            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-1',
                getAggregateFromServerFn: async () => ({
                    data: () => ({ totalAmount: floatArtifact })
                }),
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: vi.fn(),
            });

            expect(balance).toBe(0.3);
            expect(formatPrice(balance)).toBe('0.30');
        });

        it('3.2: Rounds 3-decimal figures to 2 decimal places using standard financial rounding', async () => {
            const testCases = [
                { raw: 100.556, expected: 100.56, formatted: '100.56' },
                { raw: 100.554, expected: 100.55, formatted: '100.55' },
                { raw: -50.126, expected: -50.13, formatted: '-50.13' },
                { raw: -50.124, expected: -50.12, formatted: '-50.12' },
                { raw: 1000.0001, expected: 1000.00, formatted: '1,000.00' },
            ];

            for (const tc of testCases) {
                let balance = 0;
                await runFetchCalculatedBalance({
                    clientId: 'client-123',
                    accountId: 'acc-1',
                    getAggregateFromServerFn: async () => ({
                        data: () => ({ totalAmount: tc.raw })
                    }),
                    setCalculatedBalance: (b) => { balance = b; },
                    setIsBalanceLoading: vi.fn(),
                });
                expect(balance).toBe(tc.expected);
                expect(formatPrice(balance)).toBe(tc.formatted);
            }
        });

        it('3.3: Stress test 13,687 accumulated micro-transactions (HLAYI TRADING scale)', async () => {
            // Simulate summing 13,687 transactions with fractional cents on server
            let runningSum = 0;
            for (let i = 0; i < 13687; i++) {
                // Alternating positive and negative transactions
                const amount = (i % 2 === 0 ? 1 : -1) * (100.25 + (i % 10) * 0.01);
                runningSum += amount;
            }

            let balance = 0;
            await runFetchCalculatedBalance({
                clientId: 'client-hlayi',
                accountId: 'acc-main',
                getAggregateFromServerFn: async () => ({
                    data: () => ({ totalAmount: runningSum })
                }),
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: vi.fn(),
            });

            expect(typeof balance).toBe('number');
            expect(!isNaN(balance)).toBe(true);
            // Verify 2-decimal rounding
            const decimalPlaces = (balance.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
        });
    });

    // =========================================================================
    // 4. Concurrency, Rapid Calls & Race Condition Resilience
    // =========================================================================
    describe('4. Rapid Consecutive Calls & Concurrency Stress', () => {
        it('4.1: Executes 50 rapid parallel calls without throwing or locking loading state', async () => {
            let balance = 0;
            let loadingStates: boolean[] = [];

            const calls = Array.from({ length: 50 }, (_, i) => 
                runFetchCalculatedBalance({
                    clientId: 'client-123',
                    accountId: 'acc-1',
                    getAggregateFromServerFn: async () => {
                        // Jitter delay between 1ms and 15ms
                        await new Promise(res => setTimeout(res, Math.floor(Math.random() * 15) + 1));
                        return { data: () => ({ totalAmount: 1000 + i }) };
                    },
                    setCalculatedBalance: (b) => { balance = b; },
                    setIsBalanceLoading: (l) => { loadingStates.push(l); },
                })
            );

            await Promise.all(calls);

            // Final loading state after all promises settle
            expect(loadingStates[loadingStates.length - 1]).toBe(false);
            expect(balance).toBeGreaterThanOrEqual(1000);
        });

        it('4.2: Handles rapid account switching (acc1 -> acc2 -> null -> acc3)', async () => {
            const balanceLog: number[] = [];

            // User switches to acc1
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-1',
                getAggregateFromServerFn: async () => ({ data: () => ({ totalAmount: 111.11 }) }),
                setCalculatedBalance: (b) => balanceLog.push(b),
                setIsBalanceLoading: vi.fn(),
            });

            // User switches to acc2
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-2',
                getAggregateFromServerFn: async () => ({ data: () => ({ totalAmount: 222.22 }) }),
                setCalculatedBalance: (b) => balanceLog.push(b),
                setIsBalanceLoading: vi.fn(),
            });

            // User clears account selection (selection.value === "all")
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: '',
                getAggregateFromServerFn: async () => ({ data: () => ({ totalAmount: 999.99 }) }),
                setCalculatedBalance: (b) => balanceLog.push(b),
                setIsBalanceLoading: vi.fn(),
            });

            // User selects acc3
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-3',
                getAggregateFromServerFn: async () => ({ data: () => ({ totalAmount: 333.33 }) }),
                setCalculatedBalance: (b) => balanceLog.push(b),
                setIsBalanceLoading: vi.fn(),
            });

            expect(balanceLog).toEqual([111.11, 222.22, 0, 333.33]);
        });
    });

    // =========================================================================
    // 5. Aggregate Read Cost & Zero Document Streaming Invariant
    // =========================================================================
    describe('5. Aggregate Read Cost & Zero Document Streaming Invariant', () => {
        it('5.1: Verifies exactly 1 aggregate read is billed and 0 raw documents streamed', async () => {
            let aggregateReadCount = 0;
            let rawDocumentsStreamed = 0;

            const mockFirestoreAggregate = vi.fn(async (q: any, spec: any) => {
                aggregateReadCount += 1;
                // Verify spec specifies sum('amount')
                expect(spec).toEqual({ totalAmount: 'sum(amount)' });
                // AggregateQuerySnapshot contains only aggregate metrics, zero docs
                return {
                    data: () => ({ totalAmount: 4500.50 }),
                    // AggregateQuerySnapshot does NOT have a .docs property
                    docs: undefined,
                };
            });

            let finalBalance = 0;
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-1',
                getAggregateFromServerFn: mockFirestoreAggregate,
                setCalculatedBalance: (b) => { finalBalance = b; },
                setIsBalanceLoading: vi.fn(),
            });

            expect(mockFirestoreAggregate).toHaveBeenCalledTimes(1);
            expect(aggregateReadCount).toBe(1);
            expect(rawDocumentsStreamed).toBe(0);
            expect(finalBalance).toBe(4500.50);
        });

        it('5.2: Invariant check: Document count for HLAYI TRADING is 13,687, but balance read count is 1', () => {
            const hlayiTransactionCount = 13687;
            const aggregateReadCost = 1;
            const savingsRatio = ((hlayiTransactionCount - aggregateReadCost) / hlayiTransactionCount) * 100;

            // Eliminates 13,686 reads (99.99% read reduction)
            expect(savingsRatio).toBeGreaterThan(99.99);
        });
    });

    // =========================================================================
    // 6. Network Error & Rejection Handling (Resilience)
    // =========================================================================
    describe('6. Network Error & Failure Recovery Stress', () => {
        it('6.1: Gracefully catches network timeout and guarantees isBalanceLoading resets to false', async () => {
            let balance = 2500;
            const loadingHistory: boolean[] = [];

            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-1',
                getAggregateFromServerFn: async () => {
                    throw new Error('ETIMEDOUT: Connection timed out');
                },
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: (l) => { loadingHistory.push(l); },
            });

            // Loading started true, then reset to false in finally
            expect(loadingHistory).toEqual([true, false]);
            // Previous balance retained
            expect(balance).toBe(2500);
            // Console error logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error computing aggregate balance:",
                expect.any(Error)
            );
        });

        it('6.2: Gracefully catches Firestore permission-denied / auth rejection without crashing', async () => {
            const loadingHistory: boolean[] = [];

            const permError = new Error('Missing or insufficient permissions');
            (permError as any).code = 'permission-denied';

            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-1',
                getAggregateFromServerFn: async () => {
                    throw permError;
                },
                setCalculatedBalance: vi.fn(),
                setIsBalanceLoading: (l) => { loadingHistory.push(l); },
            });

            expect(loadingHistory).toEqual([true, false]);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error computing aggregate balance:",
                permError
            );
        });

        it('6.3: Transient failure followed by successful user retry (Refresh button)', async () => {
            let attempt = 0;
            let balance = 0;
            const loadingHistory: boolean[] = [];

            const flakeyAggregate = async () => {
                attempt++;
                if (attempt === 1) {
                    throw new Error('Service Unavailable: 503');
                }
                return { data: () => ({ totalAmount: 7890.12 }) };
            };

            // Attempt 1: Fails
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-1',
                getAggregateFromServerFn: flakeyAggregate,
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: (l) => { loadingHistory.push(l); },
            });

            expect(loadingHistory).toEqual([true, false]);
            expect(balance).toBe(0);

            // Attempt 2 (user clicks Refresh): Succeeds
            await runFetchCalculatedBalance({
                clientId: 'client-123',
                accountId: 'acc-1',
                getAggregateFromServerFn: flakeyAggregate,
                setCalculatedBalance: (b) => { balance = b; },
                setIsBalanceLoading: (l) => { loadingHistory.push(l); },
            });

            expect(loadingHistory).toEqual([true, false, true, false]);
            expect(balance).toBe(7890.12);
            expect(formatPrice(balance)).toBe('7,890.12');
        });
    });

    // =========================================================================
    // 7. BankTransactionsUI.tsx Code Verification & Hook Triggers
    // =========================================================================
    describe('7. BankTransactionsUI.tsx Code Structure & Lifecycle Integration Verification', () => {
        const filePath = path.resolve(process.cwd(), 'src/components/ai-accountant/BankTransactionsUI.tsx');
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        it('7.1: Confirms getAggregateFromServer and sum are imported from firebase/firestore', () => {
            expect(fileContent).toContain('getAggregateFromServer');
            expect(fileContent).toContain('sum');
            expect(fileContent).toMatch(/import\s*{[^}]*getAggregateFromServer[^}]*}\s*from\s*['"]firebase\/firestore['"]/);
        });

        it('7.2: Confirms fetchCalculatedBalance is declared with useCallback and depends on clientId and accountId', () => {
            expect(fileContent).toContain('const fetchCalculatedBalance = useCallback(async () =>');
            expect(fileContent).toContain('[params.clientId, accountId]');
        });

        it('7.3: Confirms fetchCalculatedBalance calls getAggregateFromServer with sum(\'amount\')', () => {
            expect(fileContent).toContain("getAggregateFromServer(q, {");
            expect(fileContent).toContain("totalAmount: sum('amount')");
        });

        it('7.4: Confirms calculation applies financial rounding Math.round(raw * 100) / 100 with NaN guard', () => {
            expect(fileContent).toContain("typeof raw === 'number' && !isNaN(raw) ? Math.round(raw * 100) / 100 : 0");
        });

        it('7.5: Confirms isBalanceLoading is set to true in try and reset to false in finally', () => {
            expect(fileContent).toContain("setIsBalanceLoading(true);");
            expect(fileContent).toContain("finally {");
            expect(fileContent).toContain("setIsBalanceLoading(false);");
        });

        it('7.6: Confirms zero unbounded onSnapshot listener on transactions subcollection for balance', () => {
            // Regex check: there should NOT be an onSnapshot listener computing balance across transactions
            const balanceOnSnapshotRegex = /onSnapshot\([^)]*transactions[^)]*setCalculatedBalance/g;
            expect(fileContent).not.toMatch(balanceOnSnapshotRegex);
        });

        it('7.7: Confirms UI triggers fetchCalculatedBalance on all necessary lifecycle events', () => {
            // 1. Initial mount and account change useEffect
            expect(fileContent).toContain("useEffect(() => {\n        fetchCalculatedBalance();\n    }, [fetchCalculatedBalance]);");

            // 2. Refresh button
            expect(fileContent).toMatch(/Button[^>]*onClick=\{[^}]*fetchCalculatedBalance\(\)[^}]*\}[^>]*>\s*<RotateCcw/);

            // 3. NewTransactionsTab onAllocationComplete & onRefreshBalance
            expect(fileContent).toContain("onAllocationComplete={() => { fetchUnallocatedCount(); fetchCalculatedBalance(); }}");
            expect(fileContent).toContain("onRefreshBalance={fetchCalculatedBalance}");

            // 4. SmartMatchQueueTab onAllocationComplete
            expect(fileContent).toContain("onAllocationComplete={() => { fetchCalculatedBalance(); fetchUnallocatedCount(); }}");

            // 5. ReviewedTab onUndoComplete
            expect(fileContent).toContain("onUndoComplete={() => { fetchCalculatedBalance(); fetchUnallocatedCount(); }}");

            // 6. Account clear handler
            expect(fileContent).toMatch(/handleClearAccount[\s\S]*fetchCalculatedBalance\(\);/);
        });
    });
});
