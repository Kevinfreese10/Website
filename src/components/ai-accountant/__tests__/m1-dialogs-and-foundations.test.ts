import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('@/app/actions/banking-actions', () => ({
    applyRegroups: vi.fn(),
    splitTransaction: vi.fn(),
    proposeRegroups: vi.fn(),
    proposeAiRegroups: vi.fn(),
}));
vi.mock('@/ai/genkit', () => ({ ai: {} }));
vi.mock('@genkit-ai/google-genai', () => ({}));
vi.mock('@genkit-ai/next', () => ({}));

import { useDebounce } from '@/hooks/use-debounce';
import { renderClueIcon, getClueBadgeStyle } from '@/components/ai-accountant/clue-badge-helpers';
import { ClueType } from '@/lib/detective-engine';
import { 
    ruleFormSchema, 
    manualTransactionSchema, 
    formatPrice 
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

describe('Milestone 1: Shared Foundations & Dialog Exports', () => {
    describe('useDebounce hook', () => {
        it('initializes with the provided value in a React component lifecycle', () => {
            let captured = '';
            function TestComponent({ value }: { value: string }) {
                captured = useDebounce(value, 300);
                return React.createElement('span', null, captured);
            }

            const html = renderToString(React.createElement(TestComponent, { value: 'debounced_init' }));
            expect(html).toContain('debounced_init');
            expect(captured).toBe('debounced_init');
        });
    });

    describe('clue-badge-helpers', () => {
        const clueTypes: ClueType[] = [
            'timing',
            'amount',
            'prefix',
            'reference',
            'cross_ref',
            'sweep',
            'structure',
            'web'
        ];

        it('returns valid styling classes for all ClueTypes', () => {
            for (const type of clueTypes) {
                const style = getClueBadgeStyle(type);
                expect(style).toBeDefined();
                expect(typeof style).toBe('string');
                expect(style.length).toBeGreaterThan(0);
                expect(style).toContain('border-');
            }
        });

        it('returns fallback styling for unknown ClueType', () => {
            const fallbackStyle = getClueBadgeStyle('unknown_type' as any);
            expect(fallbackStyle).toBe('bg-slate-50 text-slate-700 border-slate-200');
        });

        it('renders valid React element icon for each ClueType', () => {
            for (const type of clueTypes) {
                const iconElement = renderClueIcon(type);
                expect(React.isValidElement(iconElement)).toBe(true);
            }
        });

        it('renders fallback icon for unknown ClueType', () => {
            const fallbackIcon = renderClueIcon('unknown_type' as any);
            expect(React.isValidElement(fallbackIcon)).toBe(true);
        });
    });

    describe('types.ts helpers & validation schemas', () => {
        it('formats numbers properly via formatPrice', () => {
            expect(formatPrice(1234.56)).toBe('1,234.56');
            expect(formatPrice(0)).toBe('0.00');
            expect(formatPrice(-50.5)).toBe('-50.50');
        });

        it('validates ruleFormSchema correctly for valid data', () => {
            const validData = {
                description: 'Rule for Office Supplies',
                keywords: 'STATIONERY, PENS',
                accountId: 'acc_123',
                vatType: 'standard_rated_purchases',
                type: 'hard',
                priority: 1
            };

            const parseResult = ruleFormSchema.safeParse(validData);
            expect(parseResult.success).toBe(true);
        });

        it('validates ruleFormSchema correctly for invalid data', () => {
            const invalidData = {
                description: '',
                keywords: '',
                accountId: ''
            };
            const invalidResult = ruleFormSchema.safeParse(invalidData);
            expect(invalidResult.success).toBe(false);
        });

        it('validates manualTransactionSchema correctly for valid transactions', () => {
            const validTx = {
                date: new Date('2026-09-21'),
                description: 'Client payment',
                amount: 500,
                reference: 'REF-001'
            };
            const parseResult = manualTransactionSchema.safeParse(validTx);
            expect(parseResult.success).toBe(true);
        });

        it('validates manualTransactionSchema correctly for invalid transactions', () => {
            const invalidTx = {
                date: 'invalid-date',
                description: '',
                amount: 0, // Zero amount is disallowed
                reference: 'REF-001'
            };
            const invalidResult = manualTransactionSchema.safeParse(invalidTx);
            expect(invalidResult.success).toBe(false);
        });
    });

    describe('dialog barrel exports', () => {
        it('exports all 10 dialog components as valid React components or functions', () => {
            const dialogs = [
                { name: 'RuleViewDialog', comp: RuleViewDialog },
                { name: 'AIAllocationReviewDialog', comp: AIAllocationReviewDialog },
                { name: 'ImportDialog', comp: ImportDialog },
                { name: 'CreateRuleDialog', comp: CreateRuleDialog },
                { name: 'CreateManualTransactionDialog', comp: CreateManualTransactionDialog },
                { name: 'EditTransactionDialog', comp: EditTransactionDialog },
                { name: 'CreateGeneralAccountDialog', comp: CreateGeneralAccountDialog },
                { name: 'SplitTransactionDialog', comp: SplitTransactionDialog },
                { name: 'SmartMatchQueueModal', comp: SmartMatchQueueModal },
                { name: 'GroupTransactionsDialog', comp: GroupTransactionsDialog }
            ];

            for (const { name, comp } of dialogs) {
                expect(comp, `Dialog ${name} should be defined`).toBeDefined();
                expect(['function', 'object']).toContain(typeof comp);
            }
        });
    });
});
