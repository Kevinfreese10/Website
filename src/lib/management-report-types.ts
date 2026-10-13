export interface ManagementReportMonthSlice {
  key: string; // e.g. "2026-07"
  label: string; // e.g. "July 2026"
  shortLabel: string; // e.g. "Jul 2026"
  startDate: string;
  endDate: string;
}

export interface ManagementReportSectionItem {
  accountNumber?: string;
  name: string;
  currentAmount: number;
  priorAmount: number;
  varianceAmount: number;
  variancePct: number;
  isCategoryHeader?: boolean;
  isSubtotal?: boolean;
  monthlyAmounts?: Record<string, number>;
}

export interface ManagementReportStatement {
  title: string;
  items: ManagementReportSectionItem[];
  currentTotal: number;
  priorTotal: number;
  varianceAmount: number;
  variancePct: number;
  monthlyTotals?: Record<string, number>;
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
    months?: ManagementReportMonthSlice[];
  };
  kpis: ManagementReportKPIs;
  profitAndLoss: {
    revenue: ManagementReportStatement;
    costOfSales: ManagementReportStatement;
    grossProfit: { current: number; prior: number; variance: number; variancePct: number; monthly?: Record<string, number> };
    operatingExpenses: ManagementReportStatement;
    netProfitBeforeTax: { current: number; prior: number; variance: number; variancePct: number; monthly?: Record<string, number> };
  };
  balanceSheet: {
    nonCurrentAssets: ManagementReportStatement;
    currentAssets: ManagementReportStatement;
    totalAssets: { current: number; prior: number; monthly?: Record<string, number> };
    equity: ManagementReportStatement;
    nonCurrentLiabilities: ManagementReportStatement;
    currentLiabilities: ManagementReportStatement;
    totalEquityAndLiabilities: { current: number; prior: number; monthly?: Record<string, number> };
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

export interface ManagementReportAnalysisOutput {
  executiveSummary: string;
  revenueAndMarginInsights: string;
  costControlObservations: string;
  cashFlowAndLiquidity: string;
  taxAndStatutoryHealth: string;
  keyRecommendations: string[];
  healthScore: number;
  riskFlags: string[];
}
