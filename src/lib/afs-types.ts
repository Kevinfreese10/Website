export interface AfsDirector {
  name: string;
  designation: string; // 'Executive Director' | 'Non-executive Director'
  changes?: string; // 'Appointed 25 July 2024'
}

export interface AfsGeneralInfo {
  companyName: string;
  tradingName?: string;
  registrationNumber: string;
  taxNumber?: string;
  vatNumber?: string;
  financialYearEndedDate: string; // e.g. "30 June 2025"
  countryOfIncorporation: string; // "South Africa"
  natureOfBusiness: string; // "Financial services provider"
  registeredOffice: string;
  businessAddress: string;
  holdingCompany?: string;
  assuranceLevel: 'audited' | 'accounting_officer' | 'independent_review';
  auditorOrPractitionerFirm: string; // "Moore Johannesburg Inc." or "My Accountant (Pty) Ltd"
  auditorOrPractitionerTitle: string; // "Registered Auditors" or "Accounting Officer"
  auditorOrPractitionerAddress: string;
  leadPartnerName?: string; // "TC Chiripanyanga" or "Kevin Freese"
  leadPartnerTitle?: string; // "Director / Registered Auditor" or "Accounting Officer BAP(SA)"
  preparerName: string; // "Lethabo Leoka"
  preparerDesignation: string; // "Director"
  issuedDate: string; // "30 October 2025"
  directors: AfsDirector[];
}

export interface AfsStatementLine {
  name: string;
  noteNumber?: string | number;
  currentAmount: number;
  priorAmount?: number;
}

export interface AfsStatementOfFinancialPosition {
  nonCurrentAssets: {
    items: AfsStatementLine[];
    total: { current: number; prior: number };
  };
  currentAssets: {
    items: AfsStatementLine[];
    total: { current: number; prior: number };
  };
  totalAssets: { current: number; prior: number };
  equity: {
    items: AfsStatementLine[];
    total: { current: number; prior: number };
  };
  nonCurrentLiabilities: {
    items: AfsStatementLine[];
    total: { current: number; prior: number };
  };
  currentLiabilities: {
    items: AfsStatementLine[];
    total: { current: number; prior: number };
  };
  totalLiabilities: { current: number; prior: number };
  totalEquityAndLiabilities: { current: number; prior: number };
}

export interface AfsStatementOfComprehensiveIncome {
  revenue: AfsStatementLine;
  costOfSales: AfsStatementLine;
  grossProfit: AfsStatementLine;
  otherIncome: AfsStatementLine;
  operatingExpenses: AfsStatementLine;
  operatingProfitOrLoss: AfsStatementLine;
  financeCosts: AfsStatementLine;
  profitOrLossBeforeTax: AfsStatementLine;
  taxation: AfsStatementLine;
  profitOrLossForTheYear: AfsStatementLine;
  otherComprehensiveIncome: AfsStatementLine;
  totalComprehensiveLossOrIncome: AfsStatementLine;
}

export interface AfsStatementOfChangesInEquity {
  shareCapital: { current: number; prior: number; change: number };
  accumulatedLoss: { current: number; prior: number; lossForTheYear: number };
  totalEquity: { current: number; prior: number };
}

export interface AfsStatementOfCashFlows {
  cashUsedInOperations: { note: string; current: number; prior: number };
  proceedsOnShareIssue: { note: string; current: number; prior: number };
  cashAdvancesReceivedOnLoansFromShareholders: { current: number; prior: number };
  netCashFromFinancingActivities: { current: number; prior: number };
  totalCashMovementForTheYear: { current: number; prior: number };
  totalCashAtEndOfTheYear: { note: string; current: number; prior: number };
}

export interface AfsStatutoryNotes {
  note2CashAndCashEquivalents: {
    items: { name: string; current: number; prior: number }[];
    total: { current: number; prior: number };
  };
  note3ShareCapital: {
    authorisedShares: string; // "1 000 Ordinary Share at no par value"
    issuedShares: string; // "100 Ordinary Shares at no par value"
    issuedAmount: { current: number; prior: number };
    issuedShareCount: number;
  };
  note4LoansFromShareholders: {
    loans: {
      name: string;
      current: number;
      prior: number;
      terms: string;
      isSubordinated: boolean;
    }[];
    total: { current: number; prior: number };
  };
  note5OperatingExpenses: {
    remunerationOtherThanEmployees: { name: string; current: number; prior: number }[];
    totalOperatingExpensesNote: { current: number; prior: number };
  };
  note6CashUsedInOperations: {
    netLossBeforeTax: { current: number; prior: number };
    total: { current: number; prior: number };
  };
  note7Taxation: {
    accountingLoss: { current: number; prior: number };
    taxAtApplicableRate27: { current: number; prior: number };
    lossCarriedForward: { current: number; prior: number };
    taxExpenseTotal: { current: number; prior: number };
    taxNoteText: string;
  };
  note8RelatedParties: {
    holdingCompany?: string;
    directors: string[];
    relatedPartyBalances: { name: string; current: number; prior: number }[];
  };
  note9GoingConcern: {
    accumulatedLoss: number;
    liabilitiesExceedAssetsBy: number;
    subordinationNoteText: string;
  };
  note10EventsAfterReportingPeriod: {
    statementText: string;
  };
}

export interface AfsDetailedIncomeStatement {
  otherIncomeItems: { name: string; current: number; prior: number }[];
  totalOtherIncome: { current: number; prior: number };
  operatingExpenseItems: { name: string; current: number; prior: number }[];
  totalOperatingExpenses: { current: number; prior: number };
  lossOrProfitForTheYear: { current: number; prior: number };
}

export interface AnnualFinancialStatementsData {
  generalInfo: AfsGeneralInfo;
  directorsReport: {
    natureOfBusiness: string;
    reviewOfActivities: string;
    shareCapitalDetails: string;
    directors: AfsDirector[];
    eventsAfterReportingPeriod: string;
    goingConcernText: string;
    auditorOrPractitionerContinuance: string;
  };
  statementOfFinancialPosition: AfsStatementOfFinancialPosition;
  statementOfComprehensiveIncome: AfsStatementOfComprehensiveIncome;
  statementOfChangesInEquity: AfsStatementOfChangesInEquity;
  statementOfCashFlows: AfsStatementOfCashFlows;
  notes: AfsStatutoryNotes;
  detailedIncomeStatement: AfsDetailedIncomeStatement;
}
