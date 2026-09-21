import { describe, it, expect } from 'vitest';
import {
    BankCleaner,
    classifyPaymentChannel,
    extractStructuralClues,
    cleanAndGroupTransaction,
} from './bank-cleaner';

describe('Adversarial Stress Test: Location Suffix Guardrails', () => {
    // Requirements from USER_REQUEST:
    // "Stress test location suffix guardrails with adversarial inputs (e.g. BLAIRGOWRIE HYPERMARKET,
    // RANDBURG GLASS AND ALUMINIUM, DURBAN SURF SHOP, CAPE TOWN CRANE HIRE, SPRINGS HYDRAULICS).
    // Verify leading locations are preserved."

    const requiredTestCases = [
        { input: 'BLAIRGOWRIE HYPERMARKET', expectedClean: 'BLAIRGOWRIE HYPERMARKET' },
        { input: 'RANDBURG GLASS AND ALUMINIUM', expectedClean: 'RANDBURG GLASS AND ALUMINIUM' },
        { input: 'DURBAN SURF SHOP', expectedClean: 'DURBAN SURF SHOP' },
        { input: 'CAPE TOWN CRANE HIRE', expectedClean: 'CAPE TOWN CRANE HIRE' },
        { input: 'SPRINGS HYDRAULICS', expectedClean: 'SPRINGS HYDRAULICS' },
    ];

    for (const { input, expectedClean } of requiredTestCases) {
        it(`preserves leading location for: "${input}"`, () => {
            const res = BankCleaner.clean(input);
            expect(res.clean).toBe(expectedClean);
            // Invariant: Leading locations must NEVER be moved to branchLocation
            expect(res.branchLocation).toBeUndefined();
        });
    }

    it('preserves leading location in merchantKey generation', () => {
        expect(BankCleaner.process('BLAIRGOWRIE HYPERMARKET').merchantKey).toBe('BLAIRGOWRIE HYPERMARKET');
        expect(BankCleaner.process('RANDBURG GLASS AND ALUMINIUM').merchantKey).toBe('RANDBURG GLASS ALUMINIUM');
        expect(BankCleaner.process('DURBAN SURF SHOP').merchantKey).toBe('DURBAN SURF');
        expect(BankCleaner.process('CAPE TOWN CRANE HIRE').merchantKey).toBe('CAPE TOWN CRANE');
        expect(BankCleaner.process('SPRINGS HYDRAULICS').merchantKey).toBe('SPRINGS HYDRAULICS');
    });

    it('preserves leading location even with additional legal forms, punctuation, and reference codes', () => {
        expect(BankCleaner.clean('BLAIRGOWRIE HYPERMARKET (PTY) LTD').clean).toBe('BLAIRGOWRIE HYPERMARKET');
        expect(BankCleaner.clean('RANDBURG GLASS & ALUMINIUM CC').clean).toBe('RANDBURG GLASS & ALUMINIUM');
        expect(BankCleaner.clean('CAPE TOWN CRANE HIRE - REF 99281').clean).toBe('CAPE TOWN CRANE HIRE');
        expect(BankCleaner.clean('SPRINGS HYDRAULICS / INV 12345').clean).toBe('SPRINGS HYDRAULICS');
    });

    it('handles dual-location case: leading location is preserved, trailing location is stripped to branchLocation', () => {
        const res1 = BankCleaner.clean('RANDBURG GLASS FOURWAYS');
        expect(res1.clean).toBe('RANDBURG GLASS');
        expect(res1.branchLocation).toBe('FOURWAYS');

        const res2 = BankCleaner.clean('DURBAN SURF SHOP UMHLANGA');
        expect(res2.clean).toBe('DURBAN SURF SHOP');
        expect(res2.branchLocation).toBe('UMHLANGA');

        const res3 = BankCleaner.clean('CAPE TOWN CRANE HIRE BELLVILLE');
        expect(res3.clean).toBe('CAPE TOWN CRANE HIRE');
        expect(res3.branchLocation).toBe('BELLVILLE');

        const res4 = BankCleaner.clean('SPRINGS HYDRAULICS BENONI');
        expect(res4.clean).toBe('SPRINGS HYDRAULICS');
        expect(res4.branchLocation).toBe('BENONI');
    });

    it('correctly handles multi-word SA locations both leading and trailing', () => {
        // Leading multi-word
        const res1 = BankCleaner.clean('PORT ELIZABETH HARBOUR LOGISTICS');
        expect(res1.clean).toBe('PORT ELIZABETH HARBOUR LOGISTICS');
        expect(res1.branchLocation).toBeUndefined();

        // Dual multi-word
        const res2 = BankCleaner.clean('PORT ELIZABETH TIMBER GQEBERHA');
        expect(res2.clean).toBe('PORT ELIZABETH TIMBER');
        expect(res2.branchLocation).toBe('GQEBERHA');

        // Trailing multi-word
        const res3 = BankCleaner.clean('ACME LOGISTICS SOMERSET WEST');
        expect(res3.clean).toBe('ACME LOGISTICS');
        expect(res3.branchLocation).toBe('SOMERSET WEST');

        const res4 = BankCleaner.clean('PRECISION TOOLS KEMPTON PARK');
        expect(res4.clean).toBe('PRECISION TOOLS');
        expect(res4.branchLocation).toBe('KEMPTON PARK');
    });

    it('differentiates recognized national brands with city names from local independent businesses', () => {
        // Recognized national brand
        const resEngen = BankCleaner.clean('ENGEN DURBAN');
        expect(resEngen.clean).toBe('ENGEN');
        expect(resEngen.branchLocation).toBe('DURBAN');

        // Local independent business
        const resDurban = BankCleaner.clean('DURBAN TIMBER');
        expect(resDurban.clean).toBe('DURBAN TIMBER');
        expect(resDurban.branchLocation).toBeUndefined();

        // National brand
        const resWoolworths = BankCleaner.clean('WOOLWORTHS CAPE TOWN');
        expect(resWoolworths.clean).toBe('WOOLWORTHS');
        expect(resWoolworths.branchLocation).toBe('CAPE TOWN');

        // Local independent business
        const resCapeTown = BankCleaner.clean('CAPE TOWN PLUMBING');
        expect(resCapeTown.clean).toBe('CAPE TOWN PLUMBING');
        expect(resCapeTown.branchLocation).toBeUndefined();
    });
});

