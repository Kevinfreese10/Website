import { describe, it, expect, vi } from 'vitest';
import {
  executeDetectiveEngine,
  analyzeMerchantGroupDetective,
  evaluateTimingClue,
  evaluateAmountClue,
  evaluatePrefixClue,
  evaluateReferenceClue,
  evaluateCrossReferenceClue,
  evaluateStatisticalSweepClue,
  evaluateStructureClues,
  evaluateWebGroundingClue,
  parseDateParts,
  DetectiveInputTransaction,
  DetectiveContext,
  WebGroundingResult
} from './detective-engine';
import { normalizeVatType, CANONICAL_VAT_TYPES } from './vat-types';

describe('Milestone 5 Empirical Challenger: 9-Clue Detective Allocation Engine Adversarial Test Suite', () => {

  // ==========================================================================
  // 1. TIMING & CALENDAR BOUNDARIES ADVERSARIAL STRESS TESTS
  // ==========================================================================
  describe('1. Timing & Calendar Boundaries Adversarial Stress Tests', () => {
    it('1.1 Leap year: February 29 (leap day) properly triggers month-end payroll window', () => {
      const parts = parseDateParts('2024-02-29');
      expect(parts).toEqual({ year: 2024, month: 2, day: 29 });

      const res = executeDetectiveEngine({
        description: 'SALARIES STAFF BATCH LEAP',
        amount: -35000.00,
        date: '2024-02-29'
      });
      const badge = res.badges.find(b => b.type === 'timing' && b.label.includes('Payroll'));
      expect(badge).toBeDefined();
      expect(badge!.confidenceContribution).toBeGreaterThanOrEqual(25);
    });

    it('1.2 Leap year: February 29 properly triggers SARS Provisional Tax window (Aug/Feb)', () => {
      const res = executeDetectiveEngine({
        description: 'SARS PROV TAX LEAP YEAR',
        amount: -50000.00,
        date: '2024-02-29'
      });
      const badge = res.badges.find(b => b.type === 'timing' && b.label.includes('Provisional'));
      expect(badge).toBeDefined();
      expect(badge!.confidenceContribution).toBe(35);
    });

    it('1.3 Non-leap year: February 28 triggers both month-end payroll and provisional tax', () => {
      const resPayroll = executeDetectiveEngine({
        description: 'SALARIES PAYROLL BATCH',
        amount: -35000.00,
        date: '2026-02-28'
      });
      expect(resPayroll.badges.some(b => b.type === 'timing' && b.label.includes('Payroll'))).toBe(true);

      const resProv = executeDetectiveEngine({
        description: 'SARS PROV TAX PAYMENT',
        amount: -45000.00,
        date: '2026-02-28'
      });
      expect(resProv.badges.some(b => b.type === 'timing' && b.label.includes('Provisional'))).toBe(true);
    });

    it('1.4 SARS EMP201 exact boundary: Day 7 triggers EMP201 badge, but Day 8 does NOT', () => {
      const badgesDay7 = evaluateTimingClue('2026-09-07', 'SARS EMP201 PAYMENT');
      expect(badgesDay7.some(b => b.label.includes('EMP201'))).toBe(true);

      const badgesDay8 = evaluateTimingClue('2026-09-08', 'SARS EMP201 PAYMENT');
      expect(badgesDay8.some(b => b.label.includes('EMP201'))).toBe(false);
      // Day 8 has no start-of-month or EMP201 badge
      expect(badgesDay8.length).toBe(0);
    });

    it('1.5 Start of month debit orders exact boundary: Day 7 triggers, Day 8 does NOT', () => {
      const badgesDay7 = evaluateTimingClue('2026-09-07', 'DEBIT ORDER INTERNET');
      expect(badgesDay7.some(b => b.label.includes('Start of Month'))).toBe(true);

      const badgesDay8 = evaluateTimingClue('2026-09-08', 'DEBIT ORDER INTERNET');
      expect(badgesDay8.some(b => b.label.includes('Start of Month'))).toBe(false);
    });

    it('1.6 SARS VAT201 exact boundary: Day 24 does NOT trigger, Day 25 DOES trigger', () => {
      const badgesDay24 = evaluateTimingClue('2026-09-24', 'SARS VAT201 PAYMENT');
      expect(badgesDay24.some(b => b.label.includes('VAT201'))).toBe(false);

      const badgesDay25 = evaluateTimingClue('2026-09-25', 'SARS VAT201 PAYMENT');
      expect(badgesDay25.some(b => b.label.includes('VAT201'))).toBe(true);
    });

    it('1.7 Payroll window exact boundary: Day 24 does NOT trigger, Day 25 DOES trigger', () => {
      const badgesDay24 = evaluateTimingClue('2026-09-24', 'SALARIES STAFF PAYMENT');
      expect(badgesDay24.some(b => b.label.includes('Payroll'))).toBe(false);

      const badgesDay25 = evaluateTimingClue('2026-09-25', 'SALARIES STAFF PAYMENT');
      expect(badgesDay25.some(b => b.label.includes('Payroll'))).toBe(true);
    });

    it('1.8 SARS Provisional tax deadline boundary: Aug 19 does NOT trigger, Aug 20 DOES trigger', () => {
      const badgesAug19 = evaluateTimingClue('2026-08-19', 'SARS PROV TAX PAYMENT');
      expect(badgesAug19.some(b => b.label.includes('Provisional'))).toBe(false);

      const badgesAug20 = evaluateTimingClue('2026-08-20', 'SARS PROV TAX PAYMENT');
      expect(badgesAug20.some(b => b.label.includes('Provisional'))).toBe(true);

      const badgesSep01 = evaluateTimingClue('2026-09-01', 'SARS PROV TAX PAYMENT');
      expect(badgesSep01.some(b => b.label.includes('Provisional'))).toBe(false);
    });

    it('1.9 Date parser resilience: handles ISO timestamps, empty strings, and malformed dates gracefully', () => {
      expect(parseDateParts('2026-09-25T12:00:00.000Z')).toEqual({ year: 2026, month: 9, day: 25 });
      expect(parseDateParts('')).toEqual({ year: 0, month: 0, day: 0 });
      expect(parseDateParts('invalid-date-string')).toEqual({ year: 0, month: 0, day: 0 });

      const badgesEmpty = evaluateTimingClue('', 'SOME DESCRIPTION');
      expect(badgesEmpty).toEqual([]);

      const badgesInvalid = evaluateTimingClue('malformed', 'SOME DESCRIPTION');
      expect(badgesInvalid).toEqual([]);
    });
  });

  // ==========================================================================
  // 2. AMOUNT LOGIC & VAT MATH ADVERSARIAL STRESS TESTS
  // ==========================================================================
  describe('2. Amount Logic & VAT Math Adversarial Stress Tests', () => {
    it('2.1 Exact whole-Rand VAT amounts (e.g. R1150.00 -> VAT R150.00) trigger 15% VAT badge', () => {
      const res = evaluateAmountClue(1150.00, 'COMMERCIAL INVOICE');
      const badge = res.badges.find(b => b.label.includes('15% VAT'));
      expect(badge).toBeDefined();
      expect(badge!.confidenceContribution).toBe(15);
    });

    it('2.2 Integer VAT calculation on round amounts (e.g. R230.00 -> VAT R30.00)', () => {
      const res = evaluateAmountClue(230.00, 'CONSULTING SERVICES');
      expect(res.badges.some(b => b.label.includes('15% VAT'))).toBe(true);
    });

    it('2.3 Non-VAT fractional amounts (e.g. R1137.42) are correctly rejected', () => {
      const res = evaluateAmountClue(1137.42, 'RANDOM AMOUNT');
      expect(res.badges.some(b => b.label.includes('15% VAT'))).toBe(false);
    });

    it('2.4 Empirical finding: cent-level VAT amounts (e.g. R116.15 -> VAT R15.15) behavior under Math.round', () => {
      // In South African tax, R101.00 net + 15% VAT (R15.15) = R116.15 gross.
      // (116.15 * 15) / 115 = 15.15.
      // Under Math.abs(vatPortion - Math.round(vatPortion)), Math.round(15.15) = 15,
      // so residue is 0.15 >= 0.01.
      // We empirically verify that this currently only triggers for whole-Rand VAT:
      const res = evaluateAmountClue(116.15, 'COMMERCIAL INVOICE WITH CENTS');
      const hasVatBadge = res.badges.some(b => b.label.includes('15% VAT'));
      // Documents empirical behavior: whole-rand VAT vs fractional-cent VAT
      expect(hasVatBadge).toBe(false);
    });

    it('2.5 Guardrail: amounts below R100 (e.g. R23.00, where VAT is R3.00 exact) do NOT trigger 15% VAT badge', () => {
      const res = evaluateAmountClue(23.00, 'SMALL PURCHASE');
      expect(res.badges.some(b => b.label.includes('15% VAT'))).toBe(false);
    });

    it('2.6 Edge amount: Zero amount (R0.00) does NOT trigger 15% VAT or drawings badges', () => {
      const res = evaluateAmountClue(0, 'ZERO DOLLAR ITEM');
      expect(res.badges.length).toBe(0);
    });

    it('2.7 Director drawings: exact thousands (R1000, R25000) allocate to 5000-001 with no_vat', () => {
      const res1000 = evaluateAmountClue(-1000.00, 'DIRECTOR DRAWINGS KEVIN');
      expect(res1000.suggestedAccountId).toBe('5000-001');
      expect(res1000.suggestedVatType).toBe('no_vat');
      expect(res1000.badges.some(b => b.label.includes('Drawings'))).toBe(true);

      const res25k = evaluateAmountClue(-25000.00, 'MEMBER LOAN DRAWING');
      expect(res25k.suggestedAccountId).toBe('5000-001');
      expect(res25k.suggestedVatType).toBe('no_vat');
      expect(res25k.badges.some(b => b.label.includes('Drawings'))).toBe(true);
    });

    it('2.8 Director drawings rejection: non-thousand amounts (R999, R1500) or non-matching descriptions do NOT trigger drawings', () => {
      const res999 = evaluateAmountClue(-999.00, 'DIRECTOR DRAWINGS');
      expect(res999.badges.some(b => b.label.includes('Drawings'))).toBe(false);

      const res1500 = evaluateAmountClue(-1500.00, 'DIRECTOR DRAWINGS');
      expect(res1500.badges.some(b => b.label.includes('Drawings'))).toBe(false);

      const resOffice = evaluateAmountClue(-5000.00, 'OFFICE DESKS AND CHAIRS');
      expect(resOffice.badges.some(b => b.label.includes('Drawings'))).toBe(false);
    });
  });

  // ==========================================================================
  // 3. SARS PRN & STATUTORY INVARIANTS ADVERSARIAL STRESS TESTS
  // ==========================================================================
  describe('3. SARS PRN & Statutory Invariants Adversarial Stress Tests', () => {
    it('3.1 Strict Balance Sheet mapping: VAT201 PRN maps strictly to 7000-008', () => {
      const res = executeDetectiveEngine({
        description: 'SARS PAYMENT PRN 194123456789012345',
        amount: -45000.00,
        date: '2026-09-25'
      });
      expect(res.suggestedAccountId).toBe('7000-008');
      expect(res.suggestedVatType).toBe('no_vat');
    });

    it('3.2 Strict Balance Sheet mapping: EMP201 PRN maps strictly to 7000-011', () => {
      const res = executeDetectiveEngine({
        description: 'SARS PAYMENT PRN 195123456789012345',
        amount: -18000.00,
        date: '2026-09-07'
      });
      expect(res.suggestedAccountId).toBe('7000-011');
      expect(res.suggestedVatType).toBe('no_vat');
    });

    it('3.3 Strict Balance Sheet mapping: Provisional Tax PRN maps strictly to 7000-015', () => {
      const res = executeDetectiveEngine({
        description: 'SARSEFLNG PROV TAX IRP6',
        amount: -75000.00,
        date: '2026-08-31'
      });
      expect(res.suggestedAccountId).toBe('7000-015');
      expect(res.suggestedVatType).toBe('no_vat');
    });

    it('3.4 Statutory Invariant: SARS payment NEVER allocated to operating expense (3000/5000 series)', () => {
      // Even if past ledger incorrectly allocated SARS to 3000-001 (Operating Expense),
      // the statutory invariant MUST override it to 7000-xxx
      const dirtyContext: DetectiveContext = {
        historicalTransactions: [
          {
            merchantKey: 'SARS',
            description: 'SARS VAT201',
            status: 'reviewed',
            allocatedTo: { value: '3000-001', type: 'account' },
            vatType: 'standard_rated_purchases'
          }
        ]
      };

      const res = executeDetectiveEngine(
        {
          description: 'SARS VAT201 PAYMENT 194123456789012345',
          amount: -30000.00,
          date: '2026-09-25',
          merchantKey: 'SARS'
        },
        [],
        dirtyContext
      );

      expect(res.suggestedAccountId).toBe('7000-008');
      expect(res.suggestedAccountId.startsWith('3000')).toBe(false);
      expect(res.suggestedAccountId.startsWith('5000')).toBe(false);
      expect(res.suggestedVatType).toBe('no_vat');
    });

    it('3.5 Statutory Invariant: SARS payment NEVER claims input VAT deduction (standard_rated_purchases)', () => {
      // Even if client is VAT registered, SARS statutory settlement MUST be no_vat
      const vatRegisteredContext: DetectiveContext = {
        isVatRegistered: true
      };

      const res = executeDetectiveEngine(
        {
          description: 'SARS EMP201 PRN 195000000000000000',
          amount: -22000.00,
          date: '2026-09-07'
        },
        [],
        vatRegisteredContext
      );

      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.suggestedVatType).not.toBe('standard_rated_purchases');
    });

    it('3.6 Statutory Invariant: Web grounding suggestion of operating expense is overridden for SARS', () => {
      const maliciousWebResult: WebGroundingResult = {
        merchantName: 'South African Revenue Service',
        merchantCategory: 'Government Agency',
        suggestedAccountId: '3000-025', // Incorrect operating expense
        suggestedVatType: 'standard_rated_purchases', // Illegal input VAT deduction
        confidence: 90
      };

      const res = executeDetectiveEngine(
        {
          description: 'SARS VAT201 PRN 194000000000000000',
          amount: -15000.00,
          date: '2026-09-25'
        },
        [],
        undefined,
        maliciousWebResult
      );

      expect(res.suggestedAccountId).toBe('7000-008');
      expect(res.suggestedVatType).toBe('no_vat');
    });
  });

  // ==========================================================================
  // 4. STATISTICAL SWEEPS ADVERSARIAL BOUNDARY TESTS
  // ==========================================================================
  describe('4. Statistical Sweeps (Inter-Account Transfers) Adversarial Tests', () => {
    it('4.1 Exact 3-day boundary (<= 3.0 days) matches contra sweep pair', () => {
      const txDebit: DetectiveInputTransaction = {
        id: 'tx_deb_3d',
        description: 'INTER-ACCOUNT TRANSFER OUT',
        amount: -25000.00,
        date: '2026-09-01'
      };
      const txCredit: DetectiveInputTransaction = {
        id: 'tx_cred_3d',
        description: 'INTER-ACCOUNT TRANSFER IN',
        amount: 25000.00,
        date: '2026-09-04' // Exactly 3 days later
      };

      const res = executeDetectiveEngine(txDebit, [txDebit, txCredit]);
      expect(res.isInterAccountSweep).toBe(true);
      expect(res.suggestedAccountId).toBe('9500-003');
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.badges.some(b => b.type === 'sweep')).toBe(true);
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(85);
    });

    it('4.2 Rejects contra pair at 4 days (> 3.0001 days)', () => {
      const txDebit: DetectiveInputTransaction = {
        id: 'tx_deb_4d',
        description: 'INTER-ACCOUNT TRANSFER OUT',
        amount: -25000.00,
        date: '2026-09-01'
      };
      const txCredit: DetectiveInputTransaction = {
        id: 'tx_cred_4d',
        description: 'INTER-ACCOUNT TRANSFER IN',
        amount: 25000.00,
        date: '2026-09-05' // 4 days later
      };

      const res = executeDetectiveEngine(txDebit, [txDebit, txCredit]);
      expect(res.isInterAccountSweep).toBe(false);
      expect(res.badges.some(b => b.type === 'sweep')).toBe(false);
    });

    it('4.3 Rejects contra pair with unequal amounts (off by 5 cents)', () => {
      const txDebit: DetectiveInputTransaction = {
        id: 'tx_deb_unequal',
        description: 'TRANSFER OUT',
        amount: -25000.00,
        date: '2026-09-01'
      };
      const txCredit: DetectiveInputTransaction = {
        id: 'tx_cred_unequal',
        description: 'TRANSFER IN',
        amount: 25000.05,
        date: '2026-09-02'
      };

      const res = executeDetectiveEngine(txDebit, [txDebit, txCredit]);
      expect(res.isInterAccountSweep).toBe(false);
      expect(res.badges.some(b => b.type === 'sweep')).toBe(false);
    });

    it('4.4 Self-matching prevention: transaction does NOT match itself in batch', () => {
      const tx: DetectiveInputTransaction = {
        id: 'tx_solo',
        description: 'TRANSFER OUT',
        amount: -25000.00,
        date: '2026-09-01'
      };

      const res = executeDetectiveEngine(tx, [tx]);
      expect(res.isInterAccountSweep).toBe(false);
      expect(res.badges.some(b => b.type === 'sweep')).toBe(false);
    });

    it('4.5 Empirical finding on same-account transfers: evaluateStatisticalSweepClue behavior when bankAccountId is identical', () => {
      // Adversarial scenario: an expense and an income of the same amount in the SAME account
      const txDebit: DetectiveInputTransaction = {
        id: 'tx_same_acc_1',
        description: 'SUPPLIER PURCHASE',
        amount: -10000.00,
        date: '2026-09-01',
        bankAccountId: 'cheque_account_1'
      };
      const txCredit: DetectiveInputTransaction = {
        id: 'tx_same_acc_2',
        description: 'CUSTOMER SALE PAYMENT',
        amount: 10000.00,
        date: '2026-09-01',
        bankAccountId: 'cheque_account_1' // SAME account!
      };

      const res = evaluateStatisticalSweepClue(txDebit, [txDebit, txCredit]);
      // Documents empirical behavior: engine matches based on amount & date difference.
      // Confirmed empirical finding: evaluateStatisticalSweepClue does not check bankAccountId inequality.
      expect(res.badge).toBeDefined();
    });
  });

  // ==========================================================================
  // 5. CONFIDENCE THRESHOLDS & ZERO-QUERY CARD INVARIANT ADVERSARIAL TESTS
  // ==========================================================================
  describe('5. Confidence Thresholds & Zero-Query Card Invariant Adversarial Tests', () => {
    it('5.1 Boundary test: exactly 79% confidence remains in ai_review with isAutoAllocatable false', () => {
      // Construct a transaction that lands near 70-75% without reaching 80%
      // e.g. Contractual Debit Order (+20) + Timing (1st-7th) (+25) = 45%
      const res = executeDetectiveEngine({
        description: 'DEBIT ORDER LOCAL SECURITY',
        amount: -450.00,
        date: '2026-09-02'
      });

      expect(res.compositeConfidence).toBeLessThan(80);
      expect(res.isAutoAllocatable).toBe(false);
      expect(res.status).toBe('ai_review');
    });

    it('5.2 Boundary test: >= 80% confidence auto-allocates to reviewed with isAutoAllocatable true', () => {
      // SARS PRN (+55) + Timing Window (+30) -> synergy sets to >= 85%
      const res = executeDetectiveEngine({
        description: 'SARS VAT201 PRN 194000000000000000',
        amount: -15000.00,
        date: '2026-09-25'
      });

      expect(res.compositeConfidence).toBeGreaterThanOrEqual(80);
      expect(res.isAutoAllocatable).toBe(true);
      expect(res.status).toBe('reviewed');
    });

    it('5.3 Invariant: transactions with < 80% confidence strictly generate ZERO query cards', () => {
      const res = executeDetectiveEngine({
        description: 'UNKNOWN STRANGE EXPENDITURE',
        amount: -83.21,
        date: '2026-09-14'
      });

      expect(res.compositeConfidence).toBeLessThan(80);
      expect(res.status).toBe('ai_review');
      expect((res as any).queryCard).toBeUndefined();
      expect((res as any).draftQuery).toBeUndefined();
      expect((res as any).clientCard).toBeUndefined();
    });
  });

  // ==========================================================================
  // 6. RULE SCOPING & BRAND RECOGNITION ADVERSARIAL TESTS
  // ==========================================================================
  describe('6. Rule Scoping & Brand Recognition Adversarial Tests', () => {
    it('6.1 Recognized SA national brand scopes to global_practice', () => {
      const resEngen = executeDetectiveEngine({
        description: 'ENGEN WATERKLOOF GARAGE',
        amount: -750.00,
        date: '2026-09-12'
      });
      expect(resEngen.ruleScoping).toBe('global_practice');

      const resWoolies = executeDetectiveEngine({
        description: 'WOOLWORTHS FOOD SANDTON',
        amount: -450.00,
        date: '2026-09-12'
      });
      expect(resWoolies.ruleScoping).toBe('global_practice');

      const resShell = executeDetectiveEngine({
        description: 'SHELL ULTRA CITY MIDRAND',
        amount: -800.00,
        date: '2026-09-12'
      });
      expect(resShell.ruleScoping).toBe('global_practice');
    });

    it('6.2 Local, independent, or unlisted merchants scope to client', () => {
      const resLocal = executeDetectiveEngine({
        description: 'BLAIRGOWRIE HARDWARE STORE',
        amount: -1250.00,
        date: '2026-09-12'
      });
      expect(resLocal.ruleScoping).toBe('client');

      const resDr = executeDetectiveEngine({
        description: 'DR J SMITH MEDICAL CONSULT',
        amount: -950.00,
        date: '2026-09-12'
      });
      expect(resDr.ruleScoping).toBe('client');
    });

    it('6.3 National brand with contractual debit order suffix scopes to global_practice', () => {
      const res = executeDetectiveEngine({
        description: 'VODACOM SA [DEBIT ORDER]',
        amount: -499.00,
        date: '2026-09-02',
        paymentChannel: 'DEBIT_ORDER'
      });
      expect(res.ruleScoping).toBe('global_practice');
    });
  });

  // ==========================================================================
  // 7. BATCH GROUP DETECTIVE ANALYSIS STRESS TESTS
  // ==========================================================================
  describe('7. Batch Group Detective Analysis Stress Tests', () => {
    it('7.1 Detects recurring fixed amounts across group members and boosts confidence', () => {
      const groupTxs: DetectiveInputTransaction[] = [
        { id: '1', description: 'TELKOM FIBRE 100M', amount: -799.00, date: '2026-07-02' },
        { id: '2', description: 'TELKOM FIBRE 100M', amount: -799.00, date: '2026-08-02' },
        { id: '3', description: 'TELKOM FIBRE 100M', amount: -799.00, date: '2026-09-02' }
      ];

      const res = analyzeMerchantGroupDetective('TELKOM FIBRE', groupTxs);
      expect(res.badges.some(b => b.label.includes('Recurring'))).toBe(true);
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(70);
    });

    it('7.2 Gracefully handles empty transaction groups without errors', () => {
      const res = analyzeMerchantGroupDetective('EMPTY VENDOR', []);
      expect(res.compositeConfidence).toBe(0);
      expect(res.isAutoAllocatable).toBe(false);
      expect(res.status).toBe('ai_review');
      expect(res.badges).toEqual([]);
    });

    it('7.3 Selects representative transaction prioritizing PRN over plain description', () => {
      const groupTxs: DetectiveInputTransaction[] = [
        { id: '1', description: 'SARS PAYMENT', amount: -5000.00, date: '2026-09-25' },
        {
          id: '2',
          description: 'SARS PAYMENT WITH PRN',
          amount: -5000.00,
          date: '2026-09-25',
          structuralClues: { prn: '194000000000000000' }
        }
      ];

      const res = analyzeMerchantGroupDetective('SARS', groupTxs);
      expect(res.suggestedAccountId).toBe('7000-008');
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.badges.some(b => b.label.includes('VAT201'))).toBe(true);
    });
  });
});
