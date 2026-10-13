'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { generateManagementReportAnalysis, ManagementReportAnalysisInput } from '@/ai/flows/generate-management-report-analysis';
import type {
  ManagementReportSectionItem,
  ManagementReportStatement,
  ManagementReportKPIs,
  ManagementReportAgeingBucket,
  ManagementReportTopEntity,
  ManagementReportData,
  ManagementReportMonthSlice,
} from '@/lib/management-report-types';

function getMonthSlices(startDate: Date, endDate: Date): ManagementReportMonthSlice[] {
  const slices: ManagementReportMonthSlice[] = [];
  const curr = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endLimit = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  while (curr <= endLimit) {
    const y = curr.getFullYear();
    const m = curr.getMonth();
    const mStr = String(m + 1).padStart(2, '0');
    const key = `${y}-${mStr}`;

    const mStart = new Date(y, m, 1, 0, 0, 0, 0);
    const mEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);

    slices.push({
      key,
      label: `${monthNames[m]} ${y}`,
      shortLabel: `${shortMonthNames[m]} ${y}`,
      startDate: mStart.toISOString(),
      endDate: mEnd.toISOString(),
    });

    curr.setMonth(curr.getMonth() + 1);
  }
  return slices;
}

export async function getManagementReportDataAction({
  clientId,
  idToken,
  startDateStr,
  endDateStr,
  periodLabel,
  comparativeStartDateStr,
  comparativeEndDateStr,
  comparativePeriodLabel,
}: {
  clientId: string;
  idToken?: string;
  startDateStr: string;
  endDateStr: string;
  periodLabel: string;
  comparativeStartDateStr: string;
  comparativeEndDateStr: string;
  comparativePeriodLabel: string;
}): Promise<{ success: boolean; data?: ManagementReportData; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const clientDoc = await adminDb.collection('aiAccountantClients').doc(clientId).get();
    if (!clientDoc.exists) {
      return { success: false, error: 'Client not found' };
    }
    const clientData = clientDoc.data() as any;

    // Fetch transactions
    const txSnap = await adminDb
      .collection('aiAccountantClients')
      .doc(clientId)
      .collection('transactions')
      .get();
    const allTxs = txSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Fetch customers
    const custSnap = await adminDb
      .collection('aiAccountantClients')
      .doc(clientId)
      .collection('customers')
      .get();
    const customers = custSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Fetch suppliers
    const suppSnap = await adminDb
      .collection('aiAccountantClients')
      .doc(clientId)
      .collection('suppliers')
      .get();
    const suppliers = suppSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    const chartOfAccounts: any[] = clientData.chartOfAccounts || [];
    const coaMap = new Map<string, any>();
    chartOfAccounts.forEach((acc) => coaMap.set(acc.id, acc));

    const currentStart = new Date(startDateStr);
    const currentEnd = new Date(endDateStr);
    const priorStart = new Date(comparativeStartDateStr);
    const priorEnd = new Date(comparativeEndDateStr);

    // Monthly breakdown slices
    const monthSlices = getMonthSlices(currentStart, currentEnd);
    const monthlyPeriodBalances = new Map<string, Map<string, number>>();
    const monthlyCumulativeBalances = new Map<string, Map<string, number>>();

    monthSlices.forEach((m) => {
      const pMap = new Map<string, number>();
      const cMap = new Map<string, number>();
      chartOfAccounts.forEach((acc) => {
        pMap.set(acc.id, 0);
        cMap.set(acc.id, 0);
      });
      monthlyPeriodBalances.set(m.key, pMap);
      monthlyCumulativeBalances.set(m.key, cMap);
    });

    // Helpers to accumulate account balances for period
    const currentPeriodBalances = new Map<string, number>();
    const priorPeriodBalances = new Map<string, number>();
    const cumulativeCurrentBalances = new Map<string, number>(); // for Balance sheet as at currentEnd
    const cumulativePriorBalances = new Map<string, number>(); // for Balance sheet as at priorEnd

    chartOfAccounts.forEach((acc) => {
      currentPeriodBalances.set(acc.id, 0);
      priorPeriodBalances.set(acc.id, 0);
      cumulativeCurrentBalances.set(acc.id, 0);
      cumulativePriorBalances.set(acc.id, 0);
    });

    const supplierControl = chartOfAccounts.find((a) => a.accountNumber === '7000-000' || a.id === '7000-000');
    const customerControl = chartOfAccounts.find((a) => a.accountNumber === '8000-001' || a.id === '8000-001');
    const vatControl = chartOfAccounts.find((a) => a.accountNumber === '7000-008' || a.id === '7000-008');

    const supplierControlId = supplierControl?.id || '7000-000';
    const customerControlId = customerControl?.id || '8000-001';
    const vatControlId = vatControl?.id || '7000-008';

    const processAllocation = (
      accountId: string,
      amt: number,
      type?: string,
      isCurrent?: boolean,
      isPrior?: boolean,
      isCumCurrent?: boolean,
      isCumPrior?: boolean,
      txnDate?: Date
    ) => {
      let targetId = accountId;
      if (type === 'supplier') targetId = supplierControlId;
      else if (type === 'customer') targetId = customerControlId;

      let account = chartOfAccounts.find((a) => a.id === targetId || a.accountNumber === targetId);
      if (!account) {
        targetId = '9500-001';
        account = chartOfAccounts.find((a) => a.id === targetId || a.accountNumber === targetId);
      }
      if (!account) return;

      const effectiveId = account.id;

      if (isCurrent) {
        currentPeriodBalances.set(effectiveId, (currentPeriodBalances.get(effectiveId) || 0) + amt);
      }
      if (isPrior) {
        priorPeriodBalances.set(effectiveId, (priorPeriodBalances.get(effectiveId) || 0) + amt);
      }
      if (isCumCurrent) {
        cumulativeCurrentBalances.set(effectiveId, (cumulativeCurrentBalances.get(effectiveId) || 0) + amt);
      }
      if (isCumPrior) {
        cumulativePriorBalances.set(effectiveId, (cumulativePriorBalances.get(effectiveId) || 0) + amt);
      }

      if (txnDate) {
        monthSlices.forEach((m) => {
          const mStartDate = new Date(m.startDate);
          const mEndDate = new Date(m.endDate);
          if (txnDate >= mStartDate && txnDate <= mEndDate) {
            const pMap = monthlyPeriodBalances.get(m.key);
            if (pMap) pMap.set(effectiveId, (pMap.get(effectiveId) || 0) + amt);
          }
          if (txnDate <= mEndDate) {
            const cMap = monthlyCumulativeBalances.get(m.key);
            if (cMap) cMap.set(effectiveId, (cMap.get(effectiveId) || 0) + amt);
          }
        });
      }
    };

    allTxs.forEach((tx) => {
      const d = new Date(tx.date);
      const isCurrent = d >= currentStart && d <= currentEnd;
      const isPrior = d >= priorStart && d <= priorEnd;
      const isCumCurrent = d <= currentEnd;
      const isCumPrior = d <= priorEnd;

      if (!isCurrent && !isPrior && !isCumCurrent && !isCumPrior) return;

      const postEntry = (accId: string, amt: number, type?: string) => {
        processAllocation(accId, amt, type, isCurrent, isPrior, isCumCurrent, isCumPrior, d);
      };

      if (tx.bankAccountId === 'JOURNAL') {
        if (tx.allocatedTo?.value) {
          postEntry(tx.allocatedTo.value, tx.amount, tx.allocatedTo.type);
        } else if (tx.allocations && Array.isArray(tx.allocations)) {
          tx.allocations.forEach((alloc: any) => {
            postEntry(alloc.accountId, alloc.amount, alloc.type);
          });
        }
      } else if (tx.bankAccountId) {
        // Bank transaction
        const inclusiveAmount = tx.amount;
        const isStandardVat = clientData.isVatRegistered && (
          tx.vatType === 'standard_rated_purchases' ||
          tx.vatType === 'standard_rated_sales' ||
          tx.vatType === 'capital_goods_purchases'
        );

        let vatAmount = 0;
        let exclusiveAmount = inclusiveAmount;
        if (isStandardVat) {
          vatAmount = (inclusiveAmount / 1.15) * 0.15;
          exclusiveAmount = inclusiveAmount - vatAmount;
        }

        // 1. Bank leg (always inclusive)
        postEntry(tx.bankAccountId, inclusiveAmount);

        // 2. Contra leg
        let contraAccountId = '9500-001';
        let contraType = 'account';
        if (((tx.status as string) === 'allocated' || tx.status === 'reviewed') && tx.allocatedTo) {
          contraAccountId = tx.allocatedTo.value;
          contraType = tx.allocatedTo.type || 'account';
        }
        postEntry(contraAccountId, -exclusiveAmount, contraType);

        // 3. VAT leg
        if (isStandardVat && vatControl) {
          postEntry(vatControl.id, -vatAmount);
        }
      } else if (tx.allocations && Array.isArray(tx.allocations) && tx.allocations.length > 0) {
        tx.allocations.forEach((alloc: any) => {
          postEntry(alloc.accountId, alloc.amount, alloc.type);
        });
      } else if (tx.accountId) {
        postEntry(tx.accountId, tx.amount, tx.type);
      }
    });

    // 1. PROFIT & LOSS CALCULATIONS
    let currentRevenue = 0;
    let priorRevenue = 0;
    const revenueItems: ManagementReportSectionItem[] = [];

    let currentCostOfSales = 0;
    let priorCostOfSales = 0;
    const cosItems: ManagementReportSectionItem[] = [];

    let currentOpex = 0;
    let priorOpex = 0;
    const opexItems: ManagementReportSectionItem[] = [];

    chartOfAccounts.forEach((acc) => {
      if (acc.section === 'Income Statement') {
        const cur = currentPeriodBalances.get(acc.id) || 0;
        const pri = priorPeriodBalances.get(acc.id) || 0;
        const desc = (acc.description || '').toLowerCase();
        const num = acc.accountNumber || '';

        const isRevenue =
          acc.category === 'Revenue' ||
          acc.category === 'Sales' ||
          acc.category === 'Other Income' ||
          acc.fsGroup === 'Revenue' ||
          acc.fsGroup === 'Other Income' ||
          num === '1000-000' ||
          num === '1000-001' ||
          num === '1000-002' ||
          num === '1000-003' ||
          num === '1000-004' ||
          num === '1000-005' ||
          num === '1000-006' ||
          num === '1000-007' ||
          num === '1000-008' ||
          (num.startsWith('1000-') && acc.section === 'Income Statement') ||
          desc.includes('sales') ||
          desc.includes('turnover') ||
          desc.includes('revenue') ||
          desc === 'interest';

        const isCostOfSales =
          !isRevenue &&
          (acc.category === 'Cost of Sales' ||
            acc.category === 'Direct Costs' ||
            acc.fsGroup === 'Cost of Sales' ||
            num === '2000-000' ||
            num === '2000-001' ||
            num === '2000-002' ||
            num === '2000-003' ||
            num.startsWith('2000-'));

        if (isRevenue) {
          // Revenue in credits (negative) => convert to positive
          const curVal = -cur;
          const priVal = -pri;
          const monthlyAmounts: Record<string, number> = {};
          let hasAnyMonthly = false;
          monthSlices.forEach((m) => {
            const mVal = -(monthlyPeriodBalances.get(m.key)?.get(acc.id) || 0);
            monthlyAmounts[m.key] = mVal;
            if (Math.abs(mVal) > 0.001) hasAnyMonthly = true;
          });

          currentRevenue += curVal;
          priorRevenue += priVal;
          if (curVal !== 0 || priVal !== 0 || hasAnyMonthly) {
            const varAmt = curVal - priVal;
            const varPct = priVal !== 0 ? (varAmt / Math.abs(priVal)) * 100 : curVal > 0 ? 100 : 0;
            revenueItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: curVal,
              priorAmount: priVal,
              varianceAmount: varAmt,
              variancePct: parseFloat(varPct.toFixed(1)),
              monthlyAmounts,
            });
          }
        } else if (isCostOfSales) {
          const monthlyAmounts: Record<string, number> = {};
          let hasAnyMonthly = false;
          monthSlices.forEach((m) => {
            const mVal = monthlyPeriodBalances.get(m.key)?.get(acc.id) || 0;
            monthlyAmounts[m.key] = mVal;
            if (Math.abs(mVal) > 0.001) hasAnyMonthly = true;
          });

          currentCostOfSales += cur;
          priorCostOfSales += pri;
          if (cur !== 0 || pri !== 0 || hasAnyMonthly) {
            const varAmt = cur - pri;
            const varPct = pri !== 0 ? (varAmt / Math.abs(pri)) * 100 : cur > 0 ? 100 : 0;
            cosItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: cur,
              priorAmount: pri,
              varianceAmount: varAmt,
              variancePct: parseFloat(varPct.toFixed(1)),
              monthlyAmounts,
            });
          }
        } else {
          // Operating Expenses
          const monthlyAmounts: Record<string, number> = {};
          let hasAnyMonthly = false;
          monthSlices.forEach((m) => {
            const mVal = monthlyPeriodBalances.get(m.key)?.get(acc.id) || 0;
            monthlyAmounts[m.key] = mVal;
            if (Math.abs(mVal) > 0.001) hasAnyMonthly = true;
          });

          currentOpex += cur;
          priorOpex += pri;
          if (cur !== 0 || pri !== 0 || hasAnyMonthly) {
            const varAmt = cur - pri;
            const varPct = pri !== 0 ? (varAmt / Math.abs(pri)) * 100 : cur > 0 ? 100 : 0;
            opexItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: cur,
              priorAmount: pri,
              varianceAmount: varAmt,
              variancePct: parseFloat(varPct.toFixed(1)),
              monthlyAmounts,
            });
          }
        }
      }
    });

    const currentGrossProfit = currentRevenue - currentCostOfSales;
    const priorGrossProfit = priorRevenue - priorCostOfSales;
    const gpVarAmt = currentGrossProfit - priorGrossProfit;
    const gpVarPct = priorGrossProfit !== 0 ? (gpVarAmt / Math.abs(priorGrossProfit)) * 100 : currentGrossProfit > 0 ? 100 : 0;

    const currentNetProfit = currentGrossProfit - currentOpex;
    const priorNetProfit = priorGrossProfit - priorOpex;
    const npVarAmt = currentNetProfit - priorNetProfit;
    const npVarPct = priorNetProfit !== 0 ? (npVarAmt / Math.abs(priorNetProfit)) * 100 : currentNetProfit > 0 ? 100 : 0;

    const revenueMonthlyTotals: Record<string, number> = {};
    const cosMonthlyTotals: Record<string, number> = {};
    const gpMonthlyTotals: Record<string, number> = {};
    const opexMonthlyTotals: Record<string, number> = {};
    const npMonthlyTotals: Record<string, number> = {};

    monthSlices.forEach((m) => {
      revenueMonthlyTotals[m.key] = revenueItems.reduce((acc, i) => acc + (i.monthlyAmounts?.[m.key] || 0), 0);
      cosMonthlyTotals[m.key] = cosItems.reduce((acc, i) => acc + (i.monthlyAmounts?.[m.key] || 0), 0);
      gpMonthlyTotals[m.key] = revenueMonthlyTotals[m.key] - cosMonthlyTotals[m.key];
      opexMonthlyTotals[m.key] = opexItems.reduce((acc, i) => acc + (i.monthlyAmounts?.[m.key] || 0), 0);
      npMonthlyTotals[m.key] = gpMonthlyTotals[m.key] - opexMonthlyTotals[m.key];
    });

    // 2. BALANCE SHEET CALCULATIONS (Cumulative to period end)
    let nonCurrentAssetsTotalCur = 0;
    let nonCurrentAssetsTotalPri = 0;
    const ncaItems: ManagementReportSectionItem[] = [];

    let currentAssetsTotalCur = 0;
    let currentAssetsTotalPri = 0;
    const caItems: ManagementReportSectionItem[] = [];

    let equityTotalCur = 0;
    let equityTotalPri = 0;
    const eqItems: ManagementReportSectionItem[] = [];

    let nonCurrentLiabilitiesTotalCur = 0;
    let nonCurrentLiabilitiesTotalPri = 0;
    const nclItems: ManagementReportSectionItem[] = [];

    let currentLiabilitiesTotalCur = 0;
    let currentLiabilitiesTotalPri = 0;
    const clItems: ManagementReportSectionItem[] = [];

    chartOfAccounts.forEach((acc) => {
      if (acc.section === 'Balance Sheet') {
        const cur = cumulativeCurrentBalances.get(acc.id) || 0;
        const pri = cumulativePriorBalances.get(acc.id) || 0;
        const num = acc.accountNumber || '';

        const isNca =
          acc.category === 'Non-Current Assets' ||
          acc.category === 'Fixed Assets' ||
          num.startsWith('1000-000') ||
          num.startsWith('1500-') ||
          num.startsWith('1600-') ||
          num.startsWith('1700-') ||
          num.startsWith('1800-') ||
          num.startsWith('1900-');

        const isCa =
          !isNca &&
          (acc.category === 'Current Assets' ||
            acc.category === 'Bank' ||
            acc.category === 'Accounts Receivable' ||
            num.startsWith('8'));

        const isEq =
          acc.category === 'Equity' ||
          acc.category === 'Capital' ||
          num.startsWith('9000-') ||
          num.startsWith('9100-');

        const isNcl =
          acc.category === 'Non-Current Liabilities' ||
          acc.category === 'Long Term Liabilities' ||
          num.startsWith('7500-') ||
          num.startsWith('7600-') ||
          num.startsWith('7700-') ||
          num.startsWith('7800-') ||
          num.startsWith('7900-');

        const isCl =
          !isEq &&
          !isNcl &&
          (acc.category === 'Current Liabilities' ||
            acc.category === 'Accounts Payable' ||
            acc.category === 'Tax Liabilities' ||
            num.startsWith('7000-') ||
            num.startsWith('7100-') ||
            num.startsWith('7200-') ||
            num.startsWith('7300-') ||
            num.startsWith('7400-') ||
            num.startsWith('9500-'));

        if (isNca) {
          const monthlyAmounts: Record<string, number> = {};
          let hasAnyMonthly = false;
          monthSlices.forEach((m) => {
            const mVal = monthlyCumulativeBalances.get(m.key)?.get(acc.id) || 0;
            monthlyAmounts[m.key] = mVal;
            if (Math.abs(mVal) > 0.001) hasAnyMonthly = true;
          });

          nonCurrentAssetsTotalCur += cur;
          nonCurrentAssetsTotalPri += pri;
          if (cur !== 0 || pri !== 0 || hasAnyMonthly) {
            ncaItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: cur,
              priorAmount: pri,
              varianceAmount: cur - pri,
              variancePct: pri !== 0 ? parseFloat(((cur - pri) / Math.abs(pri) * 100).toFixed(1)) : 0,
              monthlyAmounts,
            });
          }
        } else if (isCa) {
          const monthlyAmounts: Record<string, number> = {};
          let hasAnyMonthly = false;
          monthSlices.forEach((m) => {
            const mVal = monthlyCumulativeBalances.get(m.key)?.get(acc.id) || 0;
            monthlyAmounts[m.key] = mVal;
            if (Math.abs(mVal) > 0.001) hasAnyMonthly = true;
          });

          currentAssetsTotalCur += cur;
          currentAssetsTotalPri += pri;
          if (cur !== 0 || pri !== 0 || hasAnyMonthly) {
            caItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: cur,
              priorAmount: pri,
              varianceAmount: cur - pri,
              variancePct: pri !== 0 ? parseFloat(((cur - pri) / Math.abs(pri) * 100).toFixed(1)) : 0,
              monthlyAmounts,
            });
          }
        } else if (isEq) {
          const curVal = -cur;
          const priVal = -pri;
          const monthlyAmounts: Record<string, number> = {};
          let hasAnyMonthly = false;
          monthSlices.forEach((m) => {
            const mVal = -(monthlyCumulativeBalances.get(m.key)?.get(acc.id) || 0);
            monthlyAmounts[m.key] = mVal;
            if (Math.abs(mVal) > 0.001) hasAnyMonthly = true;
          });

          equityTotalCur += curVal;
          equityTotalPri += priVal;
          if (curVal !== 0 || priVal !== 0 || hasAnyMonthly) {
            eqItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: curVal,
              priorAmount: priVal,
              varianceAmount: curVal - priVal,
              variancePct: priVal !== 0 ? parseFloat(((curVal - priVal) / Math.abs(priVal) * 100).toFixed(1)) : 0,
              monthlyAmounts,
            });
          }
        } else if (isNcl) {
          const curVal = -cur;
          const priVal = -pri;
          const monthlyAmounts: Record<string, number> = {};
          let hasAnyMonthly = false;
          monthSlices.forEach((m) => {
            const mVal = -(monthlyCumulativeBalances.get(m.key)?.get(acc.id) || 0);
            monthlyAmounts[m.key] = mVal;
            if (Math.abs(mVal) > 0.001) hasAnyMonthly = true;
          });

          nonCurrentLiabilitiesTotalCur += curVal;
          nonCurrentLiabilitiesTotalPri += priVal;
          if (curVal !== 0 || priVal !== 0 || hasAnyMonthly) {
            nclItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: curVal,
              priorAmount: priVal,
              varianceAmount: curVal - priVal,
              variancePct: priVal !== 0 ? parseFloat(((curVal - priVal) / Math.abs(priVal) * 100).toFixed(1)) : 0,
              monthlyAmounts,
            });
          }
        } else if (isCl) {
          const curVal = -cur;
          const priVal = -pri;
          const monthlyAmounts: Record<string, number> = {};
          let hasAnyMonthly = false;
          monthSlices.forEach((m) => {
            const mVal = -(monthlyCumulativeBalances.get(m.key)?.get(acc.id) || 0);
            monthlyAmounts[m.key] = mVal;
            if (Math.abs(mVal) > 0.001) hasAnyMonthly = true;
          });

          currentLiabilitiesTotalCur += curVal;
          currentLiabilitiesTotalPri += priVal;
          if (curVal !== 0 || priVal !== 0 || hasAnyMonthly) {
            clItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: curVal,
              priorAmount: priVal,
              varianceAmount: curVal - priVal,
              variancePct: priVal !== 0 ? parseFloat(((curVal - priVal) / Math.abs(priVal) * 100).toFixed(1)) : 0,
              monthlyAmounts,
            });
          }
        }
      }
    });

    // Add cumulative retained profit into equity to balance the Balance Sheet
    let cumulativeNetProfitCur = 0;
    let cumulativeNetProfitPri = 0;
    chartOfAccounts.forEach((acc) => {
      if (acc.section === 'Income Statement') {
        const cur = cumulativeCurrentBalances.get(acc.id) || 0;
        const pri = cumulativePriorBalances.get(acc.id) || 0;
        cumulativeNetProfitCur -= cur;
        cumulativeNetProfitPri -= pri;
      }
    });

    const monthlyRetainedProfit: Record<string, number> = {};
    monthSlices.forEach((m) => {
      let mCumNet = 0;
      chartOfAccounts.forEach((acc) => {
        if (acc.section === 'Income Statement') {
          const val = monthlyCumulativeBalances.get(m.key)?.get(acc.id) || 0;
          mCumNet -= val;
        }
      });
      monthlyRetainedProfit[m.key] = mCumNet;
    });

    equityTotalCur += cumulativeNetProfitCur;
    equityTotalPri += cumulativeNetProfitPri;
    eqItems.push({
      name: 'Net Profit / (Loss) for the Period',
      currentAmount: cumulativeNetProfitCur,
      priorAmount: cumulativeNetProfitPri,
      varianceAmount: cumulativeNetProfitCur - cumulativeNetProfitPri,
      variancePct: cumulativeNetProfitPri !== 0 ? parseFloat(((cumulativeNetProfitCur - cumulativeNetProfitPri) / Math.abs(cumulativeNetProfitPri) * 100).toFixed(1)) : 0,
      monthlyAmounts: monthlyRetainedProfit,
    });

    // Balance Sheet section and grand monthly totals
    const ncaMonthlyTotals: Record<string, number> = {};
    const caMonthlyTotals: Record<string, number> = {};
    const totalAssetsMonthly: Record<string, number> = {};
    const eqMonthlyTotals: Record<string, number> = {};
    const nclMonthlyTotals: Record<string, number> = {};
    const clMonthlyTotals: Record<string, number> = {};
    const totalEquityAndLiabMonthly: Record<string, number> = {};

    monthSlices.forEach((m) => {
      ncaMonthlyTotals[m.key] = ncaItems.reduce((acc, i) => acc + (i.monthlyAmounts?.[m.key] || 0), 0);
      caMonthlyTotals[m.key] = caItems.reduce((acc, i) => acc + (i.monthlyAmounts?.[m.key] || 0), 0);
      totalAssetsMonthly[m.key] = ncaMonthlyTotals[m.key] + caMonthlyTotals[m.key];

      eqMonthlyTotals[m.key] = eqItems.reduce((acc, i) => acc + (i.monthlyAmounts?.[m.key] || 0), 0);
      nclMonthlyTotals[m.key] = nclItems.reduce((acc, i) => acc + (i.monthlyAmounts?.[m.key] || 0), 0);
      clMonthlyTotals[m.key] = clItems.reduce((acc, i) => acc + (i.monthlyAmounts?.[m.key] || 0), 0);
      totalEquityAndLiabMonthly[m.key] = eqMonthlyTotals[m.key] + nclMonthlyTotals[m.key] + clMonthlyTotals[m.key];
    });

    const totalAssetsCur = nonCurrentAssetsTotalCur + currentAssetsTotalCur;
    const totalAssetsPri = nonCurrentAssetsTotalPri + currentAssetsTotalPri;
    const totalEquityAndLiabCur = equityTotalCur + nonCurrentLiabilitiesTotalCur + currentLiabilitiesTotalCur;
    const totalEquityAndLiabPri = equityTotalPri + nonCurrentLiabilitiesTotalPri + currentLiabilitiesTotalPri;

    // 3. CASH & LIQUIDITY
    let bankCashCur = 0;
    let bankCashPri = 0;
    chartOfAccounts.forEach((acc) => {
      const num = acc.accountNumber || '';
      const desc = (acc.description || '').toLowerCase();
      if (
        num.startsWith('8400-') ||
        acc.category === 'Bank' ||
        (acc.section === 'Balance Sheet' &&
          (desc.includes('investec') ||
            desc.includes('fnb') ||
            desc.includes('standard bank') ||
            desc.includes('nedbank') ||
            desc.includes('absa') ||
            desc.includes('cheque') ||
            desc.includes('current account') ||
            desc.includes('petty cash')))
      ) {
        bankCashCur += cumulativeCurrentBalances.get(acc.id) || 0;
        bankCashPri += cumulativePriorBalances.get(acc.id) || 0;
      }
    });

    const netCashChange = bankCashCur - bankCashPri;

    // 4. WORKING CAPITAL & AGEING
    let totalDebtors = 0;
    let overdueDebtors = 0;
    const topDebtorsList: ManagementReportTopEntity[] = [];

    customers.forEach((c) => {
      const bal = c.balance || 0;
      if (bal > 0) {
        totalDebtors += bal;
        const overdue = (c.days30 || 0) + (c.days60 || 0) + (c.days90 || 0);
        overdueDebtors += overdue;
        topDebtorsList.push({
          id: c.id,
          name: c.name || 'Unnamed Customer',
          totalBalance: bal,
          overdueBalance: overdue,
          currentBucket: c.current || 0,
          days30Bucket: c.days30 || 0,
          days60Bucket: c.days60 || 0,
          days90PlusBucket: c.days90 || 0,
        });
      }
    });
    topDebtorsList.sort((a, b) => b.totalBalance - a.totalBalance);

    let totalCreditors = 0;
    let overdueCreditors = 0;
    const topCreditorsList: ManagementReportTopEntity[] = [];

    suppliers.forEach((s) => {
      const bal = s.balance || 0;
      if (bal > 0) {
        totalCreditors += bal;
        const overdue = (s.days30 || 0) + (s.days60 || 0) + (s.days90 || 0);
        overdueCreditors += overdue;
        topCreditorsList.push({
          id: s.id,
          name: s.name || 'Unnamed Supplier',
          totalBalance: bal,
          overdueBalance: overdue,
          currentBucket: s.current || 0,
          days30Bucket: s.days30 || 0,
          days60Bucket: s.days60 || 0,
          days90PlusBucket: s.days90 || 0,
        });
      }
    });
    topCreditorsList.sort((a, b) => b.totalBalance - a.totalBalance);

    const periodDays = Math.max(1, Math.round((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)));
    const dso = currentRevenue > 0 ? Math.round((totalDebtors / currentRevenue) * periodDays) : 0;
    const dpo = currentCostOfSales > 0 ? Math.round((totalCreditors / currentCostOfSales) * periodDays) : 0;
    const currentRatio = currentLiabilitiesTotalCur > 0 ? parseFloat((currentAssetsTotalCur / currentLiabilitiesTotalCur).toFixed(2)) : 1.0;

    const ageingBuckets: ManagementReportAgeingBucket[] = [
      {
        label: 'Current (0-30 days)',
        debtorsAmount: topDebtorsList.reduce((sum, d) => sum + d.currentBucket, 0),
        creditorsAmount: topCreditorsList.reduce((sum, c) => sum + c.currentBucket, 0),
      },
      {
        label: '31 - 60 days',
        debtorsAmount: topDebtorsList.reduce((sum, d) => sum + d.days30Bucket, 0),
        creditorsAmount: topCreditorsList.reduce((sum, c) => sum + c.days30Bucket, 0),
      },
      {
        label: '61 - 90 days',
        debtorsAmount: topDebtorsList.reduce((sum, d) => sum + d.days60Bucket, 0),
        creditorsAmount: topCreditorsList.reduce((sum, c) => sum + c.days60Bucket, 0),
      },
      {
        label: '90+ days Overdue',
        debtorsAmount: topDebtorsList.reduce((sum, d) => sum + d.days90PlusBucket, 0),
        creditorsAmount: topCreditorsList.reduce((sum, c) => sum + c.days90PlusBucket, 0),
      },
    ];

    // 5. TAX & VAT POSITION
    const vatBalance = -(cumulativeCurrentBalances.get(vatControlId) || 0);
    const estimatedAnnualTurnover = currentRevenue * (365 / periodDays);
    const estimatedCorporateTax = currentNetProfit > 0 ? currentNetProfit * 0.27 : 0;

    const kpis: ManagementReportKPIs = {
      revenue: {
        current: currentRevenue,
        prior: priorRevenue,
        changePct: priorRevenue !== 0 ? parseFloat(((currentRevenue - priorRevenue) / Math.abs(priorRevenue) * 100).toFixed(1)) : 0,
      },
      grossProfit: {
        current: currentGrossProfit,
        prior: priorGrossProfit,
        marginCurrentPct: currentRevenue > 0 ? parseFloat(((currentGrossProfit / currentRevenue) * 100).toFixed(1)) : 0,
        marginPriorPct: priorRevenue > 0 ? parseFloat(((priorGrossProfit / priorRevenue) * 100).toFixed(1)) : 0,
        changePct: parseFloat(gpVarPct.toFixed(1)),
      },
      opex: {
        current: currentOpex,
        prior: priorOpex,
        changePct: priorOpex !== 0 ? parseFloat(((currentOpex - priorOpex) / Math.abs(priorOpex) * 100).toFixed(1)) : 0,
      },
      netProfit: {
        current: currentNetProfit,
        prior: priorNetProfit,
        marginCurrentPct: currentRevenue > 0 ? parseFloat(((currentNetProfit / currentRevenue) * 100).toFixed(1)) : 0,
        marginPriorPct: priorRevenue > 0 ? parseFloat(((priorNetProfit / priorRevenue) * 100).toFixed(1)) : 0,
        changePct: parseFloat(npVarPct.toFixed(1)),
      },
      cashBalance: {
        current: bankCashCur,
        prior: bankCashPri,
        netChange: netCashChange,
      },
      debtors: {
        current: totalDebtors,
        prior: 0,
        overdue: overdueDebtors,
        dso,
      },
      creditors: {
        current: totalCreditors,
        prior: 0,
        overdue: overdueCreditors,
        dpo,
      },
      workingCapital: {
        current: currentAssetsTotalCur - currentLiabilitiesTotalCur,
        ratio: currentRatio,
      },
    };

    const data: ManagementReportData = {
      client: {
        id: clientId,
        companyName: clientData.companyName || clientData.name || 'Company',
        tradingName: clientData.tradingName,
        registrationNumber: clientData.registrationNumber || clientData.companyRegistrationNumber,
        taxNumber: clientData.taxNumber || clientData.incomeTaxNumber,
        vatNumber: clientData.vatNumber,
        isVatRegistered: !!clientData.isVatRegistered,
        yearEnd: clientData.yearEnd,
      },
      period: {
        label: periodLabel,
        startDate: startDateStr,
        endDate: endDateStr,
        comparativeLabel: comparativePeriodLabel,
        comparativeStartDate: comparativeStartDateStr,
        comparativeEndDate: comparativeEndDateStr,
        months: monthSlices,
      },
      kpis,
      profitAndLoss: {
        revenue: {
          title: 'Revenue & Sales',
          items: revenueItems,
          currentTotal: currentRevenue,
          priorTotal: priorRevenue,
          varianceAmount: currentRevenue - priorRevenue,
          variancePct: priorRevenue !== 0 ? parseFloat(((currentRevenue - priorRevenue) / Math.abs(priorRevenue) * 100).toFixed(1)) : 0,
          monthlyTotals: revenueMonthlyTotals,
        },
        costOfSales: {
          title: 'Cost of Sales',
          items: cosItems,
          currentTotal: currentCostOfSales,
          priorTotal: priorCostOfSales,
          varianceAmount: currentCostOfSales - priorCostOfSales,
          variancePct: priorCostOfSales !== 0 ? parseFloat(((currentCostOfSales - priorCostOfSales) / Math.abs(priorCostOfSales) * 100).toFixed(1)) : 0,
          monthlyTotals: cosMonthlyTotals,
        },
        grossProfit: {
          current: currentGrossProfit,
          prior: priorGrossProfit,
          variance: gpVarAmt,
          variancePct: parseFloat(gpVarPct.toFixed(1)),
          monthly: gpMonthlyTotals,
        },
        operatingExpenses: {
          title: 'Operating Expenses',
          items: opexItems,
          currentTotal: currentOpex,
          priorTotal: priorOpex,
          varianceAmount: currentOpex - priorOpex,
          variancePct: priorOpex !== 0 ? parseFloat(((currentOpex - priorOpex) / Math.abs(priorOpex) * 100).toFixed(1)) : 0,
          monthlyTotals: opexMonthlyTotals,
        },
        netProfitBeforeTax: {
          current: currentNetProfit,
          prior: priorNetProfit,
          variance: npVarAmt,
          variancePct: parseFloat(npVarPct.toFixed(1)),
          monthly: npMonthlyTotals,
        },
      },
      balanceSheet: {
        nonCurrentAssets: {
          title: 'Non-Current Assets',
          items: ncaItems,
          currentTotal: nonCurrentAssetsTotalCur,
          priorTotal: nonCurrentAssetsTotalPri,
          varianceAmount: nonCurrentAssetsTotalCur - nonCurrentAssetsTotalPri,
          variancePct: nonCurrentAssetsTotalPri !== 0 ? parseFloat(((nonCurrentAssetsTotalCur - nonCurrentAssetsTotalPri) / Math.abs(nonCurrentAssetsTotalPri) * 100).toFixed(1)) : 0,
          monthlyTotals: ncaMonthlyTotals,
        },
        currentAssets: {
          title: 'Current Assets',
          items: caItems,
          currentTotal: currentAssetsTotalCur,
          priorTotal: currentAssetsTotalPri,
          varianceAmount: currentAssetsTotalCur - currentAssetsTotalPri,
          variancePct: currentAssetsTotalPri !== 0 ? parseFloat(((currentAssetsTotalCur - currentAssetsTotalPri) / Math.abs(currentAssetsTotalPri) * 100).toFixed(1)) : 0,
          monthlyTotals: caMonthlyTotals,
        },
        totalAssets: {
          current: totalAssetsCur,
          prior: totalAssetsPri,
          monthly: totalAssetsMonthly,
        },
        equity: {
          title: 'Capital & Reserves (Equity)',
          items: eqItems,
          currentTotal: equityTotalCur,
          priorTotal: equityTotalPri,
          varianceAmount: equityTotalCur - equityTotalPri,
          variancePct: equityTotalPri !== 0 ? parseFloat(((equityTotalCur - equityTotalPri) / Math.abs(equityTotalPri) * 100).toFixed(1)) : 0,
          monthlyTotals: eqMonthlyTotals,
        },
        nonCurrentLiabilities: {
          title: 'Non-Current Liabilities',
          items: nclItems,
          currentTotal: nonCurrentLiabilitiesTotalCur,
          priorTotal: nonCurrentLiabilitiesTotalPri,
          varianceAmount: nonCurrentLiabilitiesTotalCur - nonCurrentLiabilitiesTotalPri,
          variancePct: nonCurrentLiabilitiesTotalPri !== 0 ? parseFloat(((nonCurrentLiabilitiesTotalCur - nonCurrentLiabilitiesTotalPri) / Math.abs(nonCurrentLiabilitiesTotalPri) * 100).toFixed(1)) : 0,
          monthlyTotals: nclMonthlyTotals,
        },
        currentLiabilities: {
          title: 'Current Liabilities',
          items: clItems,
          currentTotal: currentLiabilitiesTotalCur,
          priorTotal: currentLiabilitiesTotalPri,
          varianceAmount: currentLiabilitiesTotalCur - currentLiabilitiesTotalPri,
          variancePct: currentLiabilitiesTotalPri !== 0 ? parseFloat(((currentLiabilitiesTotalCur - currentLiabilitiesTotalPri) / Math.abs(currentLiabilitiesTotalPri) * 100).toFixed(1)) : 0,
          monthlyTotals: clMonthlyTotals,
        },
        totalEquityAndLiabilities: {
          current: totalEquityAndLiabCur,
          prior: totalEquityAndLiabPri,
          monthly: totalEquityAndLiabMonthly,
        },
      },
      cashFlow: {
        operatingCashFlow: currentNetProfit + (currentLiabilitiesTotalCur - currentLiabilitiesTotalPri) - (currentAssetsTotalCur - currentAssetsTotalPri - netCashChange),
        investingCashFlow: -(nonCurrentAssetsTotalCur - nonCurrentAssetsTotalPri),
        financingCashFlow: 0,
        netCashMovement: netCashChange,
        openingCash: bankCashPri,
        closingCash: bankCashCur,
      },
      workingCapital: {
        ageingBuckets,
        topDebtors: topDebtorsList.slice(0, 5),
        topCreditors: topCreditorsList.slice(0, 5),
        debtorsTotal: totalDebtors,
        creditorsTotal: totalCreditors,
      },
      taxAndVat: {
        vatLiabilityOrRefund: vatBalance,
        vatPeriodStatus: vatBalance > 0 ? 'Payable to SARS' : vatBalance < 0 ? 'Refundable by SARS' : 'Balanced / Nil',
        annualTurnoverEstimate: estimatedAnnualTurnover,
        turnoverThreshold: 2300000,
        estimatedCorporateTax,
        assessedLossCarriedForward: 0,
      },
    };

    return { success: true, data };
  } catch (err: any) {
    console.error('getManagementReportDataAction error:', err);
    return { success: false, error: err.message || 'Failed to calculate management report data' };
  }
}