describe('Adversarial Stress Test: Payment Channel Classification', () => {
    // Requirements from USER_REQUEST:
    // "Stress test channel classification against tricky descriptions:
    // DEBIT ORDER VODACOM, RTC IMMEDIATE PMT, STOP ORDER INSURANCE,
    // POS PURCHASE CHECKERS, POSTNET COURIER (must NOT be tagged POS!),
    // ATM CASH DEPOSIT, MONTHLY ACCOUNT FEE."

    it('tags DEBIT ORDER VODACOM as DEBIT_ORDER', () => {
        expect(classifyPaymentChannel('DEBIT ORDER VODACOM')).toBe('DEBIT_ORDER');
        const cleaned = BankCleaner.clean('DEBIT ORDER VODACOM');
        expect(cleaned.channel).toBe('DEBIT_ORDER');
        expect(cleaned.clean).toBe('VODACOM');
    });

    it('tags RTC IMMEDIATE PMT as RTC', () => {
        expect(classifyPaymentChannel('RTC IMMEDIATE PMT')).toBe('RTC');
        const cleaned = BankCleaner.clean('RTC IMMEDIATE PMT');
        expect(cleaned.channel).toBe('RTC');
    });

    it('tags STOP ORDER INSURANCE as DEBIT_ORDER', () => {
        expect(classifyPaymentChannel('STOP ORDER INSURANCE')).toBe('DEBIT_ORDER');
        const cleaned = BankCleaner.clean('STOP ORDER INSURANCE');
        expect(cleaned.channel).toBe('DEBIT_ORDER');
        expect(cleaned.clean).toBe('INSURANCE');
    });

    it('tags POS PURCHASE CHECKERS as POS', () => {
        expect(classifyPaymentChannel('POS PURCHASE CHECKERS')).toBe('POS');
        const cleaned = BankCleaner.clean('POS PURCHASE CHECKERS');
        expect(cleaned.channel).toBe('POS');
        expect(cleaned.clean).toBe('CHECKERS');
    });

    it('strictly does NOT tag POSTNET COURIER as POS', () => {
        expect(classifyPaymentChannel('POSTNET COURIER')).not.toBe('POS');
        const cleaned = BankCleaner.clean('POSTNET COURIER');
        expect(cleaned.channel).not.toBe('POS');
        expect(cleaned.clean).toBe('POSTNET');
    });

    it('does NOT falsely tag substrings containing "POS" as POS (e.g. POSTNET, COMPOST, DEPOSIT, POSITION)', () => {
        expect(classifyPaymentChannel('POSTNET WATERFALL')).not.toBe('POS');
        expect(classifyPaymentChannel('POSTAGE STAMPS')).not.toBe('POS');
        expect(classifyPaymentChannel('COMPOST NURSERY SUPPLIES')).not.toBe('POS');
        expect(classifyPaymentChannel('POSITION RECRUITMENT')).not.toBe('POS');
        expect(classifyPaymentChannel('DISPOSAL SERVICES')).not.toBe('POS');
        expect(classifyPaymentChannel('OPPOSITE CAFE')).not.toBe('POS');
    });

    it('classifies ATM CASH DEPOSIT as ATM', () => {
        expect(classifyPaymentChannel('ATM CASH DEPOSIT')).toBe('ATM');
        const cleaned = BankCleaner.clean('ATM CASH DEPOSIT');
        expect(cleaned.channel).toBe('ATM');
    });

    it('classifies MONTHLY ACCOUNT FEE as FEE and cleans to BANK FEES', () => {
        expect(classifyPaymentChannel('MONTHLY ACCOUNT FEE')).toBe('FEE');
        const cleaned = BankCleaner.clean('MONTHLY ACCOUNT FEE');
        expect(cleaned.channel).toBe('FEE');
        expect(cleaned.clean).toBe('BANK FEES');
    });

    it('tests tricky channel combinations and boundaries', () => {
        expect(classifyPaymentChannel('POS TRANSACTION FEE')).toBe('FEE');
        expect(classifyPaymentChannel('ATM CASH DEPOSIT FEE')).toBe('FEE');

        // RTC precedence
        expect(classifyPaymentChannel('RTC EXPRESS PMT TO CONTRACTOR')).toBe('RTC');

        // NAEDO and ACB debit orders
        expect(classifyPaymentChannel('NAEDO DR TRACKED 99281')).toBe('DEBIT_ORDER');
        expect(classifyPaymentChannel('ACB DEBIT SANTAM 8831')).toBe('DEBIT_ORDER');
        expect(classifyPaymentChannel('DEBICHECK PMT DISCOVERY')).toBe('DEBIT_ORDER');

        // PayShap Instant vs standard
        expect(classifyPaymentChannel('PAYSHAP IMMEDIATE PAYMENT')).toBe('RTC');
        expect(classifyPaymentChannel('PAYSHAP PAYMENT')).toBe('EFT');

        // Cash withdrawal variations
        expect(classifyPaymentChannel('AUTOBANK CASH WITHDRAWAL')).toBe('ATM');
        expect(classifyPaymentChannel('SASWITCH CASH WITHDRAWAL')).toBe('ATM');
    });
});

