import { describe, it, expect } from 'vitest';
import { matchesRuleKeyword } from './bank-cleaner';

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
});