export async function generateManagementReportAnalysisAction({
  reportData,
}: {
  reportData: ManagementReportData;
}) {
  try {
    const topOpexSorted = [...reportData.profitAndLoss.operatingExpenses.items]
      .sort((a, b) => b.currentAmount - a.currentAmount)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        amount: item.currentAmount,
        percentOfTotal: reportData.kpis.opex.current > 0 ? parseFloat(((item.currentAmount / reportData.kpis.opex.current) * 100).toFixed(1)) : 0,
      }));

    const input: ManagementReportAnalysisInput = {
      companyName: reportData.client.companyName,
      periodLabel: reportData.period.label,
      comparativePeriodLabel: reportData.period.comparativeLabel,
      isVatRegistered: reportData.client.isVatRegistered,
      currentRevenue: reportData.kpis.revenue.current,
      priorRevenue: reportData.kpis.revenue.prior,
      currentGrossProfit: reportData.kpis.grossProfit.current,
      priorGrossProfit: reportData.kpis.grossProfit.prior,
      currentGrossMarginPct: reportData.kpis.grossProfit.marginCurrentPct,
      priorGrossMarginPct: reportData.kpis.grossProfit.marginPriorPct,
      currentOpex: reportData.kpis.opex.current,
      priorOpex: reportData.kpis.opex.prior,
      currentNetProfit: reportData.kpis.netProfit.current,
      priorNetProfit: reportData.kpis.netProfit.prior,
      currentNetMarginPct: reportData.kpis.netProfit.marginCurrentPct,
      priorNetMarginPct: reportData.kpis.netProfit.marginPriorPct,
      cashBalance: reportData.kpis.cashBalance.current,
      priorCashBalance: reportData.kpis.cashBalance.prior,
      netCashChange: reportData.kpis.cashBalance.netChange,
      debtorsBalance: reportData.workingCapital.debtorsTotal,
      creditorsBalance: reportData.workingCapital.creditorsTotal,
      overdueDebtorsAmount: reportData.kpis.debtors.overdue,
      overdueCreditorsAmount: reportData.kpis.creditors.overdue,
      topExpenseCategories: topOpexSorted,
      vatDueOrRefund: reportData.taxAndVat.vatLiabilityOrRefund,
      provisionalTaxEstimate: reportData.taxAndVat.estimatedCorporateTax,
    };

    const analysis = await generateManagementReportAnalysis(input);
    return { success: true, analysis };
  } catch (err: any) {
    console.error('generateManagementReportAnalysisAction error:', err);
    return { success: false, error: err.message || 'Failed to generate AI analysis' };
  }
}
