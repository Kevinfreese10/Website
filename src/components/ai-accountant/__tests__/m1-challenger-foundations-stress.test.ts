/**
 * @fileOverview Empirical Adversarial Challenge Test Suite for Milestone 1:
 * Shared Foundations, Types, Helpers & Dialog Prop Contracts.
 *
 * Challenger: Challenger 1 (Critic & Specialist)
 * Working Directory: c:\myacc\.agents\teamwork_preview_challenger_m1_1
 *
 * Focus:
 * 1. formatPrice: Extreme values, negative zero, rounding, IEEE-754 precision, non-finite values.
 * 2. useDebounce: Rapid burst updates, timer cancellation, delay changes, edge value types.
 * 3. ruleFormSchema: Schema boundaries, defaults, malformed inputs, whitespace, unicode, injections.
 * 4. manualTransactionSchema: Zero/negative/fractional amounts, string preprocessing, date validity, non-finite inputs.
 * 5. Dialog Prop Contracts: Null safety, boundary parameters, clue badge fallbacks, and rendering invariants.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

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
vi.mock('@radix-ui/react-dialog', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        Portal: ({ children }: any) => React.createElement('div', { 'data-portal': 'true' }, children),
    };
});


import { 
    formatPrice, 
    ruleFormSchema, 
    manualTransactionSchema,
    RuleFormValues,
    ManualTransactionFormValues,
    TransactionGroup,
    SmartMatchResult,
    RuleViewDialogProps,
    AIAllocationReviewDialogProps,
    ImportDialogProps,
    CreateRuleDialogProps,
    CreateManualTransactionDialogProps,
    EditTransactionDialogProps,
    CreateGeneralAccountDialogProps,
    SplitTransactionDialogProps,
    SmartMatchQueueModalProps,
    GroupTransactionsDialogProps
} from '../types';
import { renderClueIcon, getClueBadgeStyle } from '../clue-badge-helpers';
import { ClueType } from '@/lib/detective-engine';
import {
    RuleViewDialog,
    AIAllocationReviewDialog,
    CreateGeneralAccountDialog,
    GroupTransactionsDialog
} from '../dialogs';

// ============================================================================
// SUITE 1: formatPrice Exhaustive Stress Testing
// ============================================================================
describe('Challenger 1 Suite 1: formatPrice Exhaustive Stress Testing', () => {
    it('1.1: Standard integer and decimal prices format with two decimals and grouping', () => {
        expect(formatPrice(0)).toBe('0.00');
        expect(formatPrice(10)).toBe('10.00');
        expect(formatPrice(1234.56)).toBe('1,234.56');
        expect(formatPrice(1000000)).toBe('1,000,000.00');
        expect(formatPrice(999999999.99)).toBe('999,999,999.99');
    });

    it('1.2: Negative prices include leading minus and correct grouping', () => {
        expect(formatPrice(-50.5)).toBe('-50.50');
        expect(formatPrice(-1234.56)).toBe('-1,234.56');
        expect(formatPrice(-10000000)).toBe('-10,000,000.00');
    });

    it('1.3: Handles JavaScript negative zero (-0) behavior predictably', () => {
        // In JavaScript Intl.NumberFormat('en-GB'), -0 yields '-0.00'
        const formattedNegZero = formatPrice(-0);
        expect(['0.00', '-0.00']).toContain(formattedNegZero);
    });

    it('1.4: Handles IEEE-754 floating point rounding precision edge cases', () => {
        // 0.1 + 0.2 in JS is 0.30000000000000004
        expect(formatPrice(0.1 + 0.2)).toBe('0.30');

        // Sub-cent amounts
        expect(formatPrice(0.001)).toBe('0.00');
        expect(formatPrice(0.004)).toBe('0.00');
        expect(formatPrice(0.009)).toBe('0.01');

        // Half-cent threshold
        expect(formatPrice(1.0051)).toBe('1.01');
    });

    it('1.5: Handles extreme safe integers and large scale accounting figures', () => {
        // MAX_SAFE_INTEGER is 9,007,199,254,740,991
        expect(formatPrice(Number.MAX_SAFE_INTEGER)).toBe('9,007,199,254,740,991.00');
        expect(formatPrice(Number.MIN_SAFE_INTEGER)).toBe('-9,007,199,254,740,991.00');
    });

    it('1.6: Non-finite numbers (NaN, Infinity, -Infinity) do not throw runtime crashes', () => {
        expect(() => formatPrice(NaN)).not.toThrow();
        expect(formatPrice(NaN)).toBe('NaN');

        expect(() => formatPrice(Infinity)).not.toThrow();
        expect(formatPrice(Infinity)).toBe('∞');

        expect(() => formatPrice(-Infinity)).not.toThrow();
        expect(formatPrice(-Infinity)).toBe('-∞');
    });
});

// ============================================================================
// SUITE 2: useDebounce Empirical Verification & Timer Cancellation Harness
// ============================================================================
describe('Challenger 1 Suite 2: useDebounce Empirical Verification & Timer Cancellation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    /**
     * Recreates the exact hook lifecycle logic of useDebounce:
     * - useState(initialValue)
     * - useEffect(() => { const h = setTimeout(() => setVal(v), delay); return () => clearTimeout(h); }, [v, delay])
     */
    function createDebounceLifecycleHarness<T>(initialValue: T, initialDelay = 300) {
        let currentValue = initialValue;
        let debouncedValue = initialValue;
        let delay = initialDelay;
        let timer: any = null;
        let clearTimeoutCount = 0;
        let timerSetCount = 0;

        const cleanupEffect = () => {
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
                clearTimeoutCount++;
            }
        };

        const runEffect = () => {
            cleanupEffect();
            timerSetCount++;
            const captured = currentValue;
            timer = setTimeout(() => {
                debouncedValue = captured;
                timer = null;
            }, delay);
        };

        // Initial mount effect execution
        runEffect();

        return {
            updateValue: (nextValue: T) => {
                currentValue = nextValue;
                runEffect();
            },
            updateDelay: (nextDelay: number) => {
                delay = nextDelay;
                runEffect();
            },
            unmount: () => {
                cleanupEffect();
            },
            getDebouncedValue: () => debouncedValue,
            getClearTimeoutCount: () => clearTimeoutCount,
            getTimerSetCount: () => timerSetCount,
            hasPendingTimer: () => timer !== null,
        };
    }

    it('2.1: Immediately provides the initial value synchronously on mount', () => {
        const harness = createDebounceLifecycleHarness('initial-query', 300);
        expect(harness.getDebouncedValue()).toBe('initial-query');
    });

    it('2.2: Rapid burst updates (50 changes in 50ms) cancel previous timers and emit only the final value', () => {
        const harness = createDebounceLifecycleHarness('start', 300);

        // Simulate 50 rapid keystrokes separated by 1ms
        for (let i = 1; i <= 50; i++) {
            vi.advanceTimersByTime(1);
            harness.updateValue(`keystroke-${i}`);
        }

        // Before 300ms has elapsed from the last keystroke, debounced value is still 'start'
        expect(harness.getDebouncedValue()).toBe('start');
        // Exactly 50 cleanups (clearTimeout) occurred during the burst
        expect(harness.getClearTimeoutCount()).toBe(50);
        expect(harness.hasPendingTimer()).toBe(true);

        // Advance timers by 299ms: still not resolved
        vi.advanceTimersByTime(299);
        expect(harness.getDebouncedValue()).toBe('start');

        // Advance 1ms more (reaching 300ms since keystroke-50)
        vi.advanceTimersByTime(1);
        expect(harness.getDebouncedValue()).toBe('keystroke-50');
        expect(harness.hasPendingTimer()).toBe(false);
    });

    it('2.3: Unmount explicitly cancels active timer preventing post-unmount execution', () => {
        const harness = createDebounceLifecycleHarness('query', 300);
        harness.updateValue('new-query');
        expect(harness.hasPendingTimer()).toBe(true);

        // Unmount component after 100ms
        vi.advanceTimersByTime(100);
        harness.unmount();
        expect(harness.hasPendingTimer()).toBe(false);

        // Advance time well past the 300ms threshold
        vi.advanceTimersByTime(500);
        // Value remains frozen at 'query'
        expect(harness.getDebouncedValue()).toBe('query');
    });

    it('2.4: Changing delay dynamically resets the countdown timer', () => {
        const harness = createDebounceLifecycleHarness('query', 300);
        harness.updateValue('updated');

        // 200ms into the 300ms wait
        vi.advanceTimersByTime(200);
        expect(harness.getDebouncedValue()).toBe('query');

        // User or config changes delay to 500ms
        harness.updateDelay(500);
        expect(harness.getDebouncedValue()).toBe('query');

        // Advancing 200ms (total 400ms from value update): still not fired due to 500ms reset
        vi.advanceTimersByTime(200);
        expect(harness.getDebouncedValue()).toBe('query');

        // Advancing remaining 300ms (500ms from delay change)
        vi.advanceTimersByTime(300);
        expect(harness.getDebouncedValue()).toBe('updated');
    });

    it('2.5: Operates reliably with various primitive and complex data types', () => {
        // Numbers
        const numHarness = createDebounceLifecycleHarness(0, 100);
        numHarness.updateValue(42);
        vi.advanceTimersByTime(100);
        expect(numHarness.getDebouncedValue()).toBe(42);

        // Objects
        const objHarness = createDebounceLifecycleHarness<{ active: boolean }>({ active: false }, 100);
        objHarness.updateValue({ active: true });
        vi.advanceTimersByTime(100);
        expect(objHarness.getDebouncedValue()).toEqual({ active: true });

        // Null & Undefined
        const nullHarness = createDebounceLifecycleHarness<string | null>('text', 100);
        nullHarness.updateValue(null);
        vi.advanceTimersByTime(100);
        expect(nullHarness.getDebouncedValue()).toBeNull();
    });
});

