'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { generateManagementReportAnalysis, ManagementReportAnalysisInput } from '@/ai/flows/generate-management-report-analysis';
import { requireAdminOrPartnerUser } from '@/firebase/server-auth';

export interface ManagementReportSectionItem {
  accountNumber?: string;
  name: string;
  currentAmount: number;
  priorAmount: number;
  varianceAmount: number;
  variancePct: number;
  isCategoryHeader?: boolean;
  isSubtotal?: boolean;
}

export interface ManagementReportStatement {
  title: string;
  items: ManagementReportSectionItem[];
  currentTotal: number;
  priorTotal: number;
  varianceAmount: number;
  variancePct: number;
}

export interface ManagementReportKPIs {
  revenue: { current: number; prior: number; changePct: number };
  grossProfit: { current: number; prior: number; marginCurrentPct: number; marginPriorPct: number; changePct: number };
  opex: { current: number; prior: number; changePct: number };
  netProfit: { current: number; prior: number; marginCurrentPct: number; marginPriorPct: number; changePct: number };
  cashBalance: { current: number; prior: number; netChange: number };
  debtors: { current: number; prior: number; overdue: number; dso: number };
  creditors: { current: number; prior: number; overdue: number; dpo: number };
  workingCapital: { current: number; ratio: number };
}

export interface ManagementReportAgeingBucket {
  label: string;
  debtorsAmount: number;
  creditorsAmount: number;
}

export interface ManagementReportTopEntity {
  id: string;
  name: string;
  totalBalance: number;
  overdueBalance: number;
  currentBucket: number;
  days30Bucket: number;
  days60Bucket: number;
  days90PlusBucket: number;
}

