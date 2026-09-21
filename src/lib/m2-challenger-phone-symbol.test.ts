import { describe, it, expect } from 'vitest';
import { BankCleaner, extractStructuralClues, matchesRuleKeyword } from './bank-cleaner';

describe('Milestone 2 Challenger #2 Adversarial Suite: Structural Clues & Spoken Symbols', () => {
    describe('1. Structural Clue Extraction - VAT Numbers', () => {
        it('extracts valid 10-digit VAT numbers starting with 4', () => {
            expect(extractStructuralClues('VAT 4010203040').vatNumber).toBe('4010203040');
            expect(extractStructuralClues('4123456789').vatNumber).toBe('4123456789');
            expect(extractStructuralClues('SUPPLIER INVOICE 4123456789 PAYMENT').vatNumber).toBe('4123456789');
        });

        it('does NOT extract non-matching digits as VAT', () => {
            // 10 digits starting with 5
            expect(extractStructuralClues('5123456789').vatNumber).toBeUndefined();
            expect(extractStructuralClues('VAT 5123456789').vatNumber).toBeUndefined();

            // 9 digits
            expect(extractStructuralClues('412345678').vatNumber).toBeUndefined();

            // 11 digits
            expect(extractStructuralClues('41234567890').vatNumber).toBeUndefined();
        });
    });

    describe('2. Structural Clue Extraction - Phone Numbers', () => {
        it('extracts standard mobile numbers starting with 0', () => {
            expect(extractStructuralClues('0821234567').phoneNumber).toBe('0821234567');
            expect(extractStructuralClues('082 123 4567').phoneNumber).toBe('0821234567');
            expect(extractStructuralClues('011 555 1234').phoneNumber).toBe('0115551234');
        });

        it('extracts international phone numbers starting with +27 (including spaced formats)', () => {
            expect(extractStructuralClues('+27115551234').phoneNumber).toBe('+27115551234');
            // Required format: +27 11 555 1234
            expect(extractStructuralClues('+27 11 555 1234').phoneNumber).toBe('+27115551234');
            expect(extractStructuralClues('TELKOM HELP DESK +27 11 555 1234 REF 123').phoneNumber).toBe('+27115551234');
        });

        it('does NOT extract dates as phone numbers', () => {
            expect(extractStructuralClues('INVOICE 15/09/2024 PAYMENT').phoneNumber).toBeUndefined();
        });
    });

    describe('3. Structural Clue Extraction - SARS PRNs', () => {
        it('extracts 19-digit numerical and alphanumeric PRNs', () => {
            expect(extractStructuralClues('SARS VAT201 PRN 1940012345678901234').prn).toBe('1940012345678901234');
            expect(extractStructuralClues('1940012345678901234').prn).toBe('1940012345678901234');
            expect(extractStructuralClues('1234567890V12345678').prn).toBe('1234567890V12345678');
            expect(extractStructuralClues('1234567890P12345678').prn).toBe('1234567890P12345678');
            expect(extractStructuralClues('SARSEFLNG 9876543210 PROV').prn).toBe('9876543210');
        });
    });

    describe('4. Spoken Symbol Invariant - @HOME vs Generic HOME', () => {
        it('must NOT match @HOME against generic descriptions without @ or standalone AT', () => {
            expect(matchesRuleKeyword('HOME AFFAIRS', '@HOME')).toBe(false);
            expect(matchesRuleKeyword('OLD AGE HOME', '@HOME')).toBe(false);
            expect(matchesRuleKeyword('HOME SWEET HOME', '@HOME')).toBe(false);
            expect(matchesRuleKeyword('FUNERAL HOME', '@HOME')).toBe(false);

            expect(matchesRuleKeyword('HOME AFFAIRS', 'AT HOME')).toBe(false);
            expect(matchesRuleKeyword('OLD AGE HOME', 'AT HOME')).toBe(false);
            expect(matchesRuleKeyword('FUNERAL HOME', 'AT HOME')).toBe(false);
        });

        it('MUST match @HOME and AT HOME when spoken symbols are present', () => {
            expect(matchesRuleKeyword('PURCHASE @HOME', '@HOME')).toBe(true);
            expect(matchesRuleKeyword('AT HOME STORE', '@HOME')).toBe(true);
            expect(matchesRuleKeyword('PURCHASE @HOME', 'AT HOME')).toBe(true);
            expect(matchesRuleKeyword('3@1 WATERKLOOF', '3 AT 1')).toBe(true);
            expect(matchesRuleKeyword('3 AT 1', '3@1')).toBe(true);
            expect(matchesRuleKeyword('3 AT 1', '3 AT 1')).toBe(true);
        });
    });
});
