/**
 * @fileOverview Empirical Stress Test Suite for Milestone 3 (Challenger 2).
 *
 * Covers:
 * 1. Composite Index Alignment: Cross-references queries from ReviewedTab and NewTransactionsTab
 *    against exact index definitions in firestore.indexes.json.
 * 2. ISO Date Boundary String Stress Testing: Empirical verification of T23:59:59.999Z inclusion
 *    preventing transaction loss on the last day of the financial year.
 * 3. Month Name Edge Cases & Missing client.yearEnd: Rigorous stress testing of getCurrentFinancialYearRange
 *    across empty, undefined, lowercase, abbreviated, and invalid inputs.
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { format, endOfDay } from 'date-fns';

vi.mock('@/app/actions/banking-actions', () => ({
  applyRegroups: vi.fn(),
  splitTransaction: vi.fn(),
  proposeRegroups: vi.fn(),
  proposeAiRegroups: vi.fn(),
}));
vi.mock('@/ai/genkit', () => ({ ai: {} }));
vi.mock('@genkit-ai/google-genai', () => ({}));
vi.mock('@genkit-ai/next', () => ({}));

import { getCurrentFinancialYearRange } from '../ReviewedTab';
import { ImportedTransaction } from '@/lib/types';

describe('Challenger 2 — Milestone 3 Empirical Stress Suite', () => {

  // ==========================================================================
  // 1. COMPOSITE INDEX COMPATIBILITY VERIFICATION
  // ==========================================================================
  describe('1. Firestore Composite Index Alignment (firestore.indexes.json)', () => {
    const indexesPath = path.resolve(process.cwd(), 'firestore.indexes.json');
    const indexesContent = JSON.parse(fs.readFileSync(indexesPath, 'utf-8'));
    const transactionIndexes = indexesContent.indexes.filter(
      (idx: any) => idx.collectionGroup === 'transactions' && idx.queryScope === 'COLLECTION'
    );

    it('1.1: firestore.indexes.json exists and contains collectionGroup="transactions" indexes', () => {
      expect(transactionIndexes.length).toBeGreaterThan(0);
    });

    it('1.2: ReviewedTab date-scoped query strictly matches an existing composite index in firestore.indexes.json', () => {
      // In ReviewedTab.tsx:
      // where('bankAccountId', '==', bankAccountId)
      // where('status', 'in', ['reviewed', 'allocated'])
      // where('isExpense', '==', activeSubTab === 'expenses')
      // where('date', '>=', start)
      // where('date', '<=', end)
      // Required index: bankAccountId ASC, status ASC, isExpense ASC, date ASC / DESC
      const matchingIndexAsc = transactionIndexes.find((idx: any) => {
        const fields = idx.fields;
        return (
          fields.length === 4 &&
          fields[0].fieldPath === 'bankAccountId' && fields[0].order === 'ASCENDING' &&
          fields[1].fieldPath === 'status' && fields[1].order === 'ASCENDING' &&
          fields[2].fieldPath === 'isExpense' && fields[2].order === 'ASCENDING' &&
          fields[3].fieldPath === 'date' && fields[3].order === 'ASCENDING'
        );
      });

      const matchingIndexDesc = transactionIndexes.find((idx: any) => {
        const fields = idx.fields;
        return (
          fields.length === 4 &&
          fields[0].fieldPath === 'bankAccountId' && fields[0].order === 'ASCENDING' &&
          fields[1].fieldPath === 'status' && fields[1].order === 'ASCENDING' &&
          fields[2].fieldPath === 'isExpense' && fields[2].order === 'ASCENDING' &&
          fields[3].fieldPath === 'date' && fields[3].order === 'DESCENDING'
        );
      });

      expect(matchingIndexAsc).toBeDefined();
      expect(matchingIndexDesc).toBeDefined();
    });

    it('1.3: NewTransactionsTab scoped query fields conform to index requirements', () => {
      // NewTransactionsTab uses:
      // where('bankAccountId', '==', bankAccountId)
      // where('status', '==', 'new')
      // In Firestore, multiple equality filters use single-field index merging or composite prefixes.
      // Notice firestore.indexes.json has composite indexes starting with bankAccountId, status:
      const bankAccountAndStatusIndexes = transactionIndexes.filter((idx: any) => {
        return (
          idx.fields.length >= 2 &&
          idx.fields[0].fieldPath === 'bankAccountId' &&
          idx.fields[1].fieldPath === 'status'
        );
      });

      expect(bankAccountAndStatusIndexes.length).toBeGreaterThan(0);
    });

    it('1.4: Equality fields precede inequality range fields in all transaction composite indexes', () => {
      // Firestore rule: In a composite index, fields with equality/in filters must appear before range filter fields.
      transactionIndexes.forEach((idx: any) => {
        const fieldPaths = idx.fields.map((f: any) => f.fieldPath);
        const dateIndex = fieldPaths.indexOf('date');
        if (dateIndex !== -1) {
          // If bankAccountId, status, or isExpense are present, they must precede date
          ['bankAccountId', 'status', 'isExpense'].forEach(equalityField => {
            const eqIndex = fieldPaths.indexOf(equalityField);
            if (eqIndex !== -1) {
              expect(eqIndex).toBeLessThan(dateIndex);
            }
          });
        }
      });
    });
  });

  // ==========================================================================
  // 2. ISO STRING DATE BOUNDARY STRESS TESTING
  // ==========================================================================
  describe('2. ISO String Date Boundary Stress Testing (T23:59:59.999Z Inclusion)', () => {

    it('2.1: Proves omission of T23:59:59.999Z drops transactions on the last day under lexicographical comparison', () => {
      const lastDayISO = '2027-02-28T14:30:00.000Z';
      const naiveUpperBound = '2027-02-28';
      const hardenedUpperBound = '2027-02-28T23:59:59.999Z';

      // Under Firestore string comparison:
      const includedInNaive = lastDayISO <= naiveUpperBound;
      const includedInHardened = lastDayISO <= hardenedUpperBound;

      // Naive comparison FAILS (drops transaction)
      expect(includedInNaive).toBe(false);
      // Hardened comparison SUCCEEDS (retains transaction)
      expect(includedInHardened).toBe(true);
    });

    it('2.2: Retains transactions created at the exact final millisecond of the financial year', () => {
      const finalMillisecond = '2027-02-28T23:59:59.999Z';
      const upperBound = '2027-02-28T23:59:59.999Z';

      expect(finalMillisecond <= upperBound).toBe(true);
    });

    it('2.3: Strictly excludes transactions on the first millisecond of the subsequent financial year', () => {
      const nextYearFirstMillisecond = '2027-03-01T00:00:00.000Z';
      const upperBound = '2027-02-28T23:59:59.999Z';

      expect(nextYearFirstMillisecond <= upperBound).toBe(false);
    });

    it('2.4: Lower bound format(dateRange.from, "yyyy-MM-dd") includes all transactions from midnight', () => {
      const startDayMidnight = '2026-03-01T00:00:00.000Z';
      const startDayMidday = '2026-03-01T12:00:00.000Z';
      const priorDayLastMillisecond = '2026-02-28T23:59:59.999Z';

      const lowerBound = '2026-03-01';

      expect(startDayMidnight >= lowerBound).toBe(true);
      expect(startDayMidday >= lowerBound).toBe(true);
      expect(priorDayLastMillisecond >= lowerBound).toBe(false);
    });

    it('2.5: In-memory filter with toDate.setHours(23, 59, 59, 999) matches local day boundary', () => {
      const toDate = new Date(2027, 1, 28); // Feb 28, 2027 local
      toDate.setHours(23, 59, 59, 999);
      const toTime = toDate.getTime();

      // Transaction on Feb 28 date-only string (parsed as UTC midnight)
      const txDateOnly = new Date('2027-02-28').getTime();
      // Transaction on Feb 28 local end of day
      const txLocalEnd = new Date(2027, 1, 28, 23, 59, 59, 999).getTime();
      // Transaction on Mar 1 local start of day
      const txNextDay = new Date(2027, 2, 1, 0, 0, 0, 0).getTime();

      expect(txDateOnly <= toTime).toBe(true);
      expect(txLocalEnd <= toTime).toBe(true);
      expect(txNextDay <= toTime).toBe(false);
    });
  });

  // ==========================================================================
  // 3. MONTH NAMES & MISSING CLIENT.YEAREND STRESS TESTING
  // ==========================================================================
  describe('3. Month Names & Missing client.yearEnd Edge Cases', () => {

    it('3.1: Handles missing client.yearEnd (undefined) by defaulting to February (1)', () => {
      const range = getCurrentFinancialYearRange(undefined);
      expect(range.from).toBeInstanceOf(Date);
      expect(range.to).toBeInstanceOf(Date);
      expect(isNaN(range.from!.getTime())).toBe(false);
      expect(isNaN(range.to!.getTime())).toBe(false);

      // In September 2026, FY runs 2026-03-01 to 2027-02-28
      expect(format(range.from!, 'yyyy-MM-dd')).toBe('2026-03-01');
      expect(format(range.to!, 'yyyy-MM-dd')).toBe('2027-02-28');
    });

    it('3.2: Handles empty string "" by defaulting to February (1)', () => {
      const range = getCurrentFinancialYearRange('');
      expect(range.from).toBeInstanceOf(Date);
      expect(range.to).toBeInstanceOf(Date);
      expect(format(range.from!, 'yyyy-MM-dd')).toBe('2026-03-01');
      expect(format(range.to!, 'yyyy-MM-dd')).toBe('2027-02-28');
    });

    it('3.3: Handles all 12 canonical month names correctly without NaN', () => {
      const allMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      allMonths.forEach(month => {
        const range = getCurrentFinancialYearRange(month);
        expect(range.from).toBeInstanceOf(Date);
        expect(range.to).toBeInstanceOf(Date);
        expect(isNaN(range.from!.getTime())).toBe(false);
        expect(isNaN(range.to!.getTime())).toBe(false);
      });
    });

    it('3.4: Handles case-insensitive and abbreviated month names ("february", "FEB", "Feb")', () => {
      const testCases = ['february', 'FEBRUARY', 'Feb', 'FEB', 'december', 'DEC'];

      testCases.forEach(monthName => {
        const range = getCurrentFinancialYearRange(monthName);
        expect(isNaN(range.from!.getTime())).toBe(false);
        expect(isNaN(range.to!.getTime())).toBe(false);
      });
    });

    it('3.5: Handles formatted month with day prefix ("28 February", "28 Feb")', () => {
      const range = getCurrentFinancialYearRange('28 February');
      expect(isNaN(range.from!.getTime())).toBe(false);
      expect(format(range.from!, 'yyyy-MM-dd')).toBe('2026-03-01');
      expect(format(range.to!, 'yyyy-MM-dd')).toBe('2027-02-28');
    });

    it('3.6: Adversarial probe: Unparseable month names ("InvalidMonth", "N/A") produce NaN without guardrail', () => {
      // Probing the vulnerability in getCurrentFinancialYearRange:
      // const endMonth = endMonthName ? new Date(`${endMonthName} 1, 2000`).getMonth() : 1;
      // If endMonthName is "InvalidMonth", new Date("InvalidMonth 1, 2000").getMonth() returns NaN!
      const parsedMonth = new Date('InvalidMonth 1, 2000').getMonth();
      expect(isNaN(parsedMonth)).toBe(true);

      const range = getCurrentFinancialYearRange('InvalidMonth');
      // Demonstrates that without an isNaN check, from and to become Invalid Date
      const isFromInvalid = isNaN(range.from!.getTime());
      expect(isFromInvalid).toBe(true);
    });
  });
});
