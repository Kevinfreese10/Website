import { describe, it, expect } from 'vitest';
import { generateManagementReportPdf } from '../management-report-pdf-generator';
import type { ManagementReportData } from '../management-report-types';

describe('Management Report PDF Multi-Month Breakdown', () => {
  const mockData: ManagementReportData = {
    client: {
      id: 'test-client',
      companyName: 'ACME TRADING (PTY) LTD',
      registrationNumber: '2020/123456/07',
      isVatRegistered: true,
      vatNumber: '4123456789',
    },
    period: {
      label: 'Jul 2026 – Sep 2026',
      startDate: '2026-07-01',
      endDate: '2026-09-30',
      comparativeLabel: 'Jul 2025 – Sep 2025',
      comparativeStartDate: '2025-07-01',
      comparativeEndDate: '2025-09-30',
      months: [
        { key: '2026-07', label: 'July 2026', shortLabel: 'Jul 2026', startDate: '2026-07-01', endDate: '2026-07-31' },
        { key: '2026-08', label: 'August 2026', shortLabel: 'Aug 2026', startDate: '2026-08-01', endDate: '2026-08-31' },
        { key: '2026-09', label: 'September 2026', shortLabel: 'Sep 2026', startDate: '2026-09-01', endDate: '2026-09-30' },
      ],
    },
    kpis: {
      revenue: { current: 41533.32, prior: 0, changePct: 100 },
      grossProfit: { current: 41533.32, prior: 0, marginCurrentPct: 100, marginPriorPct: 0, changePct: 100 },
      opex: { current: 468943.16, prior: 0, changePct: 100 },
      netProfit: { current: -427409.84, prior: 0, marginCurrentPct: -1029, marginPriorPct: 0, changePct: -100 },
      cashBalance: { current: 150000, prior: 100000, netChange: 50000 },
      debtors: { current: 20000, prior: 15000, overdue: 5000, dso: 30 },
      creditors: { current: 45000, prior: 30000, overdue: 10000, dpo: 45 },
      workingCapital: { current: 125000, ratio: 1.8 },
    },
    profitAndLoss: {
      revenue: {
        title: 'REVENUE & TURNOVER',
        items: [
          {
            accountNumber: '1000-003',
            name: 'Interest Received',
            currentAmount: 41533.32,
            priorAmount: 0,
            varianceAmount: 41533.32,
            variancePct: 100,
            monthlyAmounts: {
              '2026-07': 11326.45,
              '2026-08': 15867.33,
              '2026-09': 14339.54,
            },
          },
        ],
        currentTotal: 41533.32,
        priorTotal: 0,
        varianceAmount: 41533.32,
        variancePct: 100,
        monthlyTotals: {
          '2026-07': 11326.45,
          '2026-08': 15867.33,
          '2026-09': 14339.54,
        },
      },
      costOfSales: {
        title: 'COST OF SALES',
        items: [],
        currentTotal: 0,
        priorTotal: 0,
        varianceAmount: 0,
        variancePct: 0,
        monthlyTotals: {
          '2026-07': 0,
          '2026-08': 0,
          '2026-09': 0,
        },
      },
      grossProfit: {
        current: 41533.32,
        prior: 0,
        variance: 41533.32,
        variancePct: 100,
        monthly: {
          '2026-07': 11326.45,
          '2026-08': 15867.33,
          '2026-09': 14339.54,
        },
      },
      operatingExpenses: {
        title: 'OPERATING EXPENSES',
        items: [
          {
            accountNumber: '3000-000',
            name: 'Accounting Fees',
            currentAmount: 31415,
            priorAmount: 0,
            varianceAmount: 31415,
            variancePct: 100,
            monthlyAmounts: {
              '2026-07': 10000,
              '2026-08': 11415,
              '2026-09': 10000,
            },
          },
        ],
        currentTotal: 31415,
        priorTotal: 0,
        varianceAmount: 31415,
        variancePct: 100,
        monthlyTotals: {
          '2026-07': 10000,
          '2026-08': 11415,
          '2026-09': 10000,
        },
      },
      netProfitBeforeTax: {
        current: 10118.32,
        prior: 0,
        variance: 10118.32,
        variancePct: 100,
        monthly: {
          '2026-07': 1326.45,
          '2026-08': 4452.33,
          '2026-09': 4339.54,
        },
      },
    },
    balanceSheet: {
      nonCurrentAssets: { title: 'NON-CURRENT ASSETS', items: [], currentTotal: 0, priorTotal: 0, varianceAmount: 0, variancePct: 0 },
      currentAssets: { title: 'CURRENT ASSETS', items: [], currentTotal: 150000, priorTotal: 100000, varianceAmount: 50000, variancePct: 50 },
      totalAssets: { current: 150000, prior: 100000, monthly: { '2026-07': 120000, '2026-08': 135000, '2026-09': 150000 } },
      equity: { title: 'EQUITY & RESERVES', items: [], currentTotal: 105000, priorTotal: 70000, varianceAmount: 35000, variancePct: 50 },
      nonCurrentLiabilities: { title: 'NON-CURRENT LIABILITIES', items: [], currentTotal: 0, priorTotal: 0, varianceAmount: 0, variancePct: 0 },
      currentLiabilities: { title: 'CURRENT LIABILITIES', items: [], currentTotal: 45000, priorTotal: 30000, varianceAmount: 15000, variancePct: 50 },
      totalEquityAndLiabilities: { current: 150000, prior: 100000, monthly: { '2026-07': 120000, '2026-08': 135000, '2026-09': 150000 } },
    },
    cashFlow: {
      operatingCashFlow: 50000,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashMovement: 50000,
      openingCash: 100000,
      closingCash: 150000,
    },
    taxAndVat: {
      estimatedCorporateTax: 2731.95,
      assessedLossCarriedForward: 0,
      vatLiabilityOrRefund: -5000,
      vatPeriodStatus: 'Up to date / Verified',
    },
    workingCapital: {
      debtorsTotal: 20000,
      creditorsTotal: 45000,
      ageingBuckets: [
        { label: 'Current (0-30 Days)', debtorsAmount: 15000, creditorsAmount: 35000 },
        { label: '30-60 Days', debtorsAmount: 5000, creditorsAmount: 10000 },
      ],
      topDebtors: [],
      topCreditors: [],
    },
  };

  it('generates a valid multi-month PDF document with individual month columns', () => {
    const doc = generateManagementReportPdf({ data: mockData });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(4);
    
    // Check that PDF outputs a buffer or string
    const output = doc.output('arraybuffer');
    expect(output.byteLength).toBeGreaterThan(1000);
  });

  it('generates a standard comparative PDF when only 1 month or no months array is present', () => {
    const singleMonthData = {
      ...mockData,
      period: {
        ...mockData.period,
        months: undefined,
      },
    };
    const doc = generateManagementReportPdf({ data: singleMonthData });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(4);
  });
});
