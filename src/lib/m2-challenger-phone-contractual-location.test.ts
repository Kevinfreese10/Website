import { describe, it, expect } from 'vitest';
import {
    BankCleaner,
    classifyPaymentChannel,
    extractStructuralClues,
    isValidBranchLocation,
    NON_GEOGRAPHIC_DESCRIPTORS,
    NATIONAL_ROOT_BRANDS
} from './bank-cleaner';

describe('Milestone 2 & 3 Challenger #2 Empirical Stress Harness', () => {
    describe('1. Phone Clue Extraction Invariants', () => {
        it('extracts +27 11 555 1234 directly from extractStructuralClues', () => {
            const clues = extractStructuralClues('+27 11 555 1234');
            expect(clues.phoneNumber).toBe('+27115551234');
        });

        it('extracts +27 11 555 1234 in BankCleaner.clean', () => {
            const res = BankCleaner.clean('TELKOM SA +27 11 555 1234');
            expect(res.structuralClues?.phoneNumber).toBe('+27115551234');
        });

        it('extracts +27 11 555 1234 in BankCleaner.process', () => {
            const res = BankCleaner.process('POS PURCHASE VODACOM +27 11 555 1234');
            expect(res.structuralClues?.phoneNumber).toBe('+27115551234');
            expect(res.merchantKey).toBe('VODACOM');
            expect(res.paymentChannel).toBe('POS');
        });

        it('handles varied phone delimiters and SA area codes', () => {
            // Johannesburg (+27 11)
            expect(extractStructuralClues('+27 11 555 1234').phoneNumber).toBe('+27115551234');
            expect(extractStructuralClues('+27-11-555-1234').phoneNumber).toBe('+27115551234');
            expect(extractStructuralClues('+27.11.555.1234').phoneNumber).toBe('+27115551234');

            // Pretoria (+27 12)
            expect(extractStructuralClues('+27 12 345 6789').phoneNumber).toBe('+27123456789');

            // Cape Town (+27 21)
            expect(extractStructuralClues('+27 21 400 1234').phoneNumber).toBe('+27214001234');

            // Durban (+27 31)
            expect(extractStructuralClues('+27 31 300 5678').phoneNumber).toBe('+27313005678');

            // Mobile (+27 82, +27 83, +27 72)
            expect(extractStructuralClues('+27 82 123 4567').phoneNumber).toBe('+27821234567');
            expect(extractStructuralClues('+27 83 987 6543').phoneNumber).toBe('+27839876543');
            expect(extractStructuralClues('+27 72 000 1111').phoneNumber).toBe('+27720001111');

            // Local 0-prefixed formats
            expect(extractStructuralClues('011 555 1234').phoneNumber).toBe('0115551234');
            expect(extractStructuralClues('082 123 4567').phoneNumber).toBe('0821234567');
        });

        it('does NOT falsely extract dates or random numbers as phone numbers', () => {
            expect(extractStructuralClues('DATE 2024/09/15').phoneNumber).toBeUndefined();
            expect(extractStructuralClues('PAYMENT 15/09/2024').phoneNumber).toBeUndefined();
            expect(extractStructuralClues('AMOUNT 1234567').phoneNumber).toBeUndefined();
            expect(extractStructuralClues('REF 9900112233').phoneNumber).toBeUndefined();
        });
    });

    describe('2. Contractual vs Discretionary Segregation Invariants', () => {
        it('segregates DEBIT ORDER VODACOM to VODACOM [DEBIT ORDER] and POS PURCHASE VODACOM to VODACOM', () => {
            const debitOrder = BankCleaner.process('DEBIT ORDER VODACOM');
            expect(debitOrder.paymentChannel).toBe('DEBIT_ORDER');
            expect(debitOrder.cleanDescription).toBe('VODACOM');
            expect(debitOrder.merchantKey).toBe('VODACOM [DEBIT ORDER]');

            const posPurchase = BankCleaner.process('POS PURCHASE VODACOM');
            expect(posPurchase.paymentChannel).toBe('POS');
            expect(posPurchase.cleanDescription).toBe('VODACOM');
            expect(posPurchase.merchantKey).toBe('VODACOM');
        });

        it('segregates all contractual debit instruction channels with [DEBIT ORDER] suffix', () => {
            const channelsToTest = [
                { input: 'DEBIT ORDER MTN', expectedKey: 'MTN [DEBIT ORDER]', channel: 'DEBIT_ORDER' },
                { input: 'STOP ORDER OUTSURANCE', expectedKey: 'OUTSURANCE [DEBIT ORDER]', channel: 'DEBIT_ORDER' },
                { input: 'NAEDO TRACKED SANLAM', expectedKey: 'SANLAM [DEBIT ORDER]', channel: 'DEBIT_ORDER' },
                { input: 'DEBICHECK DISCOVERY', expectedKey: 'DISCOVERY [DEBIT ORDER]', channel: 'DEBIT_ORDER' },
                { input: 'ACB DEBIT SANTAM', expectedKey: 'SANTAM [DEBIT ORDER]', channel: 'DEBIT_ORDER' },
                { input: 'DIRECT DEBIT TELKOM', expectedKey: 'TELKOM [DEBIT ORDER]', channel: 'DEBIT_ORDER' },
                { input: 'MAGTAPE DEBIT VODACOM', expectedKey: 'VODACOM [DEBIT ORDER]', channel: 'DEBIT_ORDER' },
            ];

            for (const { input, expectedKey, channel } of channelsToTest) {
                const res = BankCleaner.process(input);
                expect(res.paymentChannel).toBe(channel);
                expect(res.merchantKey).toBe(expectedKey);
            }
        });

        it('ensures discretionary card, POS, and EFT spend remains WITHOUT [DEBIT ORDER] suffix', () => {
            const discretionaryToTest = [
                { input: 'POS PURCHASE MTN SANDTON', expectedKey: 'MTN', channel: 'POS', branch: 'SANDTON' },
                { input: 'CARD PURCHASE OUTSURANCE', expectedKey: 'OUTSURANCE', channel: 'CARD' },
                { input: 'EFT PAYMENT VODACOM AIRTIME', expectedKey: 'VODACOM', channel: 'EFT' },
                { input: 'RTC PMT TELKOM DATA', expectedKey: 'TELKOM', channel: 'RTC' },
            ];

            for (const { input, expectedKey, channel, branch } of discretionaryToTest) {
                const res = BankCleaner.process(input);
                expect(res.paymentChannel).toBe(channel);
                expect(res.merchantKey).toBe(expectedKey);
                if (branch) {
                    expect(res.branchLocation).toBe(branch);
                }
            }
        });

        it('correctly routes DEBIT ORDER FEE to FEE / BANK FEES without applying merchant debit order suffix', () => {
            const feeRes = BankCleaner.process('DEBIT ORDER FEE');
            expect(feeRes.paymentChannel).toBe('FEE');
            expect(feeRes.cleanDescription).toBe('BANK FEES');
            // Retain 'BANK FEES' as merchantKey for bank fees
            expect(feeRes.merchantKey).toBe('BANK FEES');
        });
    });

    describe('3. Non-Geographic Descriptors & Root Brand Invariants', () => {
        it('UBER TRIP has merchantKey: "UBER" and branchLocation is undefined (not "TRIP")', () => {
            const uber = BankCleaner.process('UBER TRIP');
            expect(uber.merchantKey).toBe('UBER');
            expect(uber.branchLocation).toBeUndefined();

            const uberClean = BankCleaner.clean('UBER TRIP');
            expect(uberClean.clean).toBe('UBER TRIP');
            expect(uberClean.branchLocation).toBeUndefined();
        });

        it('UBER TRIP with transaction noise preserves merchantKey: "UBER" and branchLocation: undefined', () => {
            const uberNoise = BankCleaner.process('POS PURCHASE UBER TRIP AUTH 982181 TID 887123');
            expect(uberNoise.merchantKey).toBe('UBER');
            expect(uberNoise.branchLocation).toBeUndefined();
        });

        it('UBER TRIP with a legitimate location extracts that location while keeping merchantKey: "UBER"', () => {
            const uberCpt = BankCleaner.process('POS PURCHASE UBER TRIP CAPE TOWN');
            expect(uberCpt.merchantKey).toBe('UBER');
            expect(uberCpt.branchLocation).toBe('CAPE TOWN');

            const uberJhb = BankCleaner.process('UBER TRIP SANDTON');
            expect(uberJhb.merchantKey).toBe('UBER');
            expect(uberJhb.branchLocation).toBe('SANDTON');
        });

        it('rejects all non-geographic descriptors from branchLocation', () => {
            const testDescriptors = [
                { input: 'UBER TRIP', expectedClean: 'UBER TRIP', expectedKey: 'UBER' },
                { input: 'UBER EATS', expectedClean: 'UBER EATS', expectedKey: 'UBER EATS' },
                { input: 'DISCOVERY HEALTH', expectedClean: 'DISCOVERY', expectedKey: 'DISCOVERY' },
                { input: 'DISCOVERY LIFE', expectedClean: 'DISCOVERY', expectedKey: 'DISCOVERY' },
                { input: 'VODACOM ONLINE', expectedClean: 'VODACOM', expectedKey: 'VODACOM' },
                { input: 'VODACOM STORE', expectedClean: 'VODACOM', expectedKey: 'VODACOM' },
                { input: 'TAKEALOT ONLINE', expectedClean: 'TAKEALOT', expectedKey: 'TAKEALOT' },
                { input: 'BOLT RIDE', expectedClean: 'BOLT', expectedKey: 'BOLT' },
            ];

            for (const { input, expectedClean, expectedKey } of testDescriptors) {
                const res = BankCleaner.process(input);
                expect(res.cleanDescription).toBe(expectedClean);
                expect(res.merchantKey).toBe(expectedKey);
                expect(res.branchLocation).toBeUndefined();
            }
        });

        it('empirically reproduces Defect 1: NAEDO TRACKED FEE misclassification as DEBIT_ORDER instead of FEE', () => {
            // BUG: Line 274 has NAEDO without NAEDO TRACKED, so it falls through to line 288 (DEBIT_ORDER)
            expect(classifyPaymentChannel('NAEDO TRACKED FEE')).toBe('FEE');
            expect(BankCleaner.clean('NAEDO TRACKED FEE').clean).toBe('BANK FEES');
        });

        it('empirically reproduces Defect 2: Honorific stripping destroys MR PRICE and MR D FOOD brands', () => {
            // BUG: Line 474 strips /^(?:MR|MRS|MS|DR|PROF)\b\s*/i before brand matching,
            // corrupting 'MR PRICE' to 'PRICE' and 'MR D FOOD' to 'D FOOD'.
            const mrPrice = BankCleaner.process('POS PURCHASE MR PRICE');
            expect(mrPrice.cleanDescription).toBe('MR PRICE');
            expect(mrPrice.merchantKey).toBe('MR PRICE');

            const mrD = BankCleaner.process('MR D FOOD DELIVERY');
            expect(mrD.cleanDescription).toBe('MR D FOOD');
            expect(mrD.merchantKey).toBe('MR D FOOD');
        });

        it('empirically reproduces Defect 3: BANK FEES collapses to FEES in merchantKey due to BANK being in STOPWORDS', () => {
            // BUG: Line 25 includes 'BANK' in STOPWORDS, causing 'BANK FEES' to reduce to 'FEES'
            const feeRes = BankCleaner.process('MONTHLY ACCOUNT FEE');
            expect(feeRes.cleanDescription).toBe('BANK FEES');
            expect(feeRes.merchantKey).toBe('BANK FEES');
        });

        it('isValidBranchLocation returns false for non-geographic descriptors and residue', () => {
            for (const desc of NON_GEOGRAPHIC_DESCRIPTORS) {
                expect(isValidBranchLocation(desc)).toBe(false);
            }
            expect(isValidBranchLocation('TRIP')).toBe(false);
            expect(isValidBranchLocation('HEALTH')).toBe(false);
            expect(isValidBranchLocation('ONLINE')).toBe(false);
            expect(isValidBranchLocation('VAT')).toBe(false);
            expect(isValidBranchLocation('TAX NO')).toBe(false);
            expect(isValidBranchLocation('TEL')).toBe(false);
        });

        it('consolidates multi-branch national brands to canonical Root Brand', () => {
            const nationalChains = [
                { input: 'POS PURCHASE ENGEN WINCHESTER', expectedKey: 'ENGEN', branch: 'WINCHESTER' },
                { input: 'ENGEN WATERKLOOF', expectedKey: 'ENGEN', branch: 'WATERKLOOF' },
                { input: 'ENGEN GARAGE 4421', expectedKey: 'ENGEN', branch: 'GARAGE 4421' },
                { input: 'WOOLWORTHS FOOD #1024', expectedKey: 'WOOLWORTHS', branch: '#1024' },
                { input: 'WOOLWORTHS SANDTON', expectedKey: 'WOOLWORTHS', branch: 'SANDTON' },
                { input: 'CHECKERS HYPER MENLYN', expectedKey: 'CHECKERS', branch: 'MENLYN' },
                { input: 'CHECKERS SIXTY60', expectedKey: 'CHECKERS', branch: undefined },
                { input: 'SPAR NORTHCLIFF', expectedKey: 'SPAR', branch: 'NORTHCLIFF' },
                { input: 'SHELL MIDRAND', expectedKey: 'SHELL', branch: 'MIDRAND' },
                { input: 'TOTAL WATERKLOOF', expectedKey: 'TOTAL', branch: 'WATERKLOOF' },
                { input: 'SASOL SANDTON', expectedKey: 'SASOL', branch: 'SANDTON' },
                { input: 'BP FOURWAYS', expectedKey: 'BP', branch: 'FOURWAYS' },
                { input: 'BUILDERS WAREHOUSE RIVONIA', expectedKey: 'BUILDERS WAREHOUSE', branch: 'RIVONIA' },
                { input: 'BUILDERS EXPRESS STRUBENSVALLEY', expectedKey: 'BUILDERS WAREHOUSE', branch: 'STRUBENSVALLEY' },
                { input: 'MUGG & BEAN MENLYN', expectedKey: 'MUGG & BEAN', branch: 'MENLYN' },
                { input: 'MUGGNBEAN MENLYN', expectedKey: 'MUGG & BEAN', branch: 'MENLYN' },
            ];

            for (const { input, expectedKey, branch } of nationalChains) {
                const res = BankCleaner.process(input);
                expect(res.merchantKey).toBe(expectedKey);
                if (branch) {
                    expect(res.branchLocation).toBe(branch);
                } else {
                    expect(res.branchLocation).toBeUndefined();
                }
            }
        });
    });
});
