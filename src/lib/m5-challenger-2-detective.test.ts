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
  parseDateParts,
  DetectiveInputTransaction,
  DetectiveContext,
  WebGroundingResult
} from './detective-engine';
import { normalizeVatType, CANONICAL_VAT_TYPES } from './vat-types';

describe('Milestone 5 Challenger #2: Adversarial Stress Test Suite for 9-Clue Detective Engine', () => {

  // ============================================================================
  // 1. CORNER CASES: CORRUPT, MALFORMED & UNEXPECTED DATA
  // ============================================================================
  describe('1. Corrupt & Malformed Data Corner Cases', () => {

    describe('1.1 Date Parsing & Malformed Dates', () => {
      it('handles empty string date without throwing and returns day=0', () => {
        const parts = parseDateParts('');
        expect(parts).toEqual({ day: 0, month: 0, year: 0 });

        const badges = evaluateTimingClue('', 'SALARIES STAFF');
        expect(badges).toHaveLength(0);
      });

      it('handles undefined date in executeDetectiveEngine gracefully', () => {
        const res = executeDetectiveEngine({
          description: 'EXPENSE ITEM',
          amount: -500,
          date: undefined as any
        });
        expect(res.badges.filter(b => b.type === 'timing')).toHaveLength(0);
        expect(Number.isNaN(res.compositeConfidence)).toBe(false);
      });

      it('handles completely malformed non-date strings without throwing', () => {
        const res = executeDetectiveEngine({
          description: 'OFFICE SUPPLIES',
          amount: -250,
          date: 'NOT_A_VALID_DATE_AT_ALL'
        });
        expect(res.badges.filter(b => b.type === 'timing')).toHaveLength(0);
        expect(Number.isNaN(res.compositeConfidence)).toBe(false);
      });

      it('handles impossible calendar dates like 2026-99-99 safely', () => {
        const parts = parseDateParts('2026-99-99');
        expect(parts.year).toBe(2026);
        expect(parts.month).toBe(99);
        expect(parts.day).toBe(99);

        // Day 99 should not trigger 25-31 payroll or 1-7 start-of-month windows
        const badges = evaluateTimingClue('2026-99-99', 'SALARIES STAFF');
        expect(badges).toHaveLength(0);
      });
    });

    describe('1.2 Corrupt, Malformed & Edge Amounts', () => {
      it('handles zero amount (0 and -0) cleanly without false VAT math or drawings', () => {
        const res = executeDetectiveEngine({
          description: 'ZERO DOLLAR TX',
          amount: 0,
          date: '2026-09-15'
        });
        expect(res.badges.some(b => b.type === 'amount')).toBe(false);
        expect(res.compositeConfidence).toBeLessThan(80);
      });

      it('handles negative zero (-0) cleanly', () => {
        const res = executeDetectiveEngine({
          description: 'NEGATIVE ZERO TX',
          amount: -0,
          date: '2026-09-15'
        });
        expect(res.badges.some(b => b.type === 'amount')).toBe(false);
      });

      it('handles NaN amount in evaluateAmountClue without throwing', () => {
        const res = evaluateAmountClue(NaN, 'DIRECTOR DRAWINGS');
        expect(res.badges).toHaveLength(0);
        expect(res.suggestedAccountId).toBeUndefined();
      });

      it('evaluates behavior of NaN amount in statistical sweeps', () => {
        const tx1: DetectiveInputTransaction = {
          id: 'nan-tx',
          description: 'UNKNOWN GLITCH',
          amount: NaN,
          date: '2026-09-01'
        };
        const tx2: DetectiveInputTransaction = {
          id: 'valid-tx',
          description: 'PAYMENT',
          amount: 500,
          date: '2026-09-01'
        };

        const sweepResult = evaluateStatisticalSweepClue(tx1, [tx1, tx2]);
        // Empirical observation: In JavaScript, Math.abs(NaN + 500) >= 0.01 evaluates to false.
        // We verify that whether it matches or not, executeDetectiveEngine handles compositeConfidence as a valid finite number.
        const engineRes = executeDetectiveEngine(tx1, [tx1, tx2]);
        expect(Number.isFinite(engineRes.compositeConfidence)).toBe(true);
      });

      it('handles Infinity and -Infinity without crashing', () => {
        const res = executeDetectiveEngine({
          description: 'MASSIVE OUTLIER',
          amount: Infinity,
          date: '2026-09-15'
        });
        expect(Number.isFinite(res.compositeConfidence)).toBe(true);
      });

      it('handles very small micro-cents (0.001) without false 15% VAT match', () => {
        const res = executeDetectiveEngine({
          description: 'MICRO CENT CHARGE',
          amount: -0.001,
          date: '2026-09-15'
        });
        expect(res.badges.some(b => b.label.includes('15% VAT'))).toBe(false);
      });
    });

    describe('1.3 Missing Fields & Extreme Inputs', () => {
      it('handles undefined description gracefully (defaults to UNKNOWN)', () => {
        const res = executeDetectiveEngine({
          description: undefined as any,
          amount: -500,
          date: '2026-09-10'
        });
        expect(res.cleanDescription).toBe('UNKNOWN');
        expect(res.merchantKey).toBeDefined();
        expect(res.compositeConfidence).toBeGreaterThanOrEqual(0);
      });

      it('handles empty string description gracefully', () => {
        const res = executeDetectiveEngine({
          description: '',
          amount: -120,
          date: '2026-09-10'
        });
        expect(res.cleanDescription).toBe('UNKNOWN');
        expect(res.compositeConfidence).toBeLessThan(80);
        expect(res.status).toBe('ai_review');
      });

      it('handles missing structuralClues and context fields cleanly', () => {
        const res = executeDetectiveEngine({
          description: 'NORMAL EXPENSE',
          amount: -300,
          date: '2026-09-10'
        });
        expect(res.badges).toBeDefined();
        expect(Array.isArray(res.badges)).toBe(true);
      });

      it('handles empty batch array in analyzeMerchantGroupDetective', () => {
        const res = analyzeMerchantGroupDetective('EMPTY_KEY', []);
        expect(res.compositeConfidence).toBe(0);
        expect(res.isAutoAllocatable).toBe(false);
        expect(res.status).toBe('ai_review');
      });

      it('handles batch array with empty transactions', () => {
        const res = analyzeMerchantGroupDetective('SINGLE_EMPTY_KEY', [
          { description: '', amount: 0, date: '' }
        ]);
        expect(res.compositeConfidence).toBeLessThan(80);
        expect(res.isAutoAllocatable).toBe(false);
      });
    });
  });

  // ============================================================================
  // 2. CROSS-REFERENCING: 100% CONSISTENCY VS CONFLICTING RECORDS
  // ============================================================================
  describe('2. Historical Ledger Cross-Referencing & Consistency Guardrails', () => {

    it('rejects conflicting historical allocations for the same merchant (50/50 split)', () => {
      const context: DetectiveContext = {
        historicalTransactions: [
          {
            merchantKey: 'SUPPLIER XYZ',
            description: 'SUPPLIER XYZ ORDER 1',
            allocatedTo: { value: '3000-001', type: 'account' },
            vatType: 'standard_rated_purchases',
            status: 'reviewed'
          },
          {
            merchantKey: 'SUPPLIER XYZ',
            description: 'SUPPLIER XYZ ORDER 2',
            allocatedTo: { value: '3000-002', type: 'account' }, // CONFLICT!
            vatType: 'standard_rated_purchases',
            status: 'reviewed'
          }
        ]
      };

      const result = evaluateCrossReferenceClue('SUPPLIER XYZ', 'SUPPLIER XYZ', context.historicalTransactions);
      expect(result.badge).toBeNull();
      expect(result.suggestedAccountId).toBeUndefined();
    });

    it('rejects 99% consistency: 99 matching vs 1 conflicting historical record', () => {
      const history: DetectiveContext['historicalTransactions'] = [];
      for (let i = 0; i < 99; i++) {
        history.push({
          merchantKey: 'ACME TOOLS',
          description: `ACME TOOLS PURCHASE ${i}`,
          allocatedTo: { value: '3000-025', type: 'account' },
          vatType: 'standard_rated_purchases',
          status: 'reviewed'
        });
      }
      // The 1 conflicting record
      history.push({
        merchantKey: 'ACME TOOLS',
        description: 'ACME TOOLS MISALLOCATED',
        allocatedTo: { value: '3000-099', type: 'account' },
        vatType: 'standard_rated_purchases',
        status: 'reviewed'
      });

      const result = evaluateCrossReferenceClue('ACME TOOLS', 'ACME TOOLS', history);
      // Strictly rejected: must be 100% consistent!
      expect(result.badge).toBeNull();
      expect(result.suggestedAccountId).toBeUndefined();
    });

    it('ignores unreviewed historical records (status: "new" or "ai_review")', () => {
      const context: DetectiveContext = {
        historicalTransactions: [
          {
            merchantKey: 'BETA TRADERS',
            description: 'BETA TRADERS',
            allocatedTo: { value: '3000-010', type: 'account' },
            vatType: 'standard_rated_purchases',
            status: 'new' // NOT reviewed or allocated!
          },
          {
            merchantKey: 'BETA TRADERS',
            description: 'BETA TRADERS',
            allocatedTo: { value: '3000-010', type: 'account' },
            vatType: 'standard_rated_purchases',
            status: 'ai_review' // NOT reviewed or allocated!
          }
        ]
      };

      const result = evaluateCrossReferenceClue('BETA TRADERS', 'BETA TRADERS', context.historicalTransactions);
      expect(result.badge).toBeNull();
    });

    it('accepts 100% consistent history with 1 reviewed transaction', () => {
      const context: DetectiveContext = {
        historicalTransactions: [
          {
            merchantKey: 'GAMMA CONSULTING',
            description: 'GAMMA CONSULTING RETAINER',
            allocatedTo: { value: '3000-040', type: 'account' },
            vatType: 'standard_rated_purchases',
            status: 'reviewed'
          }
        ]
      };

      const result = evaluateCrossReferenceClue('GAMMA CONSULTING', 'GAMMA CONSULTING', context.historicalTransactions);
      expect(result.badge).not.toBeNull();
      expect(result.badge!.confidenceContribution).toBe(40);
      expect(result.suggestedAccountId).toBe('3000-040');
      expect(result.suggestedVatType).toBe('standard_rated_purchases');
    });

    it('accepts 100% consistent history with status: "allocated"', () => {
      const context: DetectiveContext = {
        historicalTransactions: [
          {
            merchantKey: 'DELTA MEDIA',
            description: 'DELTA MEDIA ADS',
            allocatedTo: { value: '3000-050', type: 'account' },
            vatType: 'standard_rated_purchases',
            status: 'allocated'
          },
          {
            merchantKey: 'DELTA MEDIA',
            description: 'DELTA MEDIA CAMPAIGN',
            allocatedTo: { value: '3000-050', type: 'account' },
            vatType: 'standard_rated_purchases',
            status: 'allocated'
          }
        ]
      };

      const result = evaluateCrossReferenceClue('DELTA MEDIA', 'DELTA MEDIA', context.historicalTransactions);
      expect(result.badge).not.toBeNull();
      expect(result.suggestedAccountId).toBe('3000-050');
    });

    it('safely handles empty history array or undefined history', () => {
      expect(evaluateCrossReferenceClue('MKT', 'MKT', []).badge).toBeNull();
      expect(evaluateCrossReferenceClue('MKT', 'MKT', undefined).badge).toBeNull();
    });
  });

  // ============================================================================
  // 3. STRUCTURAL CLUES (VAT NUMBERS, PHONES, STORE LOCATORS)
  // ============================================================================
  describe('3. Structural Clue Validation (VAT, Phone, Store Locators)', () => {

    describe('3.1 South African 10-Digit VAT Numbers (Strict Prefix 4 & 10 Digits)', () => {
      it('accepts valid 10-digit VAT starting with 4', () => {
        const badges = evaluateStructureClues({ vatNumber: '4012345678' });
        const vatBadge = badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
        expect(vatBadge).toBeDefined();
        expect(vatBadge!.confidenceContribution).toBe(20);
        expect(vatBadge!.detail).toContain('4012345678');
      });

      it('extracts valid 10-digit VAT from raw description starting with 4', () => {
        const badges = evaluateStructureClues(undefined, 'SUPPLIER TAX INVOICE VAT 4987654321');
        const vatBadge = badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
        expect(vatBadge).toBeDefined();
        expect(vatBadge!.detail).toContain('4987654321');
      });

      it('REJECTS 10-digit number starting with 5 (not an SA VAT number)', () => {
        const badges = evaluateStructureClues({ vatNumber: '5012345678' });
        const vatBadge = badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
        expect(vatBadge).toBeUndefined();
      });

      it('REJECTS 10-digit number starting with 1 (not an SA VAT number)', () => {
        const badges = evaluateStructureClues({ vatNumber: '1012345678' });
        const vatBadge = badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
        expect(vatBadge).toBeUndefined();
      });

      it('REJECTS 10-digit number starting with 9 (not an SA VAT number)', () => {
        const badges = evaluateStructureClues({ vatNumber: '9012345678' });
        const vatBadge = badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
        expect(vatBadge).toBeUndefined();
      });

      it('REJECTS 9-digit number starting with 4 (too short)', () => {
        const badges = evaluateStructureClues({ vatNumber: '401234567' });
        const vatBadge = badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
        expect(vatBadge).toBeUndefined();
      });

      it('REJECTS 11-digit number starting with 4 (too long)', () => {
        const badges = evaluateStructureClues({ vatNumber: '40123456789' });
        const vatBadge = badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
        expect(vatBadge).toBeUndefined();
      });

      it('REJECTS alphanumeric string containing letters in raw description regex', () => {
        // From description, regex (4\d{9}) enforces 4 followed by exactly 9 digits
        const badges = evaluateStructureClues(undefined, 'VAT 401234ABCD');
        const vatBadge = badges.find(b => b.type === 'structure' && b.label.includes('VAT'));
        expect(vatBadge).toBeUndefined();
      });
    });

    describe('3.2 Phone Numbers & Branch Locators', () => {
      it('accepts valid SA landline (011xxxxxxx) and mobile (082xxxxxxx)', () => {
        const badges1 = evaluateStructureClues({ phoneNumber: '0115551234' });
        expect(badges1.some(b => b.label.includes('Contact'))).toBe(true);

        const badges2 = evaluateStructureClues({ phoneNumber: '0821234567' });
        expect(badges2.some(b => b.label.includes('Contact'))).toBe(true);
      });

      it('rejects too short phone numbers (e.g. 5 digits) from raw description', () => {
        const badges = evaluateStructureClues(undefined, 'CONTACT TEL 12345');
        const phoneBadge = badges.find(b => b.label.includes('Contact'));
        expect(phoneBadge).toBeUndefined();
      });

      it('extracts branch locator code like #4221', () => {
        const badges = evaluateStructureClues({ branchLocator: '4221' });
        const branchBadge = badges.find(b => b.label.includes('Branch Code'));
        expect(branchBadge).toBeDefined();
        expect(branchBadge!.detail).toContain('4221');
      });

      it('handles empty structuralClues object without emitting any badges', () => {
        const badges = evaluateStructureClues({});
        expect(badges).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // 4. WEB GROUNDING INTEGRATION & FALLBACK MECHANISMS
  // ============================================================================
  describe('4. Web Grounding Integration & Fallback Mechanisms', () => {

    it('falls back seamlessly to local heuristics when webResult is undefined or null', () => {
      const res = executeDetectiveEngine(
        {
          description: 'SALARIES STAFF BATCH',
          amount: -45000.00,
          date: '2026-09-25'
        },
        [],
        undefined,
        undefined
      );
      expect(res.badges.some(b => b.type === 'web')).toBe(false);
      expect(res.badges.some(b => b.type === 'timing')).toBe(true);
    });

    it('ignores webResult with confidence 0 or empty merchant details', () => {
      const emptyWebResult: WebGroundingResult = {
        confidence: 0,
        merchantName: '',
        merchantCategory: ''
      };

      const res = executeDetectiveEngine(
        {
          description: 'SOME EXPENSE',
          amount: -200,
          date: '2026-09-10'
        },
        [],
        undefined,
        emptyWebResult
      );

      expect(res.badges.some(b => b.type === 'web')).toBe(false);
    });

    it('caps web confidence contribution at 40 points', () => {
      const highConfWeb: WebGroundingResult = {
        merchantName: 'Super Merchant',
        merchantCategory: 'Retail',
        confidence: 100, // 100 * 0.4 = 40
        suggestedAccountId: '3000-020'
      };

      const badgeRes = evaluateWebGroundingClue(highConfWeb);
      expect(badgeRes.badge).not.toBeNull();
      expect(badgeRes.badge!.confidenceContribution).toBe(40);
    });

    it('safely handles non-numeric confidence in WebGroundingResult (defaults to 80 -> 32 pts)', () => {
      const weirdWeb: WebGroundingResult = {
        merchantName: 'Unrated Merchant',
        merchantCategory: 'Hardware',
        confidence: undefined
      };

      const badgeRes = evaluateWebGroundingClue(weirdWeb);
      expect(badgeRes.badge).not.toBeNull();
      expect(badgeRes.badge!.confidenceContribution).toBe(32);
    });

    describe('4.1 Canonical VAT Type Normalization (normalizeVatType)', () => {
      it('preserves all 8 canonical VAT types unchanged', () => {
        for (const type of CANONICAL_VAT_TYPES) {
          expect(normalizeVatType(type, true)).toBe(type);
          expect(normalizeVatType(type, false)).toBe(type);
        }
      });

      it('normalizes informal "standard" / "15%" strings to canonical types', () => {
        expect(normalizeVatType('standard', true)).toBe('standard_rated_purchases');
        expect(normalizeVatType('standard', false)).toBe('standard_rated_sales');
        expect(normalizeVatType('15%', true)).toBe('standard_rated_purchases');
        expect(normalizeVatType('15% VAT', false)).toBe('standard_rated_sales');
      });

      it('normalizes informal "zero" strings to canonical types', () => {
        expect(normalizeVatType('zero_rated', true)).toBe('zero_rated_purchases');
        expect(normalizeVatType('zero rated', false)).toBe('zero_rated_sales');
      });

      it('normalizes informal "exempt" strings to canonical types', () => {
        expect(normalizeVatType('exempt', true)).toBe('exempt_purchases');
        expect(normalizeVatType('exempt', false)).toBe('exempt_sales');
      });

      it('normalizes informal "capital" strings to capital_goods_purchases', () => {
        expect(normalizeVatType('capital goods', true)).toBe('capital_goods_purchases');
      });

      it('defaults undefined, empty, or unknown strings to "no_vat"', () => {
        expect(normalizeVatType(undefined)).toBe('no_vat');
        expect(normalizeVatType('')).toBe('no_vat');
        expect(normalizeVatType('unrecognized_string')).toBe('no_vat');
      });
    });
  });

  // ============================================================================
  // 5. STATUTORY INVARIANTS & ACCOUNTING DEFENSES
  // ============================================================================
  describe('5. Statutory Invariants & Accounting Defenses', () => {

    it('SARS Invariant: VAT201 PRN overrides any conflicting web recommendation to 7000-008 with no_vat', () => {
      // Adversarial scenario: Web grounding erroneously classified SARS as software with standard VAT!
      const deceptiveWebResult: WebGroundingResult = {
        merchantName: 'SARS eFiling',
        merchantCategory: 'Software Subscription',
        suggestedAccountId: '3000-045', // Operating expense!
        suggestedVatType: 'standard_rated_purchases', // Input VAT claim!
        confidence: 90
      };

      const res = executeDetectiveEngine(
        {
          description: 'SARS VAT201 PRN 1940012345678901234',
          amount: -35000.00,
          date: '2026-09-25'
        },
        [],
        undefined,
        deceptiveWebResult
      );

      // SARS statutory invariant MUST override web hallucination
      expect(res.suggestedAccountId).toBe('7000-008');
      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.suggestedVatType).not.toBe('standard_rated_purchases');
    });

    it('SARS Invariant: EMP201 PRN overrides conflicting operating expense to 7000-011 with no_vat', () => {
      const deceptiveWebResult: WebGroundingResult = {
        merchantName: 'SARS PAYE',
        merchantCategory: 'Professional Fees',
        suggestedAccountId: '3000-010',
        suggestedVatType: 'standard_rated_purchases',
        confidence: 95
      };

      const res = executeDetectiveEngine(
        {
          description: 'SARS EMP201 PRN 1950012345678901234',
          amount: -18000.00,
          date: '2026-09-07'
        },
        [],
        undefined,
        deceptiveWebResult
      );

      expect(res.suggestedAccountId).toBe('7000-011');
      expect(res.suggestedVatType).toBe('no_vat');
    });

    it('SARS Invariant: Provisional Tax overrides operating expense to 7000-015 with no_vat', () => {
      const res = executeDetectiveEngine({
        description: 'SARSEFLNG 9876543210 PROV TAX',
        amount: -55000.00,
        date: '2026-08-31'
      });

      expect(res.suggestedAccountId).toBe('7000-015');
      expect(res.suggestedVatType).toBe('no_vat');
    });

    it('Non-VAT Registered Client Invariant: Enforces no_vat even for 15% standard factor amounts', () => {
      const context: DetectiveContext = {
        isVatRegistered: false
      };

      const res = executeDetectiveEngine(
        {
          description: 'MAKRO COMMERCIAL INVOICE',
          amount: -1150.00, // Exactly 15% VAT factor
          date: '2026-09-12'
        },
        [],
        context
      );

      expect(res.suggestedVatType).toBe('no_vat');
      expect(res.suggestedVatType).not.toBe('standard_rated_purchases');
    });

    describe('5.1 Inter-Account Sweeps (Statistical Contra Pairs)', () => {
      it('pairs contra transfers within 3-day window and allocates to 9500-003 with no_vat', () => {
        const tx1: DetectiveInputTransaction = {
          id: 'out-1',
          description: 'SWEEP TO MONEY MARKET',
          amount: -75000.00,
          date: '2026-09-01'
        };
        const tx2: DetectiveInputTransaction = {
          id: 'in-1',
          description: 'SWEEP FROM CURRENT',
          amount: 75000.00,
          date: '2026-09-03' // 2 days difference (<= 3 days)
        };

        const res1 = executeDetectiveEngine(tx1, [tx1, tx2]);
        const res2 = executeDetectiveEngine(tx2, [tx1, tx2]);

        expect(res1.isInterAccountSweep).toBe(true);
        expect(res1.suggestedAccountId).toBe('9500-003');
        expect(res1.suggestedVatType).toBe('no_vat');
        expect(res1.compositeConfidence).toBeGreaterThanOrEqual(85);

        expect(res2.isInterAccountSweep).toBe(true);
        expect(res2.suggestedAccountId).toBe('9500-003');
        expect(res2.suggestedVatType).toBe('no_vat');
        expect(res2.compositeConfidence).toBeGreaterThanOrEqual(85);
      });

      it('rejects contra transfers exceeding 3-day window (e.g. 5 days)', () => {
        const tx1: DetectiveInputTransaction = {
          id: 'out-1',
          description: 'TRANSFER TO SAVINGS',
          amount: -25000.00,
          date: '2026-09-01'
        };
        const tx2: DetectiveInputTransaction = {
          id: 'in-1',
          description: 'SAVINGS DEPOSIT',
          amount: 25000.00,
          date: '2026-09-06' // 5 days difference (> 3 days)
        };

        const res = executeDetectiveEngine(tx1, [tx1, tx2]);
        expect(res.isInterAccountSweep).toBe(false);
        expect(res.badges.some(b => b.type === 'sweep')).toBe(false);
      });

      it('rejects contra transfers with unequal amounts (-10000 vs +9990)', () => {
        const tx1: DetectiveInputTransaction = {
          id: 'out-1',
          description: 'TRANSFER',
          amount: -10000.00,
          date: '2026-09-01'
        };
        const tx2: DetectiveInputTransaction = {
          id: 'in-1',
          description: 'TRANSFER',
          amount: 9990.00, // Unequal!
          date: '2026-09-01'
        };

        const res = executeDetectiveEngine(tx1, [tx1, tx2]);
        expect(res.isInterAccountSweep).toBe(false);
      });

      it('prevents self-pairing when two transactions have the same id', () => {
        const tx1: DetectiveInputTransaction = {
          id: 'same-id',
          description: 'GLITCHED SELF TRANSFER',
          amount: 0,
          date: '2026-09-01'
        };

        const res = executeDetectiveEngine(tx1, [tx1]);
        expect(res.isInterAccountSweep).toBe(false);
      });
    });

    describe('5.2 Auto-Allocation Thresholds & Query Card Suppression', () => {
      it('auto-allocates when compositeConfidence >= 80% (status: "reviewed", isAutoAllocatable: true)', () => {
        const res = executeDetectiveEngine({
          description: 'SARS VAT201 PRN 1940000000000000000',
          amount: -15000.00,
          date: '2026-09-25'
        });

        expect(res.compositeConfidence).toBeGreaterThanOrEqual(80);
        expect(res.isAutoAllocatable).toBe(true);
        expect(res.status).toBe('reviewed');
      });

      it('stages in "ai_review" when compositeConfidence < 80% with zero automated query cards', () => {
        const res = executeDetectiveEngine({
          description: 'RANDOM CORNER CAFE',
          amount: -65.50,
          date: '2026-09-14'
        });

        expect(res.compositeConfidence).toBeLessThan(80);
        expect(res.isAutoAllocatable).toBe(false);
        expect(res.status).toBe('ai_review');

        // Gating invariant: strictly ZERO automated client query cards
        expect((res as any).queryCard).toBeUndefined();
        expect((res as any).clientQuery).toBeUndefined();
      });

      it('scopes national root brands to "global_practice"', () => {
        const brands = ['ENGEN PETROLEUM', 'WOOLWORTHS FOOD', 'SHELL GARAGE', 'SASOL OIL', 'CHECKERS HYPER'];
        for (const brand of brands) {
          const res = executeDetectiveEngine({
            description: brand,
            amount: -500.00,
            date: '2026-09-10'
          });
          expect(res.ruleScoping).toBe('global_practice');
        }
      });

      it('scopes local or independent merchants to "client"', () => {
        const locals = ['JOE PLUMBING SERVICES', 'MAMA MIA BAKERY CC', 'SMITH LEGAL CHAMBERS'];
        for (const local of locals) {
          const res = executeDetectiveEngine({
            description: local,
            amount: -1500.00,
            date: '2026-09-10'
          });
          expect(res.ruleScoping).toBe('client');
        }
      });
    });
  });
});
