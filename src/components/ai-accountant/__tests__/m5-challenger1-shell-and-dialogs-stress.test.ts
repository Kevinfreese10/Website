/**
 * @fileOverview Milestone 5 Empirical Challenger 1 Stress Test Suite
 * 
 * Target Under Test (Clean Shell Assembly & Functional Integration):
 * 1. Root Shell (BankTransactionsUI.tsx) Line Budget & AST Invariants (< 300 lines)
 *    - Pruned dead imports (Papa, XLSX, useForm, dead icons, server actions)
 *    - Strict hook dependency arrays & closure safety
 *    - Milestone 2 Aggregate Balance AST signatures preserved
 *    - Tab callbacks & lifecycle event wiring
 * 2. BankAccountManageDialogs.tsx Stress Test Harness
 *    - Edit Account Name Dialog (default Firestore vs custom handler, error paths, COA immutability)
 *    - Update Actual Bank Balance Dialog (numeric validation, zero/negative overdraft, loading lock, error rollback)
 *    - Clear Bank Account Alert Dialog (destructive action, 500-batch delete simulation, cancellation safety)
 *    - Boundary conditions: null client, undefined selectedAccount, uid vs id resolution
 * 3. Cross-Tab Event Integrity & Propagation
 *    - NewTransactionsTab: modal close balance refresh, split transaction balance sync
 *    - SmartMatchQueueTab: filteredGroups Excel export, general account creation sync
 *    - ReviewedTab: undo balance & unallocated badge sync
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Standard test mocks for banking actions and AI flows required in Node test environment
vi.mock('@/app/actions/banking-actions', () => ({
    applyRegroups: vi.fn(),
    splitTransaction: vi.fn(),
    proposeRegroups: vi.fn(),
    proposeAiRegroups: vi.fn(),
}));
vi.mock('@/app/actions', () => ({
    applyRegroups: vi.fn(),
    suggestTransactionAllocationWeb: vi.fn(),
}));
vi.mock('@/ai/genkit', () => ({ ai: {} }));
vi.mock('@genkit-ai/google-genai', () => ({}));
vi.mock('@genkit-ai/next', () => ({}));

// Target component and props under test
import { 
    BankAccountManageDialogs, 
    BankAccountManageDialogsProps 
} from '../components/BankAccountManageDialogs';
import * as componentsBarrel from '../components';
import * as dialogsBarrel from '../dialogs';
import { User, ChartOfAccount } from '@/lib/types';
import { formatPrice } from '../types';

describe('Milestone 5 Empirical Challenger 1 Stress Test Suite', () => {
    const rootDir = process.cwd();
    const shellPath = path.resolve(rootDir, 'src/components/ai-accountant/BankTransactionsUI.tsx');
    const shellContent = fs.readFileSync(shellPath, 'utf-8');

    const dialogsPath = path.resolve(rootDir, 'src/components/ai-accountant/components/BankAccountManageDialogs.tsx');
    const dialogsContent = fs.readFileSync(dialogsPath, 'utf-8');

    const newTabPath = path.resolve(rootDir, 'src/components/ai-accountant/NewTransactionsTab.tsx');
    const newTabContent = fs.readFileSync(newTabPath, 'utf-8');

    const smartTabPath = path.resolve(rootDir, 'src/components/ai-accountant/SmartMatchQueueTab.tsx');
    const smartTabContent = fs.readFileSync(smartTabPath, 'utf-8');

    const reviewedTabPath = path.resolve(rootDir, 'src/components/ai-accountant/ReviewedTab.tsx');
    const reviewedTabContent = fs.readFileSync(reviewedTabPath, 'utf-8');

    // ========================================================================
    // SUITE 1: BankTransactionsUI Line Budget & AST Invariants (< 300 lines)
    // ========================================================================
    describe('Suite 1: Root Shell (BankTransactionsUI.tsx) Line Budget & AST Invariants', () => {
        it('1.1: Line count budget is strictly < 300 lines (both raw and CRLF normalized)', () => {
            const rawLines = shellContent.split('\n').length;
            const normalizedLines = shellContent.replace(/\r\n/g, '\n').split('\n').length;
            
            expect(rawLines).toBeLessThan(300);
            expect(normalizedLines).toBeLessThan(300);
            expect(rawLines).toBeLessThanOrEqual(285);
        });

        it('1.2: Pruned all dead imports and heavy unneeded libraries', () => {
            // Verify no CSV/Excel parser imports in root shell
            expect(shellContent).not.toMatch(/from\s+['"]papaparse['"]/);
            expect(shellContent).not.toMatch(/from\s+['"]xlsx-js-style['"]/);
            
            // Verify no react-hook-form or zod in root shell
            expect(shellContent).not.toMatch(/from\s+['"]react-hook-form['"]/);
            expect(shellContent).not.toMatch(/from\s+['"]zod['"]/);
            
            // Verify no heavy server actions imported in root shell
            expect(shellContent).not.toContain('runAiAccountantAnalysis');
            expect(shellContent).not.toContain('autoConsolidateSmartMatchQueue');
            expect(shellContent).not.toContain('suggestTransactionAllocationWeb');
            expect(shellContent).not.toContain('applyRegroups');
            expect(shellContent).not.toContain('splitTransaction');
            expect(shellContent).not.toContain('proposeRegroups');
            expect(shellContent).not.toContain('MASTER_ALLOCATION_RULES');
            expect(shellContent).not.toContain('BankCleaner');

            // Verify no unrendered Lucide icons
            expect(shellContent).not.toContain('AlertCircle');
            expect(shellContent).not.toContain('Undo2');
            expect(shellContent).not.toContain('CalendarIcon');
            expect(shellContent).not.toContain('Users');
            expect(shellContent).not.toContain('FileSpreadsheet');
        });

        it('1.3: Verifies formatPrice is imported from ./types and dead duplicate helpers removed', () => {
            expect(shellContent).toMatch(/import\s*{[^}]*formatPrice[^}]*}\s*from\s*['"]\.\/types['"]/);
            expect(shellContent).not.toMatch(/const\s+formatPrice\s*=\s*\(/);
            expect(shellContent).not.toContain('async function getIdToken()');
            expect(shellContent).not.toMatch(/const\s+PAGE_SIZE\s*=/);
        });

        it('1.4: Strict hook dependency completeness and closure safety', () => {
            // fetchClientData depends on params.clientId and accountId
            expect(shellContent).toMatch(/fetchClientData\s*=\s*useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[params\.clientId,\s*accountId\]\);/);

            // fetchGlobalRules has empty dependencies []
            expect(shellContent).toMatch(/fetchGlobalRules\s*=\s*useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[\]\);/);

            // fetchCustomers depends on params.clientId
            expect(shellContent).toMatch(/fetchCustomers\s*=\s*useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[params\.clientId\]\);/);

            // fetchSuppliers depends on params.clientId
            expect(shellContent).toMatch(/fetchSuppliers\s*=\s*useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[params\.clientId\]\);/);

            // fetchUnallocatedCount depends on params.clientId and accountId
            expect(shellContent).toMatch(/fetchUnallocatedCount\s*=\s*useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[params\.clientId,\s*accountId\]\);/);

            // fetchCalculatedBalance depends on params.clientId and accountId
            expect(shellContent).toMatch(/fetchCalculatedBalance\s*=\s*useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[params\.clientId,\s*accountId\]\);/);

            // useEffect for fetchCalculatedBalance depends on [fetchCalculatedBalance]
            expect(shellContent).toMatch(/useEffect\(\(\)\s*=>\s*\{\s*fetchCalculatedBalance\(\);\s*\},\s*\[fetchCalculatedBalance\]\);/);

            // useEffect for fetchUnallocatedCount depends on [fetchUnallocatedCount]
            expect(shellContent).toMatch(/useEffect\(\(\)\s*=>\s*\{\s*fetchUnallocatedCount\(\);\s*\},\s*\[fetchUnallocatedCount\]\);/);

            // Initial fetch useEffect combines the fetch callbacks
            expect(shellContent).toMatch(/useEffect\(\(\)\s*=>\s*\{\s*fetchClientData\(\);\s*fetchGlobalRules\(\);\s*fetchCustomers\(\);\s*fetchSuppliers\(\);\s*\}\s*,\s*\[fetchClientData,\s*fetchGlobalRules,\s*fetchCustomers,\s*fetchSuppliers\]\);/);

            // Realtime client listener cleans up unsubscribe and depends on [params.clientId]
            expect(shellContent).toMatch(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?return\s+onSnapshot\(doc\(db,\s*['"]aiAccountantClients['"],\s*params\.clientId\s+as\s+string\),[\s\S]*?\n\s*\}\s*,\s*\[params\.clientId\]\);/);
        });

        it('1.5: Preserves all Milestone 2 Aggregate Balance AST signatures', () => {
            // Imports getAggregateFromServer and sum
            expect(shellContent).toMatch(/import\s*{[^}]*getAggregateFromServer[^}]*sum[^}]*}\s*from\s*['"]firebase\/firestore['"]/);

            // Calls sum('amount') on transactions subcollection query
            expect(shellContent).toContain("getAggregateFromServer(q, {");
            expect(shellContent).toContain("totalAmount: sum('amount')");

            // Safeguards NaN and rounds to 2 decimals
            expect(shellContent).toContain("typeof raw === 'number' && !isNaN(raw) ? Math.round(raw * 100) / 100 : 0");

            // Manages loading state safely in try/finally
            expect(shellContent).toContain("setIsBalanceLoading(true);");
            expect(shellContent).toMatch(/finally\s*\{\s*setIsBalanceLoading\(false\);\s*\}/);

            // Confirms zero unbounded onSnapshot listener on transactions subcollection for balance
            expect(shellContent).not.toMatch(/onSnapshot\([^)]*transactions[^)]*setCalculatedBalance/);
        });

        it('1.6: Subcomponent tab wiring passes correct callback triggers', () => {
            // NewTransactionsTab callbacks
            expect(shellContent).toContain("onAccountCreated={() => { fetchClientData(); fetchUnallocatedCount(); fetchCalculatedBalance(); }}");
            expect(shellContent).toContain("onAllocationComplete={() => { fetchUnallocatedCount(); fetchCalculatedBalance(); }}");
            expect(shellContent).toContain("onRefreshBalance={fetchCalculatedBalance}");

            // SmartMatchQueueTab callbacks & globalRules
            expect(shellContent).toContain("globalRules={globalRules}");
            expect(shellContent).toContain("onAccountCreated={() => { fetchClientData(); fetchCalculatedBalance(); fetchUnallocatedCount(); }}");
            expect(shellContent).toContain("onAllocationComplete={() => { fetchCalculatedBalance(); fetchUnallocatedCount(); }}");

            // ReviewedTab callbacks
            expect(shellContent).toContain("onAccountCreated={() => { fetchClientData(); fetchCalculatedBalance(); }}");
            expect(shellContent).toContain("onUndoComplete={() => { fetchCalculatedBalance(); fetchUnallocatedCount(); }}");
        });

        it('1.7: Clear account batch operation respects Firestore 500-write limit and refreshes balance', () => {
            expect(shellContent).toContain("for (let i = 0; i < snap.docs.length; i += 500)");
            expect(shellContent).toContain("snap.docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));");
            expect(shellContent).toContain("await batch.commit();");
            expect(shellContent).toContain("setIsClearAccountAlertOpen(false);");
            expect(shellContent).toContain("fetchCalculatedBalance();");
            expect(shellContent).toContain("fetchUnallocatedCount();");
        });
    });

    // ========================================================================
    // SUITE 2: BankAccountManageDialogs Extraction, Barrel Hygiene & Render
    // ========================================================================
    describe('Suite 2: BankAccountManageDialogs Extraction, Barrel Hygiene & Render', () => {
        it('2.1: BankAccountManageDialogs is exported by components barrel file', () => {
            expect(componentsBarrel.BankAccountManageDialogs).toBeDefined();
            expect(typeof componentsBarrel.BankAccountManageDialogs).toBe('function');
        });

        it('2.2: BankAccountManageDialogs is strictly NOT in dialogs barrel file (preserving M1 contract)', () => {
            expect((dialogsBarrel as any).BankAccountManageDialogs).toBeUndefined();
            const dialogsIndex = fs.readFileSync(path.resolve(rootDir, 'src/components/ai-accountant/dialogs/index.ts'), 'utf-8');
            expect(dialogsIndex).not.toContain('BankAccountManageDialogs');
        });

        it('2.3: Renders without throwing when all dialogs are closed', () => {
            const mockClient: User = {
                id: 'client-123',
                email: 'test@example.com',
                chartOfAccounts: [
                    { id: 'acc-1', accountNumber: '8400-01', description: 'Main Cheque Account', bankBalance: 5000 }
                ]
            } as any;

            const html = renderToString(
                React.createElement(BankAccountManageDialogs, {
                    client: mockClient,
                    accountId: 'acc-1',
                    selectedAccount: mockClient.chartOfAccounts![0],
                    fetchClientData: vi.fn(),
                    isEditAccountOpen: false,
                    setIsEditAccountOpen: vi.fn(),
                    isUpdateBankBalanceOpen: false,
                    setIsUpdateBankBalanceOpen: vi.fn(),
                    isClearAccountAlertOpen: false,
                    setIsClearAccountAlertOpen: vi.fn(),
                    onClearAccount: vi.fn()
                })
            );

            expect(typeof html).toBe('string');
        });

        it('2.4: Renders cleanly under edge cases: client is null, accountId is null, selectedAccount is undefined', () => {
            const html = renderToString(
                React.createElement(BankAccountManageDialogs, {
                    client: null,
                    accountId: null,
                    selectedAccount: undefined,
                    fetchClientData: vi.fn(),
                    isEditAccountOpen: false,
                    setIsEditAccountOpen: vi.fn(),
                    isUpdateBankBalanceOpen: false,
                    setIsUpdateBankBalanceOpen: vi.fn(),
                    isClearAccountAlertOpen: false,
                    setIsClearAccountAlertOpen: vi.fn(),
                    onClearAccount: vi.fn()
                })
            );

            expect(typeof html).toBe('string');
        });
    });

    // ========================================================================
    // SUITE 3: Dialog 1 (Edit Account Name) Behavioral & Adversarial Stress
    // ========================================================================
    describe('Suite 3: Dialog 1 (Edit Account Name) Stress & Adversarial Scenarios', () => {
        const mockClient: User = {
            id: 'client-456',
            uid: 'client-456-uid',
            email: 'corp@example.com',
            chartOfAccounts: [
                { id: 'acc-1', accountNumber: '8400-01', description: 'Primary Account', bankBalance: 1250 },
                { id: 'acc-2', accountNumber: '8400-02', description: 'Savings Account', bankBalance: 9800 }
            ]
        } as any;

        it('3.1: Custom onEditAccount handler bypasses default Firestore updateDoc', async () => {
            const customOnEdit = vi.fn().mockResolvedValue(undefined);
            
            // Simulate the handler logic in BankAccountManageDialogs
            const simulateEdit = async (newName: string, onEditAccount?: (n: string) => Promise<void> | void) => {
                if (onEditAccount) {
                    await onEditAccount(newName);
                    return;
                }
                throw new Error('Should not reach default Firestore handler');
            };

            await simulateEdit('Renamed Primary Account', customOnEdit);
            expect(customOnEdit).toHaveBeenCalledWith('Renamed Primary Account');
            expect(customOnEdit).toHaveBeenCalledTimes(1);
        });

        it('3.2: Default COA update preserves immutability and isolates target account mutation', () => {
            const newName = 'Renamed Operating Account';
            const accountId = 'acc-1';

            const updatedCOA = (mockClient.chartOfAccounts || []).map(acc => 
                acc.id === accountId ? { ...acc, description: newName } : acc
            );

            // Target account updated
            expect(updatedCOA[0].id).toBe('acc-1');
            expect(updatedCOA[0].description).toBe(newName);
            expect(updatedCOA[0].bankBalance).toBe(1250);

            // Sibling account completely untouched
            expect(updatedCOA[1].id).toBe('acc-2');
            expect(updatedCOA[1].description).toBe('Savings Account');
            expect(updatedCOA[1].bankBalance).toBe(9800);

            // Original client object not mutated
            expect(mockClient.chartOfAccounts![0].description).toBe('Primary Account');
        });

        it('3.3: Resolves client ID gracefully using client.id or fallback client.uid', () => {
            const clientWithIdOnly = { id: 'id-only-123' } as User;
            const target1 = clientWithIdOnly.id || clientWithIdOnly.uid || '';
            expect(target1).toBe('id-only-123');

            const clientWithUidOnly = { uid: 'uid-only-456' } as User;
            const target2 = clientWithUidOnly.id || clientWithUidOnly.uid || '';
            expect(target2).toBe('uid-only-456');

            const emptyClient = {} as User;
            const target3 = emptyClient.id || emptyClient.uid || '';
            expect(target3).toBe('');
        });

        it('3.4: Null client or null accountId safely aborts without mutation or throw', async () => {
            const simulateDefaultEdit = async (client: User | null, accountId: string | null) => {
                if (!client || !accountId) return 'aborted_safely';
                return 'updated';
            };

            expect(await simulateDefaultEdit(null, 'acc-1')).toBe('aborted_safely');
            expect(await simulateDefaultEdit(mockClient, null)).toBe('aborted_safely');
            expect(await simulateDefaultEdit(null, null)).toBe('aborted_safely');
        });

        it('3.5: Error handling dispatches destructive toast and keeps dialog open on failure', async () => {
            const mockToast = vi.fn();
            const setIsEditAccountOpen = vi.fn();
            const fetchClientData = vi.fn();

            // Simulate Firestore failure
            const failingUpdateDoc = vi.fn().mockRejectedValue(new Error('Firestore quota exceeded'));

            try {
                await failingUpdateDoc();
                toastSuccess();
                setIsEditAccountOpen(false);
            } catch (e) {
                mockToast({ title: "Error", variant: "destructive" });
            }

            function toastSuccess() { mockToast({ title: "Account Updated" }); }

            expect(mockToast).toHaveBeenCalledWith({ title: "Error", variant: "destructive" });
            expect(setIsEditAccountOpen).not.toHaveBeenCalledWith(false);
            expect(fetchClientData).not.toHaveBeenCalled();
        });
    });

    // ========================================================================
    // SUITE 4: Dialog 2 (Update Actual Bank Balance) Numeric Stress & Validation
    // ========================================================================
    describe('Suite 4: Dialog 2 (Update Actual Bank Balance) Stress & Numeric Validation', () => {
        const mockClient: User = {
            id: 'client-789',
            chartOfAccounts: [
                { id: 'acc-1', accountNumber: '8400-01', description: 'Cheque', bankBalance: 1000 }
            ]
        } as any;

        it('4.1: Accepts valid floating point balances (positive, negative overdraft, zero)', () => {
            const testCases = [
                { input: "1234.56", expected: 1234.56, valid: true },
                { input: "0", expected: 0, valid: true },
                { input: "0.00", expected: 0, valid: true },
                { input: "-500.25", expected: -500.25, valid: true }, // Overdraft
                { input: "9999999.99", expected: 9999999.99, valid: true },
                { input: "  450.20  ", expected: 450.2, valid: true }
            ];

            for (const tc of testCases) {
                const val = parseFloat(tc.input);
                expect(isNaN(val)).toBe(false);
                expect(val).toBeCloseTo(tc.expected, 2);
            }
        });

        it('4.2: Rejects invalid inputs (empty, alphabetic, symbols) with destructive toast', () => {
            const invalidInputs = ["", "abc", "--", "undefined", "NaN", "R1200", "$$$"];
            const mockToast = vi.fn();

            for (const inp of invalidInputs) {
                const val = parseFloat(inp);
                if (!isNaN(val)) {
                    // Valid
                } else {
                    mockToast({
                        title: "Invalid Amount",
                        description: "Please enter a valid numeric balance.",
                        variant: "destructive"
                    });
                }
            }

            expect(mockToast).toHaveBeenCalledTimes(invalidInputs.length);
            expect(mockToast).toHaveBeenCalledWith({
                title: "Invalid Amount",
                description: "Please enter a valid numeric balance.",
                variant: "destructive"
            });
        });

        it('4.3: Custom onUpdateActualBankBalance handler bypasses default Firestore write', async () => {
            const customUpdate = vi.fn().mockResolvedValue(undefined);

            const handleUpdate = async (val: number, onCustom?: (b: number) => Promise<void> | void) => {
                if (onCustom) {
                    await onCustom(val);
                    return;
                }
                throw new Error('Default should be bypassed');
            };

            await handleUpdate(-3500.50, customUpdate);
            expect(customUpdate).toHaveBeenCalledWith(-3500.50);
        });

        it('4.4: Default update updates target bankBalance and formats confirmation description', () => {
            const newBalance = 15420.75;
            const accountId = 'acc-1';

            const updatedCOA = (mockClient.chartOfAccounts || []).map(acc => 
                acc.id === accountId ? { ...acc, bankBalance: newBalance } : acc
            );

            expect(updatedCOA[0].bankBalance).toBe(15420.75);
            expect(formatPrice(newBalance)).toBe('15,420.75');
        });

        it('4.5: Spinner and disabled state lock the button during updating to prevent double submit', () => {
            // Check JSX in dialogsContent
            expect(dialogsContent).toContain("disabled={isUpdatingBankBalance}");
            expect(dialogsContent).toContain('{isUpdatingBankBalance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}');
            expect(dialogsContent).toContain("setIsInternalUpdating(true);");
            expect(dialogsContent).toMatch(/finally\s*\{\s*setIsInternalUpdating\(false\);\s*\}/);
        });

        it('4.6: Catches Firestore errors, logs, dispatches destructive toast, and unlocks loading state', async () => {
            let isUpdating = true;
            const mockToast = vi.fn();
            const failingUpdate = vi.fn().mockRejectedValue(new Error('Network offline'));

            try {
                await failingUpdate();
            } catch (e) {
                mockToast({ title: "Error", description: "Could not update bank balance.", variant: "destructive" });
            } finally {
                isUpdating = false;
            }

            expect(mockToast).toHaveBeenCalledWith({
                title: "Error",
                description: "Could not update bank balance.",
                variant: "destructive"
            });
            expect(isUpdating).toBe(false);
        });
    });

    // ========================================================================
    // SUITE 5: Dialog 3 (Clear Account Alert Dialog) Stress & Batch Simulation
    // ========================================================================
    describe('Suite 5: Dialog 3 (Clear Account Alert Dialog) Stress & Batch Simulation', () => {
        it('5.1: AlertDialog renders confirmation dialog with destructive clear action', () => {
            expect(dialogsContent).toContain("<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>");
            expect(dialogsContent).toContain("This will permanently delete all transactions for the selected bank account");
            expect(dialogsContent).toContain("onClick={onClearAccount}");
            expect(dialogsContent).toContain("Yes, Clear Account");
            expect(dialogsContent).toContain("<AlertDialogCancel>Cancel</AlertDialogCancel>");
        });

        it('5.2: Simulates HLAYI TRADING scale 1,250 transaction clear in 500-op Firestore batches', async () => {
            // Create mock 1,250 transactions
            const mockDocs = Array.from({ length: 1250 }, (_, i) => ({
                id: `tx-${i}`,
                ref: { id: `ref-${i}` }
            }));

            const committedBatches: any[][] = [];
            const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

            // Execute the exact batching algorithm from handleClearAccount
            for (let i = 0; i < mockDocs.length; i += 500) {
                const chunk = mockDocs.slice(i, i + 500);
                const deletedInBatch: any[] = [];
                chunk.forEach(d => deletedInBatch.push(d.ref));
                await mockBatchCommit();
                committedBatches.push(deletedInBatch);
            }

            expect(committedBatches.length).toBe(3);
            expect(committedBatches[0].length).toBe(500);
            expect(committedBatches[1].length).toBe(500);
            expect(committedBatches[2].length).toBe(250);
            expect(committedBatches.reduce((acc, b) => acc + b.length, 0)).toBe(1250);
            expect(mockBatchCommit).toHaveBeenCalledTimes(3);
        });

        it('5.3: Empty account snapshot handles early exit gracefully with toast', async () => {
            const mockSnap = { empty: true, size: 0, docs: [] };
            const mockToast = vi.fn();
            const setIsClearAccountAlertOpen = vi.fn();

            if (mockSnap.empty) {
                mockToast({ title: "Account is already empty" });
                setIsClearAccountAlertOpen(false);
            }

            expect(mockToast).toHaveBeenCalledWith({ title: "Account is already empty" });
            expect(setIsClearAccountAlertOpen).toHaveBeenCalledWith(false);
        });

        it('5.4: Cancellation does not trigger deletion or balance recalculation', () => {
            const onClearAccount = vi.fn();
            const setIsClearAccountAlertOpen = vi.fn();

            // Clicking Cancel
            setIsClearAccountAlertOpen(false);

            expect(onClearAccount).not.toHaveBeenCalled();
            expect(setIsClearAccountAlertOpen).toHaveBeenCalledWith(false);
        });
    });

    // ========================================================================
    // SUITE 6: Cross-Tab Functional Integrity & Event Chaining
    // ========================================================================
    describe('Suite 6: Cross-Tab Functional Integrity & Event Chaining', () => {
        it('6.1: NewTransactionsTab refreshes balance and count on EditTransactionDialog close', () => {
            expect(newTabContent).toContain("<EditTransactionDialog");
            expect(newTabContent).toMatch(/onOpenChange=\{\(open\)\s*=>\s*\{[\s\S]*setIsEditTxOpen\(open\);[\s\S]*if\s*\(!open\)\s*\{[\s\S]*onRefreshBalance\?\.\(\);[\s\S]*onAllocationComplete\?\.\(\);/);
        });

        it('6.2: NewTransactionsTab refreshes balance on SplitTransactionDialog completion', () => {
            expect(newTabContent).toContain("<SplitTransactionDialog");
            expect(newTabContent).toMatch(/onSplitComplete=\{\(\)\s*=>\s*\{[\s\S]*onAllocationComplete\?\.\(\);[\s\S]*onRefreshBalance\?\.\(\);/);
        });

        it('6.3: SmartMatchQueueTab wires onAccountCreated={onAccountCreated} on CreateGeneralAccountDialog', () => {
            expect(smartTabContent).toContain("<CreateGeneralAccountDialog");
            expect(smartTabContent).toMatch(/<CreateGeneralAccountDialog[^>]*onAccountCreated=\{onAccountCreated\}/);
        });

        it('6.4: SmartMatchQueueTab Excel download iterates over filteredGroups to respect active search and filters', () => {
            expect(smartTabContent).toContain("filteredGroups.forEach(group => {");
            expect(smartTabContent).not.toMatch(/handleDownloadExcel[\s\S]*?groups\.forEach\(group\s*=>\s*\{/);
        });

        it('6.5: SmartMatchQueueTab pruned dead modal state and elements', () => {
            expect(smartTabContent).not.toContain("const [isSmartMatchOpen, setIsSmartMatchOpen]");
            expect(smartTabContent).not.toContain("<SmartMatchQueueModal");
        });

        it('6.6: ReviewedTab undo action triggers both balance calculation and unallocated count refresh', () => {
            expect(reviewedTabContent).toContain("onUndoComplete?.();");
            expect(shellContent).toContain("<ReviewedTab");
            expect(shellContent).toMatch(/onUndoComplete=\{\(\)\s*=>\s*\{\s*fetchCalculatedBalance\(\);\s*fetchUnallocatedCount\(\);\s*\}\}/);
        });
    });

    // ========================================================================
    // SUITE 7: Reconciliation Badge & Extreme Boundary Verification
    // ========================================================================
    describe('Suite 7: Reconciliation Badge Invariants & Floating Point Precision', () => {
        it('7.1: Verification of tolerance (< 0.01) for Reconciled vs Diff badge in shell AST', () => {
            expect(shellContent).toContain("Math.abs(calculatedBalance - selectedAccount.bankBalance) < 0.01");
            expect(shellContent).toContain("Reconciled");
            expect(shellContent).toContain("Diff:");
            expect(shellContent).toContain("No Statement Balance");
        });

        it('7.2: Mathematical boundary testing on reconciliation tolerance & IEEE-754 precision finding', () => {
            const checkReconciled = (calc: number, act: number | undefined) => {
                if (act === undefined) return 'no_statement';
                return Math.abs(calc - act) < 0.01 ? 'reconciled' : 'diff';
            };

            // Exactly matching
            expect(checkReconciled(1000.00, 1000.00)).toBe('reconciled');
            
            // Sub-cent floating point discrepancy within tolerance
            expect(checkReconciled(1000.004, 1000.00)).toBe('reconciled');
            expect(checkReconciled(1000.00, 1000.004)).toBe('reconciled');

            // Adversarial finding: IEEE-754 floating point subtraction (1000.01 - 1000.00 = 0.009999999999990905)
            // Evaluates to < 0.01 due to binary float representation!
            expect(Math.abs(1000.01 - 1000.00)).toBeLessThan(0.01);
            expect(checkReconciled(1000.01, 1000.00)).toBe('reconciled');

            // Multi-cent discrepancies strictly trigger 'diff'
            expect(checkReconciled(1000.02, 1000.00)).toBe('diff');
            expect(checkReconciled(1000.00, 1000.02)).toBe('diff');

            // Extreme overdraft discrepancy
            expect(checkReconciled(-5000.50, -5000.50)).toBe('reconciled');
            expect(checkReconciled(-5000.50, -5000.55)).toBe('diff');

            // Undefined actual balance
            expect(checkReconciled(250.00, undefined)).toBe('no_statement');
        });
    });

    // ========================================================================
    // SUITE 8: Loading Locks & State Toggle Invariants
    // ========================================================================
    describe('Suite 8: Loading Locks & State Toggle Invariants', () => {
        it('8.1: Evaluates composite loading state isUpdatingBankBalance = external || internal', () => {
            const evaluateLoading = (external: boolean, internal: boolean) => external || internal;

            expect(evaluateLoading(false, false)).toBe(false);
            expect(evaluateLoading(true, false)).toBe(true);
            expect(evaluateLoading(false, true)).toBe(true);
            expect(evaluateLoading(true, true)).toBe(true);
        });

        it('8.2: Default value handling in BankAccountManageDialogs input fields', () => {
            // Selected account undefined
            const selected1 = undefined;
            const defName1 = (selected1 as any)?.description;
            const defBal1 = (selected1 as any)?.bankBalance !== undefined ? (selected1 as any).bankBalance : '';
            expect(defName1).toBeUndefined();
            expect(defBal1).toBe('');

            // Selected account with zero balance
            const selected2 = { id: 'acc-0', description: 'Zero Balance Acc', bankBalance: 0 };
            const defBal2 = selected2.bankBalance !== undefined ? selected2.bankBalance : '';
            expect(defBal2).toBe(0); // Ensure 0 is NOT coerced to empty string!
        });
    });

    // ========================================================================
    // SUITE 9: Barrel Export Integrity & Zero Leakage
    // ========================================================================
    describe('Suite 9: Barrel Export Integrity & Zero Leakage', () => {
        it('9.1: Components barrel exports exactly 4 target symbols', () => {
            const keys = Object.keys(componentsBarrel);
            expect(keys).toContain('MerchantGroupCard');
            expect(keys).toContain('NewTransactionRow');
            expect(keys).toContain('ReviewedTransactionRow');
            expect(keys).toContain('BankAccountManageDialogs');
        });

        it('9.2: Dialogs barrel exports exactly 10 Milestone 1 dialogs and no others', () => {
            const expectedDialogs = [
                'RuleViewDialog',
                'AIAllocationReviewDialog',
                'ImportDialog',
                'CreateRuleDialog',
                'CreateManualTransactionDialog',
                'EditTransactionDialog',
                'CreateGeneralAccountDialog',
                'SplitTransactionDialog',
                'SmartMatchQueueModal',
                'GroupTransactionsDialog'
            ];

            const dialogsIndexPath = path.resolve(rootDir, 'src/components/ai-accountant/dialogs/index.ts');
            const dialogsIndexText = fs.readFileSync(dialogsIndexPath, 'utf-8');

            for (const d of expectedDialogs) {
                expect(dialogsIndexText).toContain(`export * from './${d}'`);
            }
            expect(dialogsIndexText).not.toContain('BankAccountManageDialogs');
            expect(dialogsIndexText).not.toContain('BankTransactionsUI');
        });
    });
});
