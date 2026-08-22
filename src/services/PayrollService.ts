import { User, Employee, Payslip, PayslipItem } from '@/lib/types';
import { format, addDays, isValid, parse } from 'date-fns';

/**
 * South African Tax Year Configurations
 */
const TAX_YEAR_CONFIGS: Record<string, { rebate: number; rebateSecondary: number; rebateTertiary: number; medCreditMember: number; medCreditFirstDependent: number; medCreditAdditionalDependent: number; uifLimit: number; brackets: { threshold: number; base: number; rate: number }[] }> = {
  '2023': {
    rebate: 16425,
    rebateSecondary: 9000,
    rebateTertiary: 2997,
    medCreditMember: 347,
    medCreditFirstDependent: 347,
    medCreditAdditionalDependent: 234,
    uifLimit: 177.12, 
    brackets: [
      { threshold: 0, base: 0, rate: 0.18 },
      { threshold: 226000, base: 40680, rate: 0.26 },
      { threshold: 353100, base: 73726, rate: 0.31 },
      { threshold: 488700, base: 115762, rate: 0.36 },
      { threshold: 641400, base: 170734, rate: 0.39 },
      { threshold: 817600, base: 238452, rate: 0.41 },
      { threshold: 1731600, base: 613192, rate: 0.45 },
    ],
  },
  '2024': {
    rebate: 17235,
    rebateSecondary: 9444,
    rebateTertiary: 3145,
    medCreditMember: 364,
    medCreditFirstDependent: 364,
    medCreditAdditionalDependent: 246,
    uifLimit: 177.12, 
    brackets: [
      { threshold: 0, base: 0, rate: 0.18 },
      { threshold: 237100, base: 42678, rate: 0.26 },
      { threshold: 370500, base: 77362, rate: 0.31 },
      { threshold: 512800, base: 121475, rate: 0.36 },
      { threshold: 673000, base: 179147, rate: 0.39 },
      { threshold: 857900, base: 251258, rate: 0.41 },
      { threshold: 1817000, base: 644489, rate: 0.45 },
    ],
  },
  '2025': {
    rebate: 17235,
    rebateSecondary: 9444,
    rebateTertiary: 3145,
    medCreditMember: 364,
    medCreditFirstDependent: 364,
    medCreditAdditionalDependent: 246,
    uifLimit: 177.12, 
    brackets: [
      { threshold: 0, base: 0, rate: 0.18 },
      { threshold: 237100, base: 42678, rate: 0.26 },
      { threshold: 370500, base: 77362, rate: 0.31 },
      { threshold: 512800, base: 121475, rate: 0.36 },
      { threshold: 673000, base: 179147, rate: 0.39 },
      { threshold: 857900, base: 251258, rate: 0.41 },
      { threshold: 1817000, base: 644489, rate: 0.45 },
    ],
  },
  '2026': {
    rebate: 17235,
    rebateSecondary: 9444,
    rebateTertiary: 3145,
    medCreditMember: 364,
    medCreditFirstDependent: 364,
    medCreditAdditionalDependent: 246,
    uifLimit: 177.12, // Monthly cap (1% of R17,712)
    brackets: [
      { threshold: 0, base: 0, rate: 0.18 },
      { threshold: 237100, base: 42678, rate: 0.26 },
      { threshold: 370500, base: 77362, rate: 0.31 },
      { threshold: 512800, base: 121475, rate: 0.36 },
      { threshold: 673000, base: 179147, rate: 0.39 },
      { threshold: 857900, base: 251258, rate: 0.41 },
      { threshold: 1817000, base: 644489, rate: 0.45 },
    ],
  },
  '2027': {
    rebate: 18010,
    rebateSecondary: 9800,
    rebateTertiary: 3200,
    medCreditMember: 380,
    medCreditFirstDependent: 380,
    medCreditAdditionalDependent: 256,
    uifLimit: 177.12, 
    brackets: [
      { threshold: 0, base: 0, rate: 0.18 },
      { threshold: 247750, base: 44595, rate: 0.26 },
      { threshold: 387150, base: 80839, rate: 0.31 },
      { threshold: 535850, base: 126936, rate: 0.36 },
      { threshold: 703300, base: 187218, rate: 0.39 },
      { threshold: 896500, base: 262566, rate: 0.41 },
      { threshold: 1898750, base: 673488, rate: 0.45 },
    ],
  }
};

const MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