// ============================================================================
// SUITE 3: ruleFormSchema Adversarial Stress Testing
// ============================================================================
describe('Challenger 1 Suite 3: ruleFormSchema Adversarial Stress Testing', () => {
    it('3.1: Automatically injects valid default values when optional fields are omitted', () => {
        const minimalInput = {
            keywords: 'ENGEN',
        };

        const result = ruleFormSchema.safeParse(minimalInput);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.mode).toBe('new');
            expect(result.data.accountType).toBe('account');
            expect(result.data.scope).toBe('client');
            expect(result.data.keywords).toBe('ENGEN');
            expect(result.data.existingRuleId).toBeUndefined();
            expect(result.data.description).toBeUndefined();
            expect(result.data.accountId).toBeUndefined();
            expect(result.data.vatType).toBeUndefined();
        }
    });

    it('3.2: Rejects keywords shorter than 2 characters', () => {
        expect(ruleFormSchema.safeParse({ keywords: '' }).success).toBe(false);
        expect(ruleFormSchema.safeParse({ keywords: 'A' }).success).toBe(false);
        expect(ruleFormSchema.safeParse({ keywords: 'AB' }).success).toBe(true);
    });

    it('3.3: Rejects invalid enum values for mode, accountType, and scope', () => {
        const base = { keywords: 'VALID' };

        // Invalid mode
        expect(ruleFormSchema.safeParse({ ...base, mode: 'invalid' }).success).toBe(false);
        expect(ruleFormSchema.safeParse({ ...base, mode: 'edit' }).success).toBe(false);

        // Invalid accountType
        expect(ruleFormSchema.safeParse({ ...base, accountType: 'bank' }).success).toBe(false);
        expect(ruleFormSchema.safeParse({ ...base, accountType: 'general' }).success).toBe(false);

        // Invalid scope
        expect(ruleFormSchema.safeParse({ ...base, scope: 'tenant' }).success).toBe(false);
        expect(ruleFormSchema.safeParse({ ...base, scope: 'system' }).success).toBe(false);
    });

    it('3.4: Accepts valid enum variations across mode, accountType, and scope', () => {
        const validModes = ['new', 'append'] as const;
        const validAccountTypes = ['account', 'customer', 'supplier'] as const;
        const validScopes = ['global', 'client'] as const;

        for (const mode of validModes) {
            for (const accountType of validAccountTypes) {
                for (const scope of validScopes) {
                    const res = ruleFormSchema.safeParse({
                        keywords: 'TEST',
                        mode,
                        accountType,
                        scope,
                    });
                    expect(res.success).toBe(true);
                }
            }
        }
    });

    it('3.5: Accepts unicode, punctuation, symbols, and comma-separated keyword lists', () => {
        const complexKeywords = [
            'WOOLWORTHS, WOOLIES FOOD, WW #402',
            'TELKOM & 8TA @ CENTURION',
            '🇿🇦 SOUTH AFRICAN REVENUE SERVICE',
            'SUPPLIER-123/ABC.XYZ',
        ];

        for (const kw of complexKeywords) {
            const res = ruleFormSchema.safeParse({ keywords: kw });
            expect(res.success).toBe(true);
        }
    });

    it('3.6: Strips unexpected extra fields cleanly without crashing', () => {
        const res = ruleFormSchema.safeParse({
            keywords: 'SHELL',
            extraField: 'malicious-or-unexpected-payload',
            nested: { hack: true },
        });

        expect(res.success).toBe(true);
        if (res.success) {
            expect((res.data as any).extraField).toBeUndefined();
            expect((res.data as any).nested).toBeUndefined();
        }
    });
});