describe('Adversarial Stress Test: Noise Elimination', () => {
    // Requirements from USER_REQUEST:
    // "Stress test noise elimination against extreme date formats,
    // timestamps (14H32, 2024-09-15 14:32:05),
    // card PAN masks (491050*9002, ****9002, ..9002)."

    it('eliminates extreme timestamps and compound date-time strings', () => {
        expect(BankCleaner.clean('CHECKERS 14H32').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('14H32 CHECKERS').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS 14H32M').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS 14:32').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS 14:32:05').clean).toBe('CHECKERS');

        // ISO date with full timestamp
        expect(BankCleaner.clean('CHECKERS 2024-09-15 14:32:05').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('2024-09-15 14:32:05 CHECKERS').clean).toBe('CHECKERS');

        // Slashed dates and compact dates
        expect(BankCleaner.clean('CHECKERS 2024/09/15').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS 15/09/2024 14:32').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS 15-09-2024 14H32').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS 15.09.2024').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS 20240915').clean).toBe('CHECKERS');

        // Month abbreviations
        expect(BankCleaner.clean('CHECKERS 15SEP2024').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS 15SEP24').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS FOR SEPTEMBER 2024').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CHECKERS (EFFECTIVE 15/09/2024)').clean).toBe('CHECKERS');
    });

    it('eliminates card PAN masks in all positions (leading, middle, trailing)', () => {
        // 491050*9002 format
        expect(BankCleaner.clean('POS PURCHASE 491050*9002 UBER').clean).toBe('UBER');
        expect(BankCleaner.clean('UBER 491050*9002').clean).toBe('UBER');
        expect(BankCleaner.clean('491050*9002 UBER').clean).toBe('UBER');

        // ****9002 format
        expect(BankCleaner.clean('CARD PURCHASE ****9002 TAKEALOT').clean).toBe('TAKEALOT');
        expect(BankCleaner.clean('TAKEALOT ****9002').clean).toBe('TAKEALOT');
        expect(BankCleaner.clean('****9002 TAKEALOT').clean).toBe('TAKEALOT');

        // ..9002 format
        expect(BankCleaner.clean('POS SWIPE ..9002 SHELL').clean).toBe('SHELL');
        expect(BankCleaner.clean('SHELL ..9002').clean).toBe('SHELL');
        expect(BankCleaner.clean('..9002 SHELL').clean).toBe('SHELL');

        // ...9002 format (3+ dots)
        expect(BankCleaner.clean('POS SWIPE ...9002 SHELL').clean).toBe('SHELL');
        expect(BankCleaner.clean('SHELL ...9002').clean).toBe('SHELL');

        // Explicit CARD label
        expect(BankCleaner.clean('CARD 1234 CHECKERS').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('CARD NO: ****9002 CHECKERS').clean).toBe('CHECKERS');
    });

    it('cleans authorization, terminal, invoice, and reference noise', () => {
        expect(BankCleaner.clean('TAKEALOT INV 2024-9988 REF ABC99182').clean).toBe('TAKEALOT');
        expect(BankCleaner.clean('CHECKERS STAN 12345 BATCH 001').clean).toBe('CHECKERS');
        expect(BankCleaner.clean('VODACOM POLICY 9912821 CONTRACT 88219').clean).toBe('VODACOM');
    });
});