export interface ManagementReportData {
  client: {
    id: string;
    companyName: string;
    tradingName?: string;
    registrationNumber?: string;
    taxNumber?: string;
    vatNumber?: string;
    isVatRegistered: boolean;
    yearEnd?: string;
  };
  period: {
    label: string;
    startDate: string;
    endDate: string;
    comparativeLabel: string;
    comparativeStartDate: string;
    comparativeEndDate: string;
  };
  kpis: ManagementReportKPIs;
  profitAndLoss: {
    revenue: ManagementReportStatement;
    costOfSales: ManagementReportStatement;
    grossProfit: { current: number; prior: number; variance: number; variancePct: number };
    operatingExpenses: ManagementReportStatement;
    netProfitBeforeTax: { current: number; prior: number; variance: number; variancePct: number };
  };
  balanceSheet: {
    nonCurrentAssets: ManagementReportStatement;
    currentAssets: ManagementReportStatement;
    totalAssets: { current: number; prior: number };
    equity: ManagementReportStatement;
    nonCurrentLiabilities: ManagementReportStatement;
    currentLiabilities: ManagementReportStatement;
    totalEquityAndLiabilities: { current: number; prior: number };
  };
  cashFlow: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashMovement: number;
    openingCash: number;
    closingCash: number;
  };
  workingCapital: {
    ageingBuckets: ManagementReportAgeingBucket[];
    topDebtors: ManagementReportTopEntity[];
    topCreditors: ManagementReportTopEntity[];
    debtorsTotal: number;
    creditorsTotal: number;
  };
  taxAndVat: {
    vatLiabilityOrRefund: number;
    vatPeriodStatus: string;
    annualTurnoverEstimate: number;
    turnoverThreshold: number;
    estimatedCorporateTax: number;
    assessedLossCarriedForward: number;
  };
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

    const supplierControlId = chartOfAccounts.find((a) => a.accountNumber === '7000-000')?.id || '7000-000';
    const customerControlId = chartOfAccounts.find((a) => a.accountNumber === '8000-001')?.id || '8000-001';
    const vatControlId = chartOfAccounts.find((a) => a.accountNumber === '7000-008')?.id || '7000-008';

    allTxs.forEach((tx) => {
      const d = new Date(tx.date);
      const isCurrent = d >= currentStart && d <= currentEnd;
      const isPrior = d >= priorStart && d <= priorEnd;
      const isCumCurrent = d <= currentEnd;
      const isCumPrior = d <= priorEnd;

      const processAllocation = (accId: string, amt: number, type?: string) => {
        let effectiveId = accId;
        if (type === 'supplier') effectiveId = supplierControlId;
        else if (type === 'customer') effectiveId = customerControlId;

        if (isCurrent && currentPeriodBalances.has(effectiveId)) {
          currentPeriodBalances.set(effectiveId, (currentPeriodBalances.get(effectiveId) || 0) + amt);
        }
        if (isPrior && priorPeriodBalances.has(effectiveId)) {
          priorPeriodBalances.set(effectiveId, (priorPeriodBalances.get(effectiveId) || 0) + amt);
        }
        if (isCumCurrent && cumulativeCurrentBalances.has(effectiveId)) {
          cumulativeCurrentBalances.set(effectiveId, (cumulativeCurrentBalances.get(effectiveId) || 0) + amt);
        }
        if (isCumPrior && cumulativePriorBalances.has(effectiveId)) {
          cumulativePriorBalances.set(effectiveId, (cumulativePriorBalances.get(effectiveId) || 0) + amt);
        }
      };

      if (tx.allocations && Array.isArray(tx.allocations) && tx.allocations.length > 0) {
        tx.allocations.forEach((alloc: any) => {
          processAllocation(alloc.accountId, alloc.amount, alloc.type);
        });
      } else if (tx.accountId) {
        processAllocation(tx.accountId, tx.amount, tx.type);
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

        if (acc.category === 'Revenue' || acc.category === 'Sales' || acc.category === 'Other Income') {
          // Revenue in credits (negative) => convert to positive
          const curVal = -cur;
          const priVal = -pri;
          currentRevenue += curVal;
          priorRevenue += priVal;
          if (curVal !== 0 || priVal !== 0) {
            const varAmt = curVal - priVal;
            const varPct = priVal !== 0 ? (varAmt / Math.abs(priVal)) * 100 : curVal > 0 ? 100 : 0;
            revenueItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: curVal,
              priorAmount: priVal,
              varianceAmount: varAmt,
              variancePct: parseFloat(varPct.toFixed(1)),
            });
          }
        } else if (acc.category === 'Cost of Sales' || acc.category === 'Direct Costs') {
          currentCostOfSales += cur;
          priorCostOfSales += pri;
          if (cur !== 0 || pri !== 0) {
            const varAmt = cur - pri;
            const varPct = pri !== 0 ? (varAmt / Math.abs(pri)) * 100 : cur > 0 ? 100 : 0;
            cosItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: cur,
              priorAmount: pri,
              varianceAmount: varAmt,
              variancePct: parseFloat(varPct.toFixed(1)),
            });
          }
        } else {
          // Operating Expenses
          currentOpex += cur;
          priorOpex += pri;
          if (cur !== 0 || pri !== 0) {
            const varAmt = cur - pri;
            const varPct = pri !== 0 ? (varAmt / Math.abs(pri)) * 100 : cur > 0 ? 100 : 0;
            opexItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: cur,
              priorAmount: pri,
              varianceAmount: varAmt,
              variancePct: parseFloat(varPct.toFixed(1)),
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

        if (acc.category === 'Non-Current Assets' || acc.category === 'Fixed Assets') {
          nonCurrentAssetsTotalCur += cur;
          nonCurrentAssetsTotalPri += pri;
          if (cur !== 0 || pri !== 0) {
            ncaItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: cur,
              priorAmount: pri,
              varianceAmount: cur - pri,
              variancePct: pri !== 0 ? parseFloat(((cur - pri) / Math.abs(pri) * 100).toFixed(1)) : 0,
            });
          }
        } else if (acc.category === 'Current Assets' || acc.category === 'Bank' || acc.category === 'Accounts Receivable') {
          currentAssetsTotalCur += cur;
          currentAssetsTotalPri += pri;
          if (cur !== 0 || pri !== 0) {
            caItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: cur,
              priorAmount: pri,
              varianceAmount: cur - pri,
              variancePct: pri !== 0 ? parseFloat(((cur - pri) / Math.abs(pri) * 100).toFixed(1)) : 0,
            });
          }
        } else if (acc.category === 'Equity' || acc.category === 'Capital') {
          const curVal = -cur;
          const priVal = -pri;
          equityTotalCur += curVal;
          equityTotalPri += priVal;
          if (curVal !== 0 || priVal !== 0) {
            eqItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: curVal,
              priorAmount: priVal,
              varianceAmount: curVal - priVal,
              variancePct: priVal !== 0 ? parseFloat(((curVal - priVal) / Math.abs(priVal) * 100).toFixed(1)) : 0,
            });
          }
        } else if (acc.category === 'Non-Current Liabilities' || acc.category === 'Long Term Liabilities') {
          const curVal = -cur;
          const priVal = -pri;
          nonCurrentLiabilitiesTotalCur += curVal;
          nonCurrentLiabilitiesTotalPri += priVal;
          if (curVal !== 0 || priVal !== 0) {
            nclItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: curVal,
              priorAmount: priVal,
              varianceAmount: curVal - priVal,
              variancePct: priVal !== 0 ? parseFloat(((curVal - priVal) / Math.abs(priVal) * 100).toFixed(1)) : 0,
            });
          }
        } else if (acc.category === 'Current Liabilities' || acc.category === 'Accounts Payable' || acc.category === 'Tax Liabilities') {
          const curVal = -cur;
          const priVal = -pri;
          currentLiabilitiesTotalCur += curVal;
          currentLiabilitiesTotalPri += priVal;
          if (curVal !== 0 || priVal !== 0) {
            clItems.push({
              accountNumber: acc.accountNumber,
              name: acc.description,
              currentAmount: curVal,
              priorAmount: priVal,
              varianceAmount: curVal - priVal,
              variancePct: priVal !== 0 ? parseFloat(((curVal - priVal) / Math.abs(priVal) * 100).toFixed(1)) : 0,
            });
          }
        }
      }
    });

    // Add retained profit for the period into equity
    equityTotalCur += currentNetProfit;
    equityTotalPri += priorNetProfit;
    eqItems.push({
      name: 'Net Profit / (Loss) for the Period',
      currentAmount: currentNetProfit,
      priorAmount: priorNetProfit,
      varianceAmount: currentNetProfit - priorNetProfit,
      variancePct: priorNetProfit !== 0 ? parseFloat(((currentNetProfit - priorNetProfit) / Math.abs(priorNetProfit) * 100).toFixed(1)) : 0,
    });

    const totalAssetsCur = nonCurrentAssetsTotalCur + currentAssetsTotalCur;
    const totalAssetsPri = nonCurrentAssetsTotalPri + currentAssetsTotalPri;
    const totalEquityAndLiabCur = equityTotalCur + nonCurrentLiabilitiesTotalCur + currentLiabilitiesTotalCur;
    const totalEquityAndLiabPri = equityTotalPri + nonCurrentLiabilitiesTotalPri + currentLiabilitiesTotalPri;

    // 3. CASH & LIQUIDITY
    let bankCashCur = 0;
    let bankCashPri = 0;
    chartOfAccounts.forEach((acc) => {
      if (acc.accountNumber?.startsWith('8400-') || acc.category === 'Bank' || acc.description?.toLowerCase().includes('bank') || acc.description?.toLowerCase().includes('account')) {
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
        },
        costOfSales: {
          title: 'Cost of Sales',
          items: cosItems,
          currentTotal: currentCostOfSales,
          priorTotal: priorCostOfSales,
          varianceAmount: currentCostOfSales - priorCostOfSales,
          variancePct: priorCostOfSales !== 0 ? parseFloat(((currentCostOfSales - priorCostOfSales) / Math.abs(priorCostOfSales) * 100).toFixed(1)) : 0,
        },
        grossProfit: {
          current: currentGrossProfit,
          prior: priorGrossProfit,
          variance: gpVarAmt,
          variancePct: parseFloat(gpVarPct.toFixed(1)),
        },
        operatingExpenses: {
          title: 'Operating Expenses',
          items: opexItems,
          currentTotal: currentOpex,
          priorTotal: priorOpex,
          varianceAmount: currentOpex - priorOpex,
          variancePct: priorOpex !== 0 ? parseFloat(((currentOpex - priorOpex) / Math.abs(priorOpex) * 100).toFixed(1)) : 0,
        },
        netProfitBeforeTax: {
          current: currentNetProfit,
          prior: priorNetProfit,
          variance: npVarAmt,
          variancePct: parseFloat(npVarPct.toFixed(1)),
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
        },
        currentAssets: {
          title: 'Current Assets',
          items: caItems,
          currentTotal: currentAssetsTotalCur,
          priorTotal: currentAssetsTotalPri,
          varianceAmount: currentAssetsTotalCur - currentAssetsTotalPri,
          variancePct: currentAssetsTotalPri !== 0 ? parseFloat(((currentAssetsTotalCur - currentAssetsTotalPri) / Math.abs(currentAssetsTotalPri) * 100).toFixed(1)) : 0,
        },
        totalAssets: {
          current: totalAssetsCur,
          prior: totalAssetsPri,
        },
        equity: {
          title: 'Capital & Reserves (Equity)',
          items: eqItems,
          currentTotal: equityTotalCur,
          priorTotal: equityTotalPri,
          varianceAmount: equityTotalCur - equityTotalPri,
          variancePct: equityTotalPri !== 0 ? parseFloat(((equityTotalCur - equityTotalPri) / Math.abs(equityTotalPri) * 100).toFixed(1)) : 0,
        },
        nonCurrentLiabilities: {
          title: 'Non-Current Liabilities',
          items: nclItems,
          currentTotal: nonCurrentLiabilitiesTotalCur,
          priorTotal: nonCurrentLiabilitiesTotalPri,
          varianceAmount: nonCurrentLiabilitiesTotalCur - nonCurrentLiabilitiesTotalPri,
          variancePct: nonCurrentLiabilitiesTotalPri !== 0 ? parseFloat(((nonCurrentLiabilitiesTotalCur - nonCurrentLiabilitiesTotalPri) / Math.abs(nonCurrentLiabilitiesTotalPri) * 100).toFixed(1)) : 0,
        },
        currentLiabilities: {
          title: 'Current Liabilities',
          items: clItems,
          currentTotal: currentLiabilitiesTotalCur,
          priorTotal: currentLiabilitiesTotalPri,
          varianceAmount: currentLiabilitiesTotalCur - currentLiabilitiesTotalPri,
          variancePct: currentLiabilitiesTotalPri !== 0 ? parseFloat(((currentLiabilitiesTotalCur - currentLiabilitiesTotalPri) / Math.abs(currentLiabilitiesTotalPri) * 100).toFixed(1)) : 0,
        },
        totalEquityAndLiabilities: {
          current: totalEquityAndLiabCur,
          prior: totalEquityAndLiabPri,
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
