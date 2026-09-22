import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Milestone 5: Clean Shell Assembly & Functional Integration Suite', () => {
    const rootDir = process.cwd();
    const shellPath = path.resolve(rootDir, 'src/components/ai-accountant/BankTransactionsUI.tsx');
    const shellContent = fs.readFileSync(shellPath, 'utf-8');

    const newTabPath = path.resolve(rootDir, 'src/components/ai-accountant/NewTransactionsTab.tsx');
    const newTabContent = fs.readFileSync(newTabPath, 'utf-8');

    const smartTabPath = path.resolve(rootDir, 'src/components/ai-accountant/SmartMatchQueueTab.tsx');
    const smartTabContent = fs.readFileSync(smartTabPath, 'utf-8');

    const componentsIndexPath = path.resolve(rootDir, 'src/components/ai-accountant/components/index.ts');
    const componentsIndexContent = fs.readFileSync(componentsIndexPath, 'utf-8');

    const dialogsIndexPath = path.resolve(rootDir, 'src/components/ai-accountant/dialogs/index.ts');
    const dialogsIndexContent = fs.readFileSync(dialogsIndexPath, 'utf-8');

    describe('1. BankTransactionsUI Line Budget & Clean Imports', () => {
        it('1.1: Root shell has strictly < 300 lines of code', () => {
            const lineCount = shellContent.split('\n').length;
            expect(lineCount).toBeLessThan(300);
            expect(lineCount).toBeLessThanOrEqual(285);
        });

        it('1.2: Pruned dead imports (no Papa, XLSX, useForm, or unrendered icons)', () => {
            expect(shellContent).not.toContain("import Papa from 'papaparse'");
            expect(shellContent).not.toContain("import * as XLSX from 'xlsx-js-style'");
            expect(shellContent).not.toContain("import { useForm }");
            expect(shellContent).not.toContain("import { runAiAccountantAnalysis");
            expect(shellContent).not.toContain("import { BankCleaner");
            expect(shellContent).not.toContain("import { MASTER_ALLOCATION_RULES");
        });

        it('1.3: Uses formatPrice from ./types and removes dead duplicate helper', () => {
            expect(shellContent).toContain("import { formatPrice } from './types'");
            expect(shellContent).not.toContain("const formatPrice = (price: number) =>");
            expect(shellContent).not.toContain("async function getIdToken()");
        });

        it('1.4: Passes globalRules to SmartMatchQueueTab', () => {
            expect(shellContent).toMatch(/<SmartMatchQueueTab[^>]*globalRules=\{globalRules\}/);
        });

        it('1.5: Renders BankAccountManageDialogs instead of inline dialog JSX', () => {
            expect(shellContent).toContain("<BankAccountManageDialogs");
            expect(shellContent).not.toContain("<DialogTitle>Edit Bank Account Name</DialogTitle>");
            expect(shellContent).not.toContain("<DialogTitle>Update Actual Bank Balance</DialogTitle>");
        });
    });

    describe('2. BankAccountManageDialogs Extraction & Barrel Hygiene', () => {
        const dialogsPath = path.resolve(rootDir, 'src/components/ai-accountant/components/BankAccountManageDialogs.tsx');

        it('2.1: BankAccountManageDialogs component exists and exports component and props', () => {
            expect(fs.existsSync(dialogsPath)).toBe(true);
            const content = fs.readFileSync(dialogsPath, 'utf-8');
            expect(content).toContain('export interface BankAccountManageDialogsProps');
            expect(content).toContain('export function BankAccountManageDialogs(');
        });

        it('2.2: Re-exported in components/index.ts', () => {
            expect(componentsIndexContent).toContain("export * from './BankAccountManageDialogs'");
        });

        it('2.3: Strictly NOT re-exported in dialogs/index.ts (preserving M1 10-dialogs contract)', () => {
            expect(dialogsIndexContent).not.toContain('BankAccountManageDialogs');
        });
    });

    describe('3. NewTransactionsTab Event Wiring & Callbacks', () => {
        it('3.1: CreateRuleDialog wires onRuleCreated={onAccountCreated}', () => {
            expect(newTabContent).toMatch(/<CreateRuleDialog[^>]*onRuleCreated=\{onAccountCreated\}/);
        });

        it('3.2: SplitTransactionDialog wires onSplitComplete to trigger onAllocationComplete and onRefreshBalance', () => {
            expect(newTabContent).toContain("onAllocationComplete?.();");
            expect(newTabContent).toContain("onRefreshBalance?.();");
            expect(newTabContent).toMatch(/onSplitComplete=\{[^}]*onAllocationComplete\?\.()[^}]*onRefreshBalance\?\.()[^}]*\}/);
        });

        it('3.3: EditTransactionDialog refreshes balance and allocation count on modal close', () => {
            expect(newTabContent).toMatch(/onOpenChange=\{\(open\)\s*=>\s*\{[\s\S]*setIsEditTxOpen\(open\)[\s\S]*onRefreshBalance\?\.()[\s\S]*onAllocationComplete\?\.()/);
        });
    });

    describe('4. SmartMatchQueueTab Excel Export & Orphan Pruning', () => {
        it('4.1: CreateGeneralAccountDialog wires onAccountCreated={onAccountCreated}', () => {
            expect(smartTabContent).toMatch(/<CreateGeneralAccountDialog[^>]*onAccountCreated=\{onAccountCreated\}/);
        });

        it('4.2: handleDownloadExcel iterates over filteredGroups to respect active filters', () => {
            expect(smartTabContent).toContain("filteredGroups.forEach(group => {");
            expect(smartTabContent).not.toMatch(/handleDownloadExcel[\s\S]*?groups\.forEach\(group\s*=>\s*\{/);
        });

        it('4.3: Orphaned isSmartMatchOpen state and SmartMatchQueueModal element removed', () => {
            expect(smartTabContent).not.toContain("const [isSmartMatchOpen, setIsSmartMatchOpen]");
            expect(smartTabContent).not.toContain("<SmartMatchQueueModal");
        });
    });
});
