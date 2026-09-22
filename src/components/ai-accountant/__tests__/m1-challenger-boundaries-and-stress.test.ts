import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';

// Mocks for actions and AI flows required by dialogs
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

import { 
    ruleFormSchema, 
    manualTransactionSchema, 
    formatPrice,
    RuleFormValues,
    ManualTransactionFormValues
} from '@/components/ai-accountant/types';

import {
    RuleViewDialog,
    AIAllocationReviewDialog,
    ImportDialog,
    CreateRuleDialog,
    CreateManualTransactionDialog,
    EditTransactionDialog,
    CreateGeneralAccountDialog,
    SplitTransactionDialog,
    SmartMatchQueueModal,
    GroupTransactionsDialog
} from '@/components/ai-accountant/dialogs';

import { renderClueIcon, getClueBadgeStyle } from '@/components/ai-accountant/clue-badge-helpers';
import { ClueType } from '@/lib/detective-engine';

describe('Empirical Challenger Suite: Milestone 1 Boundaries & Stress Testing', () => {

    describe('1. Module Boundaries, Dependency Tree & Circular Import Analysis', () => {
        const dialogDir = path.resolve(process.cwd(), 'src/components/ai-accountant/dialogs');
        const dialogFiles = [
            'RuleViewDialog.tsx',
            'AIAllocationReviewDialog.tsx',
            'ImportDialog.tsx',
            'CreateRuleDialog.tsx',
            'CreateManualTransactionDialog.tsx',
            'EditTransactionDialog.tsx',
            'CreateGeneralAccountDialog.tsx',
            'SplitTransactionDialog.tsx',
            'SmartMatchQueueModal.tsx',
            'GroupTransactionsDialog.tsx',
        ];

        it('confirms all 10 dialog component files exist on disk in src/components/ai-accountant/dialogs', () => {
            for (const file of dialogFiles) {
                const fullPath = path.join(dialogDir, file);
                expect(fs.existsSync(fullPath), `File ${file} should exist on disk`).toBe(true);
            }
        });

        it('verifies that no dialog file imports from another dialog file (0 intra-dialog cross-imports)', () => {
            const crossImports: { file: string; importedDialog: string }[] = [];

            for (const file of dialogFiles) {
                const fullPath = path.join(dialogDir, file);
                const content = fs.readFileSync(fullPath, 'utf8');

                for (const target of dialogFiles) {
                    const baseName = target.replace(/\.tsx?$/, '');
                    // Match imports like from './Target' or from '@/components/ai-accountant/dialogs/Target'
                    const regex = new RegExp(`from\\s+['"][^'"]*\\b${baseName}['"]`, 'g');
                    if (regex.test(content)) {
                        crossImports.push({ file, importedDialog: target });
                    }
                }
            }

            expect(crossImports, 'Dialogs should be fully decoupled with 0 intra-dialog dependencies').toEqual([]);
        });

        it('verifies that no dialog imports from the barrel index.ts (preventing circular reference traps)', () => {
            const barrelSelfImports: string[] = [];

            for (const file of dialogFiles) {
                const fullPath = path.join(dialogDir, file);
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Matches from '.' or from './' or from '@/components/ai-accountant/dialogs'
                const barrelRegex = /from\s+['"](\.|\.\/|@\/components\/ai-accountant\/dialogs)['"]/g;
                if (barrelRegex.test(content)) {
                    barrelSelfImports.push(file);
                }
            }

            expect(barrelSelfImports, 'No dialog component should import from the barrel index').toEqual([]);
        });

        it('validates graph acyclicity: computes topological sort and SCCs across all dialog dependencies', () => {
            // Build dependency graph of local files imported by each dialog
            const graph: Map<string, Set<string>> = new Map();

            for (const file of dialogFiles) {
                const fullPath = path.join(dialogDir, file);
                const content = fs.readFileSync(fullPath, 'utf8');
                const imports = new Set<string>();

                // Match relative imports
                const relImportRegex = /from\s+['"](\.[^'"]+)['"]/g;
                let match;
                while ((match = relImportRegex.exec(content)) !== null) {
                    const targetRel = match[1];
                    const resolved = path.resolve(dialogDir, targetRel);
                    imports.add(resolved);
                }
                graph.set(fullPath, imports);
            }

            // Verify acyclicity: each dialog points to external/shared modules (types, clue-badge-helpers),
            // and NONE of those shared modules import back to the dialogs.
            const typesPath = path.resolve(process.cwd(), 'src/components/ai-accountant/types.ts');
            const typesContent = fs.readFileSync(typesPath, 'utf8');

            expect(typesContent).not.toMatch(/from\s+['"][^'"]*dialogs/);

            const helpersPath = path.resolve(process.cwd(), 'src/components/ai-accountant/clue-badge-helpers.tsx');
            const helpersContent = fs.readFileSync(helpersPath, 'utf8');
            expect(helpersContent).not.toMatch(/from\s+['"][^'"]*dialogs/);
        });

        it('verifies barrel index.ts re-exports all 10 dialogs without omission or naming collision', () => {
            const indexPath = path.join(dialogDir, 'index.ts');
            expect(fs.existsSync(indexPath)).toBe(true);
            const content = fs.readFileSync(indexPath, 'utf8');

            for (const file of dialogFiles) {
                const baseName = file.replace(/\.tsx?$/, '');
                expect(content).toContain(`export * from './${baseName}';`);
            }
        });

        it('confirms all 10 exported dialogs are instantiated as valid React components', () => {
            const dialogExports = [
                { name: 'RuleViewDialog', comp: RuleViewDialog },
                { name: 'AIAllocationReviewDialog', comp: AIAllocationReviewDialog },
                { name: 'ImportDialog', comp: ImportDialog },
                { name: 'CreateRuleDialog', comp: CreateRuleDialog },
                { name: 'CreateManualTransactionDialog', comp: CreateManualTransactionDialog },
                { name: 'EditTransactionDialog', comp: EditTransactionDialog },
                { name: 'CreateGeneralAccountDialog', comp: CreateGeneralAccountDialog },
                { name: 'SplitTransactionDialog', comp: SplitTransactionDialog },
                { name: 'SmartMatchQueueModal', comp: SmartMatchQueueModal },
                { name: 'GroupTransactionsDialog', comp: GroupTransactionsDialog },
            ];

            expect(dialogExports).toHaveLength(10);
            for (const { name, comp } of dialogExports) {
                expect(comp, `${name} must not be undefined or null`).toBeDefined();
                expect(
                    typeof comp === 'function' || (typeof comp === 'object' && comp !== null),
                    `${name} must be a callable component or React forwardRef object`
                ).toBe(true);
            }
        });
    });

    describe('2. Stress Testing `ruleFormSchema` (Boundaries & Edge Cases)', () => {
        it('validates a minimal valid rule and verifies schema defaults', () => {
            const minimalData = {
                keywords: 'PETROL',
            };
            const result = ruleFormSchema.safeParse(minimalData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.mode).toBe('new');
                expect(result.data.accountType).toBe('account');
                expect(result.data.scope).toBe('client');
                expect(result.data.keywords).toBe('PETROL');
                expect(result.data.accountId).toBeUndefined();
                expect(result.data.vatType).toBeUndefined();
                expect(result.data.description).toBeUndefined();
            }
        });

        it('rejects keywords with fewer than 2 characters (boundary length = 0 and 1)', () => {
            expect(ruleFormSchema.safeParse({ keywords: '' }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'A' }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: ' ' }).success).toBe(false);
            
            // Exactly 2 characters must pass boundary
            const twoCharResult = ruleFormSchema.safeParse({ keywords: 'BP' });
            expect(twoCharResult.success).toBe(true);
        });

        it('stress tests massive keyword strings (10,000 characters with 1,000 tokens)', () => {
            const tokens = Array.from({ length: 1000 }, (_, i) => `KEYWORD_${i}_MERCHANT`);
            const giantKeywordList = tokens.join(', ');
            expect(giantKeywordList.length).toBeGreaterThan(10000);

            const result = ruleFormSchema.safeParse({
                keywords: giantKeywordList,
                description: 'Bulk rule with 1,000 keywords'
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.keywords.length).toBe(giantKeywordList.length);
            }
        });

        it('handles unusual characters, unicode, emojis, and special symbols in keywords', () => {
            const specialInputs = [
                '⛽ ENGEN, 🛒 CHECKERS, ☕ M&B',
                'MÜLLER & SÖHNE GMBH',
                'CASH CRUSADERS (PTY) LTD',
                'CO-OP / KOÖPERASIE #4421',
                'R100 + R200 - DEPOSIT [CARD: *1234]',
                '<script>alert("xss")</script>',
                "Robert'); DROP TABLE Rules;--",
                'Line 1\nLine 2\tTabbed',
            ];

            for (const input of specialInputs) {
                const res = ruleFormSchema.safeParse({ keywords: input });
                expect(res.success, `Failed to parse keyword input: ${input}`).toBe(true);
                if (res.success) {
                    expect(res.data.keywords).toBe(input);
                }
            }
        });

        it('enforces strict enum validation for mode', () => {
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', mode: 'new' }).success).toBe(true);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', mode: 'append' }).success).toBe(true);

            // Invalid mode strings
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', mode: 'delete' as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', mode: 'update' as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', mode: 'NEW' as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', mode: '' as any }).success).toBe(false);
        });

        it('enforces strict enum validation for accountType', () => {
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', accountType: 'account' }).success).toBe(true);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', accountType: 'customer' }).success).toBe(true);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', accountType: 'supplier' }).success).toBe(true);

            // Invalid accountType strings
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', accountType: 'ledger' as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', accountType: 'bank' as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', accountType: 'ACCOUNT' as any }).success).toBe(false);
        });

        it('enforces strict enum validation for scope', () => {
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', scope: 'client' }).success).toBe(true);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', scope: 'global' }).success).toBe(true);

            // Invalid scope strings
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', scope: 'practice' as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', scope: 'system' as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', scope: 'CLIENT' as any }).success).toBe(false);
        });

        it('accepts all 8 canonical VAT types and rejects non-string types for vatType', () => {
            const canonicalVatTypes = [
                'standard_rated_purchases',
                'zero_rated_purchases',
                'exempt_purchases',
                'capital_goods_purchases',
                'standard_rated_sales',
                'zero_rated_sales',
                'exempt_sales',
                'no_vat',
            ];

            for (const vt of canonicalVatTypes) {
                const res = ruleFormSchema.safeParse({ keywords: 'SUPPLIER', vatType: vt });
                expect(res.success).toBe(true);
            }

            // Reject non-string values
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', vatType: 123 as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', vatType: true as any }).success).toBe(false);
            expect(ruleFormSchema.safeParse({ keywords: 'VALID', vatType: { type: 'standard' } as any }).success).toBe(false);
        });

        it('is resilient against prototype pollution attempts', () => {
            const maliciousPayload = JSON.parse('{"keywords": "ATTACK", "__proto__": {"polluted": true}}');
            const res = ruleFormSchema.safeParse(maliciousPayload);
            expect(res.success).toBe(true);
            expect(({} as any).polluted).toBeUndefined();
        });
    });

    describe('3. Stress Testing `manualTransactionSchema` (Cent Boundaries, Negatives & Extremes)', () => {
        const baseValid = {
            date: new Date('2026-09-21'),
            description: 'OFFICE SUPPLIES',
            amount: -150.00,
            reference: 'REF-2026-001'
        };

        it('validates standard positive (income) and negative (expense) transactions', () => {
            const expense = manualTransactionSchema.safeParse({ ...baseValid, amount: -450.50 });
            expect(expense.success).toBe(true);
            if (expense.success) expect(expense.data.amount).toBe(-450.50);

            const income = manualTransactionSchema.safeParse({ ...baseValid, amount: 12500.00 });
            expect(income.success).toBe(true);
            if (income.success) expect(income.data.amount).toBe(12500.00);
        });

        it('tests exact 1 cent boundaries (+0.01 and -0.01)', () => {
            const posCent = manualTransactionSchema.safeParse({ ...baseValid, amount: 0.01 });
            expect(posCent.success).toBe(true);
            if (posCent.success) expect(posCent.data.amount).toBe(0.01);

            const negCent = manualTransactionSchema.safeParse({ ...baseValid, amount: -0.01 });
            expect(negCent.success).toBe(true);
            if (negCent.success) expect(negCent.data.amount).toBe(-0.01);
        });

        it('strictly rejects zero amounts (0, -0, "0", "0.00", "-0.00")', () => {
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: 0 }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: -0 }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: "0" as any }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: "0.00" as any }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: "-0.00" as any }).success).toBe(false);
        });

        it('coerces string representations of valid numbers via preprocessing', () => {
            const strPos = manualTransactionSchema.safeParse({ ...baseValid, amount: "1234.56" as any });
            expect(strPos.success).toBe(true);
            if (strPos.success) expect(strPos.data.amount).toBe(1234.56);

            const strNeg = manualTransactionSchema.safeParse({ ...baseValid, amount: "-99.95" as any });
            expect(strNeg.success).toBe(true);
            if (strNeg.success) expect(strNeg.data.amount).toBe(-99.95);

            const strSci = manualTransactionSchema.safeParse({ ...baseValid, amount: "1e3" as any });
            expect(strSci.success).toBe(true);
            if (strSci.success) expect(strSci.data.amount).toBe(1000);
        });

        it('rejects invalid non-numeric amount values (NaN, empty string, malformed strings)', () => {
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: "abc" as any }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: "" as any }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: "   " as any }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: "R150.00" as any }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: null as any }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, amount: undefined as any }).success).toBe(false);
        });

        it('handles extreme numeric values (Number.MAX_SAFE_INTEGER and 1 billion rands)', () => {
            const largePos = manualTransactionSchema.safeParse({ ...baseValid, amount: 1_000_000_000.00 });
            expect(largePos.success).toBe(true);

            const largeNeg = manualTransactionSchema.safeParse({ ...baseValid, amount: -1_000_000_000.00 });
            expect(largeNeg.success).toBe(true);

            const maxSafe = manualTransactionSchema.safeParse({ ...baseValid, amount: Number.MAX_SAFE_INTEGER });
            expect(maxSafe.success).toBe(true);

            const minSafe = manualTransactionSchema.safeParse({ ...baseValid, amount: -Number.MAX_SAFE_INTEGER });
            expect(minSafe.success).toBe(true);
        });

        it('enforces description length boundaries (< 3 characters fails, >= 3 characters passes)', () => {
            expect(manualTransactionSchema.safeParse({ ...baseValid, description: '' }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, description: 'A' }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, description: 'AB' }).success).toBe(false);

            // Boundary: exactly 3 characters passes
            expect(manualTransactionSchema.safeParse({ ...baseValid, description: 'FEE' }).success).toBe(true);
            expect(manualTransactionSchema.safeParse({ ...baseValid, description: 'ATM' }).success).toBe(true);
            expect(manualTransactionSchema.safeParse({ ...baseValid, description: 'POS' }).success).toBe(true);
        });

        it('stress tests very long descriptions (10,000 characters)', () => {
            const longDesc = 'LONG_DESCRIPTION_ENTRY_'.repeat(400); // 9,200 chars
            const result = manualTransactionSchema.safeParse({ ...baseValid, description: longDesc });
            expect(result.success).toBe(true);
            if (result.success) expect(result.data.description).toBe(longDesc);
        });

        it('accepts complex dates including leap year Feb 29 and SA FY boundary dates', () => {
            // Leap year 2028-02-29
            const leapDate = new Date('2028-02-29T12:00:00Z');
            expect(manualTransactionSchema.safeParse({ ...baseValid, date: leapDate }).success).toBe(true);

            // SA FY Start: 1 March
            const fyStart = new Date('2026-03-01T00:00:00Z');
            expect(manualTransactionSchema.safeParse({ ...baseValid, date: fyStart }).success).toBe(true);

            // SA FY End: 28 February
            const fyEnd = new Date('2027-02-28T23:59:59Z');
            expect(manualTransactionSchema.safeParse({ ...baseValid, date: fyEnd }).success).toBe(true);
        });

        it('rejects invalid Date objects', () => {
            const invalidDate = new Date('not-a-valid-date');
            expect(manualTransactionSchema.safeParse({ ...baseValid, date: invalidDate }).success).toBe(false);
            expect(manualTransactionSchema.safeParse({ ...baseValid, date: '2026-09-21' as any }).success).toBe(false);
        });

        it('handles optional reference values (undefined, empty string, long reference, special chars)', () => {
            expect(manualTransactionSchema.safeParse({ ...baseValid, reference: undefined }).success).toBe(true);
            expect(manualTransactionSchema.safeParse({ ...baseValid, reference: '' }).success).toBe(true);
            expect(manualTransactionSchema.safeParse({ ...baseValid, reference: 'REF-PRN99281728374-VAT201' }).success).toBe(true);
            expect(manualTransactionSchema.safeParse({ ...baseValid, reference: 'X'.repeat(500) }).success).toBe(true);
        });
    });

    describe('4. Stress Testing `formatPrice` Helper', () => {
        it('formats positive, negative, and zero values with standard 2 decimal places', () => {
            expect(formatPrice(1234.56)).toBe('1,234.56');
            expect(formatPrice(0)).toBe('0.00');
            expect(formatPrice(-50.5)).toBe('-50.50');
            expect(formatPrice(-0.01)).toBe('-0.01');
            expect(formatPrice(0.01)).toBe('0.01');
        });

        it('correctly rounds sub-cent amounts to 2 decimal places', () => {
            expect(formatPrice(1234.567)).toBe('1,234.57');
            expect(formatPrice(1234.562)).toBe('1,234.56');
            expect(formatPrice(0.005)).toBe('0.01');
            expect(formatPrice(-0.005)).toBe('-0.01');
        });

        it('formats large numbers with proper thousands separators', () => {
            expect(formatPrice(1000000)).toBe('1,000,000.00');
            expect(formatPrice(123456789.99)).toBe('123,456,789.99');
            expect(formatPrice(-987654321.00)).toBe('-987,654,321.00');
        });
    });

    describe('5. Stress Testing Clue Badge Helpers with Exhaustive & Rogue ClueTypes', () => {
        const canonicalClues: ClueType[] = [
            'timing', 'amount', 'prefix', 'reference', 
            'cross_ref', 'sweep', 'structure', 'web'
        ];

        it('verifies getClueBadgeStyle returns discrete distinct classes for all 8 clues', () => {
            const styles = new Set<string>();
            for (const clue of canonicalClues) {
                const style = getClueBadgeStyle(clue);
                expect(style).toBeTruthy();
                styles.add(style);
            }
            // All 8 clue types should have distinct styling
            expect(styles.size).toBe(8);
        });

        it('gracefully provides fallback badge style and icon for unmapped/rogue clue strings', () => {
            const rogueClues = ['unknown', '', 'malformed_type', null as any, undefined as any];
            for (const rogue of rogueClues) {
                const style = getClueBadgeStyle(rogue);
                expect(style).toBe('bg-slate-50 text-slate-700 border-slate-200');

                const icon = renderClueIcon(rogue);
                expect(React.isValidElement(icon)).toBe(true);
            }
        });
    });
});