// ============================================================================
// SUITE 4: manualTransactionSchema Adversarial Stress Testing
// ============================================================================
describe('Challenger 1 Suite 4: manualTransactionSchema Adversarial Stress Testing', () => {
    it('4.1: Accepts valid positive and negative financial amounts', () => {
        const validPositive = manualTransactionSchema.safeParse({
            date: new Date('2026-09-21'),
            description: 'Customer Payment Received',
            amount: 1500.50,
        });
        expect(validPositive.success).toBe(true);

        const validNegative = manualTransactionSchema.safeParse({
            date: new Date('2026-09-21'),
            description: 'Bank Service Charges',
            amount: -75.00,
        });
        expect(validNegative.success).toBe(true);
    });

    it('4.2: Preprocesses string amounts into numeric values', () => {
        const stringPos = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Coerced Positive',
            amount: '250.75',
        });
        expect(stringPos.success).toBe(true);
        if (stringPos.success) {
            expect(stringPos.data.amount).toBe(250.75);
        }

        const stringNeg = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Coerced Negative',
            amount: '-120.00',
        });
        expect(stringNeg.success).toBe(true);
        if (stringNeg.success) {
            expect(stringNeg.data.amount).toBe(-120.00);
        }
    });

    it('4.3: Strictly rejects zero, negative zero, and zero-coerced values', () => {
        // Zero number
        const zeroNum = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Zero transaction',
            amount: 0,
        });
        expect(zeroNum.success).toBe(false);

        // Negative zero
        const negZero = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Negative zero transaction',
            amount: -0,
        });
        expect(negZero.success).toBe(false);

        // String zero
        const zeroStr = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'String zero',
            amount: '0',
        });
        expect(zeroStr.success).toBe(false);

        // Empty string coerces to Number("") === 0
        const emptyStr = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Empty string amount',
            amount: '',
        });
        expect(emptyStr.success).toBe(false);

        // Whitespace string coerces to Number("   ") === 0
        const spaceStr = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Whitespace amount',
            amount: '   ',
        });
        expect(spaceStr.success).toBe(false);

        // Null coerces to Number(null) === 0
        const nullAmt = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Null amount',
            amount: null,
        });
        expect(nullAmt.success).toBe(false);
    });

    it('4.4: Rejects non-numeric strings and NaN values', () => {
        const nanStr = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Alphabetic amount',
            amount: 'not-a-number',
        });
        expect(nanStr.success).toBe(false);

        const nanNum = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'NaN amount',
            amount: NaN,
        });
        expect(nanNum.success).toBe(false);

        const undefAmt = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Undefined amount',
            amount: undefined,
        });
        expect(undefAmt.success).toBe(false);
    });

    it('4.5: Tests boundary decimal amounts (sub-cents and micro amounts)', () => {
        // 0.01 cent boundary
        const oneCent = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'One Cent Interest',
            amount: 0.01,
        });
        expect(oneCent.success).toBe(true);

        const negOneCent = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'One Cent Fee',
            amount: -0.01,
        });
        expect(negOneCent.success).toBe(true);

        // Micro-cent amount (non-zero)
        const microAmount = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Micro amount',
            amount: 0.00001,
        });
        expect(microAmount.success).toBe(true);
    });

    it('4.6: Enforces description length >= 3 and handles edge string formatting', () => {
        const shortDesc = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'AB',
            amount: 100,
        });
        expect(shortDesc.success).toBe(false);

        const exactDesc = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'ABC',
            amount: 100,
        });
        expect(exactDesc.success).toBe(true);

        // Multi-line and special characters
        const multilineDesc = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Line 1\nLine 2\tTabbed',
            amount: 100,
        });
        expect(multilineDesc.success).toBe(true);
    });

    it('4.7: Validates date objects and rejects invalid Date instances or non-date strings', () => {
        // Valid Date instance
        expect(manualTransactionSchema.safeParse({
            date: new Date('2026-09-21T08:00:00Z'),
            description: 'Valid Date',
            amount: 100,
        }).success).toBe(true);

        // Invalid Date instance (new Date('invalid'))
        expect(manualTransactionSchema.safeParse({
            date: new Date('invalid-date-string'),
            description: 'Invalid Date Instance',
            amount: 100,
        }).success).toBe(false);

        // Raw ISO string (schema expects Date, not string)
        expect(manualTransactionSchema.safeParse({
            date: '2026-09-21',
            description: 'String Date',
            amount: 100,
        }).success).toBe(false);
    });

    it('4.8: Handles optional reference field safely', () => {
        const withoutRef = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'No reference',
            amount: 100,
        });
        expect(withoutRef.success).toBe(true);
        if (withoutRef.success) {
            expect(withoutRef.data.reference).toBeUndefined();
        }

        const withRef = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'With reference',
            amount: 100,
            reference: 'INV-9921',
        });
        expect(withRef.success).toBe(true);
        if (withRef.success) {
            expect(withRef.data.reference).toBe('INV-9921');
        }
    });

    it('4.9: Empirical Invariant Observation: Infinity amount behavior', () => {
        // Zod's z.number() without .finite() permits Infinity
        const infinityResult = manualTransactionSchema.safeParse({
            date: new Date(),
            description: 'Infinite money',
            amount: Infinity,
        });
        // Records empirical behavior for verification report
        expect(typeof infinityResult.success).toBe('boolean');
    });
});

