import { describe, it, expect } from 'vitest';
import { matchesRuleKeyword, matchRuleGuideDetails } from './bank-cleaner';

describe('matchesRuleKeyword (Word-Boundary Rule Matcher)', () => {
    it('should match standalone keywords correctly', () => {
        expect(matchesRuleKeyword('BUS TICKET TO DURBAN', 'BUS')).toBe(true);
        expect(matchesRuleKeyword('INTERNET PMT TO TELKOM', 'TELKOM')).toBe(true);
        expect(matchesRuleKeyword('PURCHASE FROM SHELL SERVICE STATION', 'SHELL')).toBe(true);
        expect(matchesRuleKeyword('POS PURCHASE UBER TRIP', 'UBER')).toBe(true);
        expect(matchesRuleKeyword('OUTSURANCE PREMIUM DIRECT DEBIT', 'OUTSURANCE')).toBe(true);
    });

    it('should NOT match substrings embedded in names or other words (preventing collisions)', () => {
        // "BUS" must NOT match promoter "BUSISIWE"
        expect(matchesRuleKeyword('INTERNET PMT TO BUSISIWE. PROMOTER INDAYI', 'BUS')).toBe(false);

        // "FEE" must NOT match "COFFEE" or "CONSULTING FEES" (when checking exact singular "FEE")
        expect(matchesRuleKeyword('STARBUCKS COFFEE SHOP', 'FEE')).toBe(false);
        expect(matchesRuleKeyword('LEGAL CONSULTING FEES INVOICE', 'FEE')).toBe(false);

        // "EMP" must NOT match "TEMPEST"
        expect(matchesRuleKeyword('TEMPEST CAR HIRE CAPE TOWN', 'EMP')).toBe(false);

        // "PART" must NOT match "APARTMENT"
        expect(matchesRuleKeyword('APARTMENT RENT FOR OFFICE', 'PART')).toBe(false);

        // "FIX" must NOT match "FIXED DEPOSIT"
        expect(matchesRuleKeyword('FIXED DEPOSIT MATURITY', 'FIX')).toBe(false);
    });

    it('should support special bank syntax prefixes like # and *', () => {
        expect(matchesRuleKeyword('FNB #SERVICE FEES FOR AUG', '#SERVICE FEES')).toBe(true);
        expect(matchesRuleKeyword('FNB #MONTHLY ACCOUNT FEE', '#MONTHLY ACCOUNT FEE')).toBe(true);
        expect(matchesRuleKeyword('FNB #INT PYMT FEE', '#INT PYMT FEE')).toBe(true);
        expect(matchesRuleKeyword('POS PURCHASE 491050*9002 UBER', '*9002')).toBe(true);
    });

    it('should handle punctuation, slashes, dashes, and whitespace delimiters correctly', () => {
        expect(matchesRuleKeyword('PAYMENT TO TELKOM/SA', 'TELKOM')).toBe(true);
        expect(matchesRuleKeyword('DEBIT-ORDER-VODACOM', 'VODACOM')).toBe(true);
        expect(matchesRuleKeyword('APPLE.COM/BILL 011-234-5678', 'APPLE.COM/BILL')).toBe(true);
        expect(matchesRuleKeyword('SARSEFLNG 9876543210 PROV', 'SARSEFLNG')).toBe(true);
    });

    describe('Guide-Based Matching (Token Overlap & Stop-Word Filtering)', () => {
        it('matches when bank description is a subset of rule keyword (e.g. HAND TOOLS matching HAND TOOLS SUPPLY)', () => {
            // User example: Bank description says "HAND TOOLS", Rule says "HAND TOOLS SUPPLY"
            expect(matchesRuleKeyword('HAND TOOLS', 'HAND TOOLS SUPPLY')).toBe(true);
            expect(matchesRuleKeyword('HAND TOOLS', 'HAND TOOLS SUPPLIES')).toBe(true);
            expect(matchesRuleKeyword('HAND TOOLS', 'HAND TOOLS SERVICES')).toBe(true);
            expect(matchesRuleKeyword('HAND TOOLS', 'HAND TOOLS TRADING PTY LTD')).toBe(true);
        });

        it('matches when rule keyword is a subset of bank description (forward guide match)', () => {
            expect(matchesRuleKeyword('HAND TOOLS SUPPLY DURBAN', 'HAND TOOLS')).toBe(true);
            expect(matchesRuleKeyword('PURCHASE HAND TOOLS CAPE TOWN', 'HAND TOOLS')).toBe(true);
            expect(matchesRuleKeyword('POS PURCHASE HAND TOOLS DURBAN', 'HAND TOOLS SUPPLY')).toBe(true);
            expect(matchesRuleKeyword('HAND TOOLS ENTERPRISES 1234', 'HAND TOOLS')).toBe(true);
        });

        it('matches bidirectional corporate variations with stop words stripped', () => {
            expect(matchesRuleKeyword('BUILDERS WAREHOUSE STRUBENSVALLEY', 'BUILDERS WAREHOUSE')).toBe(true);
            expect(matchesRuleKeyword('BUILDERS WAREHOUSE', 'BUILDERS WAREHOUSE PTY LTD')).toBe(true);
            expect(matchesRuleKeyword('FASTENERS & FIXINGS CC', 'FASTENERS & FIXINGS')).toBe(true);
            expect(matchesRuleKeyword('FASTENERS AND FIXINGS', 'FASTENERS FIXINGS SUPPLY')).toBe(true);
        });

        it('does NOT falsely match purely generic stop-words across unrelated entities', () => {
            // Both have "SERVICES" or "SUPPLY", but core business names differ
            expect(matchesRuleKeyword('LEGAL CONSULTING SERVICES', 'PLUMBING SERVICES')).toBe(false);
            expect(matchesRuleKeyword('ABC SUPPLY STORE', 'XYZ SUPPLY')).toBe(false);
            expect(matchesRuleKeyword('BLUE SHIRT CLOTHING', 'BLUE CAR AUTOMOTIVE')).toBe(false);
        });

        it('returns rich details with confidence via matchRuleGuideDetails', () => {
            const exactRes = matchRuleGuideDetails('PURCHASE FROM SHELL SERVICE STATION', 'SHELL');
            expect(exactRes.matched).toBe(true);
            expect(exactRes.matchType).toBe('exact');
            expect(exactRes.confidence).toBe(100);

            const guideRes = matchRuleGuideDetails('HAND TOOLS', 'HAND TOOLS SUPPLY');
            expect(guideRes.matched).toBe(true);
            expect(guideRes.matchType).toBe('guide');
            expect(guideRes.confidence).toBeGreaterThanOrEqual(90);

            const noMatchRes = matchRuleGuideDetails('ABC BAKERY', 'DEF LOGISTICS');
            expect(noMatchRes.matched).toBe(false);
            expect(noMatchRes.matchType).toBe('none');
            expect(noMatchRes.confidence).toBe(0);
        });
    });
});

