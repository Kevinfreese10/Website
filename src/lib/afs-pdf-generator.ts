import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnnualFinancialStatementsData } from './afs-types';

export function generateAfsPdf(data: AnnualFinancialStatementsData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const leftMargin = 20;
  const rightMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  const {
    generalInfo,
    directorsResponsibilities,
    directorsReport,
    statementOfFinancialPosition,
    statementOfComprehensiveIncome,
    statementOfChangesInEquity,
    statementOfCashFlows,
    notes,
    detailedIncomeStatement,
  } = data;

  const formatRand = (val: number, blankIfZero = false) => {
    if (val === 0) return blankIfZero ? '-' : '-';
    const isNeg = val < 0;
    const abs = Math.abs(val);
    const formatted = abs.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return isNeg ? `(${formatted})` : formatted;
  };

  const drawPageHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(generalInfo.companyName, leftMargin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`(Registration number: ${generalInfo.registrationNumber})`, leftMargin, 24);
    doc.text(`Financial Statements for the year ended ${generalInfo.financialYearEndedDate}`, leftMargin, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(title, leftMargin, 37);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(leftMargin, 39, pageWidth - rightMargin, 39);
  };

  const drawPageFooter = (pageNum: number, disclaimer?: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`${pageNum}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

    if (disclaimer) {
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text(disclaimer, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  };

  // PAGE 1: COVER PAGE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(generalInfo.companyName, pageWidth / 2, 120, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`(Registration number ${generalInfo.registrationNumber})`, pageWidth / 2, 126, { align: 'center' });
  doc.text('Financial Statements', pageWidth / 2, 132, { align: 'center' });
  doc.text(`for the year ended ${generalInfo.financialYearEndedDate}`, pageWidth / 2, 137, { align: 'center' });

  // PAGE 2: GENERAL INFORMATION
  doc.addPage();
  drawPageHeader('General Information');

  let y = 48;
  const addInfoRow = (label: string, value: string | string[]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(label, leftMargin, y);

    doc.setFont('helvetica', 'normal');
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        doc.text(v, leftMargin + 65, y + i * 4);
      });
      y += Math.max(8, value.length * 4 + 4);
    } else {
      const split = doc.splitTextToSize(value, contentWidth - 65);
      doc.text(split, leftMargin + 65, y);
      y += split.length * 4 + 3.5;
    }
  };

  addInfoRow('Country of incorporation and domicile', generalInfo.countryOfIncorporation);
  addInfoRow('Nature of business and principal activities', generalInfo.natureOfBusiness);
  addInfoRow('Directors', generalInfo.directors.map((d) => d.name));
  addInfoRow('Registered office', generalInfo.registeredOffice);
  addInfoRow('Business address', generalInfo.businessAddress);
  if (generalInfo.holdingCompany) addInfoRow('Holding company', generalInfo.holdingCompany);
  addInfoRow(
    generalInfo.assuranceLevel === 'audited' ? 'Auditors' : 'Accounting Officer / Compiler',
    [generalInfo.auditorOrPractitionerFirm, generalInfo.auditorOrPractitionerTitle]
  );
  addInfoRow('Company registration number', generalInfo.registrationNumber);
  addInfoRow(
    'Level of assurance',
    generalInfo.assuranceLevel === 'audited'
      ? 'These financial statements have been audited in compliance with the applicable requirements of the Companies Act of South Africa.'
      : 'These financial statements have been compiled in compliance with the applicable requirements of the Companies Act of South Africa.'
  );
  addInfoRow('Preparer', ['The financial statements were internally compiled by:', generalInfo.preparerName, generalInfo.preparerDesignation]);
  addInfoRow('Issued', generalInfo.issuedDate);

  drawPageFooter(1);

  // PAGE 3: INDEX
  doc.addPage();
  drawPageHeader('Index');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('The reports and statements set out below comprise the financial statements presented to the shareholder:', leftMargin, 48);

  const indexItems = [
    ["Director's Responsibilities and Approval", '3'],
    [generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report" : "Report of the Accounting Officer", '4 - 6'],
    ["Director's Report", '7 - 8'],
    ['Statement of Financial Position', '9'],
    ['Statement of Profit or Loss and Other Comprehensive Income', '10'],
    ['Statement of Changes in Equity', '11'],
    ['Statement of Cash Flows', '12'],
    ['Accounting Policies', '13'],
    ['Notes to the Financial Statements', '14 - 15'],
  ];

  autoTable(doc, {
    startY: 55,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: indexItems,
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('The following supplementary information does not form part of the financial statements and is unaudited:', leftMargin, finalY + 8);

  autoTable(doc, {
    startY: finalY + 12,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: [['Detailed Income Statement', '16']],
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });
  drawPageFooter(2);

  // PAGE 4: DIRECTOR'S RESPONSIBILITIES AND APPROVAL
  doc.addPage();
  drawPageHeader("Director's Responsibilities and Approval");
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const respParas = (directorsResponsibilities.responsibilitiesText || '').split('\n\n').filter(Boolean);

  let pY = 48;
  respParas.forEach((p) => {
    const split = doc.splitTextToSize(p.trim(), contentWidth);
    doc.text(split, leftMargin, pY);
    pY += split.length * 3.8 + 3.5;
  });

  doc.setFont('helvetica', 'bold');
  doc.text('Approval of financial statements', leftMargin, pY + 8);
  doc.line(leftMargin, pY + 26, leftMargin + 65, pY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(directorsResponsibilities.signatoryName || generalInfo.directors[0]?.name || 'Director', leftMargin, pY + 30);
  doc.text(directorsResponsibilities.signatoryTitle || 'Director', leftMargin, pY + 34);
  drawPageFooter(3);

  // PAGE 5-7: PRACTITIONER REPORT
  doc.addPage();
  drawPageHeader(generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report" : "Report of the Accounting Officer");
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`To the Shareholder of ${generalInfo.companyName}`, leftMargin, 48);

  doc.text('Opinion / Report of the Accounting Officer', leftMargin, 56);
  doc.setFont('helvetica', 'normal');
  const opText = `We have compiled the financial statements of ${generalInfo.companyName} set out on pages 9 to 15, which comprise the statement of financial position as at ${generalInfo.financialYearEndedDate}, and the statement of profit or loss and other comprehensive income, the statement of changes in equity and the statement of cash flows for the year then ended, and notes to the financial statements, including a summary of material accounting policies. The financial statements have been compiled in accordance with the International Standard on Related Services (ISRS 4410) and the requirements of the Companies Act of South Africa.`;
  const opSplit = doc.splitTextToSize(opText, contentWidth);
  doc.text(opSplit, leftMargin, 61);

  doc.setFont('helvetica', 'bold');
  doc.text('Basis of Compilation', leftMargin, 61 + opSplit.length * 4 + 4);
  doc.setFont('helvetica', 'normal');
  const basisText = `We performed this compilation engagement in accordance with International Standard on Related Services 4410 (Revised), Compilation Engagements. We have applied our expertise in accounting and financial reporting to assist you in the preparation and presentation of these financial statements on the basis of International Financial Reporting Standard for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa.`;
  const basisSplit = doc.splitTextToSize(basisText, contentWidth);
  doc.text(basisSplit, leftMargin, 61 + opSplit.length * 4 + 9);
  drawPageFooter(4);

  // PAGE 6
  doc.addPage();
  drawPageHeader(generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report (Continued)" : "Report of the Accounting Officer (Continued)");
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Responsibilities of the Director for the Financial Statements', leftMargin, 48);
  doc.setFont('helvetica', 'normal');
  const dirResp = `The director is responsible for the preparation and fair presentation of the financial statements in accordance with International Financial Reporting Standard for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa, and for such internal control as the director determines is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.`;
  const dirRespSplit = doc.splitTextToSize(dirResp, contentWidth);
  doc.text(dirRespSplit, leftMargin, 53);

  doc.setFont('helvetica', 'bold');
  doc.text("Accounting Officer's Responsibilities", leftMargin, 53 + dirRespSplit.length * 4 + 4);
  doc.setFont('helvetica', 'normal');
  const audResp = `Since a compilation engagement is not an assurance engagement, we are not required to verify the accuracy or completeness of the information you provided to us to compile these financial statements. Accordingly, we do not express an audit opinion or a review conclusion on whether these financial statements are prepared in accordance with IFRS for SMEs.`;
  const audRespSplit = doc.splitTextToSize(audResp, contentWidth);
  doc.text(audRespSplit, leftMargin, 53 + dirRespSplit.length * 4 + 9);
  drawPageFooter(5);

  // PAGE 7: Sign-off
  doc.addPage();
  drawPageHeader(generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report (Sign-off)" : "Report of the Accounting Officer (Sign-off)");
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('We communicate with the directors regarding, among other matters, the planned scope and timing of our compilation procedures.', leftMargin, 48);

  doc.setFont('helvetica', 'bold');
  doc.text(generalInfo.auditorOrPractitionerFirm, leftMargin, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(generalInfo.auditorOrPractitionerTitle, leftMargin, 70);
  doc.text(`Per: ${generalInfo.leadPartnerName || 'Kevin Freese'}`, leftMargin, 78);
  doc.text(generalInfo.leadPartnerTitle || 'Accounting Officer BAP(SA)', leftMargin, 82);
  doc.text(generalInfo.auditorOrPractitionerAddress, leftMargin, 90);
  doc.setFont('helvetica', 'bold');
  doc.text(generalInfo.issuedDate, leftMargin, 96);
  drawPageFooter(6);

  // PAGE 8-9: DIRECTOR'S REPORT
  doc.addPage();
  drawPageHeader("Director's Report");
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`The director has pleasure in submitting her report on the financial statements of ${generalInfo.companyName} for the year ended ${generalInfo.financialYearEndedDate}.`, leftMargin, 48);

  let dY = 56;
  if (directorsReport.incorporationText) {
    doc.setFont('helvetica', 'bold');
    doc.text('1. Incorporation', leftMargin, dY);
    doc.setFont('helvetica', 'normal');
    doc.text(directorsReport.incorporationText, leftMargin, dY + 4);
    dY += 12;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('2. Nature of business', leftMargin, dY);
  doc.setFont('helvetica', 'normal');
  const natSplit = doc.splitTextToSize(directorsReport.natureOfBusiness, contentWidth);
  doc.text(natSplit, leftMargin, dY + 4);
  dY += natSplit.length * 4 + 5;

  doc.setFont('helvetica', 'bold');
  doc.text('3. Review of financial results and activities', leftMargin, dY);
  doc.setFont('helvetica', 'normal');
  const revSplit = doc.splitTextToSize(directorsReport.reviewOfActivities, contentWidth);
  doc.text(revSplit, leftMargin, dY + 4);
  dY += revSplit.length * 4 + 5;

  doc.setFont('helvetica', 'bold');
  doc.text('4. Share capital', leftMargin, dY);
  dY += 4;

  autoTable(doc, {
    startY: dY,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Authorised', 'Number of shares']],
    body: [[notes.note3ShareCapital.authorisedShares, '100']],
    styles: { fontSize: 8, cellPadding: 1.5 },
  });

  const scY = (doc as any).lastAutoTable?.finalY || dY + 12;
  autoTable(doc, {
    startY: scY + 2,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Issued', '2026 (R)', '2025 (R)', 'Number of shares']],
    body: [[notes.note3ShareCapital.issuedShares, `${formatRand(notes.note3ShareCapital.issuedAmount.current)}`, `${formatRand(notes.note3ShareCapital.issuedAmount.prior || 100)}`, '100']],
    styles: { fontSize: 8, cellPadding: 1.5 },
  });

  const sc2Y = (doc as any).lastAutoTable?.finalY || scY + 12;
  doc.setFont('helvetica', 'bold');
  doc.text('5. Director', leftMargin, sc2Y + 5);

  const directorRows = generalInfo.directors.map((d) => [
    d.name,
    d.office || 'Chief Executive Officer',
    d.designation || 'Executive',
    d.nationality || 'South African',
  ]);

  autoTable(doc, {
    startY: sc2Y + 8,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Director', 'Office', 'Designation', 'Nationality']],
    body: directorRows,
    styles: { fontSize: 8, cellPadding: 1.5 },
  });

  const dirY = (doc as any).lastAutoTable?.finalY || sc2Y + 22;
  doc.setFont('helvetica', 'bold');
  doc.text('6. Events after the reporting period', leftMargin, dirY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(directorsReport.eventsAfterReportingPeriod, leftMargin, dirY + 9);

  drawPageFooter(7);

  // PAGE 9: DIRECTOR'S REPORT (CONTINUED)
  doc.addPage();
  drawPageHeader("Director's Report (Continued)");
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('7. Going concern', leftMargin, 48);
  doc.setFont('helvetica', 'normal');
  const gcText1 =
    'The financial statements have been prepared on the basis of accounting policies applicable to a going concern. This basis presumes that funds will be available to finance future operations and that the realisation of assets and settlement of liabilities, contingent obligations and commitments will occur in the ordinary course of business.';
  const gc1Split = doc.splitTextToSize(gcText1, contentWidth);
  doc.text(gc1Split, leftMargin, 53);

  const gcText2 = directorsReport.goingConcernText;
  if (gcText2 && gcText2 !== gcText1) {
    const gc2Split = doc.splitTextToSize(gcText2, contentWidth);
    doc.text(gc2Split, leftMargin, 53 + gc1Split.length * 4 + 3);
  }

  drawPageFooter(8);

  // PAGE 10: STATEMENT OF FINANCIAL POSITION
  doc.addPage();
  drawPageHeader(`Statement of Financial Position as at ${generalInfo.financialYearEndedDate}`);

  const bsRows = [
    [{ content: 'Assets', styles: { fontStyle: 'bold' } }, '', ''],
    [{ content: 'Current Assets', styles: { fontStyle: 'bold' } }, '', ''],
    ['Cash and cash equivalents', '2', formatRand(statementOfFinancialPosition.currentAssets.total.current)],
    [{ content: 'Total Assets', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfFinancialPosition.totalAssets.current), styles: { fontStyle: 'bold' } }],
    ['', '', ''],
    [{ content: 'Equity and Liabilities', styles: { fontStyle: 'bold' } }, '', ''],
    [{ content: 'Equity', styles: { fontStyle: 'bold' } }, '', ''],
    ['Share capital', '3', formatRand(statementOfFinancialPosition.equity.items[0]?.currentAmount || 100)],
    ['Accumulated loss', '', formatRand(statementOfFinancialPosition.equity.items[1]?.currentAmount || -510104)],
    ['', '', { content: formatRand(statementOfFinancialPosition.equity.total.current), styles: { fontStyle: 'bold' } }],
    ['', '', ''],
    [{ content: 'Liabilities', styles: { fontStyle: 'bold' } }, '', ''],
    [{ content: 'Current Liabilities', styles: { fontStyle: 'bold' } }, '', ''],
    ['Loans from shareholder', '4', formatRand(statementOfFinancialPosition.currentLiabilities.items[0]?.currentAmount || 619901)],
    [{ content: 'Total Liabilities', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfFinancialPosition.totalLiabilities.current), styles: { fontStyle: 'bold' } }],
    [{ content: 'Total Equity and Liabilities', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfFinancialPosition.totalEquityAndLiabilities.current), styles: { fontStyle: 'bold' } }],
  ];

  autoTable(doc, {
    startY: 48,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', 'Notes', '2026']],
    body: bsRows as any,
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' } },
  });
  drawPageFooter(9);

  // PAGE 11: STATEMENT OF COMPREHENSIVE INCOME
  doc.addPage();
  drawPageHeader('Statement of Profit or Loss and Other Comprehensive Income');

  const pnlTableRows = [
    ['Other income', '', formatRand(statementOfComprehensiveIncome.otherIncome.currentAmount)],
    ['Operating expenses', '5', formatRand(statementOfComprehensiveIncome.operatingExpenses.currentAmount)],
    [{ content: 'Operating loss', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfComprehensiveIncome.operatingProfitOrLoss.currentAmount), styles: { fontStyle: 'bold' } }],
    [{ content: 'Loss before income tax', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfComprehensiveIncome.profitOrLossBeforeTax.currentAmount), styles: { fontStyle: 'bold' } }],
    ['Income tax', '7', '-'],
    [{ content: 'Loss for the year', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfComprehensiveIncome.profitOrLossForTheYear.currentAmount), styles: { fontStyle: 'bold' } }],
    ['Other comprehensive loss', '', '-'],
    [{ content: 'Total comprehensive loss for the year', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfComprehensiveIncome.totalComprehensiveLossOrIncome.currentAmount), styles: { fontStyle: 'bold' } }],
  ];

  autoTable(doc, {
    startY: 48,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', 'Note(s)', '2026']],
    body: pnlTableRows as any,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' } },
  });
  drawPageFooter(10);

  // PAGE 12: STATEMENT OF CHANGES IN EQUITY
  doc.addPage();
  drawPageHeader('Statement of Changes in Equity');

  const eqRows = [
    ['Loss for the year', '-', formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear), formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear)],
    ['Other comprehensive income', '-', '-', '-'],
    [{ content: 'Total comprehensive loss for the year', styles: { fontStyle: 'bold' } }, '-', formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear), formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear)],
    ['Issue of Shares', formatRand(statementOfChangesInEquity.shareCapital.change), '-', formatRand(statementOfChangesInEquity.shareCapital.change)],
    [{ content: 'Total changes', styles: { fontStyle: 'bold' } }, formatRand(statementOfChangesInEquity.shareCapital.change), '-', formatRand(statementOfChangesInEquity.shareCapital.change)],
    [{ content: `Balance at ${generalInfo.financialYearEndedDate}`, styles: { fontStyle: 'bold' } }, formatRand(statementOfChangesInEquity.shareCapital.current), formatRand(statementOfChangesInEquity.accumulatedLoss.current), formatRand(statementOfChangesInEquity.totalEquity.current)],
  ];

  autoTable(doc, {
    startY: 48,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', 'Share capital', 'Accumulated loss', 'Total equity']],
    body: eqRows as any,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } },
  });

  const eqFinalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Note 3', leftMargin, eqFinalY + 5);
  drawPageFooter(11);

  // PAGE 13: STATEMENT OF CASH FLOWS
  doc.addPage();
  drawPageHeader('Statement of Cash Flows');

  const cfRows = [
    [{ content: 'Cash flows from operating activities', styles: { fontStyle: 'bold' } }, '', ''],
    ['Cash used in operations', '6', formatRand(statementOfCashFlows.cashUsedInOperations.current)],
    ['', '', ''],
    [{ content: 'Cash flows from financing activities', styles: { fontStyle: 'bold' } }, '', ''],
    ['Proceeds on share issue', '3', formatRand(statementOfCashFlows.proceedsOnShareIssue.current)],
    ['Cash advances received on loans from shareholders', '', formatRand(statementOfCashFlows.cashAdvancesReceivedOnLoansFromShareholders.current)],
    [{ content: 'Net cash from financing activities', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfCashFlows.netCashFromFinancingActivities.current), styles: { fontStyle: 'bold' } }],
    ['', '', ''],
    [{ content: 'Total cash movement for the year', styles: { fontStyle: 'bold' } }, '', { content: formatRand(statementOfCashFlows.totalCashMovementForTheYear.current), styles: { fontStyle: 'bold' } }],
    ['Total cash at end of the year', '2', { content: formatRand(statementOfCashFlows.totalCashAtEndOfTheYear.current), styles: { fontStyle: 'bold' } }],
  ];

  autoTable(doc, {
    startY: 48,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', 'Notes', '2026']],
    body: cfRows as any,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' } },
  });
  drawPageFooter(12);

  // PAGE 14: ACCOUNTING POLICIES
  doc.addPage();
  drawPageHeader('Accounting Policies');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('1. Basis of preparation and summary of material accounting policies', leftMargin, 48);
  doc.setFont('helvetica', 'normal');
  const p1 =
    'The financial statements have been prepared on a going concern basis in accordance with the International Financial Reporting Standard for Small and Medium-sized Entities (IFRS for SMEs) and the requirements of the Companies Act of South Africa. The financial statements have been prepared on the historical cost basis, and incorporate the principal accounting policies set out below. They are presented in South African Rands.';
  const p1Split = doc.splitTextToSize(p1, contentWidth);
  doc.text(p1Split, leftMargin, 53);

  let polY = 53 + p1Split.length * 4 + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('1.1 Significant judgements and sources of estimation uncertainty', leftMargin, polY);
  doc.text('Critical judgements in applying accounting policies', leftMargin, polY + 4);
  doc.setFont('helvetica', 'normal');
  const p2 =
    'Management did not make critical judgements in the application of accounting policies, apart from those involving estimations, which would significantly affect the financial statements.';
  const p2Split = doc.splitTextToSize(p2, contentWidth);
  doc.text(p2Split, leftMargin, polY + 9);

  polY = polY + 9 + p2Split.length * 4 + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('1.2 Financial instruments', leftMargin, polY);
  doc.text('Initial measurement', leftMargin, polY + 4);
  doc.setFont('helvetica', 'normal');
  const p3 =
    'Financial instruments including loans, are initially measured at the transaction price (including transaction costs except in the initial measurement of financial assets and liabilities that are measured at fair value through profit or loss) unless the arrangement constitutes, in effect, a financing transaction in which case it is measured at the present value of the future payments discounted at a market rate of interest.';
  const p3Split = doc.splitTextToSize(p3, contentWidth);
  doc.text(p3Split, leftMargin, polY + 9);

  polY = polY + 9 + p3Split.length * 4 + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('1.3 Income Tax', leftMargin, polY);
  doc.text('Current tax assets and liabilities', leftMargin, polY + 4);
  doc.setFont('helvetica', 'normal');
  const p4 =
    'Current tax for current period is, to the extent unpaid, recognised as a liability. If the amount already paid in respect of current period exceeds the amount due for that period, the excess is recognised as an asset.';
  const p4Split = doc.splitTextToSize(p4, contentWidth);
  doc.text(p4Split, leftMargin, polY + 9);

  polY = polY + 9 + p4Split.length * 4 + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('1.4 Share capital and equity', leftMargin, polY);
  doc.setFont('helvetica', 'normal');
  const p5 = 'Equity instruments issued by the company are recognised at the proceeds received, net of direct issue costs.';
  const p5Split = doc.splitTextToSize(p5, contentWidth);
  doc.text(p5Split, leftMargin, polY + 5);

  drawPageFooter(13);

  // PAGE 15: NOTES (PART 1)
  doc.addPage();
  drawPageHeader('Notes to the Financial Statements');

  let nY = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('2. Cash and cash equivalents', leftMargin, nY);
  doc.setFont('helvetica', 'normal');
  doc.text('Cash and cash equivalents consist of:', leftMargin, nY + 4);

  autoTable(doc, {
    startY: nY + 7,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: [['Bank balances', formatRand(notes.note2CashAndCashEquivalents.total.current)]],
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  let n2Y = (doc as any).lastAutoTable?.finalY || nY + 18;
  doc.setFont('helvetica', 'bold');
  doc.text('3. Share capital', leftMargin, n2Y + 4);
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    startY: n2Y + 7,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: [
      ['Authorised', ''],
      [notes.note3ShareCapital.authorisedShares, '100'],
      ['Issued', ''],
      [notes.note3ShareCapital.issuedShares, formatRand(notes.note3ShareCapital.issuedAmount.current)],
    ],
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  let n3Y = (doc as any).lastAutoTable?.finalY || n2Y + 30;
  doc.setFont('helvetica', 'bold');
  doc.text('4. Loans from shareholders', leftMargin, n3Y + 4);
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    startY: n3Y + 7,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: [[notes.note4LoansFromShareholders.loans[0]?.name || generalInfo.holdingCompany || 'Shareholder', `(${formatRand(notes.note4LoansFromShareholders.total.current)})`]],
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  let n4Y = (doc as any).lastAutoTable?.finalY || n3Y + 20;
  const loanTerms =
    notes.note4LoansFromShareholders.loans[0]?.terms ||
    'The loan is unsecured and bears no interest. There are no fixed repayment terms of the loan. The loan has been subordinated in favour of other creditors, until the assets of the company, fairly valued, exceeds its liabilities.';
  const loanSplit = doc.splitTextToSize(loanTerms, contentWidth);
  doc.text(loanSplit, leftMargin, n4Y + 3);

  let n5StartY = n4Y + 3 + loanSplit.length * 4 + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('5. Operating expenses', leftMargin, n5StartY);
  doc.setFont('helvetica', 'normal');
  doc.text('Operating expenses include the following expenses:', leftMargin, n5StartY + 4);
  doc.text('Remuneration, other than to employees, for:', leftMargin, n5StartY + 8);

  const opRows: any[] = notes.note5OperatingExpenses.remunerationOtherThanEmployees.map((r) => [r.name, formatRand(r.current)]);
  opRows.push([
    { content: '', styles: { fontStyle: 'bold' } },
    { content: formatRand(notes.note5OperatingExpenses.totalOperatingExpensesNote.current), styles: { fontStyle: 'bold' } },
  ]);

  autoTable(doc, {
    startY: n5StartY + 11,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: opRows,
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  drawPageFooter(14);

  // PAGE 16: NOTES (PART 2)
  doc.addPage();
  drawPageHeader('Notes to the Financial Statements (Continued)');

  let n6Y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('6. Cash used in operations', leftMargin, n6Y);
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    startY: n6Y + 4,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: [['Net loss before income tax', formatRand(notes.note6CashUsedInOperations.netLossBeforeTax.current)]],
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  let n7Y = (doc as any).lastAutoTable?.finalY || n6Y + 15;
  doc.setFont('helvetica', 'bold');
  doc.text('7. Taxation', leftMargin, n7Y + 4);
  doc.setFont('helvetica', 'normal');
  doc.text('Reconciliation of the tax expense', leftMargin, n7Y + 8);

  autoTable(doc, {
    startY: n7Y + 11,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: [
      ['Accounting loss', formatRand(notes.note7Taxation.accountingLoss.current)],
      ['Tax at the applicable tax rate of 27%', formatRand(notes.note7Taxation.taxAtApplicableRate27.current)],
      ['Tax effect of adjustments on taxable income', ''],
      ['Loss carried forward', formatRand(notes.note7Taxation.lossCarriedForward.current)],
      ['', '-'],
    ],
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  let n8Y = (doc as any).lastAutoTable?.finalY || n7Y + 35;
  doc.text(notes.note7Taxation.taxNoteText, leftMargin, n8Y + 3);

  doc.setFont('helvetica', 'bold');
  doc.text('8. Related parties', leftMargin, n8Y + 10);
  doc.setFont('helvetica', 'normal');

  autoTable(doc, {
    startY: n8Y + 13,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: [
      ['Relationships', ''],
      ['Holding company', generalInfo.holdingCompany || ''],
      ['Directors', generalInfo.directors.map((d) => d.name).join(', ')],
      ['Related party balances', ''],
      ['Loan accounts - Owing (to) by related parties', ''],
      [generalInfo.holdingCompany || '', formatRand(notes.note4LoansFromShareholders.total.current)],
    ],
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 70, halign: 'right' } },
  });

  let n9Y = (doc as any).lastAutoTable?.finalY || n8Y + 35;
  doc.setFont('helvetica', 'bold');
  doc.text('9. Going concern', leftMargin, n9Y + 4);
  doc.setFont('helvetica', 'normal');
  const gcNoteSplit = doc.splitTextToSize(notes.note9GoingConcern.subordinationNoteText, contentWidth);
  doc.text(gcNoteSplit, leftMargin, n9Y + 8);

  let n10Y = n9Y + 8 + gcNoteSplit.length * 4 + 3;
  doc.setFont('helvetica', 'bold');
  doc.text('10. Events after the reporting period', leftMargin, n10Y);
  doc.setFont('helvetica', 'normal');
  doc.text(notes.note10EventsAfterReportingPeriod.statementText, leftMargin, n10Y + 4);

  drawPageFooter(15);

  // PAGE 17: DETAILED INCOME STATEMENT
  doc.addPage();
  drawPageHeader('Detailed Income Statement');

  const detRows: any[] = [
    [{ content: 'Other income', styles: { fontStyle: 'bold' } }, ''],
    ...detailedIncomeStatement.otherIncomeItems.map((i) => [i.name, formatRand(i.current)]),
    ['', { content: formatRand(detailedIncomeStatement.totalOtherIncome.current), styles: { fontStyle: 'bold' } }],
    ['', ''],
    [{ content: 'Operating expenses', styles: { fontStyle: 'bold' } }, ''],
    ...detailedIncomeStatement.operatingExpenseItems.map((i) => [i.name, `(${formatRand(i.current)})`]),
    ['', { content: `(${formatRand(detailedIncomeStatement.totalOperatingExpenses.current)})`, styles: { fontStyle: 'bold' } }],
    ['', ''],
    [
      { content: 'Loss for the year', styles: { fontStyle: 'bold' } },
      { content: `(${formatRand(Math.abs(detailedIncomeStatement.lossOrProfitForTheYear.current))})`, styles: { fontStyle: 'bold' } },
    ],
  ];

  autoTable(doc, {
    startY: 48,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', '2026']],
    body: detRows,
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  drawPageFooter(16, 'The supplementary information presented does not form part of the financial statements and is unaudited');

  return doc;
}
