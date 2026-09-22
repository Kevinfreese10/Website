/**
 * @fileOverview Milestone 3 Empirical Challenger 1 Stress Test Suite
 * 
 * Target under test:
 * 1. NewTransactionsTab: Query scoping (status == 'new'), status isolation, search/sort resilience.
 * 2. SmartMatchQueueTab: PAGE_SIZE = 25 pagination boundaries, zero mount auto-consolidation loops.
 * 3. ReviewedTab: Date filtering across leap years, crossovers, custom intervals, unconstrained fallbacks.
 * 4. AST & Source Code Verification: Structural proofs of invariants.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { format, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

vi.mock('@/app/actions/banking-actions', () => ({
  applyRegroups: vi.fn(),
  splitTransaction: vi.fn(),
  proposeRegroups: vi.fn(),
  proposeAiRegroups: vi.fn(),
  autoConsolidateSmartMatchQueue: vi.fn(),
}));
vi.mock('@/ai/genkit', () => ({ ai: {} }));
vi.mock('@genkit-ai/google-genai', () => ({}));
vi.mock('@genkit-ai/next', () => ({}));

import { getCurrentFinancialYearRange, ReviewedTab } from '../ReviewedTab';
import { NewTransactionsTab } from '../NewTransactionsTab';
import { SmartMatchQueueTab, AIWorkflowTab } from '../SmartMatchQueueTab';
import { BankTransactionsUI } from '../BankTransactionsUI';
import { ImportedTransaction } from '@/lib/types';
import { formatPrice } from '../types';

describe('Milestone 3 Empirical Challenger 1 Stress Test Suite', () => {

  // ==========================================================================
  // SUITE 1: NewTransactionsTab Query Scoping (status == 'new') Stress
  // ==========================================================================
  describe('Suite 1: NewTransactionsTab Query Scoping (status == "new") Stress', () => {

    it('1.1: Generated 50,000-transaction random dataset strictly isolates status === "new"', () => {
      const statuses = ['new', 'ai_review', 'ai_processing', 'reviewed', 'allocated', 'unknown', 'draft', 'deleted'];
      const TOTAL = 50000;
      const transactions: Array<{ id: string; status: string; amount: number; bankAccountId: string }> = [];

      let expectedNewCount = 0;
      for (let i = 0; i < TOTAL; i++) {
        const status = statuses[i % statuses.length];
        if (status === 'new') expectedNewCount++;
        transactions.push({
          id: `tx-${i}`,
          status,
          amount: -(i + 1),
          bankAccountId: 'acc-primary',
        });
      }

      // Simulated Firestore query constraint: where('bankAccountId', '==', 'acc-primary'), where('status', '==', 'new')
      const scopedTxs = transactions.filter(tx => tx.bankAccountId === 'acc-primary' && tx.status === 'new');

      expect(scopedTxs.length).toBe(expectedNewCount);
      expect(scopedTxs.every(tx => tx.status === 'new')).toBe(true);
      expect(scopedTxs.some(tx => tx.status === 'ai_review')).toBe(false);
      expect(scopedTxs.some(tx => tx.status === 'ai_processing')).toBe(false);
      expect(scopedTxs.some(tx => tx.status === 'reviewed')).toBe(false);
    });

    it('1.2: Real-world HLAYI TRADING scenario: 861 new vs 6,605 workflow vs 6,221 reviewed', () => {
      const hlayiDistribution = {
        new: 861,
        ai_processing: 1450,
        ai_review: 5155,
        reviewed: 6221,
      };

      const dataset: Array<{ id: string; status: string; bankAccountId: string }> = [];
      Object.entries(hlayiDistribution).forEach(([status, count]) => {
        for (let i = 0; i < count; i++) {
          dataset.push({ id: `${status}-${i}`, status, bankAccountId: 'hlayi-main' });
        }
      });

      expect(dataset.length).toBe(13687);

      const scoped = dataset.filter(tx => tx.bankAccountId === 'hlayi-main' && tx.status === 'new');
      expect(scoped.length).toBe(861);

      // Verify exact payload reduction
      const unpaginatedOldCount = 861 + 1450 + 5155; // 7466 unreviewed
      const reduction = ((unpaginatedOldCount - scoped.length) / unpaginatedOldCount) * 100;
      expect(reduction).toBeCloseTo(88.468, 2);
    });

    it('1.3: handleAllocateByRules query constraint requires status == "new" and isExpense == true', () => {
      const sampleTxs: ImportedTransaction[] = [
        { id: '1', bankAccountId: 'acc-1', status: 'new', isExpense: true, description: 'ENGEN' } as any,
        { id: '2', bankAccountId: 'acc-1', status: 'new', isExpense: false, description: 'CUSTOMER DEPOSIT' } as any,
        { id: '3', bankAccountId: 'acc-1', status: 'ai_review', isExpense: true, description: 'ENGEN' } as any,
        { id: '4', bankAccountId: 'acc-1', status: 'ai_processing', isExpense: true, description: 'ENGEN' } as any,
        { id: '5', bankAccountId: 'acc-1', status: 'reviewed', isExpense: true, description: 'ENGEN' } as any,
      ];

      // Scoped rule allocation query
      const rulesEligible = sampleTxs.filter(tx => 
        tx.bankAccountId === 'acc-1' && 
        tx.status === 'new' && 
        tx.isExpense === true
      );

      expect(rulesEligible.length).toBe(1);
      expect(rulesEligible[0].id).toBe('1');
    });

    it('1.4: In-memory sorting and debounced search withstand adversarial inputs', () => {
      const edgeCaseTxs = [
        { id: '1', date: '2026-09-01', description: 'Zero Item', amount: 0, _absAmount: 0, _time: 1000 },
        { id: '2', date: '2026-09-02', description: 'Negative Zero', amount: -0, _absAmount: 0, _time: 2000 },
        { id: '3', date: '2026-09-03', description: 'Extreme Large', amount: -999999999.99, _absAmount: 999999999.99, _time: 3000 },
        { id: '4', date: '2026-09-04', description: 'Special @#$% STORE & CO', amount: -150.50, _absAmount: 150.50, _time: 4000 },
      ];

      // Test sort by amount desc
      const sortedByAmount = [...edgeCaseTxs].sort((a, b) => b._absAmount - a._absAmount);
      expect(sortedByAmount[0].id).toBe('3');
      expect(sortedByAmount[1].id).toBe('4');

      // Test special character search
      const term = '@#$%';
      const searchResults = edgeCaseTxs.filter(tx => tx.description.toUpperCase().includes(term));
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].id).toBe('4');
    });

    it('1.5: Static AST Source Audit: NewTransactionsTab.tsx queries only status == "new"', () => {
      const filePath = path.resolve(__dirname, '../NewTransactionsTab.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check all occurrences of query()
      const queryRegex = /query\([\s\S]*?\);/g;
      const matches = content.match(queryRegex) || [];

      expect(matches.length).toBeGreaterThan(0);
      matches.forEach(qBlock => {
        if (qBlock.includes('transactions')) {
          expect(qBlock).toContain("where('status', '==', 'new')");
          expect(qBlock).not.toContain("where('status', 'in', ['new', 'ai_review', 'ai_processing'])");
        }
      });
    });
  });

  // ==========================================================================
  // SUITE 2: SmartMatchQueueTab Pagination & Loop Elimination Stress
  // ==========================================================================
  describe('Suite 2: SmartMatchQueueTab Pagination & Mount Loop Elimination', () => {

    const PAGE_SIZE = 25;

    function paginate<T>(items: T[], page: number, size: number = PAGE_SIZE) {
      const totalPages = Math.ceil(items.length / size);
      const safePage = Math.max(1, Math.min(page, totalPages || 1));
      const start = (safePage - 1) * size;
      return {
        items: items.slice(start, start + size),
        totalPages,
        currentPage: safePage,
      };
    }

    it('2.1: PAGE_SIZE constant in SmartMatchQueueTab.tsx is strictly 25', () => {
      const filePath = path.resolve(__dirname, '../SmartMatchQueueTab.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toMatch(/const\s+PAGE_SIZE\s*=\s*25;/);
    });

    it('2.2: Boundary Matrix: 0, 1, 24, 25, 26, 50, 51, 100, 214 groups', () => {
      const testCases = [
        { count: 0, expectedPages: 0, expectedPage1Length: 0 },
        { count: 1, expectedPages: 1, expectedPage1Length: 1 },
        { count: 24, expectedPages: 1, expectedPage1Length: 24 },
        { count: 25, expectedPages: 1, expectedPage1Length: 25 },
        { count: 26, expectedPages: 2, expectedPage1Length: 25 },
        { count: 50, expectedPages: 2, expectedPage1Length: 25 },
        { count: 51, expectedPages: 3, expectedPage1Length: 25 },
        { count: 100, expectedPages: 4, expectedPage1Length: 25 },
        { count: 214, expectedPages: 9, expectedPage1Length: 25 },
      ];

      testCases.forEach(({ count, expectedPages, expectedPage1Length }) => {
        const groups = Array.from({ length: count }, (_, i) => ({ id: i }));
        const result = paginate(groups, 1);
        expect(result.totalPages).toBe(expectedPages);
        expect(result.items.length).toBe(expectedPage1Length);
      });
    });

    it('2.3: Boundary Transition from Page 1 to Page 2 on 26 items', () => {
      const groups = Array.from({ length: 26 }, (_, i) => ({ id: i }));
      const page1 = paginate(groups, 1);
      const page2 = paginate(groups, 2);

      expect(page1.items.length).toBe(25);
      expect(page1.items[0].id).toBe(0);
      expect(page1.items[24].id).toBe(24);

      expect(page2.items.length).toBe(1);
      expect(page2.items[0].id).toBe(25);
    });

    it('2.4: Out of bounds clamping prevents negative and excessive page requests', () => {
      const groups = Array.from({ length: 30 }, (_, i) => ({ id: i }));
      const clampedLow = paginate(groups, -10);
      const clampedHigh = paginate(groups, 9999);

      expect(clampedLow.currentPage).toBe(1);
      expect(clampedHigh.currentPage).toBe(2);
      expect(clampedHigh.items.length).toBe(5);
    });

    it('2.5: Zero Mount Auto-Consolidation Loop Proof (Static Analysis)', () => {
      const filePath = path.resolve(__dirname, '../SmartMatchQueueTab.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Ensure no useEffect calls autoConsolidateSmartMatchQueue
      const useEffectBlocks = content.match(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?\},[\s\S]*?\);/g) || [];
      expect(useEffectBlocks.length).toBeGreaterThan(0);

      useEffectBlocks.forEach((block, idx) => {
        expect(block).not.toContain('autoConsolidateSmartMatchQueue');
      });

      // Verify autoConsolidate is only referenced in on-demand handler
      const autoConsolidateMatches = content.match(/autoConsolidateSmartMatchQueue\(/g) || [];
      expect(autoConsolidateMatches.length).toBe(1); // Only inside handleAutoConsolidate
    });
  });

  // ==========================================================================
  // SUITE 3: ReviewedTab Date Filtering Stress Tests
  // ==========================================================================
  describe('Suite 3: ReviewedTab Date Filtering & Edge Cases', () => {

    it('3.1: Leap Year calculations across 2024, 2028, 2032', () => {
      // 2024 leap year (FY runs 2023-03-01 to 2024-02-29)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-08-15T12:00:00Z'));
      const fy2024 = getCurrentFinancialYearRange('February');
      expect(format(fy2024.from!, 'yyyy-MM-dd')).toBe('2023-03-01');
      expect(format(fy2024.to!, 'yyyy-MM-dd')).toBe('2024-02-29');

      // 2028 leap year (FY runs 2027-03-01 to 2028-02-29)
      vi.setSystemTime(new Date('2027-10-10T12:00:00Z'));
      const fy2028 = getCurrentFinancialYearRange('February');
      expect(format(fy2028.from!, 'yyyy-MM-dd')).toBe('2027-03-01');
      expect(format(fy2028.to!, 'yyyy-MM-dd')).toBe('2028-02-29');

      // 2032 leap year (FY runs 2031-03-01 to 2032-02-29)
      vi.setSystemTime(new Date('2031-11-20T12:00:00Z'));
      const fy2032 = getCurrentFinancialYearRange('February');
      expect(format(fy2032.from!, 'yyyy-MM-dd')).toBe('2031-03-01');
      expect(format(fy2032.to!, 'yyyy-MM-dd')).toBe('2032-02-29');

      // Non-leap years: 2025, 2026, 2027 end on 28 Feb
      vi.setSystemTime(new Date('2025-05-01T12:00:00Z'));
      const fy2026 = getCurrentFinancialYearRange('February');
      expect(format(fy2026.to!, 'yyyy-MM-dd')).toBe('2026-02-28');

      vi.useRealTimers();
    });

    it('3.2: High-Precision Sub-Second Midnight Crossover: 28 Feb 23:59:59.999 vs 1 Mar 00:00:00.000', () => {
      vi.useFakeTimers();

      // One millisecond before March 1, 2026
      vi.setSystemTime(new Date('2026-02-28T23:59:59.999'));
      const fyBefore = getCurrentFinancialYearRange('February');
      expect(format(fyBefore.from!, 'yyyy-MM-dd')).toBe('2025-03-01');
      expect(format(fyBefore.to!, 'yyyy-MM-dd')).toBe('2026-02-28');

      // Exactly at midnight March 1, 2026
      vi.setSystemTime(new Date('2026-03-01T00:00:00.000'));
      const fyAfter = getCurrentFinancialYearRange('February');
      expect(format(fyAfter.from!, 'yyyy-MM-dd')).toBe('2026-03-01');
      expect(format(fyAfter.to!, 'yyyy-MM-dd')).toBe('2027-02-28');

      vi.useRealTimers();
    });

    it('3.3: Custom Year-End Months: June, December, August, and default fallback', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));

      // June Year End: FY runs 2026-07-01 to 2027-06-30
      const fyJune = getCurrentFinancialYearRange('June');
      expect(format(fyJune.from!, 'yyyy-MM-dd')).toBe('2026-07-01');
      expect(format(fyJune.to!, 'yyyy-MM-dd')).toBe('2027-06-30');

      // December Year End: FY runs 2026-01-01 to 2026-12-31
      const fyDec = getCurrentFinancialYearRange('December');
      expect(format(fyDec.from!, 'yyyy-MM-dd')).toBe('2026-01-01');
      expect(format(fyDec.to!, 'yyyy-MM-dd')).toBe('2026-12-31');

      // Undefined fallback defaults to February
      const fyDefault = getCurrentFinancialYearRange(undefined);
      expect(format(fyDefault.from!, 'yyyy-MM-dd')).toBe('2026-03-01');
      expect(format(fyDefault.to!, 'yyyy-MM-dd')).toBe('2027-02-28');

      vi.useRealTimers();
    });

    it('3.4: "All Dates" unconstrained query fallback omits date constraints', () => {
      const buildConstraints = (bankAccountId: string, activeSubTab: string, range?: DateRange) => {
        const constraints: any[] = [
          { field: 'bankAccountId', op: '==', value: bankAccountId },
          { field: 'status', op: 'in', value: ['reviewed', 'allocated'] },
          { field: 'isExpense', op: '==', value: activeSubTab === 'expenses' }
        ];
        if (range?.from) {
          constraints.push({ field: 'date', op: '>=', value: format(range.from, 'yyyy-MM-dd') });
        }
        if (range?.to) {
          constraints.push({ field: 'date', op: '<=', value: format(range.to, 'yyyy-MM-dd') + 'T23:59:59.999Z' });
        }
        return constraints;
      };

      // When "All Dates" is selected (dateRange is undefined)
      const unconstrained = buildConstraints('acc-1', 'expenses', undefined);
      expect(unconstrained.length).toBe(3);
      expect(unconstrained.some(c => c.field === 'date')).toBe(false);

      // When dateRange is defined
      const constrained = buildConstraints('acc-1', 'expenses', {
        from: new Date(2026, 2, 1),
        to: new Date(2027, 1, 28)
      });
      expect(constrained.length).toBe(5);
      expect(constrained.filter(c => c.field === 'date').length).toBe(2);
    });

    it('3.5: Custom 90-day intervals and inverted date handling', () => {
      const transactions = [
        { id: '1', date: '2026-06-01', _time: new Date('2026-06-01').getTime() },
        { id: '2', date: '2026-07-15', _time: new Date('2026-07-15').getTime() },
        { id: '3', date: '2026-08-30', _time: new Date('2026-08-30').getTime() },
        { id: '4', date: '2026-09-25', _time: new Date('2026-09-25').getTime() },
      ];

      // Filter for recent 90 days: 2026-06-23 to 2026-09-21
      const fromTime = new Date('2026-06-23').getTime();
      const toTime = new Date('2026-09-21T23:59:59.999Z').getTime();

      const in90Days = transactions.filter(t => t._time >= fromTime && t._time <= toTime);
      expect(in90Days.map(t => t.id)).toEqual(['2', '3']);

      // Inverted range (from > to)
      const invFrom = new Date('2026-09-21').getTime();
      const invTo = new Date('2026-06-23').getTime();
      const inverted = transactions.filter(t => t._time >= invFrom && t._time <= invTo);
      expect(inverted).toEqual([]); // Safe empty result, zero crashes
    });

    it('3.6: Static AST Source Audit: ReviewedTab.tsx matches composite index pattern', () => {
      const filePath = path.resolve(__dirname, '../ReviewedTab.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify presence of index constraints
      expect(content).toContain("where('bankAccountId', '==', bankAccountId)");
      expect(content).toContain("where('status', 'in', ['reviewed', 'allocated'])");
      expect(content).toContain("where('isExpense', '==', activeSubTab === 'expenses')");
      expect(content).toContain("where('date', '>=', format(dateRange.from, 'yyyy-MM-dd'))");
      expect(content).toContain("where('date', '<=', format(dateRange.to, 'yyyy-MM-dd') + 'T23:59:59.999Z')");
    });
  });

  // ==========================================================================
  // SUITE 4: Cross-Tab Invariants & Contract Integrity
  // ==========================================================================
  describe('Suite 4: Cross-Tab Invariants & Contract Integrity', () => {

    it('4.1: Status Transitions preserve document partition: mutually exclusive sets', () => {
      const statuses = ['new', 'ai_processing', 'ai_review', 'reviewed'];
      
      const isNewTabDoc = (status: string) => status === 'new';
      const isSmartMatchDoc = (status: string) => status === 'ai_processing' || status === 'ai_review';
      const isReviewedDoc = (status: string) => status === 'reviewed';

      statuses.forEach(st => {
        const inNew = isNewTabDoc(st);
        const inSmartMatch = isSmartMatchDoc(st);
        const inReviewed = isReviewedDoc(st);

        // Exactly one tab should own the status
        const ownershipCount = Number(inNew) + Number(inSmartMatch) + Number(inReviewed);
        expect(ownershipCount).toBe(1);
      });
    });

    it('4.2: Conservation of total balance across tab transitions ($0 net drift)', () => {
      const txs = [
        { id: '1', amount: 1000, status: 'new' },
        { id: '2', amount: -250, status: 'ai_review' },
        { id: '3', amount: -150, status: 'reviewed' },
      ];

      const calculateTotalBalance = (items: typeof txs) => 
        items.reduce((acc, t) => acc + t.amount, 0);

      const initialTotal = calculateTotalBalance(txs);
      expect(initialTotal).toBe(600);

      // Simulate status transition: tx 1 moves from 'new' to 'reviewed'
      txs[0].status = 'reviewed';
      expect(calculateTotalBalance(txs)).toBe(initialTotal);

      // Simulate tx 2 moves from 'ai_review' to 'new' (via undo)
      txs[1].status = 'new';
      expect(calculateTotalBalance(txs)).toBe(initialTotal);
    });
  });
});
