import { describe, it, expect } from 'vitest';
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
  DetectiveInputTransaction,
  DetectiveContext,
  WebGroundingResult
} from './detective-engine';

describe('9-Clue Detective Allocation Engine (src/lib/detective-engine.ts)', () => {
  // ==========================================================================
  // CLUE 1: TIMING HEURISTICS
  // ==========================================================================
  describe('Clue 1: Timing / Calendar Heuristics', () => {
    it('1. Payroll window (25th to month-end) produces Payroll timing badge with >=25 contribution', () => {
      const res = executeDetectiveEngine({
        description: 'SALARIES STAFF BATCH',
        amount: -45000.00,
        date: '2026-09-25'
      });
      const payrollBadge = res.badges.find(b => b.type === 'timing' && b.label.includes('Payroll'));
      expect(payrollBadge).toBeDefined();
      expect(payrollBadge!.confidenceContribution).toBeGreaterThanOrEqual(25);
    });

    it('2. Start-of-month debit orders (1st to 7th) produces Start-of-Month timing badge with >=20 contribution', () => {
      const res = executeDetectiveEngine({
        description: 'DEBIT ORDER OFFICE RENT',
        amount: -15000.00,
        date: '2026-09-02'
      });
      const startBadge = res.badges.find(b => b.type === 'timing' && (b.label.includes('Start-of-Month') || b.label.includes('Start of Month')));
      expect(startBadge).toBeDefined();
      expect(startBadge!.confidenceContribution).toBeGreaterThanOrEqual(20);
    });

    it('3. SARS EMP201 deadline (1st to 7th) produces EMP201 statutory timing badge', () => {
      const res = executeDetectiveEngine({
        description: 'SARS EMP201 PAYMENT',
        amount: -18500.00,
        date: '2026-09-07'
      });
      expect(res.badges.some(b => b.label.includes('EMP201'))).toBe(true);
    });

    it('4. SARS VAT201 window (25th to month-end) produces VAT201 statutory timing badge', () => {
      const res = executeDetectiveEngine({
        description: 'SARS VAT201 PAYMENT',
        amount: -32000.00,
        date: '2026-09-25'
      });
      expect(res.badges.some(b => b.label.includes('VAT201'))).toBe(true);
    });

    it('5. SARS Provisional Tax window (Aug & Feb late month) produces Provisional Tax badge', () => {
      const res = executeDetectiveEngine({
        description: 'SARS PROV TAX PAYMENT',
        amount: -60000.00,
        date: '2026-08-31'
      });
      expect(res.badges.some(b => b.label.includes('Provisional'))).toBe(true);
    });

    it('6. Mid-month date has no timing badge', () => {
      const res = executeDetectiveEngine({
        description: 'RANDOM EXPENSE',
        amount: -450.00,
        date: '2026-09-15'
      });
      expect(res.badges.some(b => b.type === 'timing')).toBe(false);
    });
  });

  // ==========================================================================
  // CLUE 2: AMOUNT HEURISTICS
  // ==========================================================================
  describe('Clue 2: Amount Context Heuristics', () => {
    it('7. Exact 15% standard VAT factor identified', () => {
      const res = executeDetectiveEngine({
        description: 'SUPPLIER COMMERCIAL INVOICE',
        amount: -1150.00,
        date: '2026-09-10'
      });
      const vatBadge = res.badges.find(b => b.type === 'amount' && b.label.includes('15% VAT'));
      expect(vatBadge).toBeDefined();
      expect(vatBadge!.confidenceContribution).toBeGreaterThanOrEqual(15);
    });

    it('8. Non-VAT fractional amount does not trigger 15% VAT badge', () => {
      const res = executeDetectiveEngine({
        description: 'ODD FRACTIONAL AMOUNT',
        amount: -1137.42,
        date: '2026-09-10'
      });
      expect(res.badges.some(b => b.label.includes('15% VAT'))).toBe(false);
    });

    it('9. Recurring identical fixed amount across history triggers Recurring Fixed Amount badge', () => {
      const context: DetectiveContext = {
        historicalTransactions: [
          { amount: -999.00, status: 'reviewed', isExpense: true },
          { amount: -999.00, status: 'reviewed', isExpense: true }
        ]
      };
      const res = executeDetectiveEngine(
        { description: 'FIBRE SUBSCRIPTION', amount: -999.00, date: '2026-09-12' },
        [],
        context
      );
      const recurBadge = res.badges.find(b => b.type === 'amount' && b.label.includes('Recurring'));
      expect(recurBadge).toBeDefined();
      expect(recurBadge!.confidenceContribution).toBe(25);
    });

    it('10. Round thousands director drawings allocates to 5000-001 with no_vat', () => {
      const res = executeDetectiveEngine({
        description: 'DIRECTOR TRANSFER KEVIN',
        amount: -20000.00,
        date: '2026-09-15'
      });
      expect(res.suggestedAccountId).toBe('5000-001');
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.badges.some(b => b.label.includes('Drawings'))).toBe(true);
    });
  });

  // ==========================================================================
  // CLUE 3: PREFIX / CHANNEL INTENT DECODING
  // ==========================================================================
  describe('Clue 3: Prefix / Channel Intent Decoding', () => {
    it('11. Contractual debit order channel triggers Contractual Debit Order badge', () => {
      const res = executeDetectiveEngine({
        description: 'DEBIT ORDER TELKOM FIBRE',
        amount: -899.00,
        date: '2026-09-12'
      });
      expect(res.badges.some(b => b.label.includes('Contractual Debit Order'))).toBe(true);
    });

    it('12. Discretionary card swipe triggers Discretionary Card / POS badge', () => {
      const res = executeDetectiveEngine({
        description: 'POS PURCHASE WOOLWORTHS',
        amount: -450.00,
        date: '2026-09-12'
      });
      expect(res.badges.some(b => b.label.includes('Discretionary Card / POS'))).toBe(true);
    });

    it('13. Bank fee channel allocates to 3000-004 with exempt_purchases', () => {
      const res = executeDetectiveEngine({
        description: 'MONTHLY ACCOUNT SERVICE FEE',
        amount: -125.00,
        date: '2026-09-15'
      });
      expect(res.suggestedAccountId).toBe('3000-004');
      expect(res.suggestedVatType).toBe('exempt_purchases');
      expect(res.badges.some(b => b.label.includes('Bank Service Fee'))).toBe(true);
    });

    it('14. ATM cash withdrawal triggers ATM badge and 1000-002 account', () => {
      const res = executeDetectiveEngine({
        description: 'ATM CASH WITHDRAWAL SANDTON',
        amount: -2000.00,
        date: '2026-09-15'
      });
      expect(res.badges.some(b => b.type === 'prefix' && b.label.includes('ATM'))).toBe(true);
      expect(res.suggestedAccountId).toBe('1000-002');
    });
  });

  // ==========================================================================
  // CLUE 4: REFERENCE DECODING (SARS PRNs)
  // ==========================================================================
  describe('Clue 4: Reference Decoding (SARS PRNs & Statutory Liabilities)', () => {
    it('15. SARS VAT201 PRN allocates to Balance Sheet 7000-008 with no_vat', () => {
      const res = executeDetectiveEngine({
        description: 'SARS VAT201 PRN 1940012345678901234',
        amount: -28500.00,
        date: '2026-09-25'
      });
      expect(res.suggestedAccountId).toBe('7000-008');
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.badges.some(b => b.label.includes('VAT201'))).toBe(true);
    });

    it('16. SARS EMP201 PRN allocates to Balance Sheet 7000-011 with no_vat', () => {
      const res = executeDetectiveEngine({
        description: 'SARS EMP201 PRN 1950098765432109876',
        amount: -14200.00,
        date: '2026-09-07'
      });
      expect(res.suggestedAccountId).toBe('7000-011');
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.badges.some(b => b.label.includes('EMP201'))).toBe(true);
    });

    it('17. SARS Provisional Tax allocates to Balance Sheet 7000-015 with no_vat', () => {
      const res = executeDetectiveEngine({
        description: 'SARSEFLNG 9876543210 PROV TAX',
        amount: -35000.00,
        date: '2026-08-31'
      });
      expect(res.suggestedAccountId).toBe('7000-015');
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.badges.some(b => b.label.includes('Provisional Tax'))).toBe(true);
    });

    it('18. Strictly disallows operating expense accounts for SARS statutory payments', () => {
      const res = executeDetectiveEngine({
        description: 'SARS VAT201 PRN 1940000000000000000',
        amount: -5000.00,
        date: '2026-09-25'
      });
      expect(res.suggestedAccountId.startsWith('3000')).toBe(false);
      expect(res.suggestedAccountId.startsWith('5000')).toBe(false);
    });

    it('19. Strictly disallows input VAT deduction on SARS statutory tax settlements', () => {
      const res = executeDetectiveEngine({
        description: 'SARS EMP201 PAYMENT',
        amount: -12000.00,
        date: '2026-09-07'
      });
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.suggestedVatType).not.toBe('standard_rated_purchases');
    });
  });

  // ==========================================================================
  // CLUE 5: CROSS-REFERENCING (CLIENT HISTORICAL LEDGER MEMORY)
  // ==========================================================================
  describe('Clue 5: Cross-Referencing (Client Historical Ledger Memory)', () => {
    it('20. 100% consistent client history match triggers Past Ledger Consistency badge', () => {
      const context: DetectiveContext = {
        historicalTransactions: [
          {
            merchantKey: 'OFFICE DEPOT',
            description: 'OFFICE DEPOT STATIONERY',
            status: 'reviewed',
            allocatedTo: { value: '3000-036', type: 'account' },
            vatType: 'standard_rated_purchases'
          },
          {
            merchantKey: 'OFFICE DEPOT',
            description: 'OFFICE DEPOT SUPPLIES',
            status: 'reviewed',
            allocatedTo: { value: '3000-036', type: 'account' },
            vatType: 'standard_rated_purchases'
          }
        ]
      };

      const res = executeDetectiveEngine(
        {
          description: 'OFFICE DEPOT CAPE TOWN',
          amount: -1450.00,
          date: '2026-09-12',
          merchantKey: 'OFFICE DEPOT'
        },
        [],
        context
      );

      const crossRefBadge = res.badges.find(b => b.type === 'cross_ref');
      expect(crossRefBadge).toBeDefined();
      expect(crossRefBadge!.confidenceContribution).toBeGreaterThanOrEqual(40);
      expect(res.suggestedAccountId).toBe('3000-036');
    });
  });

  // ==========================================================================
  // CLUE 6: STATISTICAL SWEEPS (INTER-ACCOUNT TRANSFERS WITHIN 3 DAYS)
  // ==========================================================================
  describe('Clue 6: Statistical Sweeps (Inter-Account Transfers within 3 Days)', () => {
    it('21. Detects matching debit/credit contra transfer pair on same day (0 days)', () => {
      const tx1: DetectiveInputTransaction = {
        id: 't1',
        description: 'TRANSFER TO SAVINGS',
        amount: -50000.00,
        date: '2026-09-01',
        bankAccountId: 'acc_cheque'
      };
      const tx2: DetectiveInputTransaction = {
        id: 't2',
        description: 'TRANSFER FROM CHEQUE',
        amount: 50000.00,
        date: '2026-09-01',
        bankAccountId: 'acc_savings'
      };

      const res1 = executeDetectiveEngine(tx1, [tx1, tx2]);
      const res2 = executeDetectiveEngine(tx2, [tx1, tx2]);

      expect(res1.suggestedAccountId).toBe('9500-003');
      expect(res1.suggestedVatType).toBe('no_vat');
      expect(res1.badges.some(b => b.type === 'sweep')).toBe(true);

      expect(res2.suggestedAccountId).toBe('9500-003');
      expect(res2.suggestedVatType).toBe('no_vat');
      expect(res2.badges.some(b => b.type === 'sweep')).toBe(true);
    });

    it('22. Detects contra pair within 3 days', () => {
      const tx1: DetectiveInputTransaction = {
        id: 't1',
        description: 'SWEEP OUT',
        amount: -50000.00,
        date: '2026-09-01'
      };
      const tx2: DetectiveInputTransaction = {
        id: 't2',
        description: 'SWEEP IN',
        amount: 50000.00,
        date: '2026-09-04'
      };

      const res = executeDetectiveEngine(tx1, [tx1, tx2]);
      expect(res.suggestedAccountId).toBe('9500-003');
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.badges.some(b => b.type === 'sweep')).toBe(true);
    });

    it('23. Rejects contra pair exceeding 3 days (>72 hours)', () => {
      const tx1: DetectiveInputTransaction = {
        id: 't1',
        description: 'TRANSFER TO NOTICE',
        amount: -10000.00,
        date: '2026-09-01'
      };
      const tx2: DetectiveInputTransaction = {
        id: 't2',
        description: 'NOTICE DEPOSIT',
        amount: 10000.00,
        date: '2026-09-06'
      };

      const res = executeDetectiveEngine(tx1, [tx1, tx2]);
      expect(res.badges.some(b => b.type === 'sweep')).toBe(false);
    });

    it('24. Rejects contra pair with unequal amounts', () => {
      const tx1: DetectiveInputTransaction = {
        id: 't1',
        description: 'TRANSFER',
        amount: -50000.00,
        date: '2026-09-01'
      };
      const tx2: DetectiveInputTransaction = {
        id: 't2',
        description: 'TRANSFER',
        amount: 49950.00,
        date: '2026-09-02'
      };

      const res = executeDetectiveEngine(tx1, [tx1, tx2]);
      expect(res.badges.some(b => b.type === 'sweep')).toBe(false);
    });
  });

  // ==========================================================================
  // CLUE 7: DESCRIPTION STRUCTURE
  // ==========================================================================
  describe('Clue 7: Description Structure (VAT Numbers, Phone Numbers, Locators)', () => {
    it('25. Valid 10-digit SA VAT number triggers SA VAT Vendor structure badge', () => {
      const res = executeDetectiveEngine({
        description: 'OUTSURANCE VAT NO 4123456789',
        amount: -1150.00,
        date: '2026-09-12'
      });
      const vatBadge = res.badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
      expect(vatBadge).toBeDefined();
      expect(vatBadge!.detail).toContain('4123456789');
    });

    it('26. Valid phone number extracted triggers SA Contact Number badge', () => {
      const res = executeDetectiveEngine({
        description: 'VODACOM TEL 0115551234',
        amount: -799.00,
        date: '2026-09-12'
      });
      const phoneBadge = res.badges.find(b => b.type === 'structure' && b.label.includes('Contact'));
      expect(phoneBadge).toBeDefined();
    });
  });

  // ==========================================================================
  // CLUE 8: TIER 2 GROUNDED WEB RESEARCH
  // ==========================================================================
  describe('Clue 8: Tier 2 Grounded Web Research', () => {
    it('27. Web grounding incorporates CIPC and category into Web badge and GL account', () => {
      const webResult: WebGroundingResult = {
        merchantName: 'Engen Petroleum Limited',
        merchantCategory: 'Fuel Station',
        cipcRegistered: true,
        vatVendorStatus: 'registered',
        suggestedAccountId: '3000-033',
        suggestedVatType: 'zero_rated_purchases',
        confidence: 95,
        rationale: 'Engen service station providing commercial fuel products'
      };

      const res = executeDetectiveEngine(
        {
          description: 'ENGEN FOURWAYS GARAGE',
          amount: -850.00,
          date: '2026-09-12'
        },
        [],
        undefined,
        webResult
      );

      const webBadge = res.badges.find(b => b.type === 'web');
      expect(webBadge).toBeDefined();
      expect(webBadge!.label).toContain('Fuel Station');
      expect(res.suggestedAccountId).toBe('3000-033');
      expect(res.suggestedVatType).toBe('zero_rated_purchases');
    });
  });

  // ==========================================================================
  // CLUE 9: COMPOSITE CONFIDENCE, RULE SCOPING & DECISION ENGINE
  // ==========================================================================
  describe('Clue 9: Composite Confidence, Rule Scoping & Decision Engine', () => {
    it('28. Auto-allocates to "reviewed" when composite confidence >= 80%', () => {
      const res = executeDetectiveEngine({
        description: 'SARS VAT201 PRN 1940000000000000000',
        amount: -25000.00,
        date: '2026-09-25'
      });
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(80);
      expect(res.isAutoAllocatable).toBe(true);
      expect(res.status).toBe('reviewed');
    });

    it('29. Leaves low-confidence transactions (<80%) unallocated in "ai_review"', () => {
      const res = executeDetectiveEngine({
        description: 'UNKNOWN SUNDRY SPEND',
        amount: -42.15,
        date: '2026-09-14'
      });
      expect(res.compositeConfidence).toBeLessThan(80);
      expect(res.isAutoAllocatable).toBe(false);
      expect(res.status).toBe('ai_review');
    });

    it('30. Generates strictly ZERO automated client query cards for low-confidence items', () => {
      const res = executeDetectiveEngine({
        description: 'UNRECOGNIZED VENDOR',
        amount: -99.00,
        date: '2026-09-15'
      });
      expect(res.status).toBe('ai_review');
      expect((res as any).queryCard).toBeUndefined();
    });

    it('31. Scopes rule creation to "global_practice" for recognized national brands', () => {
      const res = executeDetectiveEngine({
        description: 'ENGEN WATERKLOOF',
        amount: -650.00,
        date: '2026-09-12'
      });
      expect(res.ruleScoping).toBe('global_practice');
    });

    it('32. Scopes rule creation to "client" for local or independent merchants', () => {
      const res = executeDetectiveEngine({
        description: 'JOE LOCAL PLUMBING SERVICES',
        amount: -2300.00,
        date: '2026-09-12'
      });
      expect(res.ruleScoping).toBe('client');
    });
  });

  // ==========================================================================
  // BATCH GROUP ANALYSIS (analyzeMerchantGroupDetective)
  // ==========================================================================
  describe('analyzeMerchantGroupDetective (Batch Group Analysis)', () => {
    it('analyzes group of transactions and detects recurring amounts across group', () => {
      const txs: DetectiveInputTransaction[] = [
        { id: '1', description: 'INTERNET FIBRE 1', amount: -899.00, date: '2026-07-02' },
        { id: '2', description: 'INTERNET FIBRE 2', amount: -899.00, date: '2026-08-02' },
        { id: '3', description: 'INTERNET FIBRE 3', amount: -899.00, date: '2026-09-02' }
      ];

      const res = analyzeMerchantGroupDetective('TELKOM FIBRE', txs);
      expect(res.badges.some(b => b.label.includes('Recurring'))).toBe(true);
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(70);
    });

    it('handles empty transaction list gracefully', () => {
      const res = analyzeMerchantGroupDetective('EMPTY GROUP', []);
      expect(res.compositeConfidence).toBe(0);
      expect(res.isAutoAllocatable).toBe(false);
      expect(res.status).toBe('ai_review');
    });

    it('respects client isVatRegistered: false setting by enforcing no_vat', () => {
      const context: DetectiveContext = {
        isVatRegistered: false
      };
      const res = executeDetectiveEngine(
        { description: 'COMMERCIAL OFFICE SUPPLIES', amount: -1150.00, date: '2026-09-02' },
        [],
        context
      );
      expect(res.suggestedVatType).toBe('no_vat');
    });

    it('allocates AIRTIME TOPUP directly to Telephone & Internet (3000-051) via Master Rules', () => {
      const res = executeDetectiveEngine({
        description: 'AIRTIME TOPUP 0821234567',
        amount: -150.00,
        date: '2026-09-15'
      });
      expect(res.suggestedAccountId).toBe('3000-051');
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(85);
      expect(res.isAutoAllocatable).toBe(true);
      expect(res.badges.some(b => b.label.includes('Practice Rule') || b.label.includes('Master Rule'))).toBe(true);
    });

    it('leaves suggestedAccountId empty and isAutoAllocatable false for unknown merchants without rules', () => {
      const res = executeDetectiveEngine({
        description: 'RANDOM OBSCURE UNKNOWN TRADER 998',
        amount: -250.00,
        date: '2026-09-15'
      });
      expect(res.suggestedAccountId).toBe('');
      expect(res.isAutoAllocatable).toBe(false);
      expect(res.status).toBe('ai_review');
    });
    it('allocates TRANSPORT * to Travel & Accommodation (3000-052) via Master Rules', () => {
      const res = executeDetectiveEngine({
        description: 'TRANSPORT PTA JUDO',
        amount: -450.00,
        date: '2026-09-15'
      });
      expect(res.suggestedAccountId).toBe('3000-052');
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(85);
      expect(res.isAutoAllocatable).toBe(true);
    });

    it('allocates WEBTICKETS to Entertainment Expenses (3000-020) via Master Rules', () => {
      const res = executeDetectiveEngine({
        description: 'WEBTICKETS JUDO TOURNAMENT',
        amount: -200.00,
        date: '2026-09-15'
      });
      expect(res.suggestedAccountId).toBe('3000-020');
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(85);
      expect(res.isAutoAllocatable).toBe(true);
    });

    it('allocates YALE SECURITY to Security/Alarm (3000-024) via Master Rules', () => {
      const res = executeDetectiveEngine({
        description: 'YALE SECURITY RANDB 00123',
        amount: -1500.00,
        date: '2026-09-15'
      });
      expect(res.suggestedAccountId).toBe('3000-024');
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(85);
      expect(res.isAutoAllocatable).toBe(true);
    });

    it('allocates COACHING to Cost of Sales (2000-000) via Master Rules', () => {
      const res = executeDetectiveEngine({
        description: 'WARDA COACHING JUDO',
        amount: -3000.00,
        date: '2026-09-15'
      });
      expect(res.suggestedAccountId).toBe('2000-000');
      expect(res.compositeConfidence).toBeGreaterThanOrEqual(85);
      expect(res.isAutoAllocatable).toBe(true);
    });
  });
});
