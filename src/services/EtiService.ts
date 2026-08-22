import { Employee } from '@/lib/types';
import { PayrollService } from './PayrollService';

/**
 * Employment Tax Incentive (ETI) — EMP201 field 4118.
 *
 * ETI reduces the PAYE an employer pays over to SARS when they employ qualifying young workers.
 * It was not implemented anywhere in this application, which meant any client claiming ETI was
 * over-declaring PAYE on every EMP201 produced here.
 *
 * ── IMPORTANT: THE RATE BANDS BELOW REQUIRE CONFIRMATION ────────────────────────────────────
 *
 * The qualifying rules and the calculation mechanics in this file are deterministic and testable,
 * and are implemented in full. The monetary BANDS are the part that changes by Budget, and they
 * must be signed off against the current SARS ETI guide before this feature is used in anger.
 *
 * For that reason:
 *   • ETI is OFF by default (`client.etiEnabled !== true`) — nothing changes for existing clients.
 *   • Each band set carries an explicit `verified` flag. `calculateEti` REFUSES to return an
 *     amount from an unverified band set unless `allowUnverified` is passed, so an unconfirmed
 *     rate can never quietly become a claim submitted to SARS.
 *   • An unconfigured period throws rather than falling back — the same discipline applied to the
 *     PAYE tables, and for the same reason.
 *
 * To enable: confirm the bands against the current SARS ETI guide, set `verified: true`, and set
 * `etiEnabled: true` on the client.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */

export interface EtiBand {
  /** Inclusive lower bound of monthly remuneration. */
  from: number;
  /** Exclusive upper bound. `Infinity` for the final band. */
  to: number;
  /**
   * How the incentive is derived within this band.
   *  - 'percentage'  : amount = remuneration × value
   *  - 'fixed'       : amount = value
   *  - 'taperedFixed': amount = value − (taperRate × (remuneration − from))
   */
  method: 'percentage' | 'fixed' | 'taperedFixed';
  /** First 12 qualifying months. */
  firstTier: number;
  /** Second 12 qualifying months. */
  secondTier: number;
  /** Taper rate applied per rand above `from`, for 'taperedFixed'. */
  firstTierTaper?: number;
  secondTierTaper?: number;
}

export interface EtiBandSet {
  /** ISO date this band set takes effect. */
  effectiveFrom: string;
  /** Remuneration at or above which no incentive is claimable. */
  remunerationCeiling: number;
  /**
   * Set to true ONLY once the figures have been checked against the current SARS ETI guide.
   * While false, calculateEti will not produce a claimable amount.
   */
  verified: boolean;
  bands: EtiBand[];
}

/**
 * Band sets, newest first.
 *
 * VALUES BELOW ARE UNVERIFIED — they reflect the structure of the post-2025-Budget bands but the
 * amounts have not been confirmed against a current SARS source and must not be relied upon until
 * they are. Add earlier band sets here as needed for prior periods.
 */
export const ETI_BAND_SETS: EtiBandSet[] = [
  {
    effectiveFrom: '2025-04-01',
    remunerationCeiling: 7500,
    verified: false, // ← set true only after checking against the current SARS ETI guide
    bands: [
      { from: 0, to: 2500, method: 'percentage', firstTier: 0.75, secondTier: 0.375 },
      { from: 2500, to: 5500, method: 'fixed', firstTier: 1875, secondTier: 937.5 },
      {
        from: 5500, to: 7500, method: 'taperedFixed',
        firstTier: 1875, firstTierTaper: 0.75,
        secondTier: 937.5, secondTierTaper: 0.375,
      },
      { from: 7500, to: Infinity, method: 'fixed', firstTier: 0, secondTier: 0 },
    ],
  },
];

export interface EtiQualification {
  qualifies: boolean;
  /** Which 12-month tier the employee is in: 1, 2, or null when they no longer qualify. */
  tier: 1 | 2 | null;
  /** Human-readable reasons the employee does NOT qualify. Empty when they do. */
  reasons: string[];
  /** Completed qualifying months already claimed for this employee. */
  monthsClaimed: number;
}

/** Employment on or after this date is a precondition of the incentive. */
const ETI_EMPLOYMENT_START_FLOOR = new Date('2013-10-01');
const ETI_MIN_AGE = 18;
const ETI_MAX_AGE = 29;
const ETI_MAX_QUALIFYING_MONTHS = 24;

export class EtiService {
  /** Returns the band set applicable to a period, or throws if none is configured. */
  static getBandSet(periodDate: Date): EtiBandSet {
    const applicable = ETI_BAND_SETS
      .filter(set => new Date(set.effectiveFrom) <= periodDate)
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0];

