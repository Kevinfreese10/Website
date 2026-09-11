'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import type {
  AnnualFinancialStatementsData,
  AfsGeneralInfo,
  AfsDirector,
  AfsDirectorsResponsibilities,
  AfsAccountingOfficerReport,
  AfsDirectorsReportData,
  AfsAccountingPoliciesData,
  AfsSectionToggles,
  AfsAccountingPolicyItem,
} from '@/lib/afs-types';

export async function getAnnualFinancialStatementsDataAction({
  clientId,
  yearEndDateStr,
}: {
  clientId: string;
  yearEndDateStr?: string;
}): Promise<{ success: boolean; data?: AnnualFinancialStatementsData; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const clientDoc = await adminDb.collection('aiAccountantClients').doc(clientId).get();
    if (!clientDoc.exists) {
      return { success: false, error: 'Client entity not found' };
    }
    const clientData = clientDoc.data() as any;

    // Fetch custom AFS config if saved previously
    const configDoc = await adminDb
      .collection('aiAccountantClients')
      .doc(clientId)
      .collection('settings')
      .doc('afsConfig')
      .get();
    const savedConfig = configDoc.exists ? configDoc.data() : {};

    // Fetch transactions
    const txSnap = await adminDb
      .collection('aiAccountantClients')
      .doc(clientId)
      .collection('transactions')
      .get();
    const allTxs = txSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    const chartOfAccounts: any[] = clientData.chartOfAccounts || [];

    // Financial Year-End Date determination
    const now = new Date();
    let currentFye: Date;
    if (yearEndDateStr) {
      currentFye = new Date(yearEndDateStr);
    } else if (savedConfig?.financialYearEndedDateIso) {
      currentFye = new Date(savedConfig.financialYearEndedDateIso);
    } else if (clientData.yearEnd) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const mIdx = months.findIndex((m) => m.toLowerCase() === clientData.yearEnd.toLowerCase());
      const targetMonth = mIdx >= 0 ? mIdx : 1; // default Feb (idx 1)
      const currentCalendarMonth = now.getMonth();
      const yr = currentCalendarMonth > targetMonth ? now.getFullYear() : now.getFullYear() - 1;
      currentFye = new Date(yr, targetMonth + 1, 0);
    } else {
      currentFye = new Date(now.getFullYear(), 2, 0); // Last day of Feb current year default
    }

    const currentYearStart = new Date(currentFye.getFullYear() - 1, currentFye.getMonth(), currentFye.getDate() + 1);
    const priorFye = new Date(currentFye.getFullYear() - 1, currentFye.getMonth(), currentFye.getDate());
    const priorYearStart = new Date(priorFye.getFullYear() - 1, priorFye.getMonth(), priorFye.getDate() + 1);

    const fyeFormatted = currentFye.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
    const fyeIso = currentFye.toISOString().split('T')[0];

    // Calculate balances
    const curBalances = new Map<string, number>();
    const priBalances = new Map<string, number>();
    const curPnlBalances = new Map<string, number>();
    const priPnlBalances = new Map<string, number>();

    chartOfAccounts.forEach((acc) => {
      curBalances.set(acc.id, 0);
      priBalances.set(acc.id, 0);
      curPnlBalances.set(acc.id, 0);
      priPnlBalances.set(acc.id, 0);
    });

    const supplierControlId = chartOfAccounts.find((a) => a.accountNumber === '7000-000')?.id || '7000-000';
    const customerControlId = chartOfAccounts.find((a) => a.accountNumber === '8000-001')?.id || '8000-001';

    allTxs.forEach((tx) => {
      const d = new Date(tx.date);
      const isCurCum = d <= currentFye;
      const isPriCum = d <= priorFye;
      const isCurPnl = d >= currentYearStart && d <= currentFye;
      const isPriPnl = d >= priorYearStart && d <= priorFye;

      const processAlloc = (accId: string, amt: number, type?: string) => {
        let effId = accId;
        if (type === 'supplier') effId = supplierControlId;
        else if (type === 'customer') effId = customerControlId;

        if (isCurCum && curBalances.has(effId)) {
          curBalances.set(effId, (curBalances.get(effId) || 0) + amt);
        }
        if (isPriCum && priBalances.has(effId)) {
          priBalances.set(effId, (priBalances.get(effId) || 0) + amt);
        }
        if (isCurPnl && curPnlBalances.has(effId)) {
          curPnlBalances.set(effId, (curPnlBalances.get(effId) || 0) + amt);
        }
        if (isPriPnl && priPnlBalances.has(effId)) {
          priPnlBalances.set(effId, (priPnlBalances.get(effId) || 0) + amt);
        }
      };

      if (tx.allocations && Array.isArray(tx.allocations) && tx.allocations.length > 0) {
        tx.allocations.forEach((alloc: any) => processAlloc(alloc.accountId, alloc.amount, alloc.type));
      } else if (tx.accountId) {
        processAlloc(tx.accountId, tx.amount, tx.type);
      }
    });

    // 1. P&L / Comprehensive Income Calculation
    let curRevenue = 0;
    let priRevenue = 0;
    let curCos = 0;
    let priCos = 0;
    let curOtherIncome = 0;
    let priOtherIncome = 0;
    let curOpex = 0;
    let priOpex = 0;

    const detailedExpensesList: { name: string; current: number; prior: number }[] = [];
    const detailedOtherIncomeList: { name: string; current: number; prior: number }[] = [];

    chartOfAccounts.forEach((acc) => {
      if (acc.section === 'Income Statement') {
        const cur = curPnlBalances.get(acc.id) || 0;
        const pri = priPnlBalances.get(acc.id) || 0;

        if (acc.fsGroup === 'Revenue' || acc.category === 'Revenue') {
          curRevenue += -cur;
          priRevenue += -pri;
        } else if (acc.fsGroup === 'Cost of Sales' || acc.category === 'Cost of Sales') {
          curCos += cur;
          priCos += pri;
        } else if (acc.fsGroup === 'Other Income' || acc.category === 'Other Income' || acc.accountNumber?.startsWith('1000-00')) {
          const c = -cur;
          const p = -pri;
          curOtherIncome += c;
          priOtherIncome += p;
          if (c !== 0 || p !== 0) {
            detailedOtherIncomeList.push({ name: acc.description, current: c, prior: p });
          }
        } else {
          curOpex += cur;
          priOpex += pri;
          if (cur !== 0 || pri !== 0) {
            detailedExpensesList.push({ name: acc.description, current: cur, prior: pri });
          }
        }
      }
    });

    detailedExpensesList.sort((a, b) => a.name.localeCompare(b.name));
    detailedOtherIncomeList.sort((a, b) => a.name.localeCompare(b.name));

    const curGrossProfit = curRevenue - curCos;
    const priGrossProfit = priRevenue - priCos;

    const curOperatingProfitOrLoss = curGrossProfit + curOtherIncome - curOpex;
    const priOperatingProfitOrLoss = priGrossProfit + priOtherIncome - priOpex;

    const curLossOrProfitForTheYear = curOperatingProfitOrLoss;
    const priLossOrProfitForTheYear = priOperatingProfitOrLoss;

    // 2. Balance Sheet Components
    let bankCur = 0;
    let bankPri = 0;
    let receivablesCur = 0;
    let receivablesPri = 0;
    let inventoryCur = 0;
    let inventoryPri = 0;
    let shareCapitalCur = 100;
    let shareCapitalPri = 100;
    let shareholderLoanCur = 0;
    let shareholderLoanPri = 0;
    let payablesCur = 0;
    let payablesPri = 0;
    let vatPayableCur = 0;
    let vatPayablePri = 0;
    let otherLiabilitiesCur = 0;
    let otherLiabilitiesPri = 0;
    let nonCurrentAssetsCur = 0;
    let nonCurrentAssetsPri = 0;

    chartOfAccounts.forEach((acc) => {
      if (acc.section === 'Balance Sheet') {
        const cur = curBalances.get(acc.id) || 0;
        const pri = priBalances.get(acc.id) || 0;

        if (acc.fsGroup === 'Cash and cash equivalents' || acc.category === 'Bank' || acc.accountNumber === '8000-004') {
          bankCur += cur;
          bankPri += pri;
        } else if (acc.fsGroup === 'Trade and other receivables' || acc.category === 'Accounts Receivable' || acc.accountNumber === '8000-001') {
          receivablesCur += cur;
          receivablesPri += pri;
        } else if (acc.fsGroup === 'Inventories' || acc.category === 'Inventory') {
          inventoryCur += cur;
          inventoryPri += pri;
        } else if (acc.fsGroup === 'Property, plant and equipment' || acc.category === 'Non-Current Assets' || acc.category === 'Fixed Assets') {
          nonCurrentAssetsCur += cur;
          nonCurrentAssetsPri += pri;
        } else if (acc.fsGroup === 'Share capital' || acc.accountNumber === '9000-000') {
          const c = -cur;
          const p = -pri;
          if (c > 0) shareCapitalCur = c;
          if (p > 0) shareCapitalPri = p;
        } else if (acc.fsGroup === 'Loans from shareholders' || acc.category === 'Shareholder Loans' || acc.accountNumber === '9000-001') {
          shareholderLoanCur += -cur;
          shareholderLoanPri += -pri;
        } else if (acc.fsGroup === 'Trade and other payables' || acc.category === 'Accounts Payable' || acc.accountNumber === '7000-000') {
          payablesCur += -cur;
          payablesPri += -pri;
        } else if (acc.fsGroup === 'VAT control' || acc.category === 'VAT' || acc.accountNumber === '8500-000' || acc.accountNumber === '8500-001') {
          vatPayableCur += -cur;
          vatPayablePri += -pri;
        } else if (acc.category === 'Current Liabilities' || acc.section === 'Current Liabilities') {
          otherLiabilitiesCur += -cur;
          otherLiabilitiesPri += -pri;
        }
      }
    });

    const totalCashCur = bankCur;
    const totalCashPri = bankPri;

    const accumulatedProfitOrLossCur = curLossOrProfitForTheYear;
    const totalEquityCur = shareCapitalCur + accumulatedProfitOrLossCur;
    const isProfitable = curLossOrProfitForTheYear >= 0;

    // Default directors setup
    const defaultDirectors: AfsDirector[] = savedConfig?.directors || [
      {
        name: clientData.directorName || 'Lerato Khoza',
        office: 'Chief Executive Officer',
        designation: 'Executive',
        nationality: 'South African',
        appointmentDate: '2023-01-16',
        changes: 'Appointed 16 January 2023',
      },
    ];

    const entityName = clientData.companyName || clientData.name || 'Company Name';
    const regNumber = clientData.registrationNumber || clientData.companyRegistrationNumber || '2023/123456/07';

    // Section Toggles
    const defaultSectionToggles: AfsSectionToggles = {
      showIncorporation: true,
      showNatureOfBusiness: true,
      showReviewOfActivities: true,
      showShareCapital: true,
      showDirectors: true,
      showEventsAfterReportingPeriod: true,
      showGoingConcern: true,
      showAuditorContinuance: true,
      showBasisOfPreparation: true,
      showJudgements: true,
      showFinancialInstruments: true,
      showPpePolicy: true,
      showIncomeTaxPolicy: true,
      showShareCapitalPolicy: true,
      showRevenuePolicy: true,
      showLeasesPolicy: true,
      showNoteCash: true,
      showNoteShareCapital: true,
      showNoteShareholderLoans: true,
      showNoteOperatingExpenses: true,
      showNoteCashUsedInOps: true,
      showNoteTaxation: true,
      showNoteRelatedParties: true,
      showNoteGoingConcern: true,
      showNoteEventsAfterReportingPeriod: true,
      showDetailedIncomeStatement: true,
      ...(savedConfig?.sectionToggles || {}),
    };

    // General Information
    const generalInfo: AfsGeneralInfo = {
      companyName: entityName,
      tradingName: clientData.tradingName || '',
      registrationNumber: regNumber,
      taxNumber: clientData.taxNumber || clientData.incomeTaxNumber || '',
      vatNumber: clientData.vatNumber || '',
      financialYearEndedDate: fyeFormatted,
      financialYearEndedDateIso: fyeIso,
      countryOfIncorporation: savedConfig?.countryOfIncorporation || 'South Africa',
      natureOfBusiness: savedConfig?.natureOfBusiness || 'Property investment and services',
      registeredOffice: savedConfig?.registeredOffice || 'Office 102, 1st Floor, Block B, 150 Rivonia Road, Sandton, Johannesburg, 2196',
      businessAddress: savedConfig?.businessAddress || 'Office 102, 1st Floor, Block B, 150 Rivonia Road, Sandton, Johannesburg, 2196',
      holdingCompany: savedConfig?.holdingCompany || '',
      assuranceLevel: savedConfig?.assuranceLevel || 'accounting_officer',
      auditorOrPractitionerFirm: savedConfig?.auditorOrPractitionerFirm || 'My Accountant',
      auditorOrPractitionerTitle: savedConfig?.auditorOrPractitionerTitle || 'Accounting Officer / BAP(SA)',
      auditorOrPractitionerAddress: savedConfig?.auditorOrPractitionerAddress || 'Office 102, 1st Floor, Block B, 150 Rivonia Road, Sandton, Johannesburg, 2196',
      leadPartnerName: savedConfig?.leadPartnerName || 'Kevin Freese',
      leadPartnerTitle: savedConfig?.leadPartnerTitle || 'Accounting Officer / Business Accountant in Practice (SA)',
      preparerName: savedConfig?.preparerName || 'Kevin Freese',
      preparerDesignation: savedConfig?.preparerDesignation || 'Accounting Officer BAP(SA)',
      issuedDate: savedConfig?.issuedDate || fyeIso,
      directors: defaultDirectors,
    };

    // Directors' Responsibilities and Approval
    const defaultResponsibilitiesText = `The director is required by the Companies Act of South Africa, to maintain adequate accounting records and is responsible for the content and integrity of the financial statements and related financial information included in this report. It is her responsibility to ensure that the financial statements fairly present the state of affairs of the company as at the end of the financial year and the results of its operations and cash flows for the period then ended, in conformity with the International Financial Reporting Standard for Small and Medium-sized Entities.

The financial statements are prepared in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities and are based upon appropriate accounting policies consistently applied and supported by reasonable and prudent judgements and estimates.

The director acknowledges that she is ultimately responsible for the system of internal financial control established by the company and places considerable importance on maintaining a strong control environment. To enable the director to meet these responsibilities, the director sets standards for internal control aimed at reducing the risk of error or loss in a cost effective manner. The standards include the proper delegation of responsibilities within a clearly defined framework, effective accounting procedures and adequate segregation of duties to ensure an acceptable level of risk. These controls are monitored throughout the company and all employees are required to maintain the highest ethical standards in ensuring the company’s business is conducted in a manner that in all reasonable circumstances is above reproach. The focus of risk management in the company is on identifying, assessing, managing and monitoring all known forms of risk across the company. While operating risk cannot be fully eliminated, the company endeavours to minimise it by ensuring that appropriate infrastructure, controls, systems and ethical behaviour are applied and managed within predetermined procedures and constraints.

The director is of the opinion, based on the information and explanations given by management, that the system of internal control provides reasonable assurance that the financial records may be relied on for the preparation of the financial statements. However, any system of internal financial control can provide only reasonable, and not absolute, assurance against material misstatement or loss.

The director has reviewed the company’s cash flow forecast for the year to ${currentFye.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })} and, in the light of this review and the current financial position, she is satisfied that the company has or has access to adequate resources to continue in operational existence for the foreseeable future.

The financial statements, which have been prepared on the going concern basis, were approved by the director on ${fyeFormatted} and were signed on its behalf by:`;

    const directorsResponsibilities: AfsDirectorsResponsibilities = {
      responsibilitiesText: savedConfig?.responsibilitiesText || defaultResponsibilitiesText,
      approvalDate: savedConfig?.approvalDate || fyeIso,
      signatoryName: savedConfig?.signatoryName || defaultDirectors[0]?.name || 'Director',
      signatoryTitle: savedConfig?.signatoryTitle || 'Director',
    };

    // Accounting Officer Report
    const accountingOfficerReport: AfsAccountingOfficerReport = {
      title: savedConfig?.accountingOfficerReport?.title || 'Report of the Accounting Officer',
      addressee: savedConfig?.accountingOfficerReport?.addressee || `To the Shareholder of ${entityName}`,
      reportText:
        savedConfig?.accountingOfficerReport?.reportText ||
        `We have compiled the financial statements of ${entityName}, which comprise the statement of financial position as at ${fyeFormatted}, and the statement of profit or loss and other comprehensive income, the statement of changes in equity and the statement of cash flows for the year then ended, and notes to the financial statements, including a summary of material accounting policies. The financial statements have been compiled in accordance with the International Standard on Related Services (ISRS 4410) and the requirements of the Companies Act of South Africa.`,
      basisText:
        savedConfig?.accountingOfficerReport?.basisText ||
        `We performed this compilation engagement in accordance with International Standard on Related Services 4410 (Revised), Compilation Engagements. We have applied our expertise in accounting and financial reporting to assist you in the preparation and presentation of these financial statements on the basis of International Financial Reporting Standard for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa.`,
      directorResponsibilityText:
        savedConfig?.accountingOfficerReport?.directorResponsibilityText ||
        `The director is responsible for the preparation and fair presentation of the financial statements in accordance with International Financial Reporting Standard for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa, and for such internal control as the director determines is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.`,
      practitionerResponsibilityText:
        savedConfig?.accountingOfficerReport?.practitionerResponsibilityText ||
        `Since a compilation engagement is not an assurance engagement, we are not required to verify the accuracy or completeness of the information you provided to us to compile these financial statements. Accordingly, we do not express an audit opinion or a review conclusion on whether these financial statements are prepared in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities.`,
      conclusionText:
        savedConfig?.accountingOfficerReport?.conclusionText ||
        `We have compiled the financial statements from the accounting records and from information and explanations supplied to us by the director.`,
      firmName: savedConfig?.accountingOfficerReport?.firmName || 'My Accountant',
      firmTitle: savedConfig?.accountingOfficerReport?.firmTitle || 'Accounting Officer / BAP(SA)',
      leadPartnerName: savedConfig?.accountingOfficerReport?.leadPartnerName || 'Kevin Freese',
      leadPartnerTitle: savedConfig?.accountingOfficerReport?.leadPartnerTitle || 'Accounting Officer / BAP(SA)',
      firmAddress:
        savedConfig?.accountingOfficerReport?.firmAddress ||
        'Office 102, 1st Floor, Block B, 150 Rivonia Road, Sandton, Johannesburg, 2196',
      date: savedConfig?.accountingOfficerReport?.date || fyeIso,
    };

    // Directors' Report Data
    const directorsReport: AfsDirectorsReportData = {
      incorporationText:
        savedConfig?.directorsReport?.incorporationText ||
        `The company was incorporated in South Africa on ${defaultDirectors[0]?.appointmentDate || '16 January 2023'}.`,
      natureOfBusiness:
        savedConfig?.directorsReport?.natureOfBusiness ||
        `${entityName} operates in South Africa, specialising in ${generalInfo.natureOfBusiness}.`,
      reviewOfActivities:
        savedConfig?.directorsReport?.reviewOfActivities ||
        `The results of the company and the state of its affairs are set out in the financial statements. The ${isProfitable ? 'profit' : 'loss'} for the year was R ${Math.abs(curLossOrProfitForTheYear).toLocaleString('en-ZA')}.`,
      shareCapitalDetails:
        savedConfig?.directorsReport?.shareCapitalDetails ||
        `There have been no changes to the authorised or issued share capital during the year under review. 100 Ordinary shares of no par value are in issue.`,
      directors: defaultDirectors,
      eventsAfterReportingPeriod:
        savedConfig?.directorsReport?.eventsAfterReportingPeriod ||
        `The director is not aware of any material event which occurred after the reporting date and up to the date of this report that would require adjustment to or disclosure in these financial statements.`,
      goingConcernText:
        savedConfig?.directorsReport?.goingConcernText ||
        `The financial statements have been prepared on the basis of accounting policies applicable to a going concern. This basis presumes that funds will be available to finance future operations and that the realisation of assets and settlement of liabilities, contingent obligations and commitments will occur in the ordinary course of business.`,
      auditorOrPractitionerContinuance:
        savedConfig?.directorsReport?.auditorOrPractitionerContinuance ||
        `My Accountant will continue in office as accounting officer in accordance with the Companies Act of South Africa.`,
    };

    // Accounting Policies List
    const defaultPoliciesList: AfsAccountingPolicyItem[] = [
      {
        id: 'basis_of_prep',
        title: '1.1 Basis of preparation and summary of significant accounting policies',
        content: `The financial statements have been prepared on a going concern basis in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities (IFRS for SMEs) and the Companies Act of South Africa. The financial statements have been prepared on the historical cost basis, and incorporate the principal accounting policies set out below. They are presented in South African Rands (ZAR).`,
        enabled: true,
      },
      {
        id: 'judgements',
        title: '1.2 Significant judgements and sources of estimation uncertainty',
        content: `In preparing the financial statements, management is required to make judgements, estimates and assumptions that affect the amounts represented in the financial statements and related disclosures. The estimates and associated assumptions are based on historical experience and other factors that are considered to be relevant. Actual results in the future could differ from these estimates.`,
        enabled: true,
      },
      {
        id: 'financial_instruments',
        title: '1.3 Financial instruments',
        content: `Financial instruments are recognised when the company becomes a party to the contractual provisions of the instrument. Financial assets and liabilities are initially measured at transaction price. Trade and other receivables and cash and cash equivalents are subsequently measured at amortised cost less any impairment. Trade and other payables and shareholder loans are subsequently measured at amortised cost.`,
        enabled: true,
      },
      {
        id: 'ppe',
        title: '1.4 Property, plant and equipment',
        content: `Property, plant and equipment are tangible items that are held for use in the production or supply of goods or services, for rental to others, or for administrative purposes, and are expected to be used during more than one period. Property, plant and equipment is stated at cost less accumulated depreciation and accumulated impairment losses. Cost includes expenditure that is directly attributable to the acquisition of the items. Depreciation is provided using the straight-line method to write down the cost over the estimated useful lives of the assets.`,
        enabled: true,
      },
      {
        id: 'tax',
        title: '1.5 Tax',
        content: `Current tax assets and liabilities are measured at the amount expected to be recovered from or paid to the taxation authorities, using the tax rates and laws that have been enacted or substantively enacted by the reporting date. Deferred tax is recognised on temporary differences between the carrying amounts of assets and liabilities in the financial statements and the corresponding tax bases used in the computation of taxable profit.`,
        enabled: true,
      },
      {
        id: 'share_capital',
        title: '1.6 Share capital and equity',
        content: `An equity instrument is any contract that evidences a residual interest in the assets of an entity after deducting all of its liabilities. Ordinary shares are classified as equity. Incremental costs directly attributable to the issue of new shares are shown in equity as a deduction, net of tax, from the proceeds.`,
        enabled: true,
      },
      {
        id: 'revenue',
        title: '1.7 Revenue',
        content: `Revenue is recognised to the extent that it is probable that the economic benefits will flow to the company and the revenue can be reliably measured. Revenue is measured at the fair value of the consideration received or receivable, net of value added tax, rebates and trade discounts.`,
        enabled: true,
      },
      {
        id: 'borrowing_costs',
        title: '1.8 Borrowing costs',
        content: `All borrowing costs are recognised in profit or loss in the period in which they are incurred.`,
        enabled: true,
      },
      {
        id: 'provisions',
        title: '1.9 Provisions and contingencies',
        content: `Provisions are recognised when the company has an obligation at the reporting date as a result of a past event; it is probable that the company will be required to transfer economic benefits in settlement; and the amount of the obligation can be estimated reliably.`,
        enabled: true,
      },
      {
        id: 'events_after_reporting_period',
        title: '1.10 Events after the reporting period',
        content: `Events after the reporting period are those events, favourable and unfavourable, that occur between the end of the reporting period and the date when the financial statements are authorised for issue. Adjusting events require adjustment to the financial statements, while non-adjusting events are disclosed when material.`,
        enabled: true,
      },
      {
        id: 'changes_in_accounting_policies',
        title: '1.11 Changes in accounting policies, estimates and errors',
        content: `Changes in accounting policies are applied retrospectively when required by IFRS for SMEs or when the change results in reliable and more relevant information. Changes in accounting estimates are recognised prospectively in profit or loss in the period of the change and future periods. Material prior-period errors are corrected retrospectively.`,
        enabled: true,
      },
    ];

    const accountingPolicies: AfsAccountingPoliciesData = {
      policies: savedConfig?.accountingPolicies?.policies || defaultPoliciesList,
    };

    const effectiveShareholderLoan = shareholderLoanCur;

    // Current Assets items
    const currentAssetItems = [
      { name: 'Cash and cash equivalents', noteNumber: 2, currentAmount: totalCashCur, priorAmount: totalCashPri },
    ];
    if (receivablesCur !== 0 || receivablesPri !== 0) {
      currentAssetItems.push({ name: 'Trade and other receivables', noteNumber: '' as any, currentAmount: receivablesCur, priorAmount: receivablesPri });
    }
    if (inventoryCur !== 0 || inventoryPri !== 0) {
      currentAssetItems.push({ name: 'Inventories', noteNumber: '' as any, currentAmount: inventoryCur, priorAmount: inventoryPri });
    }
    if (vatPayableCur < 0 || vatPayablePri < 0) {
      currentAssetItems.push({ name: 'VAT receivable', noteNumber: '' as any, currentAmount: Math.max(0, -vatPayableCur), priorAmount: Math.max(0, -vatPayablePri) });
    }

    const totalCurrentAssetsCur = currentAssetItems.reduce((s, i) => s + i.currentAmount, 0);
    const totalCurrentAssetsPri = currentAssetItems.reduce((s, i) => s + (i.priorAmount || 0), 0);

    // Current Liabilities items
    const currentLiabilityItems: any[] = [];
    if (effectiveShareholderLoan !== 0 || shareholderLoanPri !== 0) {
      currentLiabilityItems.push({ name: 'Loans from shareholder', noteNumber: 4, currentAmount: effectiveShareholderLoan, priorAmount: shareholderLoanPri });
    }
    if (payablesCur !== 0 || payablesPri !== 0) {
      currentLiabilityItems.push({ name: 'Trade and other payables', noteNumber: '' as any, currentAmount: Math.max(0, payablesCur), priorAmount: Math.max(0, payablesPri) });
    }
    if (vatPayableCur > 0 || vatPayablePri > 0) {
      currentLiabilityItems.push({ name: 'VAT payable', noteNumber: '' as any, currentAmount: Math.max(0, vatPayableCur), priorAmount: Math.max(0, vatPayablePri) });
    }
    if (otherLiabilitiesCur !== 0 || otherLiabilitiesPri !== 0) {
      currentLiabilityItems.push({ name: 'Other current liabilities', noteNumber: '' as any, currentAmount: Math.max(0, otherLiabilitiesCur), priorAmount: Math.max(0, otherLiabilitiesPri) });
    }

    const totalCurrentLiabilitiesCur = currentLiabilityItems.reduce((s, i) => s + i.currentAmount, 0);
    const totalCurrentLiabilitiesPri = currentLiabilityItems.reduce((s, i) => s + (i.priorAmount || 0), 0);

    const totalAssetsCalculated = totalCurrentAssetsCur + nonCurrentAssetsCur;
    const totalAssetsPriCalculated = totalCurrentAssetsPri + nonCurrentAssetsPri;

    const totalLiabilitiesCalculated = totalCurrentLiabilitiesCur;
    const totalLiabilitiesPriCalculated = totalCurrentLiabilitiesPri;

    const data: AnnualFinancialStatementsData = {
      generalInfo,
      directorsResponsibilities,
      accountingOfficerReport,
      directorsReport,
      accountingPolicies,
      sectionToggles: defaultSectionToggles,
      statementOfFinancialPosition: {
        nonCurrentAssets: {
          items: nonCurrentAssetsCur > 0 ? [{ name: 'Property, plant and equipment', currentAmount: nonCurrentAssetsCur, priorAmount: nonCurrentAssetsPri }] : [],
          total: { current: nonCurrentAssetsCur, prior: nonCurrentAssetsPri },
        },
        currentAssets: {
          items: currentAssetItems,
          total: { current: totalCurrentAssetsCur, prior: totalCurrentAssetsPri },
        },
        totalAssets: { current: totalAssetsCalculated, prior: totalAssetsPriCalculated },
        equity: {
          items: [
            { name: 'Share capital', noteNumber: 3, currentAmount: shareCapitalCur, priorAmount: shareCapitalPri },
            { name: isProfitable ? 'Retained earnings' : 'Accumulated loss', currentAmount: accumulatedProfitOrLossCur, priorAmount: priLossOrProfitForTheYear },
          ],
          total: { current: totalEquityCur, prior: shareCapitalPri + priLossOrProfitForTheYear },
        },
        nonCurrentLiabilities: {
          items: [],
          total: { current: 0, prior: 0 },
        },
        currentLiabilities: {
          items: currentLiabilityItems,
          total: { current: totalCurrentLiabilitiesCur, prior: totalCurrentLiabilitiesPri },
        },
        totalLiabilities: { current: totalLiabilitiesCalculated, prior: totalLiabilitiesPriCalculated },
        totalEquityAndLiabilities: {
          current: totalEquityCur + totalLiabilitiesCalculated,
          prior: shareCapitalPri + priLossOrProfitForTheYear + totalLiabilitiesPriCalculated,
        },
      },
      statementOfComprehensiveIncome: {
        revenue: { name: 'Revenue', currentAmount: curRevenue, priorAmount: priRevenue },
        costOfSales: { name: 'Cost of sales', currentAmount: curCos, priorAmount: priCos },
        grossProfit: { name: 'Gross profit', currentAmount: curGrossProfit, priorAmount: priGrossProfit },
        otherIncome: { name: 'Other income', currentAmount: curOtherIncome, priorAmount: priOtherIncome },
        operatingExpenses: {
          name: 'Operating expenses',
          noteNumber: 5,
          currentAmount: -curOpex,
          priorAmount: -priOpex,
        },
        operatingProfitOrLoss: {
          name: isProfitable ? 'Operating profit' : 'Operating loss',
          currentAmount: curOperatingProfitOrLoss,
          priorAmount: priOperatingProfitOrLoss,
        },
        financeCosts: { name: 'Finance costs', currentAmount: 0, priorAmount: 0 },
        profitOrLossBeforeTax: {
          name: isProfitable ? 'Profit before income tax' : 'Loss before income tax',
          currentAmount: curOperatingProfitOrLoss,
          priorAmount: priOperatingProfitOrLoss,
        },
        taxation: { name: 'Income tax', noteNumber: 7, currentAmount: 0, priorAmount: 0 },
        profitOrLossForTheYear: {
          name: isProfitable ? 'Profit for the year' : 'Loss for the year',
          currentAmount: curLossOrProfitForTheYear,
          priorAmount: priLossOrProfitForTheYear,
        },
        otherComprehensiveIncome: { name: 'Other comprehensive income', currentAmount: 0, priorAmount: 0 },
        totalComprehensiveLossOrIncome: {
          name: isProfitable ? 'Total comprehensive income for the year' : 'Total comprehensive loss for the year',
          currentAmount: curLossOrProfitForTheYear,
          priorAmount: priLossOrProfitForTheYear,
        },
      },
      statementOfChangesInEquity: {
        openingBalance: { current: 0, prior: 0 },
        shareCapital: { current: shareCapitalCur, prior: shareCapitalPri, change: shareCapitalCur - shareCapitalPri },
        accumulatedLoss: { current: accumulatedProfitOrLossCur, prior: priLossOrProfitForTheYear, lossForTheYear: curLossOrProfitForTheYear },
        totalEquity: { current: totalEquityCur, prior: shareCapitalPri + priLossOrProfitForTheYear },
      },
      statementOfCashFlows: {
        cashUsedInOperations: { note: '6', current: curLossOrProfitForTheYear, prior: priLossOrProfitForTheYear },
        cashFlowsFromInvestingActivities: {
          items: nonCurrentAssetsCur > 0 ? [{ name: 'Purchase of property, plant and equipment', currentAmount: -nonCurrentAssetsCur, priorAmount: 0 }] : [],
          total: { current: -nonCurrentAssetsCur, prior: 0 },
        },
        proceedsOnShareIssue: { note: '3', current: shareCapitalCur - shareCapitalPri, prior: shareCapitalPri },
        cashAdvancesReceivedOnLoansFromShareholders: { current: effectiveShareholderLoan, prior: shareholderLoanPri },
        netCashFromFinancingActivities: { current: (shareCapitalCur - shareCapitalPri) + effectiveShareholderLoan, prior: shareCapitalPri + shareholderLoanPri },
        totalCashMovementForTheYear: { current: totalCashCur - totalCashPri, prior: totalCashPri },
        cashAtBeginningOfTheYear: { current: totalCashPri, prior: 0 },
        totalCashAtEndOfTheYear: { note: '2', current: totalCashCur, prior: totalCashPri },
      },
      notes: {
        note2CashAndCashEquivalents: {
          items: [{ name: 'Bank balances', current: totalCashCur, prior: totalCashPri }],
          total: { current: totalCashCur, prior: totalCashPri },
        },
        note3ShareCapital: {
          authorisedShares: '100 Ordinary shares of no par value',
          issuedShares: '100 Ordinary shares of no par value',
          issuedAmount: { current: shareCapitalCur, prior: shareCapitalPri },
          issuedShareCount: 100,
        },
        note4LoansFromShareholders: {
          loans: effectiveShareholderLoan !== 0 || shareholderLoanPri !== 0 ? [
            {
              name: generalInfo.holdingCompany || 'Shareholder Loan Account',
              current: effectiveShareholderLoan,
              prior: shareholderLoanPri,
              terms: 'The loan is unsecured, bears no interest, and has no fixed repayment terms. The loan is subordinated in favour of other creditors until the assets of the company exceed its liabilities.',
              isSubordinated: true,
            },
          ] : [],
          total: { current: effectiveShareholderLoan, prior: shareholderLoanPri },
        },
        note5OperatingExpenses: {
          remunerationOtherThanEmployees: detailedExpensesList,
          totalOperatingExpensesNote: { current: curOpex, prior: priOpex },
        },
        note6CashUsedInOperations: {
          netLossBeforeTax: { current: curLossOrProfitForTheYear, prior: priLossOrProfitForTheYear },
          total: { current: curLossOrProfitForTheYear, prior: priLossOrProfitForTheYear },
        },
        note7Taxation: {
          accountingLoss: { current: curLossOrProfitForTheYear, prior: priLossOrProfitForTheYear },
          taxAtApplicableRate27: { current: Math.round((curLossOrProfitForTheYear > 0 ? curLossOrProfitForTheYear : 0) * 0.27), prior: 0 },
          lossCarriedForward: { current: Math.round((curLossOrProfitForTheYear < 0 ? Math.abs(curLossOrProfitForTheYear) : 0) * 0.27), prior: 0 },
          taxExpenseTotal: { current: 0, prior: 0 },
          taxNoteText: curLossOrProfitForTheYear <= 0
            ? `No provision has been made for ${currentFye.getFullYear()} tax as the company has an estimated tax loss.`
            : `Provision for income tax has been estimated at standard corporate rates for ${currentFye.getFullYear()}.`,
        },
        note8RelatedParties: {
          holdingCompany: generalInfo.holdingCompany,
          directors: defaultDirectors.map((d) => d.name),
          relatedPartyBalances: effectiveShareholderLoan !== 0 ? [
            { name: generalInfo.holdingCompany || 'Shareholder Loan Account', current: effectiveShareholderLoan, prior: shareholderLoanPri },
          ] : [],
        },
        note9GoingConcern: {
          accumulatedLoss: Math.abs(accumulatedProfitOrLossCur),
          liabilitiesExceedAssetsBy: Math.max(0, -totalEquityCur),
          subordinationNoteText: `The financial statements have been prepared on the basis of accounting policies applicable to a going concern. This basis presumes that funds will be available to finance future operations and that the realisation of assets and settlement of liabilities, contingent obligations and commitments will occur in the ordinary course of business.`,
        },
        note10EventsAfterReportingPeriod: {
          statementText: `The director is not aware of any material event which occurred after the reporting date and up to the date of this report that would require adjustment to or disclosure in these financial statements.`,
        },
      },
      detailedIncomeStatement: {
        otherIncomeItems: detailedOtherIncomeList,
        totalOtherIncome: { current: curOtherIncome, prior: priOtherIncome },
        operatingExpenseItems: detailedExpensesList,
        totalOperatingExpenses: { current: curOpex, prior: priOpex },
        lossOrProfitForTheYear: { current: curLossOrProfitForTheYear, prior: priLossOrProfitForTheYear },
      },
    };

    return { success: true, data };
  } catch (err: any) {
    console.error('getAnnualFinancialStatementsDataAction error:', err);
    return { success: false, error: err.message || 'Failed to compile Annual Financial Statements data' };
  }
}

export async function saveAnnualFinancialStatementsConfigAction({
  clientId,
  config,
}: {
  clientId: string;
  config: Record<string, any>;
}) {
  try {
    const adminDb = getAdminDb();
    await adminDb
      .collection('aiAccountantClients')
      .doc(clientId)
      .collection('settings')
      .doc('afsConfig')
      .set(config, { merge: true });

    return { success: true };
  } catch (err: any) {
    console.error('saveAnnualFinancialStatementsConfigAction error:', err);
    return { success: false, error: err.message || 'Failed to save AFS configuration' };
  }
}
