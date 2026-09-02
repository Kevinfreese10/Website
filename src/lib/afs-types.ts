export interface AfsDirector {
  name: string;
  office?: string; // e.g. 'Chief Executive Officer' | 'Director' | 'Managing Director'
  designation: string; // 'Executive' | 'Non-Executive'
  nationality?: string; // 'South African'
  appointmentDate?: string; // 'YYYY-MM-DD'
  resignationDate?: string; // 'YYYY-MM-DD'
  changes?: string; // 'Appointed 16 January 2023'
}

export interface AfsGeneralInfo {
  companyName: string;
  tradingName?: string;
  registrationNumber: string;
  taxNumber?: string;
  vatNumber?: string;
  financialYearEndedDate: string; // e.g. "31 March 2026"
  financialYearEndedDateIso?: string; // e.g. "2026-03-31"
  countryOfIncorporation: string; // "South Africa"
  natureOfBusiness: string; // "Financial services provider" or "Property investment"
  registeredOffice: string;
  businessAddress: string;
  holdingCompany?: string;
  assuranceLevel: 'accounting_officer' | 'audited' | 'independent_review';
  auditorOrPractitionerFirm: string; // "My Accountant"
  auditorOrPractitionerTitle: string; // "Accounting Officer / BAP(SA)"
  auditorOrPractitionerAddress: string; // "Office 102, 1st Floor, Block B, 150 Rivonia Road, Sandton, Johannesburg, 2196"
  leadPartnerName?: string; // "Kevin Freese"
  leadPartnerTitle?: string; // "Accounting Officer / BAP(SA)"
  preparerName: string; // "Kevin Freese"
  preparerDesignation: string; // "Accounting Officer BAP(SA)"
  issuedDate: string; // "2026-08-19" or "19 August 2026"
  directors: AfsDirector[];
}

export interface AfsDirectorsResponsibilities {
  responsibilitiesText: string;
  approvalDate: string; // "YYYY-MM-DD"
  signatoryName: string;
  signatoryTitle: string;
}

export interface AfsDirectorsReportData {
  incorporationText: string;
  natureOfBusiness: string;
  reviewOfActivities: string;
  shareCapitalDetails: string;
  directors: AfsDirector[];
  eventsAfterReportingPeriod: string;
  goingConcernText: string;
  auditorOrPractitionerContinuance: string;
}

export interface AfsAccountingPolicyItem {
  id: string;
  title: string;
  subTitle?: string;
  content: string;
  enabled: boolean;
}

export interface AfsAccountingPoliciesData {
  policies: AfsAccountingPolicyItem[];
}

export interface AfsSectionToggles {
  // Director's Report toggles
  showIncorporation: boolean;
  showNatureOfBusiness: boolean;
  showReviewOfActivities: boolean;
  showShareCapital: boolean;
  showDirectors: boolean;
  showEventsAfterReportingPeriod: boolean;
  showGoingConcern: boolean;
  showAuditorContinuance: boolean;

  // Accounting Policies toggles
  showBasisOfPreparation: boolean;
  showJudgements: boolean;
  showFinancialInstruments: boolean;
  showPpePolicy: boolean;
  showIncomeTaxPolicy: boolean;
  showShareCapitalPolicy: boolean;
  showRevenuePolicy: boolean;
  showLeasesPolicy: boolean;

  // Notes toggles
  showNoteCash: boolean;
  showNoteShareCapital: boolean;
  showNoteShareholderLoans: boolean;
  showNoteOperatingExpenses: boolean;
  showNoteCashUsedInOps: boolean;
  showNoteTaxation: boolean;
  showNoteRelatedParties: boolean;
  showNoteGoingConcern: boolean;
  showNoteEventsAfterReportingPeriod: boolean;

  // Supplementary
  showDetailedIncomeStatement: boolean;
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
    authorisedShares: string;
    issuedShares: string;
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
  directorsResponsibilities: AfsDirectorsResponsibilities;
  directorsReport: AfsDirectorsReportData;
  accountingPolicies: AfsAccountingPoliciesData;
  sectionToggles: AfsSectionToggles;
  statementOfFinancialPosition: AfsStatementOfFinancialPosition;
  statementOfComprehensiveIncome: AfsStatementOfComprehensiveIncome;
  statementOfChangesInEquity: AfsStatementOfChangesInEquity;
  statementOfCashFlows: AfsStatementOfCashFlows;
  notes: AfsStatutoryNotes;
  detailedIncomeStatement: AfsDetailedIncomeStatement;
}