    if (!applicable) {
      throw new Error(
        `No ETI bands are configured for ${periodDate.toISOString().slice(0, 10)}. ` +
        `Add the applicable band set to ETI_BAND_SETS before claiming ETI for this period.`
      );
    }
    return applicable;
  }

  /**
   * Determines whether an employee qualifies for ETI in a given period.
   *
   * Deliberately conservative: anything it cannot establish from the data counts as a
   * disqualification with a stated reason, rather than being assumed in the employer's favour.
   */
  static assessQualification(
    employee: Employee,
    periodDate: Date,
    monthsAlreadyClaimed = 0
  ): EtiQualification {
    const reasons: string[] = [];

    // Age 18–29 at the end of the month.
    const age = employee.idNumber
      ? PayrollService.getAgeFromIdNumber(employee.idNumber, periodDate)
      : 0;
    if (!employee.idNumber) {
      reasons.push('No ID number captured — age and identity cannot be established.');
    } else if (age < ETI_MIN_AGE || age > ETI_MAX_AGE) {
      reasons.push(`Employee is ${age}; ETI applies to ages ${ETI_MIN_AGE}–${ETI_MAX_AGE}.`);
    }

    // Employed on or after 1 October 2013.
    const joinDate = employee.joinDate?.toDate
      ? employee.joinDate.toDate()
      : employee.joinDate ? new Date(employee.joinDate) : null;
    if (!joinDate || isNaN(joinDate.getTime())) {
      reasons.push('No valid employment start date captured.');
    } else if (joinDate < ETI_EMPLOYMENT_START_FLOOR) {
      reasons.push('Employed before 1 October 2013.');
    }

    // 24-month lifetime cap.
    if (monthsAlreadyClaimed >= ETI_MAX_QUALIFYING_MONTHS) {
      reasons.push(`The ${ETI_MAX_QUALIFYING_MONTHS}-month ETI period has been exhausted.`);
    }

    const qualifies = reasons.length === 0;
    const tier: 1 | 2 | null = !qualifies
      ? null
      : monthsAlreadyClaimed < 12 ? 1 : 2;

    return { qualifies, tier, reasons, monthsClaimed: monthsAlreadyClaimed };
  }

  /**
   * Calculates the ETI amount for one employee for one month.
   *
   * Returns `{ amount: 0, blocked: true }` when the applicable band set has not been verified —
   * the feature is structurally complete but must not produce a claim off unconfirmed figures.
   */
  static calculateEti(params: {
    employee: Employee;
    /** Monthly remuneration as defined for ETI purposes. */
    remuneration: number;
    periodDate: Date;
    monthsAlreadyClaimed?: number;
    /**
     * Hours actually employed in the month. ETI requires remuneration to be grossed up to a
     * 160-hour month when an employee worked less, then the resulting incentive scaled back down.
     */
    hoursEmployed?: number;
    /** Escape hatch for testing only. Never set this in production code. */
    allowUnverified?: boolean;
  }): { amount: number; tier: 1 | 2 | null; blocked: boolean; reasons: string[] } {
    const {
      employee, remuneration, periodDate,
      monthsAlreadyClaimed = 0, hoursEmployed, allowUnverified = false,
    } = params;

    const qualification = this.assessQualification(employee, periodDate, monthsAlreadyClaimed);
    if (!qualification.qualifies || qualification.tier === null) {
      return { amount: 0, tier: null, blocked: false, reasons: qualification.reasons };
    }

    const bandSet = this.getBandSet(periodDate);

    if (!bandSet.verified && !allowUnverified) {
      return {
        amount: 0,
        tier: qualification.tier,
        blocked: true,
        reasons: [
          `ETI bands effective ${bandSet.effectiveFrom} have not been verified against the current ` +
          `SARS ETI guide. Confirm the figures and set verified: true in ETI_BAND_SETS before claiming.`,
        ],
      };
    }

    // Gross up part-month employment to a 160-hour month, then scale the result back.
    const STANDARD_HOURS = 160;
    const worked = hoursEmployed && hoursEmployed > 0 ? Math.min(hoursEmployed, STANDARD_HOURS) : STANDARD_HOURS;
    const grossedUp = worked < STANDARD_HOURS ? (remuneration / worked) * STANDARD_HOURS : remuneration;

    if (grossedUp >= bandSet.remunerationCeiling) {
      return {
        amount: 0,
        tier: qualification.tier,
        blocked: false,
        reasons: [`Monthly remuneration is at or above the R${bandSet.remunerationCeiling} ETI ceiling.`],
      };
    }

    const band = bandSet.bands.find(b => grossedUp >= b.from && grossedUp < b.to);
    if (!band) {
      return { amount: 0, tier: qualification.tier, blocked: false, reasons: ['No matching ETI band.'] };
    }

    const isFirstTier = qualification.tier === 1;
    let amount: number;

    switch (band.method) {
      case 'percentage':
        amount = grossedUp * (isFirstTier ? band.firstTier : band.secondTier);
        break;
      case 'fixed':
        amount = isFirstTier ? band.firstTier : band.secondTier;
        break;
      case 'taperedFixed': {
        const base = isFirstTier ? band.firstTier : band.secondTier;
        const taper = (isFirstTier ? band.firstTierTaper : band.secondTierTaper) ?? 0;
        amount = base - taper * (grossedUp - band.from);
        break;
      }
    }

    // Scale back for part-month employment.
    if (worked < STANDARD_HOURS) {
      amount = amount * (worked / STANDARD_HOURS);
    }

    return {
      amount: Math.max(0, Math.round(amount * 100) / 100),
      tier: qualification.tier,
      blocked: false,
      reasons: [],
    };
  }

  /**
   * Aggregates ETI across a payroll run.
   *
   * The claim is capped at total PAYE for the period — ETI can reduce PAYE to nil but never
   * produce a negative liability. Any excess is carried (and, in practice, may be refundable at
   * reconciliation), which is surfaced separately rather than silently dropped.
   */
  static aggregate(
    lines: { amount: number; blocked: boolean }[],
    totalPaye: number
  ): { claimable: number; calculated: number; excess: number; blockedCount: number } {
    const calculated = lines.reduce((sum, l) => sum + l.amount, 0);
    const claimable = Math.min(calculated, Math.max(0, totalPaye));
    return {
      calculated: Math.round(calculated * 100) / 100,
      claimable: Math.round(claimable * 100) / 100,
      excess: Math.round((calculated - claimable) * 100) / 100,
      blockedCount: lines.filter(l => l.blocked).length,
    };
  }
}
