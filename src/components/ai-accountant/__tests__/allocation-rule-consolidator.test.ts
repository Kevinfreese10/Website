import { describe, it, expect } from 'vitest';
import { consolidateAllocationRules } from '@/lib/allocation-rule-consolidator';
import { AllocationRule } from '@/lib/types';

describe('Allocation Rule Consolidator', () => {
    it('consolidates 11 duplicate Bank Charges rules into 1 master rule with merged, deduplicated, sorted keywords', () => {
        const duplicateRules: AllocationRule[] = [
            { id: 'rule_1', description: 'Rule for Bank Charges', accountId: '3000-004', keywords: ['MONTHLY FEE', 'BANK CHARGES'], vatType: 'standard' },
            { id: 'rule_2', description: 'Bank charges pmt', accountId: '3000-004', keywords: ['SERVICE FEE', 'BANK CHARGES'], vatType: 'standard' },
            { id: 'rule_3', description: 'Card fees', accountId: '3000-004', keywords: ['CARD FEE', 'ATM CHARGE'], vatType: 'standard' },
            { id: 'rule_4', description: 'Bank Charges 4', accountId: '3000-004', keywords: ['POS FEE', 'MONTHLY SERVICE FEE'], vatType: 'standard' },
            { id: 'rule_5', description: 'Bank Charges 5', accountId: '3000-004', keywords: ['INTEREST CHARGED'], vatType: 'standard' },
            { id: 'rule_6', description: 'Bank Charges 6', accountId: '3000-004', keywords: ['CASH DEPOSIT FEE'], vatType: 'standard' },
            { id: 'rule_7', description: 'Bank Charges 7', accountId: '3000-004', keywords: ['UNPAID CHEQUE FEE'], vatType: 'standard' },
            { id: 'rule_8', description: 'Bank Charges 8', accountId: '3000-004', keywords: ['STATEMENT FEE'], vatType: 'standard' },
            { id: 'rule_9', description: 'Bank Charges 9', accountId: '3000-004', keywords: ['FNB CHARGES'], vatType: 'standard' },
            { id: 'rule_10', description: 'Bank Charges 10', accountId: '3000-004', keywords: ['NEDBANK CHARGES'], vatType: 'standard' },
            { id: 'rule_11', description: 'Bank Charges 11', accountId: '3000-004', keywords: ['ABSA FEES', 'MONTHLY FEE'], vatType: 'standard' },
        ];

        const consolidated = consolidateAllocationRules(duplicateRules, {
            chartOfAccounts: [
                { id: '3000-004', code: '3000-004', name: 'Bank Charges', description: 'Bank Charges', type: 'expense', isSystem: true } as any
            ],
            isVatRegistered: true
        });

        expect(consolidated).toHaveLength(1);
        const rule = consolidated[0];
        expect(rule.accountId).toBe('3000-004');
        expect(rule.description).toBe('Bank Charges (3000-004)');

        // Check keywords are deduplicated and sorted
        expect(rule.keywords).toBeDefined();
        // Set contains unique keywords
        const uniqueSet = new Set(rule.keywords);
        expect(rule.keywords?.length).toBe(uniqueSet.size);

        // Verify sorted alphabetically
        const copy = [...(rule.keywords || [])];
        copy.sort((a, b) => a.localeCompare(b));
        expect(rule.keywords).toEqual(copy);
    });

    it('handles multiple accounts separately and preserves unique accounts', () => {
        const mixedRules: AllocationRule[] = [
            { id: 'rule_1', accountId: '3000-004', keywords: ['BANK FEE'], vatType: 'standard' },
            { id: 'rule_2', accountId: '3000-050', keywords: ['AIRBNB', 'HOTEL'], vatType: 'standard' },
            { id: 'rule_3', accountId: '3000-050', keywords: ['BASS LAKE', 'AIRBNB'], vatType: 'standard' },
            { id: 'rule_4', accountId: '3000-004', keywords: ['SERVICE FEE'], vatType: 'standard' },
        ];

        const consolidated = consolidateAllocationRules(mixedRules);
        expect(consolidated).toHaveLength(2);

        const travel = consolidated.find(r => r.accountId === '3000-050');
        expect(travel).toBeDefined();
        expect(travel?.keywords).toContain('AIRBNB');
        expect(travel?.keywords).toContain('BASS LAKE');
        expect(travel?.keywords).toContain('HOTEL');
        expect(travel?.keywords?.length).toBe(3); // 'AIRBNB' deduplicated
    });

    it('standardizes VAT from Chart of Accounts default if available', () => {
        const rules: AllocationRule[] = [
            { id: 'r1', accountId: '3000-004', vatType: 'no_vat', keywords: ['FEE'] },
            { id: 'r2', accountId: '3000-004', vatType: 'standard_rate', keywords: ['CHARGE'] },
        ];

        const coa = [
            { id: '3000-004', code: '3000-004', name: 'Bank Charges', defaultVatType: 'standard_rate' } as any
        ];

        const result = consolidateAllocationRules(rules, { chartOfAccounts: coa, isVatRegistered: true });
        expect(result[0].vatType).toBe('standard_rate');
    });
});