export class PayrollService {
  /**
   * Parses a South African ID number (YYMMDDSSSSCAZ) and calculates the employee's age
   * as of a reference date.
   */
  static getAgeFromIdNumber(idNumber?: string, referenceDate: Date = new Date()): number {
    if (!idNumber || idNumber.length !== 13) return 0;
    
    const yyStr = idNumber.substring(0, 2);
    const mmStr = idNumber.substring(2, 4);
    const ddStr = idNumber.substring(4, 6);
    
    const yy = parseInt(yyStr);
    const mm = parseInt(mmStr) - 1;
    const dd = parseInt(ddStr);
    
    if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return 0;
    
    const currentYear = referenceDate.getFullYear();
    const currentTwoDigitYear = currentYear % 100;
    
    // Assume year threshold: if YY is >= current two digit year, they were born in 1900s
    let birthYear = yy >= currentTwoDigitYear ? 1900 + yy : 2000 + yy;
    const birthDate = new Date(birthYear, mm, dd);
    
    if (isNaN(birthDate.getTime())) return 0;
    
    let age = currentYear - birthDate.getFullYear();
    const m = referenceDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Helper to convert frequency string to numeric multiplier.
   */
  static getFrequencyMultiplier(freq?: string): number {
    if (freq === 'Fortnightly') return 26;
    return 12;
  }

  /**
   * Calculates how many pay periods remain in the current SA tax year
   * (March–February) from the employee's join date. If the employee joined
   * before the current tax year, returns the full frequency (12 or 26).
   */
  static getRemainingPeriods(period?: string, joinDate?: any, frequency: number = 12): number {
    if (!joinDate) return frequency;

    const join = joinDate.toDate ? joinDate.toDate() : new Date(joinDate);
    if (isNaN(join.getTime())) return frequency;

    const periodDate = this.getPeriodDate(period);

    // Determine tax year start (1 March)
    let taxYearStartYear = periodDate.getFullYear();
    if (periodDate.getMonth() < 2) { // Jan or Feb → tax year started previous year
      taxYearStartYear -= 1;
    }
    const taxYearStart = new Date(taxYearStartYear, 2, 1); // 1 March

    // Employee joined before this tax year → full year
    if (join < taxYearStart) return frequency;

    if (frequency === 12) {
      // Monthly: count from join month through February (inclusive)
      const taxYearEndYear = taxYearStartYear + 1;
      const taxYearEndMonth = 1; // February = index 1
      const remaining = (taxYearEndYear * 12 + taxYearEndMonth) - (join.getFullYear() * 12 + join.getMonth()) + 1;
      return Math.max(1, Math.min(12, remaining));
    } else {
      // Fortnightly: approximate remaining fortnights until end of February
      const taxYearEnd = new Date(taxYearStartYear + 1, 1, 28);
      const diffDays = (taxYearEnd.getTime() - join.getTime()) / (1000 * 60 * 60 * 24);
      const remaining = Math.round(diffDays / 14);
      return Math.max(1, Math.min(26, remaining));
    }
  }

  /**
   * Identifies the tax year based on the period string (e.g. "March 2026" or "06/03/2026")
   */
  static getTaxConfig(period?: string) {
    // These three paths previously all fell back silently to the 2026 tables. That is a
    // wrong-numbers-with-no-error failure mode: from 1 March 2027 (tax year 2028) every payslip
    // in the system would be computed on 2026 brackets, rebates and medical credits, and nothing
    // — no log, no banner, no exception — would indicate it. PAYE would simply be wrong for every
    // employee of every client until somebody noticed by hand.
    //
    // Failing loudly is the correct behaviour: a blocked payroll run is recoverable, an
    // incorrectly-filed EMP201 is not.
    if (!period) {
      throw new Error('Cannot calculate PAYE: no payroll period was supplied.');
    }

    let monthIdx = -1;
    let year = NaN;

    // Try parsing as "Month Year" (Monthly)
    const monthYearParts = period.split(' ');
    if (monthYearParts.length >= 2) {
      monthIdx = MONTHS.indexOf(monthYearParts[0]);
      year = parseInt(monthYearParts[1]);
    } else {
      // Try parsing as DD/MM/YYYY (Fortnightly)
      const dateParts = period.split('/');
      if (dateParts.length === 3) {
        monthIdx = parseInt(dateParts[1]) - 1;
        year = parseInt(dateParts[2]);
      }
    }

    if (monthIdx === -1 || isNaN(year)) {
      throw new Error(
        `Cannot calculate PAYE: payroll period "${period}" could not be interpreted. ` +
        `Expected "Month YYYY" (e.g. "March 2026") or "DD/MM/YYYY".`
      );
    }

    // South African tax year runs from March to February.
    const taxYear = monthIdx >= 2 ? (year + 1).toString() : year.toString();
    const config = TAX_YEAR_CONFIGS[taxYear];

    if (!config) {
      const available = Object.keys(TAX_YEAR_CONFIGS).sort().join(', ');
      throw new Error(
        `Cannot calculate PAYE for period "${period}": SARS tax tables for the ${taxYear} tax year ` +
        `have not been configured. Configured years: ${available}. ` +
        `Add the ${taxYear} brackets, rebates, medical credits and UIF ceiling to TAX_YEAR_CONFIGS ` +
        `before processing this period.`
      );
    }

    return config;
  }

  /**
   * True when tax tables exist for the given period. Lets callers surface a clear, actionable
   * message ahead of a payroll run rather than throwing mid-calculation.
   */
  static hasTaxConfig(period?: string): boolean {
    try {
      PayrollService.getTaxConfig(period);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parses a period label like "March 2026" or "06/03/2026" into a Date object.
   */
  static getPeriodDate(period?: string): Date {
    if (!period) return new Date();
    
    // Check if it's a date string (DD/MM/YYYY)
    if (period.includes('/')) {
        const parsed = parse(period, 'dd/MM/yyyy', new Date());
        return isValid(parsed) ? parsed : new Date();
    }

    const base = period.split(' - ')[0];
    const parts = base.split(' ');
    if (parts.length < 2) return new Date();
    const monthName = parts[0];
    const year = parseInt(parts[1]);
    const monthIdx = MONTHS.indexOf(monthName);
    return new Date(year, monthIdx !== -1 ? monthIdx : 0, 1);
  }

  /**
   * Calculates the taxable portion of a payslip item based on its tax category.
   */
  static calculateTaxableAmount(item: PayslipItem): number {
    if (item.taxCategory === 'non-taxable') return 0;
    if (item.taxCategory === '80-percent-taxable') return item.amount * 0.8;
    return item.amount;
  }

  /**
   * Calculates PAYE based on earnings, age (rebates) and medical aid.
   */
  static calculatePaye(
    periodEarnings: number, 
    period?: string, 
    frequency: number = 12, 
    joinDate?: any, 
    idNumber?: string, 
    medicalAidMembers: number = 0, 
    medicalAidDependents: number = 0,
    bonusEarnings: number = 0
  ): number {
    const config = this.getTaxConfig(period);
    // Standard periodic PAYE calculation annualises the period income by the full frequency (e.g., * 12)
    // rather than remaining periods, to avoid under-taxing employees who join mid-year.
    const effectivePeriods = frequency;
    
    // Regular Annual Gross
    const annualRegularGross = periodEarnings * effectivePeriods;
    let annualRegularTax = 0;

    const regularBracket = [...config.brackets].reverse().find(b => annualRegularGross > b.threshold);
    if (regularBracket) {
      annualRegularTax = regularBracket.base + (annualRegularGross - regularBracket.threshold) * regularBracket.rate;
    } else {
      annualRegularTax = annualRegularGross * config.brackets[0].rate;
    }

    // Determine age-based rebates
    let rebate = config.rebate;
    if (idNumber) {
      const age = this.getAgeFromIdNumber(idNumber, this.getPeriodDate(period));
      if (age >= 65) {
        rebate += config.rebateSecondary;
      }
      if (age >= 75) {
        rebate += config.rebateTertiary;
      }
    }

    const netAnnualRegularTax = Math.max(0, annualRegularTax - rebate);
    const monthlyRegularPaye = netAnnualRegularTax / effectivePeriods;

    // Calculate tax on bonus if applicable
    let taxOnBonus = 0;
    if (bonusEarnings > 0) {
      const annualTotalGross = annualRegularGross + bonusEarnings; // Bonus added to annual gross
      let annualTotalTax = 0;
      const totalBracket = [...config.brackets].reverse().find(b => annualTotalGross > b.threshold);
      if (totalBracket) {
        annualTotalTax = totalBracket.base + (annualTotalGross - totalBracket.threshold) * totalBracket.rate;
      } else {
        annualTotalTax = annualTotalGross * config.brackets[0].rate;
      }
      const netAnnualTotalTax = Math.max(0, annualTotalTax - rebate);
      taxOnBonus = Math.max(0, netAnnualTotalTax - netAnnualRegularTax);
    }

    const totalMonthlyPaye = monthlyRegularPaye + taxOnBonus;

    // Monthly Medical Aid Credit
    let medicalCredit = 0;
    if (medicalAidMembers > 0) {
      const mCredit = config.medCreditMember;
      const d1Credit = config.medCreditFirstDependent;
      const addCredit = config.medCreditAdditionalDependent;

      medicalCredit = mCredit;
      const deps = medicalAidDependents;
      if (deps > 0) {
        medicalCredit += d1Credit;
        if (deps > 1) {
          medicalCredit += (deps - 1) * addCredit;
        }
      }
    }

    return parseFloat(Math.max(0, totalMonthlyPaye - medicalCredit).toFixed(2));
  }

  /**
   * Calculates UIF (1% of gross, capped).
   */
  static calculateUif(periodEarnings: number, period?: string, frequency: number = 12): number {
    const config = this.getTaxConfig(period);
    const uifRaw = periodEarnings * 0.01;
    const effectiveLimit = (config.uifLimit * 12) / frequency;
    return parseFloat(Math.min(uifRaw, effectiveLimit).toFixed(2));
  }

  /**
   * Calculates Gross from a desired Net amount using iterative approximation.
   */
  static calculateGrossFromNet(
    targetNet: number, 
    period?: string, 
    frequency: number = 12, 
    joinDate?: any, 
    idNumber?: string, 
    medicalAidMembers: number = 0, 
    medicalAidDependents: number = 0
  ): number {
    if (targetNet <= 0) return 0;
    
    let low = targetNet;
    let high = targetNet * 2.5; // Slightly higher margin for fortnightly
    let mid = (low + high) / 2;
    let iterations = 0;
    
    while (iterations < 50) {
      const currentPaye = this.calculatePaye(mid, period, frequency, joinDate, idNumber, medicalAidMembers, medicalAidDependents);
      const currentUif = this.calculateUif(mid, period, frequency);
      const currentNet = mid - currentPaye - currentUif;
      
      if (Math.abs(currentNet - targetNet) < 0.01) break;
      
      if (currentNet < targetNet) {
        low = mid;
      } else {
        high = mid;
      }
      mid = (low + high) / 2;
      iterations++;
    }
    
    let finalGross = parseFloat(mid.toFixed(2));
    
    // Fine-tuning loop to ensure exact cent match after rounding
    for (let i = 0; i < 20; i++) {
        const paye = this.calculatePaye(finalGross, period, frequency, joinDate, idNumber, medicalAidMembers, medicalAidDependents);
        const uif = this.calculateUif(finalGross, period, frequency);
        const net = parseFloat((finalGross - paye - uif).toFixed(2));
        
        if (net === targetNet) {
            break;
        } else if (net < targetNet) {
            finalGross += 0.01;
        } else {
            finalGross -= 0.01;
        }
        finalGross = parseFloat(finalGross.toFixed(2));
    }
    
    return finalGross;
  }

  /**
   * Helper to build earnings list based on hours and rates.
   */
  static calculateEarningsList(employee: Employee, baseValue: number, basePeriod: string, frequency: number, hours?: {
      normal?: number;
      publicHoliday?: number;
      overtime15?: number;
      overtime20?: number;
      standbyAllowance?: number;
  }): PayslipItem[] {
      const earnings: PayslipItem[] = [];
      const hourlyRate = employee.hourlyRate || 0;

      if (employee.payType === 'Hourly') {
          const defaultHours = frequency === 26 ? 80 : 160;
          const normalHours = hours?.normal ?? defaultHours;
          earnings.push({ label: 'Normal Hours pay', amount: parseFloat((hourlyRate * normalHours).toFixed(2)) });
      } else {
          let periodAmount = baseValue;
          if (frequency === 26) {
              // Convert monthly salary to fortnightly (Salary * 12 / 26)
              periodAmount = (baseValue * 12) / 26;
          }

          if (employee.isNetSalary) {
              periodAmount = this.calculateGrossFromNet(
                  periodAmount, 
                  basePeriod, 
                  frequency, 
                  employee.joinDate,
                  employee.idNumber,
                  employee.medicalAidMembers || 0,
                  employee.medicalAidDependents || 0
              );
          }
          
          const label = employee.isNetSalary 
              ? (frequency === 26 ? 'Fortnightly salary (Grossed Up)' : 'Basic salary (Grossed Up)')
              : (frequency === 26 ? 'Fortnightly salary' : 'Basic salary');
              
          earnings.push({ label, amount: parseFloat(periodAmount.toFixed(2)) });
      }

      if (hours) {
          if (hours.publicHoliday && hours.publicHoliday > 0) {
              earnings.push({ label: 'Public Holidays (2x)', amount: parseFloat((hourlyRate * 2 * hours.publicHoliday).toFixed(2)) });
          }
          if (hours.overtime15 && hours.overtime15 > 0) {
              earnings.push({ label: 'Overtime (1.5x)', amount: parseFloat((hourlyRate * 1.5 * hours.overtime15).toFixed(2)) });
          }
          if (hours.overtime20 && hours.overtime20 > 0) {
              earnings.push({ label: 'Overtime (2x)', amount: parseFloat((hourlyRate * 2 * hours.overtime20).toFixed(2)) });
          }
          if (hours.standbyAllowance && hours.standbyAllowance > 0) {
              earnings.push({ label: 'Standby Allowance', amount: hours.standbyAllowance });
          }
      }

      return earnings;
  }

  /**
   * Splits a payslip's earnings and fringe benefits into the regular and bonus taxable bases.
   *
   * This logic previously lived only inside PayslipEditor, so the editor taxed correctly while
   * every server-side path (updateDraftPayslipHours, syncEmployeeSalary, bulkSync, bulkFinalize,
   * rollForward, PayrollServiceServer) passed a single raw gross into getInitialDeductions. That
   * meant, on those paths:
   *   - non-taxable items (Reimbursive Travel Non-Taxable, Subsistence Allowance) were FULLY taxed
   *   - 80%-taxable items (Travel Allowance, Company Car) were taxed on 100%
   *   - an annual bonus was annualised x12 by calculatePaye, producing gross over-taxation
   * and bulkSyncDraftPayslipsAction then OVERWROTE the payroll administrator's corrected figures
   * with those results.
   */
  static splitTaxableBases(
    earnings: PayslipItem[] = [],
    fringeBenefits: PayslipItem[] = []
  ): { regularGross: number; bonusGross: number } {
    const regularGross =
      earnings.reduce((sum, e) => sum + (e.taxCategory === 'bonus' ? 0 : this.calculateTaxableAmount(e)), 0) +
      fringeBenefits.reduce((sum, f) => sum + (f.taxCategory === 'bonus' ? 0 : this.calculateTaxableAmount(f)), 0);

    const bonusGross =
      earnings.reduce((sum, e) => sum + (e.taxCategory === 'bonus' ? this.calculateTaxableAmount(e) : 0), 0) +
      fringeBenefits.reduce((sum, f) => sum + (f.taxCategory === 'bonus' ? this.calculateTaxableAmount(f) : 0), 0);

    return { regularGross, bonusGross };
  }

  static getInitialDeductions(
    gross: number,
    period: string,
    frequency: number,
    joinDate?: any,
    idNumber?: string,
    medicalAidMembers: number = 0,
    medicalAidDependents: number = 0,
    /**
     * Optional payslip lines. When supplied, PAYE is computed on the correct regular/bonus split
     * (honouring taxCategory) instead of on the raw scalar gross. Callers that have the line items
     * — which is all of the payroll actions — should pass them.
     */
    lines?: { earnings?: PayslipItem[]; fringeBenefits?: PayslipItem[] }
  ): PayslipItem[] {
      let regularBase = gross;
      let bonusBase = 0;

      if (lines && (lines.earnings?.length || lines.fringeBenefits?.length)) {
        const split = this.splitTaxableBases(lines.earnings || [], lines.fringeBenefits || []);
        regularBase = split.regularGross;
        bonusBase = split.bonusGross;
      }

      return [
          {
            label: 'Tax',
            amount: this.calculatePaye(regularBase, period, frequency, joinDate, idNumber, medicalAidMembers, medicalAidDependents, bonusBase),
            isStatutory: true,
          },
          { label: 'Unemployment insurance fund', amount: this.calculateUif(gross, period, frequency), isStatutory: true }
      ];
  }

  static getInitialContributions(gross: number, period: string, frequency: number, excludeSdl: boolean): PayslipItem[] {
      const uif = this.calculateUif(gross, period, frequency);
      const contribs = [
          { label: 'Unemployment insurance fund', amount: uif, isStatutory: true }
      ];
      if (!excludeSdl) {
          contribs.push({ label: 'Skills development levy', amount: parseFloat((gross * 0.01).toFixed(2)), isStatutory: true });
      }
      return contribs;
  }

}
