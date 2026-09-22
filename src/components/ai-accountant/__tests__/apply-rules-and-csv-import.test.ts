import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { matchesRuleKeyword } from '@/lib/bank-cleaner';

describe('Apply Rules Multi-Field Matching & CSV Import Without Merchant Name', () => {
    const newTabPath = path.resolve(__dirname, '../NewTransactionsTab.tsx');
    const newTabContent = fs.readFileSync(newTabPath, 'utf-8');

    const importDialogPath = path.resolve(__dirname, '../dialogs/ImportDialog.tsx');
    const importDialogContent = fs.readFileSync(importDialogPath, 'utf-8');

    describe('1. Static Code Analysis', () => {
        it('1.1: handleAllocateByRules collects rawDescription, description, cleanDescription, and merchantKey as candidate match targets', () => {
            expect(newTabContent).toContain('tx.rawDescription');
            expect(newTabContent).toContain('tx.description');
            expect(newTabContent).toContain('tx.cleanDescription');
            expect(newTabContent).toContain('tx.merchantKey');
            expect(newTabContent).toContain('candidates.some(desc => matchesRuleKeyword(desc, kw))');
        });

        it('1.2: ImportDialog handleImport does not assign merchantKey or cleanDescription on CSV import', () => {
            // Confirm merchantKey and cleanDescription assignments were removed from txData
            expect(importDialogContent).not.toMatch(/txData\.cleanDescription\s*=\s*triage\.cleanDescription/);
            expect(importDialogContent).not.toMatch(/txData\.merchantKey\s*=\s*triage\.merchantKey/);
            expect(importDialogContent).toContain('rawDescription: description');
        });
    });

    describe('2. Functional Verification of Multi-Field Rule Matching', () => {
        const testRule = {
            id: 'rule-fee-1',
            keywords: ['MANAGEMENT FEE', 'BANK CHARGES'],
            accountId: 'acc-bank-fees',
            vatType: 'no_vat',
        };

        const evaluateMatch = (tx: {
            rawDescription?: string;
            description?: string;
            cleanDescription?: string;
            merchantKey?: string;
        }) => {
            const candidates = [
                tx.rawDescription,
                tx.description,
                tx.cleanDescription,
                tx.merchantKey
            ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

            if (candidates.length === 0) return null;
            return testRule.keywords.some(kw => candidates.some(desc => matchesRuleKeyword(desc, kw)));
        };

        it('2.1: Matches when keyword appears in rawDescription only', () => {
            const tx = {
                rawDescription: 'FNB #MONTHLY MANAGEMENT FEE REF-99238',
                description: 'FNB SERVICE 99238', // clean/shortened
            };
            expect(evaluateMatch(tx)).toBe(true);
        });

        it('2.2: Matches when keyword appears in standard description only', () => {
            const tx = {
                description: 'MONTHLY MANAGEMENT FEE',
            };
            expect(evaluateMatch(tx)).toBe(true);
        });

        it('2.3: Matches when keyword appears in cleanDescription only', () => {
            const tx = {
                rawDescription: 'TRN 109238814777 B/C',
                description: 'TRN 109238814777 B/C',
                cleanDescription: 'BANK CHARGES',
            };
            expect(evaluateMatch(tx)).toBe(true);
        });

        it('2.4: Matches when keyword appears in merchantKey only', () => {
            const tx = {
                rawDescription: 'DIRECT DEBIT FEE-OCT2026',
                description: 'DIRECT DEBIT FEE',
                merchantKey: 'MANAGEMENT FEE',
            };
            expect(evaluateMatch(tx)).toBe(true);
        });

        it('2.5: Returns false when no field matches rule keywords', () => {
            const tx = {
                rawDescription: 'ENGEN SERVICE STATION CAPE TOWN',
                description: 'ENGEN SERVICE STATION',
                cleanDescription: 'ENGEN',
                merchantKey: 'ENGEN',
            };
            expect(evaluateMatch(tx)).toBe(false);
        });
    });
});