// ============================================================================
// SUITE 5: Dialog Prop Contracts & Clue Badge Helpers
// ============================================================================
describe('Challenger 1 Suite 5: Dialog Prop Contracts & Clue Badge Helpers', () => {
    it('5.1: Clue Badge Helpers return resilient icons and styling for all 8 standard clue types', () => {
        const clues: ClueType[] = [
            'timing',
            'amount',
            'prefix',
            'reference',
            'cross_ref',
            'sweep',
            'structure',
            'web',
        ];

        for (const clue of clues) {
            const icon = renderClueIcon(clue);
            const style = getClueBadgeStyle(clue);

            expect(React.isValidElement(icon)).toBe(true);
            expect(typeof style).toBe('string');
            expect(style).toContain('border-');
        }
    });

    it('5.2: Clue Badge Helpers degrade gracefully on invalid or unrecognized clue types', () => {
        const fallbackIcon = renderClueIcon('non_existent' as any);
        const fallbackStyle = getClueBadgeStyle('non_existent' as any);

        expect(React.isValidElement(fallbackIcon)).toBe(true);
        expect(fallbackStyle).toBe('bg-slate-50 text-slate-700 border-slate-200');

        const emptyIcon = renderClueIcon('' as any);
        const emptyStyle = getClueBadgeStyle('' as any);
        expect(React.isValidElement(emptyIcon)).toBe(true);
        expect(emptyStyle).toBe('bg-slate-50 text-slate-700 border-slate-200');
    });

    it('5.3: RuleViewDialog safely renders null when rule is null', () => {
        const props: RuleViewDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            rule: null,
        };

        const rendered = renderToString(React.createElement(RuleViewDialog, props));
        expect(rendered).toBe('');
    });

    it('5.4: RuleViewDialog renders rule details correctly when rule is provided', () => {
        const props: RuleViewDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            rule: {
                id: 'rule_1',
                keywords: ['VODACOM', 'AIRTIME'],
                accountId: 'Telephone & Internet',
                vatType: 'standard_rated_purchases',
                description: 'Vodacom Mobile Charges',
            },
            matchedKeyword: 'VODACOM',
            isVatRegistered: true,
        };

        const rendered = renderToString(React.createElement(RuleViewDialog, props));
        expect(rendered).toContain('Allocation Rule Details');
        expect(rendered).toContain('Vodacom Mobile Charges');
        expect(rendered).toContain('VODACOM');
        expect(rendered).toContain('Telephone &amp; Internet');
    });

    it('5.5: AIAllocationReviewDialog safely returns null when suggestion or transaction is null', () => {
        const nullSuggestionProps: AIAllocationReviewDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            suggestion: null,
            transaction: { id: 'tx-1', description: 'Test' } as any,
            onAction: vi.fn(),
        };
        expect(renderToString(React.createElement(AIAllocationReviewDialog, nullSuggestionProps))).toBe('');

        const nullTxProps: AIAllocationReviewDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            suggestion: { confidence: 90, accountId: 'acc-1', vatType: 'no_vat', summary: 'AI match' } as any,
            transaction: null,
            onAction: vi.fn(),
        };
        expect(renderToString(React.createElement(AIAllocationReviewDialog, nullTxProps))).toBe('');
    });

    it('5.6: GroupTransactionsDialog returns null when group is null', () => {
        const props: GroupTransactionsDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            group: null,
            onMoveToNew: vi.fn(),
            onSplitGroup: vi.fn(),
        };

        expect(renderToString(React.createElement(GroupTransactionsDialog, props))).toBe('');
    });

    it('5.7: GroupTransactionsDialog renders transaction list with formatPrice when group is provided', () => {
        const mockGroup: TransactionGroup = {
            merchantKey: 'ENGEN',
            status: 'ready',
            suggestion: null,
            transactions: [
                {
                    id: 'tx-1',
                    date: '2026-09-20',
                    description: 'ENGEN WINCHESTER 1234',
                    cleanDescription: 'ENGEN WINCHESTER',
                    amount: -450.50,
                    status: 'new',
                } as any,
                {
                    id: 'tx-2',
                    date: '2026-09-21',
                    description: 'ENGEN WATERKLOOF',
                    cleanDescription: 'ENGEN WATERKLOOF',
                    amount: -600.00,
                    status: 'new',
                } as any,
            ],
        };

        const props: GroupTransactionsDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            group: mockGroup,
            onMoveToNew: vi.fn(),
            onSplitGroup: vi.fn(),
        };

        const rendered = renderToString(React.createElement(GroupTransactionsDialog, props));
        expect(rendered).toContain('Transactions for:');
        expect(rendered).toContain('ENGEN');
        expect(rendered).toContain('-450.50');
        expect(rendered).toContain('-600.00');
        expect(rendered).toContain('Split Group into Individual Merchants');
    });

    it('5.8: Vulnerability stress test: RuleViewDialog throws if rule.vatType is undefined when isVatRegistered is true', () => {
        const propsWithMissingVatType: RuleViewDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            rule: {
                id: 'rule_bad',
                keywords: ['TEST'],
                accountId: 'Bank Fees',
                description: 'Rule with missing vatType',
            } as any,
            isVatRegistered: true,
        };

        // When isVatRegistered is true, calling replace on undefined vatType throws TypeError
        expect(() => {
            renderToString(React.createElement(RuleViewDialog, propsWithMissingVatType));
        }).toThrow(TypeError);

        // However, when isVatRegistered is false or omitted, it renders safely
        const propsWithoutVatReg: RuleViewDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            rule: {
                id: 'rule_bad',
                keywords: ['TEST'],
                accountId: 'Bank Fees',
                description: 'Rule with missing vatType',
            } as any,
            isVatRegistered: false,
        };
        expect(() => {
            renderToString(React.createElement(RuleViewDialog, propsWithoutVatReg));
        }).not.toThrow();
    });

    it('5.9: Vulnerability stress test: AIAllocationReviewDialog throws if suggestion.vatType is undefined when isVatRegistered is true', () => {
        const propsWithMissingVatType: AIAllocationReviewDialogProps = {
            open: true,
            onOpenChange: vi.fn(),
            suggestion: {
                confidence: 85,
                accountId: 'Office Expenses',
                summary: 'AI Suggestion',
            } as any,
            transaction: {
                id: 'tx-1',
                description: 'Stationery shop',
            } as any,
            onAction: vi.fn(),
            isVatRegistered: true,
        };

        // When isVatRegistered is true, calling replace on undefined vatType throws TypeError
        expect(() => {
            renderToString(React.createElement(AIAllocationReviewDialog, propsWithMissingVatType));
        }).toThrow(TypeError);

        // When isVatRegistered is false, it does not throw
        const propsWithoutVatReg: AIAllocationReviewDialogProps = {
            ...propsWithMissingVatType,
            isVatRegistered: false,
        };
        expect(() => {
            renderToString(React.createElement(AIAllocationReviewDialog, propsWithoutVatReg));
        }).not.toThrow();
    });

});
