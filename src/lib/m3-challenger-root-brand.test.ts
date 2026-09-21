import { describe, it, expect } from 'vitest';
import {
    BankCleaner,
    classifyPaymentChannel,
    extractStructuralClues,
    cleanAndGroupTransaction,
} from './bank-cleaner';

describe('Milestone 2 & 3 Challenger Suite: Prefix Dates, Compound Fees, Root Brands', () => {

    describe('1. Prefix Date Collision & Noise Elimination', () => {
        it('cleans ISO date immediately following prefix: POS PURCHASE 2024-09-15 CHECKERS -> clean is CHECKERS', () => {
            const res = BankCleaner.clean('POS PURCHASE 2024-09-15 CHECKERS');
            expect(res.clean).toBe('CHECKERS');
            expect(res.clean).not.toContain('09');
            expect(res.clean).not.toContain('15');
            expect(res.channel).toBe('POS');
        });

        it('cleans various date formats immediately following various banking prefixes', () => {
            expect(BankCleaner.clean('POS PURCHASE 2024/09/15 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('POS PURCHASE 2024.09.15 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('POS PURCHASE 20240915 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('POS PURCHASE 15-09-2024 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('POS PURCHASE 15/09/2024 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('POS PURCHASE 15.09.2024 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('POS PURCHASE 15SEP2024 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('CARD PURCHASE 2024-09-15 14:32:05 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('EFT PAYMENT 2024-09-15 WOOLWORTHS').clean).toBe('WOOLWORTHS');
            expect(BankCleaner.clean('DEBIT ORDER 2024-09-15 VODACOM').clean).toBe('VODACOM');
            expect(BankCleaner.clean('CHEQUE CARD PURCHASE 2024-09-15 PICK N PAY').clean).toBe('PICK N PAY');
            expect(BankCleaner.clean('ELECTRONIC TRANSFER 2024-09-15 SASOL').clean).toBe('SASOL');
        });

        it('cleans prefix dates with trailing merchant names containing numbers or alphanumeric tokens', () => {
            expect(BankCleaner.clean('POS PURCHASE 2024-09-15 STUDIO 88').clean).toBe('STUDIO 88');
            expect(BankCleaner.clean('POS PURCHASE 2024-09-15 7 ELEVEN').clean).toBe('7 ELEVEN');
            expect(BankCleaner.clean('POS PURCHASE 2024-09-15 3M SOUTH AFRICA').clean).toBe('3 M SOUTH AFRICA');
            expect(BankCleaner.clean('POS PURCHASE 2024-09-15 24/7 FITNESS').clean).toBe('24 7 FITNESS');
        });

        it('cleans prefix numbers/amounts followed by ISO dates', () => {
            expect(BankCleaner.clean('POS PURCHASE 123.45 2024-09-15 CHECKERS').clean).toBe('CHECKERS');
            expect(BankCleaner.clean('POS PURCHASE 123 2024-09-15 CHECKERS').clean).toBe('CHECKERS');
        });
    });

    describe('2. Compound Fees & Non-Bank Fee Protections', () => {
        it('verifies compound fees: RTC IMMEDIATE PAYMENT FEE, DEBIT ORDER FEE, FAST CLEARING FEE are tagged FEE and cleaned to BANK FEES', () => {
            const requiredCases = [
                'RTC IMMEDIATE PAYMENT FEE',
                'DEBIT ORDER FEE',
                'FAST CLEARING FEE',
            ];

            for (const desc of requiredCases) {
                const channel = classifyPaymentChannel(desc);
                expect(channel, `Channel for "${desc}" should be FEE`).toBe('FEE');

                const cleaned = BankCleaner.clean(desc);
                expect(cleaned.channel, `Cleaned channel for "${desc}" should be FEE`).toBe('FEE');
                expect(cleaned.clean, `Cleaned text for "${desc}" should be BANK FEES`).toBe('BANK FEES');
            }
        });

        it('verifies broader set of compound banking fee phrases classified as channel FEE and cleaned to BANK FEES', () => {
            const compoundCases = [
                'RTC EXPRESS PMT FEE',
                'RTC PMT FEE',
                'REAL-TIME CLEARING FEE',
                'REAL TIME CLEARING CHARGE',
                'STOP ORDER FEE',
                'DEBICHECK FEE',
                'NAEDO FEE',
                'CARD FEE',
                'EFT FEE',
                'POS FEE',
                'PAYSHAP FEE',
                'ATM CASH DEPOSIT FEE',
                'MONTHLY ACCOUNT FEE',
                'BANK CHARGES',
            ];

            for (const desc of compoundCases) {
                const channel = classifyPaymentChannel(desc);
                expect(channel, `Channel for "${desc}" should be FEE`).toBe('FEE');

                const cleaned = BankCleaner.clean(desc);
                expect(cleaned.channel, `Cleaned channel for "${desc}" should be FEE`).toBe('FEE');
                expect(cleaned.clean, `Cleaned text for "${desc}" should be BANK FEES`).toBe('BANK FEES');
            }
        });

        it('strictly protects legitimate non-bank fees from being classified as FEE or cleaned to BANK FEES', () => {
            const nonBankCases = [
                'COMPETITION FEES J4P COC 15TH SEPT',
                'LEGAL FEES ADVOCATE SMITH',
                'SCHOOL FEES CURRO',
                'CONSULTING FEES KPMG',
                'REGISTRATION FEES UNISA',
                'MEMBERSHIP FEES VIRGIN ACTIVE',
                'TUITION FEES UCT',
                'DOCTORS FEES DR JONES',
                'ENTRANCE FEES KRUGER PARK',
                'FILING FEES CIPC',
            ];

            for (const desc of nonBankCases) {
                const channel = classifyPaymentChannel(desc);
                expect(channel, `Channel for non-bank description "${desc}" must NOT be FEE`).not.toBe('FEE');

                const cleaned = BankCleaner.clean(desc);
                expect(cleaned.channel, `Cleaned channel for "${desc}" must NOT be FEE`).not.toBe('FEE');
                expect(cleaned.clean, `Cleaned text for "${desc}" must NOT be BANK FEES`).not.toBe('BANK FEES');
            }
        });

        it('correctly classifies compound fee modifiers under FEE channel', () => {
            // Compound fee modifiers (TRACKED, DEBIT, IMMEDIATE, REVERSAL) are correctly routed to FEE:
            expect(classifyPaymentChannel('NAEDO TRACKED FEE')).toBe('FEE');
            expect(classifyPaymentChannel('ACB DEBIT FEE')).toBe('FEE');
            expect(classifyPaymentChannel('PAYSHAP IMMEDIATE FEE')).toBe('FEE');
            expect(classifyPaymentChannel('DEBIT ORDER REVERSAL FEE')).toBe('FEE');
        });
    });

    describe('3. Root Brand Primary Merchant Grouping & Branch Metadata Preservation', () => {
        it('consolidates ENGEN WINCHESTER, ENGEN WATERKLOOF, ENGEN GARAGE 4421 all to merchantKey: ENGEN', () => {
            // Unprefixed inputs
            const engen1 = BankCleaner.process('ENGEN WINCHESTER');
            expect(engen1.merchantKey).toBe('ENGEN');
            expect(engen1.cleanDescription).toBe('ENGEN');
            expect(engen1.branchLocation).toBe('WINCHESTER');

            const engen2 = BankCleaner.process('ENGEN WATERKLOOF');
            expect(engen2.merchantKey).toBe('ENGEN');
            expect(engen2.cleanDescription).toBe('ENGEN');
            expect(engen2.branchLocation).toBe('WATERKLOOF');

            const engen3 = BankCleaner.process('ENGEN GARAGE 4421');
            expect(engen3.merchantKey).toBe('ENGEN');
            expect(engen3.cleanDescription).toBe('ENGEN');
            expect(engen3.branchLocation).toBe('GARAGE 4421');

            // With prefixes via cleanAndGroupTransaction
            const g1 = cleanAndGroupTransaction('POS PURCHASE ENGEN WINCHESTER');
            expect(g1.merchantKey).toBe('ENGEN');
            expect(g1.clean).toBe('ENGEN');
            expect(g1.branchLocation).toBe('WINCHESTER');

            const g2 = cleanAndGroupTransaction('POS PURCHASE ENGEN WATERKLOOF');
            expect(g2.merchantKey).toBe('ENGEN');
            expect(g2.clean).toBe('ENGEN');
            expect(g2.branchLocation).toBe('WATERKLOOF');

            const g3 = cleanAndGroupTransaction('POS PURCHASE ENGEN GARAGE 4421');
            expect(g3.merchantKey).toBe('ENGEN');
            expect(g3.clean).toBe('ENGEN');
            expect(g3.branchLocation).toBe('GARAGE 4421');
        });

        it('consolidates other national chains under canonical Root Brand merchantKey', () => {
            // WOOLWORTHS
            const woolies1 = BankCleaner.process('CARD PURCHASE WOOLWORTHS FOOD #1024');
            expect(woolies1.merchantKey).toBe('WOOLWORTHS');
            expect(woolies1.branchLocation).toBe('#1024');

            const woolies2 = BankCleaner.process('POS PURCHASE WOOLWORTHS SANDTON');
            expect(woolies2.merchantKey).toBe('WOOLWORTHS');
            expect(woolies2.branchLocation).toBe('SANDTON');

            // CHECKERS
            const checkers1 = BankCleaner.process('POS PURCHASE CHECKERS HYPER MENLYN');
            expect(checkers1.merchantKey).toBe('CHECKERS');
            expect(checkers1.branchLocation).toBe('MENLYN');

            const checkers2 = BankCleaner.process('CHECKERS SIXTY60');
            expect(checkers2.merchantKey).toBe('CHECKERS');

            // SPAR
            const spar1 = BankCleaner.process('POS PURCHASE SPAR WATERKLOOF');
            expect(spar1.merchantKey).toBe('SPAR');
            expect(spar1.branchLocation).toBe('WATERKLOOF');

            const spar2 = BankCleaner.process('KWIKSPAR STELLENBOSCH');
            expect(spar2.merchantKey).toBe('SPAR');
            expect(spar2.branchLocation).toBe('STELLENBOSCH');

            // SHELL & TOTAL
            const shell = BankCleaner.process('POS PURCHASE SHELL ULTRA CITY');
            expect(shell.merchantKey).toBe('SHELL');
            expect(shell.branchLocation).toBe('ULTRA CITY');

            const total = BankCleaner.process('TOTALENERGIES BROOKLYN');
            expect(total.merchantKey).toBe('TOTAL');
            expect(total.branchLocation).toBe('BROOKLYN');
        });

        it('segregates contractual DEBIT_ORDER from discretionary spend in merchantKey', () => {
            const debitVodacom = BankCleaner.process('DEBIT ORDER VODACOM');
            expect(debitVodacom.paymentChannel).toBe('DEBIT_ORDER');
            expect(debitVodacom.merchantKey).toBe('VODACOM [DEBIT ORDER]');

            const posVodacom = BankCleaner.process('POS PURCHASE VODACOM');
            expect(posVodacom.paymentChannel).toBe('POS');
            expect(posVodacom.merchantKey).toBe('VODACOM');

            const debitDiscovery = BankCleaner.process('DEBIT ORDER DISCOVERY');
            expect(debitDiscovery.paymentChannel).toBe('DEBIT_ORDER');
            expect(debitDiscovery.merchantKey).toBe('DISCOVERY [DEBIT ORDER]');

            const cardDiscovery = BankCleaner.process('CARD PURCHASE DISCOVERY');
            expect(cardDiscovery.paymentChannel).toBe('CARD');
            expect(cardDiscovery.merchantKey).toBe('DISCOVERY');

            const stopOrderSantam = BankCleaner.process('STOP ORDER SANTAM');
            expect(stopOrderSantam.paymentChannel).toBe('DEBIT_ORDER');
            expect(stopOrderSantam.merchantKey).toBe('SANTAM [DEBIT ORDER]');
        });

        it('preserves leading locations for independent local businesses and does NOT assign them to branchLocation', () => {
            const blairgowrie = BankCleaner.process('BLAIRGOWRIE HYPERMARKET');
            expect(blairgowrie.cleanDescription).toBe('BLAIRGOWRIE HYPERMARKET');
            expect(blairgowrie.merchantKey).toBe('BLAIRGOWRIE HYPERMARKET');
            expect(blairgowrie.branchLocation).toBeUndefined();

            const randburg = BankCleaner.process('RANDBURG GLASS AND ALUMINIUM');
            expect(randburg.cleanDescription).toBe('RANDBURG GLASS AND ALUMINIUM');
            expect(randburg.merchantKey).toBe('RANDBURG GLASS ALUMINIUM');
            expect(randburg.branchLocation).toBeUndefined();
        });

        it('excludes non-geographic descriptors from branchLocation', () => {
            const uber = BankCleaner.process('UBER TRIP AUTH 982181');
            expect(uber.cleanDescription).toBe('UBER TRIP');
            expect(uber.merchantKey).toBe('UBER');
            expect(uber.branchLocation).toBeUndefined();

            const discovery = BankCleaner.process('DISCOVERY HEALTH');
            expect(discovery.cleanDescription).toBe('DISCOVERY');
            expect(discovery.merchantKey).toBe('DISCOVERY');
            expect(discovery.branchLocation).toBeUndefined();
        });
    });
});
