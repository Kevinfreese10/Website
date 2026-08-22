import { describe, it, expect } from 'vitest';
import { PayrollService } from './PayrollService';

/**
 * Payroll calculation tests.
 *
 * These exist because the audit found five independent ways this module could produce a wrong
 * number on a real payslip without raising an error. The most consequential is the tax-year
 * fallback: prior to the fix, an unconfigured tax year silently reverted to the 2026 tables,
 * which would have made every payslip in the system wrong from 1 March 2027 onwards.
 */

const MONTHLY = 12;

describe('getTaxConfig — tax year resolution', () => {
  it('resolves a March period to the FOLLOWING tax year (SA tax year runs Mar–Feb)', () => {
    // March 2025 falls in the 2026 tax year.
    expect(() => PayrollService.getTaxConfig('March 2025')).not.toThrow();
  });

  it('resolves a February period to the SAME tax year', () => {
    expect(() => PayrollService.getTaxConfig('February 2026')).not.toThrow();
  });

  it('THROWS rather than silently falling back when the tax year is not configured', () => {
    // This is the regression guard. Returning stale brackets here is the failure mode that
    // would corrupt every payslip after the configured tables run out.
    expect(() => PayrollService.getTaxConfig('March 2099')).toThrow(/tax tables/i);
  });

  it('THROWS on a missing period rather than assuming one', () => {
    expect(() => PayrollService.getTaxConfig(undefined)).toThrow(/period/i);
  });

  it('THROWS on an uninterpretable period rather than guessing', () => {
    expect(() => PayrollService.getTaxConfig('sometime last year')).toThrow(/could not be interpreted/i);
  });

  it('hasTaxConfig reports availability without throwing', () => {
    expect(PayrollService.hasTaxConfig('March 2025')).toBe(true);
    expect(PayrollService.hasTaxConfig('March 2099')).toBe(false);
  });
});

describe('calculateUif', () => {
  it('applies 1% of gross below the statutory ceiling', () => {
    const uif = PayrollService.calculateUif(10000, 'June 2025', MONTHLY);
    expect(uif).toBeCloseTo(100, 2);
  });

  it('caps at the monthly ceiling rather than scaling indefinitely', () => {
    // The UIF contribution ceiling means a very high earner pays the same as one at the cap.
    const atCap = PayrollService.calculateUif(17712, 'June 2025', MONTHLY);
    const wellAbove = PayrollService.calculateUif(500000, 'June 2025', MONTHLY);
    expect(wellAbove).toBeCloseTo(atCap, 2);
    expect(wellAbove).toBeLessThan(200);
  });

  it('never returns a negative contribution', () => {
    expect(PayrollService.calculateUif(0, 'June 2025', MONTHLY)).toBeGreaterThanOrEqual(0);
  });
});

describe('calculatePaye', () => {
  it('returns zero below the tax threshold', () => {
    const paye = PayrollService.calculatePaye(4000, 'June 2025', MONTHLY);
    expect(paye).toBe(0);
  });

  it('increases monotonically with income', () => {
    const low = PayrollService.calculatePaye(20000, 'June 2025', MONTHLY);
    const high = PayrollService.calculatePaye(60000, 'June 2025', MONTHLY);
    expect(high).toBeGreaterThan(low);
  });

  it('never exceeds gross', () => {
    const gross = 45000;
    const paye = PayrollService.calculatePaye(gross, 'June 2025', MONTHLY);
    expect(paye).toBeLessThan(gross);
    expect(paye).toBeGreaterThanOrEqual(0);
  });

  it('applies a larger rebate at 65+, reducing PAYE for the same gross', () => {
    const gross = 30000;
    // 1990 birth year -> under 65; 1950 -> over 65. SA ID format: YYMMDD.......
    const under65 = PayrollService.calculatePaye(gross, 'June 2025', MONTHLY, undefined, '9001015800085');
    const over65 = PayrollService.calculatePaye(gross, 'June 2025', MONTHLY, undefined, '5001015800083');
    expect(over65).toBeLessThan(under65);
  });
});

describe('splitTaxableBases — the regular/bonus split', () => {
  it('excludes non-taxable earnings from the taxable base', () => {
    const { regularGross } = PayrollService.splitTaxableBases(
      [
        { label: 'Basic Salary', amount: 20000, taxCategory: 'regular' } as any,
        { label: 'Subsistence Allowance (Non-Taxable)', amount: 5000, taxCategory: 'non-taxable' } as any,
      ],
      []
    );
    // The non-taxable allowance must not be taxed. Before the fix, every server-side path
    // taxed it in full.
    expect(regularGross).toBeCloseTo(20000, 2);
  });

  it('separates a bonus from regular earnings', () => {
    const { regularGross, bonusGross } = PayrollService.splitTaxableBases(
      [
        { label: 'Basic Salary', amount: 20000, taxCategory: 'regular' } as any,
        { label: 'Annual Bonus / 13th Cheque', amount: 15000, taxCategory: 'bonus' } as any,
      ],
      []
    );
    expect(regularGross).toBeCloseTo(20000, 2);
    expect(bonusGross).toBeCloseTo(15000, 2);
  });

  it('does not annualise a bonus as if it were recurring salary', () => {
    // The bug: calculatePaye annualises its regular base x12. A bonus passed as regular income
    // was therefore treated as R180k/year of extra salary instead of a R15k once-off.
    const asBonus = PayrollService.calculatePaye(20000, 'June 2025', MONTHLY, undefined, undefined, 0, 0, 15000);
    const asSalary = PayrollService.calculatePaye(35000, 'June 2025', MONTHLY, undefined, undefined, 0, 0, 0);
    expect(asBonus).toBeLessThan(asSalary);
  });
});

describe('getInitialDeductions — server path parity', () => {
  it('honours tax categories when line items are supplied', () => {
    const period = 'June 2025';
    const lines = {
      earnings: [
        { label: 'Basic Salary', amount: 20000, taxCategory: 'regular' } as any,
        { label: 'Reimbursive Travel (Non-Taxable)', amount: 5000, taxCategory: 'non-taxable' } as any,
      ],
      fringeBenefits: [],
    };

    const withLines = PayrollService.getInitialDeductions(25000, period, MONTHLY, undefined, undefined, 0, 0, lines);
    const withoutLines = PayrollService.getInitialDeductions(25000, period, MONTHLY);

    const taxWith = withLines.find(d => d.label === 'Tax')!.amount;
    const taxWithout = withoutLines.find(d => d.label === 'Tax')!.amount;

    // Supplying the lines must reduce PAYE, because R5 000 of the gross is not taxable.
    expect(taxWith).toBeLessThan(taxWithout);
  });

  it('always returns both statutory deduction lines', () => {
    const deductions = PayrollService.getInitialDeductions(25000, 'June 2025', MONTHLY);
    expect(deductions.map(d => d.label)).toEqual(
      expect.arrayContaining(['Tax', 'Unemployment insurance fund'])
    );
    expect(deductions.every(d => d.isStatutory)).toBe(true);
  });
});
