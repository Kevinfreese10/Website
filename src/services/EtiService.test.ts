import { describe, it, expect } from 'vitest';
import { EtiService } from './EtiService';
import type { Employee } from '@/lib/types';

/**
 * ETI tests.
 *
 * The qualifying rules and calculation mechanics are deterministic, so they are tested properly
 * here. The monetary bands are unverified by design (see EtiService), and the guard preventing an
 * unverified band set from producing a claim is itself tested — that guard is what stops an
 * unconfirmed figure reaching a SARS submission.
 */

const PERIOD = new Date('2025-06-30');

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    // 2000-01-01 born -> 25 in June 2025, inside the 18–29 window.
    idNumber: '0001015800086',
    joinDate: new Date('2024-01-15'),
    name: 'Test',
    surname: 'Employee',
    ...overrides,
  } as Employee;
}

describe('assessQualification', () => {
  it('qualifies a 25-year-old employed after Oct 2013 with months remaining', () => {
    const q = EtiService.assessQualification(employee(), PERIOD, 0);
    expect(q.qualifies).toBe(true);
    expect(q.tier).toBe(1);
    expect(q.reasons).toEqual([]);
  });

  it('moves to tier 2 after 12 claimed months', () => {
    expect(EtiService.assessQualification(employee(), PERIOD, 12).tier).toBe(2);
    expect(EtiService.assessQualification(employee(), PERIOD, 23).tier).toBe(2);
  });

  it('stops qualifying once the 24-month cap is reached', () => {
    const q = EtiService.assessQualification(employee(), PERIOD, 24);
    expect(q.qualifies).toBe(false);
    expect(q.tier).toBeNull();
    expect(q.reasons.join(' ')).toMatch(/24-month/);
  });

  it('rejects an employee outside the 18–29 age window', () => {
    // Born 1970 -> 55 in 2025.
    const q = EtiService.assessQualification(employee({ idNumber: '7001015800088' }), PERIOD, 0);
    expect(q.qualifies).toBe(false);
    expect(q.reasons.join(' ')).toMatch(/ages 18/);
  });

  it('rejects employment that started before 1 October 2013', () => {
    const q = EtiService.assessQualification(employee({ joinDate: new Date('2012-05-01') }), PERIOD, 0);
    expect(q.qualifies).toBe(false);
    expect(q.reasons.join(' ')).toMatch(/before 1 October 2013/);
  });

  it('treats a missing ID number as a disqualification, not an assumption in the employer\'s favour', () => {
    const q = EtiService.assessQualification(employee({ idNumber: '' }), PERIOD, 0);
    expect(q.qualifies).toBe(false);
    expect(q.reasons.join(' ')).toMatch(/No ID number/);
  });

  it('treats a missing start date as a disqualification', () => {
    const q = EtiService.assessQualification(employee({ joinDate: undefined }), PERIOD, 0);
    expect(q.qualifies).toBe(false);
    expect(q.reasons.join(' ')).toMatch(/employment start date/);
  });
});

describe('calculateEti — the unverified-bands guard', () => {
  it('refuses to produce a claim while the band set is unverified', () => {
    const r = EtiService.calculateEti({ employee: employee(), remuneration: 4000, periodDate: PERIOD });
    expect(r.blocked).toBe(true);
    expect(r.amount).toBe(0);
    expect(r.reasons.join(' ')).toMatch(/have not been verified/);
  });

  it('returns zero without blocking when the employee simply does not qualify', () => {
    const r = EtiService.calculateEti({
      employee: employee({ idNumber: '7001015800088' }),
      remuneration: 4000,
      periodDate: PERIOD,
    });
    expect(r.blocked).toBe(false);
    expect(r.amount).toBe(0);
  });
});

describe('calculateEti — mechanics (bypassing the verification guard)', () => {
  const opts = { periodDate: PERIOD, allowUnverified: true as const };

  it('applies the percentage band at low remuneration, halved in tier 2', () => {
    const t1 = EtiService.calculateEti({ employee: employee(), remuneration: 2000, monthsAlreadyClaimed: 0, ...opts });
    const t2 = EtiService.calculateEti({ employee: employee(), remuneration: 2000, monthsAlreadyClaimed: 12, ...opts });
    expect(t1.amount).toBeGreaterThan(0);
    expect(t2.amount).toBeCloseTo(t1.amount / 2, 2);
  });

  it('applies a flat amount in the middle band regardless of remuneration within it', () => {
    const a = EtiService.calculateEti({ employee: employee(), remuneration: 3000, ...opts });
    const b = EtiService.calculateEti({ employee: employee(), remuneration: 5000, ...opts });
    expect(a.amount).toBeCloseTo(b.amount, 2);
  });

  it('tapers to zero as remuneration approaches the ceiling', () => {
    const low = EtiService.calculateEti({ employee: employee(), remuneration: 5600, ...opts });
    const high = EtiService.calculateEti({ employee: employee(), remuneration: 7400, ...opts });
    expect(high.amount).toBeLessThan(low.amount);
    expect(high.amount).toBeGreaterThanOrEqual(0);
  });

  it('claims nothing at or above the remuneration ceiling', () => {
    const r = EtiService.calculateEti({ employee: employee(), remuneration: 7500, ...opts });
    expect(r.amount).toBe(0);
  });

  it('never returns a negative amount', () => {
    for (const rem of [0, 100, 2499, 2500, 5499, 5500, 7499, 7500, 20000]) {
      const r = EtiService.calculateEti({ employee: employee(), remuneration: rem, ...opts });
      expect(r.amount).toBeGreaterThanOrEqual(0);
    }
  });

  it('grosses up part-month employment and scales the result back down', () => {
    // Half a month at half the pay should land near the full-month equivalent, halved.
    const full = EtiService.calculateEti({ employee: employee(), remuneration: 4000, hoursEmployed: 160, ...opts });
    const half = EtiService.calculateEti({ employee: employee(), remuneration: 2000, hoursEmployed: 80, ...opts });
    expect(half.amount).toBeCloseTo(full.amount / 2, 2);
  });
});

describe('getBandSet', () => {
  it('throws for a period with no configured bands rather than guessing', () => {
    expect(() => EtiService.getBandSet(new Date('2014-01-31'))).toThrow(/No ETI bands are configured/);
  });
});

describe('aggregate', () => {
  it('caps the claim at total PAYE and reports the excess separately', () => {
    const r = EtiService.aggregate(
      [{ amount: 1000, blocked: false }, { amount: 1000, blocked: false }],
      1500
    );
    expect(r.calculated).toBe(2000);
    expect(r.claimable).toBe(1500);
    expect(r.excess).toBe(500);
  });

  it('never produces a negative liability', () => {
    const r = EtiService.aggregate([{ amount: 500, blocked: false }], 0);
    expect(r.claimable).toBe(0);
    expect(r.excess).toBe(500);
  });

  it('counts blocked lines so the UI can warn', () => {
    const r = EtiService.aggregate(
      [{ amount: 0, blocked: true }, { amount: 0, blocked: true }, { amount: 100, blocked: false }],
      1000
    );
    expect(r.blockedCount).toBe(2);
  });
});
