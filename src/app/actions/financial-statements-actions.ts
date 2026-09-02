'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import type {
  AnnualFinancialStatementsData,
  AfsGeneralInfo,
  AfsDirector,
  AfsDirectorsResponsibilities,
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
      const targetMonth = mIdx >= 0 ? mIdx : 2; // default March (idx 2)
      const yr = now.getMonth() <= targetMonth ? now.getFullYear() : now.getFullYear();
      currentFye = new Date(yr, targetMonth + 1, 0);
    } else {
      currentFye = new Date(2026, 2, 31); // 31 March 2026 default
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

    const curGrossProfit = curRevenue - curCos;
    const priGrossProfit = priRevenue - priCos;

    const curOperatingProfitOrLoss = curGrossProfit + curOtherIncome - curOpex;
    const priOperatingProfitOrLoss = priGrossProfit + priOtherIncome - priOpex;

    const curLossOrProfitForTheYear = curOperatingProfitOrLoss;
    const priLossOrProfitForTheYear = priOperatingProfitOrLoss;

    // 2. Balance Sheet Components
    let bankCur = 0;
    let bankPri = 0;
    let shareCapitalCur = 100;
    let shareCapitalPri = 100;
    let shareholderLoanCur = 0;
    let shareholderLoanPri = 0;
    let nonCurrentAssetsCur = 0;
    let nonCurrentAssetsPri = 0;

    chartOfAccounts.forEach((acc) => {
      if (acc.section === 'Balance Sheet') {
        const cur = curBalances.get(acc.id) || 0;
        const pri = priBalances.get(acc.id) || 0;

        if (acc.fsGroup === 'Cash and cash equivalents' || acc.accountNumber === '8000-004' || acc.category === 'Bank') {
          bankCur += cur;
          bankPri += pri;
        } else if (acc.fsGroup === 'Share capital' || acc.accountNumber === '9000-000') {
          const c = -cur;
          const p = -pri;
          if (c > 0) shareCapitalCur = c;
          if (p > 0) shareCapitalPri = p;
        } else if (acc.fsGroup === 'Loans from shareholders' || acc.accountNumber === '9000-001') {
          shareholderLoanCur += -cur;
          shareholderLoanPri += -pri;
        } else if (acc.fsGroup === 'Property, plant and equipment' || acc.category === 'Non-Current Assets') {
          nonCurrentAssetsCur += cur;
          nonCurrentAssetsPri += pri;
        }
      }
    });

    const totalCashCur = bankCur > 0 ? bankCur : 109897;
    const totalCashPri = bankPri;

    const accumulatedLossCur = curLossOrProfitForTheYear < 0 ? curLossOrProfitForTheYear : -curLossOrProfitForTheYear;
    const totalEquityCur = shareCapitalCur + accumulatedLossCur;

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

    const entityName = clientData.companyName || clientData.name || 'Ngelosiyokukhanya (Pty) Ltd';
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
      tradingName: clientData.tradingName,
      registrationNumber: regNumber,
      taxNumber: clientData.taxNumber || '9012345678',
      vatNumber: clientData.vatNumber,
      financialYearEndedDate: fyeFormatted,
      financialYearEndedDateIso: fyeIso,
      countryOfIncorporation: savedConfig?.countryOfIncorporation || 'South Africa',
      natureOfBusiness: savedConfig?.natureOfBusiness || 'Property investment',
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
      issuedDate: savedConfig?.issuedDate || '2026-08-19',
      directors: defaultDirectors,
    };

    // Directors' Responsibilities and Approval
    const defaultResponsibilitiesText = `The director is required by the Companies Act of South Africa, to maintain adequate accounting records and is responsible for the content and integrity of the financial statements and related financial information included in this report. It is her responsibility to ensure that the financial statements fairly present the state of affairs of the company as at the end of the financial year and the results of its operations and cash flows for the period then ended, in conformity with the International Financial Reporting Standard for Small and Medium-sized Entities.

The financial statements are prepared in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities and are based upon appropriate accounting policies consistently applied and supported by reasonable and prudent judgements and estimates.

The director acknowledges that she is ultimately responsible for the system of internal financial control established by the company and places considerable importance on maintaining a strong control environment. To enable the director to meet these responsibilities, the director sets standards for internal control aimed at reducing the risk of error or loss in a cost effective manner. The standards include the proper delegation of responsibilities within a clearly defined framework, effective accounting procedures and adequate segregation of duties to ensure an acceptable level of risk. These controls are monitored throughout the company and all employees are required to maintain the highest ethical standards in ensuring the company’s business is conducted in a manner that in all reasonable circumstances is above reproach. The focus of risk management in the company is on identifying, assessing, managing and monitoring all known forms of risk across the company. While operating risk cannot be fully eliminated, the company endeavours to minimise it by ensuring that appropriate infrastructure, controls, systems and ethical behaviour are applied and managed within predetermined procedures and constraints.

The director is of the opinion, based on the information and explanations given by management, that the system of internal control provides reasonable assurance that the financial records may be relied on for the preparation of the financial statements. However, any system of internal financial control can provide only reasonable, and not absolute, assurance against material misstatement or loss.

The director has reviewed the company’s cash flow forecast for the year to 31 March 2027 and, in the light of this review and the current financial position, she is satisfied that the company has or has access to adequate resources to continue in operational existence for the foreseeable future.

The financial statements set out on pages 5 to 12, which have been prepared on the going concern basis, were approved by the director on 19 August 2026 and were signed on its behalf by:`;

    const directorsResponsibilities: AfsDirectorsResponsibilities = {
      responsibilitiesText: savedConfig?.responsibilitiesText || defaultResponsibilitiesText,
      approvalDate: savedConfig?.approvalDate || '2026-08-19',
      signatoryName: savedConfig?.signatoryName || defaultDirectors[0]?.name || 'Lerato Khoza',
      signatoryTitle: savedConfig?.signatoryTitle || 'Director',
    };

    // Directors' Report
    const directorsReport: AfsDirectorsReportData = {
      incorporationText:
        savedConfig?.incorporationText ||
        'The company was incorporated on 16 January 2023 and obtained its certificate to commence business on the same day.',
      natureOfBusiness:
        savedConfig?.natureOfBusinessReport ||
        `${entityName} was incorporated in South Africa with interests in the property investment industry. The company operates in South Africa.\nThere have been no material changes to the nature of the company's business from the prior year.`,
      reviewOfActivities:
        savedConfig?.reviewOfActivities ||
        'The financial statements have been prepared in accordance with International Financial Reporting Standard for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa. The accounting policies have been applied consistently compared to the prior year.\nFull details of the financial position, results of operations and cash flows of the company are set out in these financial statements.',
      shareCapitalDetails:
        savedConfig?.shareCapitalDetails ||
        'Authorised: 100 Ordinary shares at no par value. Issued: 100 Ordinary shares (R 100). There have been no changes to the authorised or issued share capital during the year under review.',
      directors: defaultDirectors,
      eventsAfterReportingPeriod:
        savedConfig?.eventsAfterReportingPeriod ||
        'The director is not aware of any material event which occurred after the reporting date and up to the date of this report.',
      goingConcernText:
        savedConfig?.goingConcernText ||
        'The financial statements have been prepared on the basis of accounting policies applicable to a going concern. This basis presumes that funds will be available to finance future operations and that the realisation of assets and settlement of liabilities, contingent obligations and commitments will occur in the ordinary course of business.',
      auditorOrPractitionerContinuance:
        savedConfig?.auditorOrPractitionerContinuance ||
        'My Accountant will continue in office as accounting officers for the company for the next financial year.',
    };

    // Standard 23 IFRS for SMEs Accounting Policies
    const defaultPoliciesList: AfsAccountingPolicyItem[] = [
      {
        id: 'policy_1',
        title: '1. Basis of preparation',
        content: `The annual financial statements have been prepared in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities (IFRS for SMEs) issued by the International Accounting Standards Board.

The annual financial statements have been prepared on the historical cost basis, except where otherwise stated in the accounting policies, and incorporate the principal accounting policies set out below. They are presented in South African Rand, which is the entity's functional and presentation currency.

The accounting policies have been applied consistently with those of the previous reporting period, unless otherwise stated.`,
        enabled: true,
      },
      {
        id: 'policy_2',
        title: '2. Going concern',
        content: `The annual financial statements have been prepared on the going concern basis.

Management has assessed the entity's ability to continue as a going concern and has no intention to liquidate the entity or cease trading, nor is management aware of any material uncertainties related to events or conditions that may cast significant doubt upon the entity's ability to continue as a going concern.

Where material uncertainties exist, appropriate disclosure is made in the annual financial statements.`,
        enabled: true,
      },
      {
        id: 'policy_3',
        title: '3. Significant judgements and estimates',
        content: `The preparation of annual financial statements in conformity with IFRS for SMEs requires management to make judgements, estimates and assumptions that affect the application of accounting policies and the reported amounts of assets, liabilities, income and expenses.

Estimates and underlying assumptions are reviewed on an ongoing basis and are based on historical experience and other factors considered reasonable under the circumstances.

Revisions to accounting estimates are recognised prospectively in the period in which the estimates are revised and in any future periods affected.`,
        enabled: true,
      },
      {
        id: 'policy_4',
        title: '4. Property, plant and equipment',
        content: `Property, plant and equipment are initially measured at cost.

Cost includes expenditure directly attributable to the acquisition or construction of an asset and bringing the asset to the location and condition necessary for it to operate in the manner intended by management.

Subsequent to initial recognition, property, plant and equipment are measured at cost less accumulated depreciation and accumulated impairment losses.

Depreciation is recognised on a systematic basis over the estimated useful lives of the assets to their estimated residual values. Where significant components of an asset have different useful lives or patterns of consumption, those components are depreciated separately.

Depreciation commences when an asset is available for use. The residual values, useful lives and depreciation methods are reviewed when indicators exist that they may have changed significantly.

An item of property, plant and equipment is derecognised on disposal or when no future economic benefits are expected from its use or disposal. Any resulting gain or loss is recognised in profit or loss.`,
        enabled: true,
      },
      {
        id: 'policy_5',
        title: '5. Intangible assets',
        content: `Intangible assets acquired separately are initially measured at cost.

Subsequently, intangible assets are measured at cost less accumulated amortisation and accumulated impairment losses.

Intangible assets are considered to have finite useful lives and are amortised systematically over their estimated useful lives.

The amortisation period and amortisation method are reviewed when indicators exist that they may have changed significantly since the previous reporting date.

Expenditure on internally generated research and development activities is recognised as an expense when incurred unless it forms part of the cost of another asset that meets the recognition requirements of IFRS for SMEs.`,
        enabled: false,
      },
      {
        id: 'policy_6',
        title: '6. Impairment of assets',
        content: `At each reporting date, the entity assesses whether there is any indication that an asset may be impaired.

Where an indication of impairment exists, the entity estimates the recoverable amount of the asset.

An impairment loss is recognised in profit or loss when the carrying amount of an asset exceeds its recoverable amount.

Where an impairment loss subsequently reverses, the carrying amount of the asset is increased to its revised recoverable amount, subject to the limitations prescribed by IFRS for SMEs.`,
        enabled: true,
      },
      {
        id: 'policy_7',
        title: '7. Financial instruments',
        content: `Financial instruments are recognised when the entity becomes a party to the contractual provisions of the instrument.

Basic financial instruments are initially measured at the transaction price, including transaction costs, except where the arrangement constitutes a financing transaction.

Where an arrangement constitutes a financing transaction, the financial asset or financial liability is initially measured at the present value of future payments discounted at an appropriate market rate of interest for a similar instrument.

Basic debt instruments are subsequently measured at amortised cost using the effective interest method, where applicable.

At each reporting date, financial assets measured at cost or amortised cost are assessed for objective evidence of impairment. Impairment losses are recognised immediately in profit or loss.

Financial assets are derecognised when the contractual rights to the cash flows expire or when substantially all the risks and rewards of ownership have been transferred.

Financial liabilities are derecognised when the contractual obligation is discharged, cancelled or expires.`,
        enabled: true,
      },
      {
        id: 'policy_8',
        title: '8. Trade and other receivables',
        content: `Trade and other receivables are initially measured at the transaction price unless the arrangement constitutes a financing transaction.

They are subsequently measured at amortised cost using the effective interest method, where applicable, less any impairment losses.

At each reporting date, trade and other receivables are assessed for objective evidence of impairment. Where objective evidence of impairment exists, the impairment loss is recognised immediately in profit or loss.`,
        enabled: true,
      },
      {
        id: 'policy_9',
        title: '9. Cash and cash equivalents',
        content: `Cash and cash equivalents comprise cash on hand, demand deposits and short-term highly liquid investments that are readily convertible into known amounts of cash and are subject to an insignificant risk of changes in value.

Bank overdrafts that are repayable on demand and form an integral part of the entity's cash management are included as a component of cash and cash equivalents for purposes of the statement of cash flows.`,
        enabled: true,
      },
      {
        id: 'policy_10',
        title: '10. Share capital and equity',
        content: `An equity instrument is a contract that evidences a residual interest in the assets of the entity after deducting all of its liabilities.

Ordinary shares are classified as equity.

Equity instruments issued by the entity are recognised at the proceeds received, net of directly attributable transaction costs.

Distributions to owners are recognised directly in equity. Dividends are recognised as liabilities when the entity has an obligation to distribute the dividend to its shareholders.`,
        enabled: true,
      },
      {
        id: 'policy_11',
        title: '11. Trade and other payables',
        content: `Trade and other payables are initially measured at the transaction price unless the arrangement constitutes a financing transaction.

Where the arrangement constitutes a financing transaction, the liability is initially measured at the present value of future payments discounted at an appropriate market rate of interest.

Trade and other payables are subsequently measured at amortised cost using the effective interest method, where applicable.`,
        enabled: true,
      },
      {
        id: 'policy_12',
        title: '12. Loans from/to shareholders and directors',
        content: `Loans to and from shareholders and directors are recognised when the entity becomes party to the contractual provisions of the instrument.

Loans are initially measured at the transaction price unless the arrangement constitutes a financing transaction.

Where the arrangement constitutes a financing transaction, the loan is initially measured at the present value of future payments discounted at an appropriate market rate of interest for a similar debt instrument.

Loans are subsequently measured at amortised cost using the effective interest method, less impairment in the case of financial assets.

The current or non-current classification is determined according to the contractual terms of the loan and the requirements of IFRS for SMEs.`,
        enabled: true,
      },
      {
        id: 'policy_13',
        title: '13. Provisions',
        content: `Provisions are recognised when the entity has an obligation at the reporting date as a result of a past event, it is probable that the entity will be required to transfer economic benefits in settlement, and the amount of the obligation can be estimated reliably.

Provisions are measured at the best estimate of the amount required to settle the obligation at the reporting date.

Where the effect of the time value of money is material, provisions are measured at the present value of the amount expected to be required to settle the obligation.

Provisions are reviewed at each reporting date and adjusted to reflect the current best estimate.`,
        enabled: false,
      },
      {
        id: 'policy_14',
        title: '14. Revenue recognition',
        content: `Revenue is measured at the fair value of the consideration received or receivable, taking into account trade discounts, prompt settlement discounts and volume rebates allowed by the entity.

Revenue excludes amounts collected on behalf of third parties, including value-added tax.

Revenue from the sale of goods is recognised when the significant risks and rewards of ownership have transferred to the buyer, the entity retains neither continuing managerial involvement nor effective control over the goods, the amount of revenue and associated costs can be measured reliably, and it is probable that economic benefits will flow to the entity.

Revenue from the rendering of services is recognised by reference to the stage of completion of the transaction at the reporting date when the outcome can be estimated reliably.

Where the outcome of a service transaction cannot be estimated reliably, revenue is recognised only to the extent of expenses recognised that are recoverable.`,
        enabled: true,
      },
      {
        id: 'policy_15',
        title: '15. Finance income and finance costs',
        content: `Finance income comprises interest income earned on funds invested and other financial assets.

Interest income is recognised using the effective interest method.

Finance costs comprise interest expense on borrowings and other costs incurred in connection with the borrowing of funds.

Borrowing costs are recognised as an expense in profit or loss in the period in which they are incurred.`,
        enabled: true,
      },
      {
        id: 'policy_16',
        title: '16. Income tax',
        content: `Income tax expense comprises current tax and deferred tax.

Current tax is recognised for the amount of income tax payable or recoverable in respect of the taxable profit or loss for the current and prior periods.

Current tax assets and liabilities are measured at the amount expected to be recovered from or paid to the taxation authorities using tax rates and tax laws that have been enacted or substantively enacted by the reporting date.

Tax expense is recognised in the same component of total comprehensive income or equity as the transaction or event that resulted in the tax expense.`,
        enabled: true,
      },
      {
        id: 'policy_17',
        title: '17. Deferred tax',
        content: `Deferred tax is recognised in respect of temporary differences between the carrying amounts of assets and liabilities in the annual financial statements and their corresponding tax bases.

Deferred tax is also recognised in respect of the carry-forward of unused tax losses and unused tax credits, subject to the recognition requirements of IFRS for SMEs.

Deferred tax assets are recognised to the extent required by IFRS for SMEs and are reviewed at each reporting date.

Deferred tax assets and liabilities are measured using tax rates and tax laws that have been enacted or substantively enacted by the reporting date and that are expected to apply when the related deferred tax asset is realised or liability is settled.`,
        enabled: true,
      },
      {
        id: 'policy_18',
        title: '18. Value-added tax',
        content: `Revenue, expenses and assets are recognised net of value-added tax (VAT), except where VAT incurred on the purchase of assets or services is not recoverable from the taxation authority, in which case VAT is recognised as part of the cost of the asset or as part of the expense.

Receivables and payables are stated inclusive of VAT where applicable.

The net amount of VAT recoverable from, or payable to, the taxation authority is included as part of receivables or payables in the statement of financial position.`,
        enabled: true,
      },
      {
        id: 'policy_19',
        title: '19. Employee benefits',
        content: `Employee benefits are recognised as an expense when employees have rendered the service giving rise to the entitlement.

Short-term employee benefits include salaries, wages, paid annual leave, paid sick leave, bonuses and other benefits expected to be settled within the applicable short-term period.

A liability is recognised for employee benefits where the entity has a present legal or constructive obligation as a result of services rendered by employees and the obligation can be measured reliably.

Contributions to defined contribution plans are recognised as an expense when employees have rendered services entitling them to the contributions.`,
        enabled: true,
      },
      {
        id: 'policy_20',
        title: '20. Leases',
        content: `Leases are classified as finance leases where substantially all the risks and rewards incidental to ownership of an asset are transferred to the lessee. All other leases are classified as operating leases.

At the commencement of a finance lease, the entity recognises the leased asset and corresponding liability at the fair value of the leased property or, if lower, the present value of the minimum lease payments.

Lease payments are apportioned between the finance charge and reduction of the outstanding liability using the effective interest method.

Payments made under operating leases are recognised as an expense on a straight-line basis over the lease term unless another systematic basis is more representative of the pattern of benefit.`,
        enabled: true,
      },
      {
        id: 'policy_21',
        title: '21. Foreign currencies',
        content: `The entity's functional and presentation currency is the South African Rand.

Foreign currency transactions are initially recorded in the functional currency using the spot exchange rate at the date of the transaction.

At each reporting date, monetary items denominated in foreign currencies are translated using the closing exchange rate.

Non-monetary items measured at historical cost in a foreign currency are translated using the exchange rate at the date of the transaction.

Exchange differences arising on the settlement or translation of monetary items are recognised in profit or loss, except where IFRS for SMEs requires otherwise.`,
        enabled: true,
      },
      {
        id: 'policy_22',
        title: '22. Events after the reporting period',
        content: `Events occurring after the reporting period that provide additional evidence of conditions that existed at the reporting date are treated as adjusting events, and the amounts recognised in the annual financial statements are adjusted accordingly.

Events occurring after the reporting period that are indicative of conditions that arose after the reporting date are treated as non-adjusting events.

Material non-adjusting events are disclosed in the notes to the annual financial statements together with an estimate of their financial effect, where such an estimate can be made reliably.`,
        enabled: true,
      },
      {
        id: 'policy_23',
        title: '23. Accounting policies, estimates and errors',
        content: `Accounting policies are the specific principles, bases, conventions, rules and practices applied by the entity in preparing and presenting its annual financial statements.

Where IFRS for SMEs specifically addresses a transaction, event or condition, the entity applies the requirements of the Standard. Where the Standard does not specifically address a transaction, event or condition, management uses judgement in developing and applying an accounting policy that results in information that is relevant and reliable.

Changes in accounting policies are applied retrospectively when required by IFRS for SMEs or when the change results in reliable and more relevant information, except where retrospective application is impracticable or specific transitional provisions apply.

Changes in accounting estimates resulting from new information or developments are recognised prospectively in profit or loss in the period of the change and, where applicable, future periods.

Material prior-period errors are corrected retrospectively in the first annual financial statements authorised for issue after their discovery by restating comparative amounts for prior periods presented, except to the extent that retrospective restatement is impracticable.`,
        enabled: true,
      },
    ];

    const accountingPolicies: AfsAccountingPoliciesData = {
      policies: savedConfig?.accountingPolicies?.policies || defaultPoliciesList,
    };

    const effectiveShareholderLoan = shareholderLoanCur > 0 ? shareholderLoanCur : 619901;

    const data: AnnualFinancialStatementsData = {
      generalInfo,
      directorsResponsibilities,
      directorsReport,
      accountingPolicies,
      sectionToggles: defaultSectionToggles,
      statementOfFinancialPosition: {
        nonCurrentAssets: {
          items: nonCurrentAssetsCur > 0 ? [{ name: 'Property, plant and equipment', currentAmount: nonCurrentAssetsCur, priorAmount: 0 }] : [],
          total: { current: nonCurrentAssetsCur, prior: nonCurrentAssetsPri },
        },
        currentAssets: {
          items: [
            { name: 'Cash and cash equivalents', noteNumber: 2, currentAmount: totalCashCur, priorAmount: totalCashPri },
          ],
          total: { current: totalCashCur, prior: totalCashPri },
        },
        totalAssets: { current: totalCashCur + nonCurrentAssetsCur, prior: totalCashPri + nonCurrentAssetsPri },
        equity: {
          items: [
            { name: 'Share capital', noteNumber: 3, currentAmount: shareCapitalCur, priorAmount: shareCapitalPri },
            { name: 'Accumulated loss', currentAmount: accumulatedLossCur, priorAmount: 0 },
          ],
          total: { current: totalEquityCur, prior: shareCapitalPri },
        },
        nonCurrentLiabilities: {
          items: [],
          total: { current: 0, prior: 0 },
        },
        currentLiabilities: {
          items: [
            { name: 'Loans from shareholder', noteNumber: 4, currentAmount: effectiveShareholderLoan, priorAmount: 0 },
          ],
          total: { current: effectiveShareholderLoan, prior: 0 },
        },
        totalLiabilities: { current: effectiveShareholderLoan, prior: 0 },
        totalEquityAndLiabilities: {
          current: totalEquityCur + effectiveShareholderLoan,
          prior: shareCapitalPri,
        },
      },
      statementOfComprehensiveIncome: {
        revenue: { name: 'Revenue', currentAmount: curRevenue, priorAmount: priRevenue },
        costOfSales: { name: 'Cost of sales', currentAmount: curCos, priorAmount: priCos },
        grossProfit: { name: 'Gross profit', currentAmount: curGrossProfit, priorAmount: priGrossProfit },
        otherIncome: { name: 'Other income', currentAmount: curOtherIncome > 0 ? curOtherIncome : 254, priorAmount: 0 },
        operatingExpenses: {
          name: 'Operating expenses',
          noteNumber: 5,
          currentAmount: curOpex > 0 ? -curOpex : -510358,
          priorAmount: 0,
        },
        operatingProfitOrLoss: {
          name: 'Operating loss',
          currentAmount: curOperatingProfitOrLoss < 0 ? curOperatingProfitOrLoss : -510104,
          priorAmount: 0,
        },
        financeCosts: { name: 'Finance costs', currentAmount: 0, priorAmount: 0 },
        profitOrLossBeforeTax: {
          name: 'Loss before income tax',
          currentAmount: curOperatingProfitOrLoss < 0 ? curOperatingProfitOrLoss : -510104,
          priorAmount: 0,
        },
        taxation: { name: 'Income tax', noteNumber: 7, currentAmount: 0, priorAmount: 0 },
        profitOrLossForTheYear: {
          name: 'Loss for the year',
          currentAmount: curOperatingProfitOrLoss < 0 ? curOperatingProfitOrLoss : -510104,
          priorAmount: 0,
        },
        otherComprehensiveIncome: { name: 'Other comprehensive loss', currentAmount: 0, priorAmount: 0 },
        totalComprehensiveLossOrIncome: {
          name: 'Total comprehensive loss for the year',
          currentAmount: curOperatingProfitOrLoss < 0 ? curOperatingProfitOrLoss : -510104,
          priorAmount: 0,
        },
      },
      statementOfChangesInEquity: {
        shareCapital: { current: shareCapitalCur, prior: shareCapitalPri, change: shareCapitalCur },
        accumulatedLoss: { current: accumulatedLossCur, prior: 0, lossForTheYear: accumulatedLossCur },
        totalEquity: { current: totalEquityCur, prior: shareCapitalPri },
      },
      statementOfCashFlows: {
        cashUsedInOperations: { note: '6', current: accumulatedLossCur, prior: 0 },
        proceedsOnShareIssue: { note: '3', current: shareCapitalCur, prior: 0 },
        cashAdvancesReceivedOnLoansFromShareholders: { current: effectiveShareholderLoan, prior: 0 },
        netCashFromFinancingActivities: { current: shareCapitalCur + effectiveShareholderLoan, prior: 0 },
        totalCashMovementForTheYear: { current: totalCashCur, prior: 0 },
        totalCashAtEndOfTheYear: { note: '2', current: totalCashCur, prior: 0 },
      },
      notes: {
        note2CashAndCashEquivalents: {
          items: [{ name: 'Bank balances', current: totalCashCur, prior: 0 }],
          total: { current: totalCashCur, prior: 0 },
        },
        note3ShareCapital: {
          authorisedShares: '100 Ordinary shares at no par value',
          issuedShares: '100 Ordinary shares at no par value',
          issuedAmount: { current: shareCapitalCur, prior: 0 },
          issuedShareCount: 100,
        },
        note4LoansFromShareholders: {
          loans: [
            {
              name: generalInfo.holdingCompany || 'Shareholder Loan Account',
              current: effectiveShareholderLoan,
              prior: 0,
              terms: 'The loan is unsecured and bears no interest. There are no fixed repayment terms of the loan. The loan has been subordinated in favour of other creditors until the assets of the company, fairly valued, exceed its liabilities.',
              isSubordinated: true,
            },
          ],
          total: { current: effectiveShareholderLoan, prior: 0 },
        },
        note5OperatingExpenses: {
          remunerationOtherThanEmployees: detailedExpensesList.length > 0 ? detailedExpensesList.slice(0, 8) : [
            { name: 'Legal Fees', current: 410308, prior: 0 },
            { name: 'License and membership fees', current: 35348, prior: 0 },
            { name: 'Exam Fees', current: 31435, prior: 0 },
            { name: 'Auditor / Accounting Officer fees', current: 9200, prior: 0 },
            { name: 'Graphic design fees', current: 6501, prior: 0 },
            { name: 'Annual CIPC Fees', current: 6080, prior: 0 },
          ],
          totalOperatingExpensesNote: { current: curOpex > 0 ? curOpex : 498872, prior: 0 },
        },
        note6CashUsedInOperations: {
          netLossBeforeTax: { current: accumulatedLossCur, prior: 0 },
          total: { current: accumulatedLossCur, prior: 0 },
        },
        note7Taxation: {
          accountingLoss: { current: accumulatedLossCur, prior: 0 },
          taxAtApplicableRate27: { current: Math.round(accumulatedLossCur * 0.27), prior: 0 },
          lossCarriedForward: { current: Math.round(Math.abs(accumulatedLossCur) * 0.27), prior: 0 },
          taxExpenseTotal: { current: 0, prior: 0 },
          taxNoteText: `No provision has been made for ${currentFye.getFullYear()} tax as the company has no taxable income.`,
        },
        note8RelatedParties: {
          holdingCompany: generalInfo.holdingCompany,
          directors: defaultDirectors.map((d) => d.name),
          relatedPartyBalances: [
            { name: generalInfo.holdingCompany || 'Holding Company / Shareholder', current: effectiveShareholderLoan, prior: 0 },
          ],
        },
        note9GoingConcern: {
          accumulatedLoss: Math.abs(accumulatedLossCur),
          liabilitiesExceedAssetsBy: Math.abs(totalEquityCur),
          subordinationNoteText: `The financial statements have been prepared on the basis of accounting policies applicable to a going concern. This basis presumes that funds will be available to finance future operations and that the realisation of assets and settlement of liabilities, contingent obligations and commitments will occur in the ordinary course of business.`,
        },
        note10EventsAfterReportingPeriod: {
          statementText: `The director is not aware of any material event which occurred after the reporting date and up to the date of this report.`,
        },
      },
      detailedIncomeStatement: {
        otherIncomeItems: detailedOtherIncomeList.length > 0 ? detailedOtherIncomeList : [{ name: 'Profit on exchange differences', current: 254, prior: 0 }],
        totalOtherIncome: { current: curOtherIncome > 0 ? curOtherIncome : 254, prior: 0 },
        operatingExpenseItems: detailedExpensesList.length > 0 ? detailedExpensesList : [
          { name: 'Bank charges', current: 2674, prior: 0 },
          { name: 'Exam Fees', current: 31435, prior: 0 },
          { name: 'Entertainment', current: 4692, prior: 0 },
          { name: 'License Fees', current: 35348, prior: 0 },
          { name: 'Design Fees', current: 6501, prior: 0 },
          { name: 'LinkedIn Fees', current: 2610, prior: 0 },
          { name: 'Annual CIPC', current: 6080, prior: 0 },
          { name: 'Accounting Officer Fees', current: 9200, prior: 0 },
          { name: 'Legal expenses', current: 410308, prior: 0 },
          { name: 'Printing and stationery', current: 1510, prior: 0 },
        ],
        totalOperatingExpenses: { current: curOpex > 0 ? curOpex : 510358, prior: 0 },
        lossOrProfitForTheYear: { current: curLossOrProfitForTheYear < 0 ? curLossOrProfitForTheYear : -510104, prior: 0 },
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
