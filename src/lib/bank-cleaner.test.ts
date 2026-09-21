import { describe, it, expect } from 'vitest';
import { BankCleaner, matchesRuleKeyword, matchRuleGuideDetails, cleanAndGroupTransaction } from './bank-cleaner';

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

    it('should match spoken symbols interchangeably like @ <-> AT and & <-> AND', () => {
        expect(matchesRuleKeyword('3 AT 1 BLAIRGOWRIE', '3@1')).toBe(true);
        expect(matchesRuleKeyword('3 AT 1 BLAIRGOWRIE', '3 AT 1')).toBe(true);
        expect(matchesRuleKeyword('POS PURCHASE 3@1 WATERKLOOF', '3 AT 1')).toBe(true);
        expect(matchesRuleKeyword('PURCHASE @HOME SANDTON', 'AT HOME')).toBe(true);
        expect(matchesRuleKeyword('PURCHASE AT HOME SANDTON', '@HOME')).toBe(true);
        expect(matchesRuleKeyword('FASTENERS & FIXINGS CC', 'FASTENERS AND FIXINGS')).toBe(true);
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

describe('BankCleaner.clean Fee Pattern Hardening', () => {
    it('does NOT collapse legitimate fee descriptions into BANK FEES', () => {
        expect(BankCleaner.clean('COMPETITION FEES J4P COC 15TH SEPT').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('COMPETITION FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('LEGAL FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('SCHOOL FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('CONSULTING FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('AUDIT FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('ACCOUNTING FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('LEGAL SERVICE FEE').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('COURIER SERVICE FEE').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('CLEANING SERVICE FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('CONSULTING SERVICE FEE').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('UBER EATS SERVICE FEE').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('PROPERTY ADMIN FEE').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('HR ADMIN FEE').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('RANDPARKNHIGH SCHO SCHOOL FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('TUITION FEES TSHILAMATANDA THENDO').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('ANNUAL FEE GP-IN0036801').clean).not.toBe('BANK FEES');
        // Descriptions beginning with fee words or ending with subscription monthly fees
        expect(BankCleaner.clean('FEES FOR AUDIT 2024').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('FEES - DR SMITH').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('FEES GRADE 12 TUITION').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('SERVICE FEE - IT SUPPORT').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('ADMIN FEE LEASE CONTRACT').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('FEES MARCH 2024').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('FEES ACCOUNTING').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('FEES PAID').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('FEES SMITH').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('FEES MARAIS').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('VIRGIN ACTIVE MONTHLY FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('DISCOVERY MONTHLY FEE').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('PLANET FITNESS MONTHLY FEES').clean).not.toBe('BANK FEES');
        expect(BankCleaner.clean('VODACOM MONTHLY FEE').clean).not.toBe('BANK FEES');
    });

    it('correctly cleans genuine bank fee and charge descriptions as BANK FEES', () => {
        expect(BankCleaner.clean('MONTHLY ACCOUNT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('BANK CHARGES')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('BANK FEES')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('SERVICE FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('SERVICE FEES')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('#SERVICE FEES')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('FEES')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('#FEES')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('FEES 123456')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('FEES #123456')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('TRANSACTION FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('CASH DEPOSIT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('CASH HANDLING FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('STATEMENT FEE STATEMENT DOWNLOAD')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('STATEMENT FEE STATEMENT EMAILED')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('BANK SERVICE CHARGE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('BANK COSTS')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('FNB SERVICE FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('CAPITEC ADMIN FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('ABSA MONTHLY ACCOUNT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('FNB #SERVICE FEES')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('FNB #SERVICE FEES 15/09/2024')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('#SERVICE FEES 15/09/2024')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('SERVICE FEES 15/09/2024')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('FNB #SERVICE FEES FOR AUG')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('SERVICE FEES - SEP 2024')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('SERVICE FEES FOR AUG')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('FNB #INT PYMT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('#INT PYMT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('INTERNET PAYMENT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('PAYSHAP FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('EFT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('MONTHLY SERVICE FEES')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('MONTHLY ACCOUNT FEES 15/09/2024')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('BANK CHARGES - CASH DEPOSIT')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
        expect(BankCleaner.clean('BANK CHARGE 123456')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
    });

    it('correctly classifies compound banking fee phrases across all channels as FEE and BANK FEES', () => {
        expect(BankCleaner.classifyPaymentChannel('RTC IMMEDIATE PAYMENT FEE')).toBe('FEE');
        expect(BankCleaner.clean('RTC IMMEDIATE PAYMENT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });

        expect(BankCleaner.classifyPaymentChannel('DEBIT ORDER FEE')).toBe('FEE');
        expect(BankCleaner.clean('DEBIT ORDER FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });

        expect(BankCleaner.classifyPaymentChannel('IMMEDIATE PMT FEE')).toBe('FEE');
        expect(BankCleaner.clean('IMMEDIATE PMT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });

        expect(BankCleaner.classifyPaymentChannel('FAST CLEARING FEE')).toBe('FEE');
        expect(BankCleaner.clean('FAST CLEARING FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });

        expect(BankCleaner.classifyPaymentChannel('CARD FEE')).toBe('FEE');
        expect(BankCleaner.clean('CARD FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });

        expect(BankCleaner.classifyPaymentChannel('EFT FEE')).toBe('FEE');
        expect(BankCleaner.clean('EFT FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });

        expect(BankCleaner.classifyPaymentChannel('NAEDO TRACKED FEE')).toBe('FEE');
        expect(BankCleaner.clean('NAEDO TRACKED FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });

        expect(BankCleaner.classifyPaymentChannel('PAYSHAP IMMEDIATE FEE')).toBe('FEE');
        expect(BankCleaner.clean('PAYSHAP IMMEDIATE FEE')).toEqual({ clean: 'BANK FEES', channel: 'FEE' });
    });
});

describe('First-Class Channel Tagging (The 7 Channels & Hierarchy)', () => {
    it('accurately tags DEBIT_ORDER for contractual debit instructions', () => {
        expect(BankCleaner.clean('DEBIT ORDER VODACOM SA 12345').channel).toBe('DEBIT_ORDER');
        expect(BankCleaner.clean('STOP ORDER OUTSURANCE POLICY').channel).toBe('DEBIT_ORDER');
        expect(BankCleaner.clean('NAEDO TRACKED DEBIT ACC 99182').channel).toBe('DEBIT_ORDER');
        expect(BankCleaner.clean('ACB DEBIT VEHICLE FINANCE').channel).toBe('DEBIT_ORDER');
        expect(BankCleaner.clean('MAGTAPE DEBIT RENT MONTHLY').channel).toBe('DEBIT_ORDER');
        expect(BankCleaner.clean('DEBICHECK DEBIT PREM').channel).toBe('DEBIT_ORDER');
        expect(BankCleaner.clean('RECURRING DEBIT GYM SUB').channel).toBe('DEBIT_ORDER');
        expect(BankCleaner.clean('DIRECT DEBIT TELKOM FIBRE').channel).toBe('DEBIT_ORDER');
    });

    it('accurately tags RTC for real-time clearing and immediate payments', () => {
        expect(BankCleaner.clean('RTC EXPRESS PMT TO CONTRACTOR PLUMBING').channel).toBe('RTC');
        expect(BankCleaner.clean('RTC PAYMENT TO LAW FIRM').channel).toBe('RTC');
        expect(BankCleaner.clean('IMMEDIATE PAYMENT TO EMERGENCY REPAIRS').channel).toBe('RTC');
        expect(BankCleaner.clean('IMMEDIATE PMT TO SUPPLIER').channel).toBe('RTC');
        expect(BankCleaner.clean('INSTANT PAYMENT SETTLEMENT').channel).toBe('RTC');
        expect(BankCleaner.clean('REAL TIME CLEARING PMT').channel).toBe('RTC');
        expect(BankCleaner.clean('FAST CLEARING PMT TO COURIER').channel).toBe('RTC');
        expect(BankCleaner.clean('PAYSHAP IMMEDIATE PAYMENT').channel).toBe('RTC');
    });

    it('accurately tags ATM for automated teller machines and cash withdrawals', () => {
        expect(BankCleaner.clean('ATM WITHDRAWAL SANDTON CITY').channel).toBe('ATM');
        expect(BankCleaner.clean('ATM CASH WITHDRAWAL').channel).toBe('ATM');
        expect(BankCleaner.clean('AUTOBANK CASH WITHDRAWAL').channel).toBe('ATM');
        expect(BankCleaner.clean('SASWITCH CASH WITHDRAWAL').channel).toBe('ATM');
        expect(BankCleaner.clean('CASH WITHDRAWAL BRANCH').channel).toBe('ATM');
    });

    it('accurately tags POS for physical point-of-sale retail swipes', () => {
        expect(BankCleaner.clean('POS PURCHASE CHECKERS HYPER 123456').channel).toBe('POS');
        expect(BankCleaner.clean('POS DEBIT TOTAL WATERKLOOF').channel).toBe('POS');
        expect(BankCleaner.clean('POINT OF SALE SWIPE WOOLWORTHS').channel).toBe('POS');
        expect(BankCleaner.clean('POS SWIPE ENGEN GARAGE').channel).toBe('POS');
        expect(BankCleaner.clean('POS TRANSACTION SPAR').channel).toBe('POS');
    });

    it('accurately tags CARD for general card, cheque card, Visa, and Mastercard', () => {
        expect(BankCleaner.clean('CHEQUE CARD PURCHASE TAKEALOT CAPE TOWN').channel).toBe('CARD');
        expect(BankCleaner.clean('DEBIT CARD PURCHASE UBER TRIP').channel).toBe('CARD');
        expect(BankCleaner.clean('CREDIT CARD PURCHASE AIRBNB').channel).toBe('CARD');
        expect(BankCleaner.clean('VIRTUAL CARD PURCHASE GOOGLE CLOUD').channel).toBe('CARD');
        expect(BankCleaner.clean('ONLINE CARD PURCHASE MICROSOFT 365').channel).toBe('CARD');
        expect(BankCleaner.clean('TAP & GO PURCHASE SEATTLE COFFEE').channel).toBe('CARD');
        expect(BankCleaner.clean('INTERNATIONAL CARD PURCHASE GITHUB').channel).toBe('CARD');
    });

    it('accurately tags EFT for internet banking, app transfers, and PayShap', () => {
        expect(BankCleaner.clean('INTERNET PMT TO TELKOM REF 99001').channel).toBe('EFT');
        expect(BankCleaner.clean('EFT PAYMENT TO SUPPLIER CC').channel).toBe('EFT');
        expect(BankCleaner.clean('FNB APP TRANSFER TO JOHN DOE').channel).toBe('EFT');
        expect(BankCleaner.clean('BANKING APP TRANSFER OFFICE').channel).toBe('EFT');
        expect(BankCleaner.clean('CAPITEC PAY ONLINE PAYMENT').channel).toBe('EFT');
        expect(BankCleaner.clean('PAYSHAP PAYMENT TO CONTRACTOR').channel).toBe('EFT');
        expect(BankCleaner.clean('ELECTRONIC PAYMENT TO LANDLORD').channel).toBe('EFT');
    });

    it('accurately tags FEE for banking charges and service fees', () => {
        expect(BankCleaner.clean('FNB #MONTHLY ACCOUNT FEE FOR AUG').channel).toBe('FEE');
        expect(BankCleaner.clean('BANK CHARGES').channel).toBe('FEE');
        expect(BankCleaner.clean('STATEMENT FEE STATEMENT DOWNLOAD').channel).toBe('FEE');
        expect(BankCleaner.clean('CASH HANDLING FEE').channel).toBe('FEE');
    });

    it('assigns UNKNOWN when no payment channel indicator is present', () => {
        expect(BankCleaner.clean('COMPETITION FEES J4P COC 15TH SEPT').channel).toBe('UNKNOWN');
        expect(BankCleaner.clean('RANDBURG GLASS AND ALUMINIUM').channel).toBe('UNKNOWN');
        expect(BankCleaner.clean('LEGAL CONSULTING SERVICES').channel).toBe('UNKNOWN');
    });

    it('resolves precedence hierarchy conflicts deterministically (FEE > RTC > DEBIT_ORDER > ATM > POS > CARD > EFT)', () => {
        // FEE takes precedence over EFT
        expect(BankCleaner.clean('INTERNET PAYMENT FEE').channel).toBe('FEE');
        expect(BankCleaner.clean('EFT FEE').channel).toBe('FEE');
        // RTC takes precedence over generic EFT
        expect(BankCleaner.clean('RTC EXPRESS PMT TO CONTRACTOR').channel).toBe('RTC');
        expect(BankCleaner.clean('IMMEDIATE PAYMENT TO SUPPLIER').channel).toBe('RTC');
        // DEBIT_ORDER takes precedence over generic EFT
        expect(BankCleaner.clean('DEBIT ORDER EFT PAYMENT').channel).toBe('DEBIT_ORDER');
        // ATM takes precedence over generic card/EFT
        expect(BankCleaner.clean('ATM CASH WITHDRAWAL CARD').channel).toBe('ATM');
        // POS takes precedence over generic CARD
        expect(BankCleaner.clean('POS PURCHASE CARD 491050*9002').channel).toBe('POS');
        // CARD takes precedence over generic EFT
        expect(BankCleaner.clean('CHEQUE CARD PMT ONLINE').channel).toBe('CARD');
    });
});

describe('Pre-Sanitization Structural Clue Extraction', () => {
    it('extracts valid 10-digit SA VAT numbers starting with 4', () => {
        const res1 = BankCleaner.clean('SUPPLIER INVOICE 4123456789 PAYMENT');
        expect(res1.structuralClues?.vatNumber).toBe('4123456789');

        const res2 = BankCleaner.clean('TELKOM SA VAT: 4987654321 INV 100');
        expect(res2.structuralClues?.vatNumber).toBe('4987654321');

        const res3 = BankCleaner.clean('ACME TRADING VAT# 4010203040 EFT');
        expect(res3.structuralClues?.vatNumber).toBe('4010203040');
    });

    it('strictly ignores 10-digit numbers starting with non-4 digits or non-10 digit numbers', () => {
        // Starts with 5 (not an SA VAT vendor)
        const res1 = BankCleaner.clean('SUPPLIER INVOICE 5123456789 PAYMENT');
        expect(res1.structuralClues?.vatNumber).toBeUndefined();

        // 9 digits (invalid)
        const res2 = BankCleaner.clean('SUPPLIER INVOICE 412345678 PAYMENT');
        expect(res2.structuralClues?.vatNumber).toBeUndefined();

        // 11 digits (invalid)
        const res3 = BankCleaner.clean('SUPPLIER INVOICE 41234567890 PAYMENT');
        expect(res3.structuralClues?.vatNumber).toBeUndefined();

        // Masked PAN with asterisk
        const res4 = BankCleaner.clean('POS PURCHASE 491050*9002 UBER');
        expect(res4.structuralClues?.vatNumber).toBeUndefined();
    });

    it('extracts South African phone numbers across landlines, mobiles, and toll-free', () => {
        const res1 = BankCleaner.clean('APPLE.COM/BILL 011-234-5678');
        expect(res1.structuralClues?.phoneNumber).toBe('0112345678');

        const res2 = BankCleaner.clean('INTERNET PMT TO VODACOM 0821234567');
        expect(res2.structuralClues?.phoneNumber).toBe('0821234567');

        const res3 = BankCleaner.clean('TELKOM HELP DESK +27123456789');
        expect(res3.structuralClues?.phoneNumber).toBe('+27123456789');

        // Guardrail: standard dates must NOT be extracted as phone numbers
        const res4 = BankCleaner.clean('INVOICE 15/09/2024 PAYMENT');
        expect(res4.structuralClues?.phoneNumber).toBeUndefined();
    });

    it('extracts branch and store locators (#1024, STORE 4421, SHOP 12)', () => {
        const res1 = BankCleaner.clean('WOOLWORTHS FOOD #1024 SANDTON');
        expect(res1.structuralClues?.branchLocator).toBe('#1024');

        const res2 = BankCleaner.clean('ENGEN GARAGE STORE 4421 WATERKLOOF');
        expect(res2.structuralClues?.branchLocator).toBe('STORE 4421');

        const res3 = BankCleaner.clean('SPAR SUPERMARKET SHOP 12');
        expect(res3.structuralClues?.branchLocator).toBe('SHOP 12');
    });

    it('extracts SARS PRN payment references (19-char alphanumeric, 19-digit, and labeled)', () => {
        const res1 = BankCleaner.clean('SARS VAT201 PRN 1940012345678901234');
        expect(res1.structuralClues?.prn).toBe('1940012345678901234');

        const res2 = BankCleaner.clean('SARS EMP201 PRN 1950098765432109876');
        expect(res2.structuralClues?.prn).toBe('1950098765432109876');

        const res3 = BankCleaner.clean('SARS PRN 1940000000000000000 PAYMENT');
        expect(res3.structuralClues?.prn).toBe('1940000000000000000');

        const res4 = BankCleaner.clean('SARSEFLNG 9876543210 PROV');
        expect(res4.structuralClues?.prn).toBe('9876543210');
    });

    it('extracts structural clues into ProcessedTransaction metadata', () => {
        const processed = BankCleaner.process('POS PURCHASE ENGEN WATERKLOOF STORE #402 4123456789');
        expect(processed.paymentChannel).toBe('POS');
        expect(processed.cleanDescription).toBe('ENGEN');
        expect(processed.merchantKey).toBe('ENGEN');
        expect(processed.branchLocation).toBe('WATERKLOOF');
        expect(processed.structuralClues.vatNumber).toBe('4123456789');
        expect(processed.structuralClues.branchLocator).toBe('STORE #402');
    });
});

describe('Location Suffix Guardrails (Leading vs Trailing Protection)', () => {
    it('strictly preserves leading location on independent local businesses (Guardrail Invariant)', () => {
        const res1 = BankCleaner.clean('BLAIRGOWRIE HYPER MARKET');
        expect(res1.clean).toContain('BLAIRGOWRIE HYPER');
        expect(res1.clean.startsWith('HYPER')).toBe(false);
        expect(res1.branchLocation).toBeUndefined();

        const res2 = BankCleaner.clean('RANDBURG AUTO REPAIRS');
        expect(res2.clean).toBe('RANDBURG AUTO REPAIRS');
        expect(res2.branchLocation).toBeUndefined();

        const res3 = BankCleaner.clean('DURBAN TIMBER SUPPLIES');
        expect(res3.clean).toContain('DURBAN TIMBER');
        expect(res3.branchLocation).toBeUndefined();

        const res4 = BankCleaner.clean('ALBERTON PHARMACY CC');
        expect(res4.clean).toBe('ALBERTON PHARMACY');
        expect(res4.branchLocation).toBeUndefined();

        const res5 = BankCleaner.clean('CAPE TOWN PLUMBING');
        expect(res5.clean).toBe('CAPE TOWN PLUMBING');
        expect(res5.branchLocation).toBeUndefined();
    });

    it('strips trailing location suffixes on independent businesses and preserves in branchLocation', () => {
        const res1 = BankCleaner.clean('HAND TOOLS FOURWAYS');
        expect(res1.clean).toBe('HAND TOOLS');
        expect(res1.branchLocation).toBe('FOURWAYS');

        const res2 = BankCleaner.clean('ABC HARDWARE DURBAN');
        expect(res2.clean).toBe('ABC HARDWARE');
        expect(res2.branchLocation).toBe('DURBAN');

        const res3 = BankCleaner.clean('AUTO PARTS JHB');
        expect(res3.clean).toBe('AUTO PARTS');
        expect(res3.branchLocation).toBe('JHB');
    });

    it('handles dual-location edge case: preserves leading location while stripping trailing location', () => {
        const res = BankCleaner.clean('RANDBURG GLASS FOURWAYS');
        expect(res.clean).toBe('RANDBURG GLASS');
        expect(res.branchLocation).toBe('FOURWAYS');
    });

    it('strips branch locations after recognized national brands into branchLocation', () => {
        const res1 = BankCleaner.clean('ENGEN WATERKLOOF');
        expect(res1.clean).toBe('ENGEN');
        expect(res1.branchLocation).toBe('WATERKLOOF');

        const res2 = BankCleaner.clean('WOOLWORTHS SANDTON');
        expect(res2.clean).toBe('WOOLWORTHS');
        expect(res2.branchLocation).toBe('SANDTON');

        const res3 = BankCleaner.clean('SPAR BLAIRGOWRIE');
        expect(res3.clean).toBe('SPAR');
        expect(res3.branchLocation).toBe('BLAIRGOWRIE');

        const res4 = BankCleaner.clean('SHELL ULTRA CITY MIDRAND');
        expect(res4.clean).toBe('SHELL');
        expect(res4.branchLocation).toContain('MIDRAND');
    });
});

describe('Noise Elimination (Card PANs, Dates, Codes, Transfer Prefixes)', () => {
    it('strips masked card PANs completely', () => {
        expect(BankCleaner.clean('POS PURCHASE 491050*9002 UBER').clean).toBe('UBER');
        expect(BankCleaner.clean('CARD PURCHASE ****9002 TAKEALOT').clean).toBe('TAKEALOT');
        expect(BankCleaner.clean('POS SWIPE ..9002 SHELL').clean).toBe('SHELL');
        expect(BankCleaner.clean('CARD 1234 CHECKERS').clean).toBe('CHECKERS');
    });

    it('strips ISO, compact, and alphanumeric dates and timestamps', () => {
        expect(BankCleaner.clean('DEBIT ORDER VODACOM 2024-09-15').clean).toBe('VODACOM');
        expect(BankCleaner.clean('EFT PMT TELKOM 20240915').clean).toBe('TELKOM');
        expect(BankCleaner.clean('POS PURCHASE 14H32 ENGEN').clean).toBe('ENGEN');
        expect(BankCleaner.clean('CARD PURCHASE 14:32:10 UBER').clean).toBe('UBER');
        expect(BankCleaner.clean('EFT PMT OUTSURANCE 15SEP24').clean).toBe('OUTSURANCE');
    });

    it('strips multi-bank transfer prefixes cleanly', () => {
        expect(BankCleaner.clean('FNB APP TRANSFER TO ABC TRADING').clean).toBe('ABC TRADING');
        expect(BankCleaner.clean('DIGITAL PAYMENTS BANKING APP IMMEDIATE PAYMENT TO XYZ').clean).toBe('XYZ');
        expect(BankCleaner.clean('CAPITEC PAY ONLINE PAYMENT TO LEROY MERLIN').clean).toBe('LEROY MERLIN');
    });
});

describe('Spoken Symbol Normalization & False-Positive Prevention', () => {
    it('matches spoken symbols interchangeably (@ <-> AT, & <-> AND)', () => {
        expect(matchesRuleKeyword('3 AT 1 BLAIRGOWRIE', '3@1')).toBe(true);
        expect(matchesRuleKeyword('POS PURCHASE 3@1 WATERKLOOF', '3 AT 1')).toBe(true);
        expect(matchesRuleKeyword('PURCHASE @HOME SANDTON', 'AT HOME')).toBe(true);
        expect(matchesRuleKeyword('PURCHASE AT HOME SANDTON', '@HOME')).toBe(true);
        expect(matchesRuleKeyword('FASTENERS & FIXINGS CC', 'FASTENERS AND FIXINGS')).toBe(true);
        expect(matchesRuleKeyword('MUGG AND BEAN SANDTON', 'MUGG & BEAN')).toBe(true);
    });

    it('strictly enforces the symbol presence invariant to eliminate false positives for @HOME', () => {
        // Descriptions with "@" or "AT" match
        expect(matchesRuleKeyword('PURCHASE @HOME SANDTON', '@HOME')).toBe(true);
        expect(matchesRuleKeyword('PURCHASE AT HOME SANDTON', '@HOME')).toBe(true);
        expect(matchesRuleKeyword('@HOME WATERFALL', '@HOME')).toBe(true);

        // Descriptions WITHOUT "@" or "AT" MUST NOT match @HOME
        expect(matchesRuleKeyword('PAYMENT TO HOME AFFAIRS', '@HOME')).toBe(false);
        expect(matchesRuleKeyword('DEBIT ORDER OLD AGE HOME', '@HOME')).toBe(false);
        expect(matchesRuleKeyword('HOME SWEET HOME DECOR', '@HOME')).toBe(false);
        expect(matchesRuleKeyword('INTERNET PMT HOME SECURITY', '@HOME')).toBe(false);

        // Rule for "AT HOME" also must NOT match "HOME AFFAIRS"
        expect(matchesRuleKeyword('PAYMENT TO HOME AFFAIRS', 'AT HOME')).toBe(false);
        expect(matchesRuleKeyword('DEBIT ORDER OLD AGE HOME', 'AT HOME')).toBe(false);
    });
});

describe('ProcessedTransaction & cleanAndGroupTransaction Interface Adherence', () => {
    it('populates all fields in ProcessedTransaction with contractual segregation on debit orders', () => {
        const debit = BankCleaner.process('DEBIT ORDER VODACOM SA 12345');
        expect(debit.rawDescription).toBe('DEBIT ORDER VODACOM SA 12345');
        expect(debit.cleanDescription).toBe('VODACOM');
        expect(debit.paymentChannel).toBe('DEBIT_ORDER');
        expect(debit.merchantKey).toBe('VODACOM [DEBIT ORDER]');

        const pos = BankCleaner.process('POS PURCHASE VODACOM STORE');
        expect(pos.cleanDescription).toBe('VODACOM');
        expect(pos.paymentChannel).toBe('POS');
        expect(pos.merchantKey).toBe('VODACOM');
        expect(debit.merchantKey).not.toBe(pos.merchantKey);
    });

    it('returns CleanedTransaction from cleanAndGroupTransaction', () => {
        const tx = cleanAndGroupTransaction('POS PURCHASE ENGEN WATERKLOOF STORE #402 4123456789');
        expect(tx.clean).toBe('ENGEN');
        expect(tx.channel).toBe('POS');
        expect(tx.merchantKey).toBe('ENGEN');
        expect(tx.branchLocation).toBe('WATERKLOOF');
        expect(tx.structuralClues.vatNumber).toBe('4123456789');
    });
});

describe('String Similarity & Typo Detection', () => {
    it('detects single-token double letter typos ("ENNGEN" vs "ENGEN")', () => {
        const sim = BankCleaner.getSimilarity('ENNGEN', 'ENGEN');
        expect(sim.score).toBeGreaterThan(0.80);
    });

    it('detects adjacent letter transpositions ("TAEKALOT" vs "TAKEALOT")', () => {
        const sim = BankCleaner.getSimilarity('TAEKALOT', 'TAKEALOT');
        expect(sim.score).toBeGreaterThan(0.75);
    });

    it('keeps distinct single-word merchants separate ("SHELL" vs "SMELL")', () => {
        const sim = BankCleaner.getSimilarity('SHELL', 'SMELL');
        expect(sim.score).toBeLessThanOrEqual(0.85);
    });
});

describe('Milestone 3: Root Brand Primary Merchant Grouping & Contractual Segregation', () => {
    it('consolidates national chains and multi-branch suppliers to canonical Root Brand', () => {
        expect(BankCleaner.generateMerchantKey('ENGEN WINCHESTER')).toBe('ENGEN');
        expect(BankCleaner.generateMerchantKey('ENGEN WATERKLOOF')).toBe('ENGEN');
        expect(BankCleaner.generateMerchantKey('ENGEN GARAGE 4421')).toBe('ENGEN');
        expect(BankCleaner.generateMerchantKey('WOOLWORTHS FOOD #1024')).toBe('WOOLWORTHS');
        expect(BankCleaner.generateMerchantKey('WOOLWORTHS SANDTON')).toBe('WOOLWORTHS');
        expect(BankCleaner.generateMerchantKey('CHECKERS HYPER')).toBe('CHECKERS');
        expect(BankCleaner.generateMerchantKey('CHECKERS')).toBe('CHECKERS');
        expect(BankCleaner.generateMerchantKey('SPAR NORTHCLIFF')).toBe('SPAR');
        expect(BankCleaner.generateMerchantKey('SHELL MIDRAND')).toBe('SHELL');
        expect(BankCleaner.generateMerchantKey('TOTAL WATERKLOOF')).toBe('TOTAL');
        expect(BankCleaner.generateMerchantKey('SASOL SANDTON')).toBe('SASOL');
        expect(BankCleaner.generateMerchantKey('BP FOURWAYS')).toBe('BP');
        expect(BankCleaner.generateMerchantKey('TAKEALOT CAPE TOWN')).toBe('TAKEALOT');
        expect(BankCleaner.generateMerchantKey('UBER TRIP')).toBe('UBER');
        expect(BankCleaner.generateMerchantKey('UBER')).toBe('UBER');
    });

    it('preserves branch location and suburb in branchLocation metadata', () => {
        const engen = BankCleaner.process('POS PURCHASE ENGEN WATERKLOOF');
        expect(engen.cleanDescription).toBe('ENGEN');
        expect(engen.merchantKey).toBe('ENGEN');
        expect(engen.branchLocation).toBe('WATERKLOOF');

        const woolies = BankCleaner.process('WOOLWORTHS SANDTON');
        expect(woolies.cleanDescription).toBe('WOOLWORTHS');
        expect(woolies.merchantKey).toBe('WOOLWORTHS');
        expect(woolies.branchLocation).toBe('SANDTON');

        const garage = BankCleaner.process('ENGEN GARAGE 4421');
        expect(garage.cleanDescription).toBe('ENGEN');
        expect(garage.merchantKey).toBe('ENGEN');
        expect(garage.branchLocation).toBe('GARAGE 4421');
    });

    it('segregates contractual DEBIT_ORDER from discretionary transactions with [DEBIT ORDER] suffix', () => {
        const debit = BankCleaner.generateMerchantKey('VODACOM', 'DEBIT_ORDER');
        expect(debit).toBe('VODACOM [DEBIT ORDER]');

        const pos = BankCleaner.generateMerchantKey('VODACOM', 'POS');
        expect(pos).toBe('VODACOM');

        const card = BankCleaner.generateMerchantKey('VODACOM', 'CARD');
        expect(card).toBe('VODACOM');

        const contractual = BankCleaner.process('DEBIT ORDER TELKOM FIBRE');
        expect(contractual.merchantKey).toBe('TELKOM [DEBIT ORDER]');
        expect(contractual.paymentChannel).toBe('DEBIT_ORDER');

        const adhoc = BankCleaner.process('POS PURCHASE TELKOM AIRTIME');
        expect(adhoc.merchantKey).toBe('TELKOM');
        expect(adhoc.paymentChannel).toBe('POS');
    });

    it('does not leak non-geographic descriptors into branchLocation', () => {
        const uber = BankCleaner.process('UBER TRIP AUTH 982181 TID 887123 MID 99120');
        expect(uber.cleanDescription).toBe('UBER TRIP');
        expect(uber.merchantKey).toBe('UBER');
        expect(uber.branchLocation).toBeUndefined();

        const disc = BankCleaner.process('DISCOVERY HEALTH');
        expect(disc.cleanDescription).toBe('DISCOVERY');
        expect(disc.merchantKey).toBe('DISCOVERY');
        expect(disc.branchLocation).toBeUndefined();
    });

    it('guards MR honorific stripping against MR PRICE and MR D FOOD root brands', () => {
        const mrPrice = BankCleaner.process('POS PURCHASE MR PRICE SANDTON');
        expect(mrPrice.cleanDescription).toBe('MR PRICE');
        expect(mrPrice.merchantKey).toBe('MR PRICE');
        expect(mrPrice.branchLocation).toBe('SANDTON');

        const mrPriceBare = BankCleaner.process('POS PURCHASE MR PRICE');
        expect(mrPriceBare.cleanDescription).toBe('MR PRICE');
        expect(mrPriceBare.merchantKey).toBe('MR PRICE');

        const mrD = BankCleaner.process('MR D FOOD DELIVERY');
        expect(mrD.cleanDescription).toBe('MR D FOOD');
        expect(mrD.merchantKey).toBe('MR D FOOD');

        const mrDBare = BankCleaner.process('MR D');
        expect(mrDBare.cleanDescription).toBe('MR D FOOD');
        expect(mrDBare.merchantKey).toBe('MR D FOOD');

        // Genuine honorifics should still be stripped
        const mrSmith = BankCleaner.clean('MR JOHN SMITH');
        expect(mrSmith.clean).toBe('JOHN SMITH');

        const drJones = BankCleaner.clean('DR SARAH JONES');
        expect(drJones.clean).toBe('SARAH JONES');
    });

    it('retains BANK FEES as merchantKey for bank fee transactions', () => {
        const monthly = BankCleaner.process('MONTHLY ACCOUNT FEE');
        expect(monthly.cleanDescription).toBe('BANK FEES');
        expect(monthly.merchantKey).toBe('BANK FEES');
        expect(monthly.paymentChannel).toBe('FEE');

        const debitFee = BankCleaner.process('DEBIT ORDER FEE');
        expect(debitFee.cleanDescription).toBe('BANK FEES');
        expect(debitFee.merchantKey).toBe('BANK FEES');
        expect(debitFee.paymentChannel).toBe('FEE');

        const naedoFee = BankCleaner.process('NAEDO TRACKED FEE');
        expect(naedoFee.cleanDescription).toBe('BANK FEES');
        expect(naedoFee.merchantKey).toBe('BANK FEES');
        expect(naedoFee.paymentChannel).toBe('FEE');

        expect(BankCleaner.generateMerchantKey('BANK FEES')).toBe('BANK FEES');
        expect(BankCleaner.generateMerchantKey('BANK FEES', 'FEE')).toBe('BANK FEES');
    });
});