describe('Adversarial Findings: Resolved Defects & Boundary Protections', () => {
    it('verifies FIX 1: Prefix regex does NOT consume dates immediately following prefixes', () => {
        const resIso = BankCleaner.clean('POS PURCHASE 2024-09-15 CHECKERS');
        expect(resIso.clean).toBe('CHECKERS');

        const resSlash = BankCleaner.clean('POS PURCHASE 15/09/2024 CHECKERS');
        expect(resSlash.clean).toBe('CHECKERS');

        const resDash = BankCleaner.clean('POS PURCHASE 15-09-2024 CHECKERS');
        expect(resDash.clean).toBe('CHECKERS');

        const resDot = BankCleaner.clean('POS PURCHASE 15.09.2024 CHECKERS');
        expect(resDot.clean).toBe('CHECKERS');
    });

    it('verifies FIX 2: Compound banking fee phrases on RTC and DEBIT_ORDER channels classified as FEE', () => {
        expect(classifyPaymentChannel('RTC IMMEDIATE PAYMENT FEE')).toBe('FEE');
        expect(BankCleaner.clean('RTC IMMEDIATE PAYMENT FEE').clean).toBe('BANK FEES');

        expect(classifyPaymentChannel('DEBIT ORDER FEE')).toBe('FEE');
        expect(BankCleaner.clean('DEBIT ORDER FEE').clean).toBe('BANK FEES');

        expect(classifyPaymentChannel('IMMEDIATE PMT FEE')).toBe('FEE');
        expect(BankCleaner.clean('IMMEDIATE PMT FEE').clean).toBe('BANK FEES');

        expect(classifyPaymentChannel('FAST CLEARING FEE')).toBe('FEE');
        expect(BankCleaner.clean('FAST CLEARING FEE').clean).toBe('BANK FEES');

        expect(classifyPaymentChannel('CARD FEE')).toBe('FEE');
        expect(BankCleaner.clean('CARD FEE').clean).toBe('BANK FEES');

        expect(classifyPaymentChannel('EFT FEE')).toBe('FEE');
        expect(BankCleaner.clean('EFT FEE').clean).toBe('BANK FEES');
    });

    it('verifies Phone Number extraction preserves structural clues', () => {
        const res = BankCleaner.clean('APPLE.COM/BILL 011-234-5678');
        expect(res.structuralClues?.phoneNumber).toBe('0112345678');
        expect(extractStructuralClues('+27 11 555 1234').phoneNumber).toBe('+27115551234');
        expect(extractStructuralClues('+27-11-555-1234').phoneNumber).toBe('+27115551234');
        expect(extractStructuralClues('+27.11.555.1234').phoneNumber).toBe('+27115551234');
        expect(extractStructuralClues('+27 82 123 4567').phoneNumber).toBe('+27821234567');
    });

    it('verifies FIX 4: Statutory labels (VAT, TAX, etc.) do not leak into branchLocation', () => {
        const res = BankCleaner.clean('POS PURCHASE SPAR WATERKLOOF VAT 4123456789');
        expect(res.clean).toBe('SPAR');
        expect(res.branchLocation).toBe('WATERKLOOF');
        expect(res.structuralClues?.vatNumber).toBe('4123456789');

        const res2 = BankCleaner.clean('POS PURCHASE SPAR WATERKLOOF TAX NO 4123456789');
        expect(res2.clean).toBe('SPAR');
        expect(res2.branchLocation).toBe('WATERKLOOF');

        const res3 = BankCleaner.clean('POS PURCHASE SPAR WATERKLOOF TEL 0115551234');
        expect(res3.clean).toBe('SPAR');
        expect(res3.branchLocation).toBe('WATERKLOOF');
    });

    it('verifies FIX 5: Non-geographic descriptors do not become branchLocation', () => {
        const uber = BankCleaner.clean('UBER TRIP AUTH 982181 TID 887123 MID 99120');
        expect(uber.clean).toBe('UBER TRIP');
        expect(uber.branchLocation).toBeUndefined();

        const disc = BankCleaner.clean('DISCOVERY HEALTH');
        expect(disc.clean).toBe('DISCOVERY');
        expect(disc.branchLocation).toBeUndefined();

        const order = BankCleaner.clean('VODACOM ONLINE ORDER');
        expect(order.clean).toBe('VODACOM');
        expect(order.branchLocation).toBeUndefined();
    });
});
