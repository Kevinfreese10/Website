import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnnualFinancialStatementsData, AfsSectionToggles } from './afs-types';

export function getDynamicNoteNumbers(toggles: AfsSectionToggles) {
  let noteCounter = 2; // Note 1 is Accounting Policies
  const noteCash = toggles.showNoteCash ? noteCounter++ : '';
  const noteShareCapital = toggles.showNoteShareCapital ? noteCounter++ : '';
  const noteShareholderLoans = toggles.showNoteShareholderLoans ? noteCounter++ : '';
  const noteOperatingExpenses = toggles.showNoteOperatingExpenses ? noteCounter++ : '';
  const noteCashUsedInOps = toggles.showNoteCashUsedInOps ? noteCounter++ : '';
  const noteTaxation = toggles.showNoteTaxation ? noteCounter++ : '';
  const noteRelatedParties = toggles.showNoteRelatedParties ? noteCounter++ : '';
  const noteGoingConcern = toggles.showNoteGoingConcern ? noteCounter++ : '';
  const noteEventsAfterReportingPeriod = toggles.showNoteEventsAfterReportingPeriod ? noteCounter++ : '';

  return {
    noteCash,
    noteShareCapital,
    noteShareholderLoans,
    noteOperatingExpenses,
    noteCashUsedInOps,
    noteTaxation,
    noteRelatedParties,
    noteGoingConcern,
    noteEventsAfterReportingPeriod,
  };
}

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
    accountingPolicies,
    sectionToggles,
    statementOfFinancialPosition,
    statementOfComprehensiveIncome,
    statementOfChangesInEquity,
    statementOfCashFlows,
    notes,
    detailedIncomeStatement,
  } = data;

  const toggles: AfsSectionToggles = sectionToggles || {
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
  };

  const dynamicNotes = getDynamicNoteNumbers(toggles);

  const cleanTitleText = (title: string) => title.replace(/^\d+(\.\d+)*\.\s*/, '').trim();

  const formatRand = (val?: number, blankIfZero = false) => {
    if (val === undefined || val === 0) return blankIfZero ? '' : '-';
    const isNeg = val < 0;
    const abs = Math.abs(val);
    const formatted = abs.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return isNeg ? `(${formatted})` : formatted;
  };

  const drawPageHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text(generalInfo.companyName, leftMargin, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`(Registration number: ${generalInfo.registrationNumber})`, leftMargin, 22);
    doc.text(`Financial Statements for the year ended ${generalInfo.financialYearEndedDate}`, leftMargin, 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(0, 0, 0);
    doc.text(title, leftMargin, 34);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.line(leftMargin, 36.5, pageWidth - rightMargin, 36.5);
  };

  let runningPageNumber = 1;

  const drawPageFooter = (pageNum: number, disclaimer?: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`${pageNum}`, pageWidth / 2, pageHeight - 12, { align: 'center' });

    if (disclaimer) {
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text(disclaimer, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }
  };

  // Helper for justified multi-paragraph rendering
  const renderJustifiedParagraphs = (
    text: string,
    startY: number,
    fontSize = 8.5,
    lineSpacing = 4,
    paraSpacing = 3
  ): number => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);

    const paragraphs = text.split('\n\n').filter(Boolean);
    let curY = startY;

    paragraphs.forEach((p) => {
      const splitLines = doc.splitTextToSize(p.trim(), contentWidth);
      if (curY + splitLines.length * lineSpacing > pageHeight - 20) {
        drawPageFooter(runningPageNumber++);
        doc.addPage();
        drawPageHeader('Accounting Policies (Continued)');
        curY = 44;
      }
      doc.text(splitLines, leftMargin, curY, { align: 'justify', maxWidth: contentWidth });
      curY += splitLines.length * lineSpacing + paraSpacing;
    });

    return curY;
  };

  // Common AutoTable styling hook for accounting top single rule & bottom double underline
  const accountingDidDrawCell = (hookData: any) => {
    if (hookData.section === 'body') {
      const rawRow = hookData.row.raw as any;
      const isSubtotal = rawRow?.isSubtotal;
      const isGrandTotal = rawRow?.isGrandTotal;
      const colIdx = hookData.column.index;

      // Apply accounting lines to amount columns (index 2 and 3)
      if (colIdx >= 2) {
        if (isSubtotal) {
          hookData.doc.setDrawColor(0, 0, 0);
          hookData.doc.setLineWidth(0.25);
          hookData.doc.line(hookData.cell.x, hookData.cell.y, hookData.cell.x + hookData.cell.width, hookData.cell.y);
        }
        if (isGrandTotal) {
          hookData.doc.setDrawColor(0, 0, 0);
          hookData.doc.setLineWidth(0.25);
          // Top single line
          hookData.doc.line(hookData.cell.x, hookData.cell.y, hookData.cell.x + hookData.cell.width, hookData.cell.y);
          // Bottom double line
          const botY = hookData.cell.y + hookData.cell.height;
          hookData.doc.line(hookData.cell.x, botY - 1.2, hookData.cell.x + hookData.cell.width, botY - 1.2);
          hookData.doc.line(hookData.cell.x, botY - 0.4, hookData.cell.x + hookData.cell.width, botY - 0.4);
        }
      }
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

  let y = 46;
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

  drawPageFooter(runningPageNumber++);

  // PAGE 3: INDEX
  doc.addPage();
  drawPageHeader('Index');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('The reports and statements set out below comprise the financial statements presented to the shareholder:', leftMargin, 46);

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
    startY: 53,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: indexItems,
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  if (toggles.showDetailedIncomeStatement) {
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
  }
  drawPageFooter(runningPageNumber++);

  // PAGE 4: DIRECTOR'S RESPONSIBILITIES AND APPROVAL (JUSTIFIED)
  doc.addPage();
  drawPageHeader("Director's Responsibilities and Approval");

  let pY = renderJustifiedParagraphs(directorsResponsibilities.responsibilitiesText || '', 46, 8.5, 3.8, 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Approval of financial statements', leftMargin, pY + 6);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, pY + 22, leftMargin + 65, pY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(directorsResponsibilities.signatoryName || generalInfo.directors[0]?.name || 'Director', leftMargin, pY + 26);
  doc.text(directorsResponsibilities.signatoryTitle || 'Director', leftMargin, pY + 30);
  drawPageFooter(runningPageNumber++);

  // PAGE 5-7: PRACTITIONER REPORT (JUSTIFIED)
  doc.addPage();
  drawPageHeader(generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report" : "Report of the Accounting Officer");
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`To the Shareholder of ${generalInfo.companyName}`, leftMargin, 46);

  doc.text('Opinion / Report of the Accounting Officer', leftMargin, 54);
  const opText = `We have compiled the financial statements of ${generalInfo.companyName} set out on pages 9 to 15, which comprise the statement of financial position as at ${generalInfo.financialYearEndedDate}, and the statement of profit or loss and other comprehensive income, the statement of changes in equity and the statement of cash flows for the year then ended, and notes to the financial statements, including a summary of material accounting policies. The financial statements have been compiled in accordance with the International Standard on Related Services (ISRS 4410) and the requirements of the Companies Act of South Africa.`;
  let rY = renderJustifiedParagraphs(opText, 59, 8.5, 3.8, 3.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Basis of Compilation', leftMargin, rY + 3);
  const basisText = `We performed this compilation engagement in accordance with International Standard on Related Services 4410 (Revised), Compilation Engagements. We have applied our expertise in accounting and financial reporting to assist you in the preparation and presentation of these financial statements on the basis of International Financial Reporting Standard for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa.`;
  renderJustifiedParagraphs(basisText, rY + 8, 8.5, 3.8, 3.5);
  drawPageFooter(runningPageNumber++);

  // PAGE 6
  doc.addPage();
  drawPageHeader(generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report (Continued)" : "Report of the Accounting Officer (Continued)");
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Responsibilities of the Director for the Financial Statements', leftMargin, 46);
  const dirResp = `The director is responsible for the preparation and fair presentation of the financial statements in accordance with International Financial Reporting Standard for Small and Medium-sized Entities and the requirements of the Companies Act of South Africa, and for such internal control as the director determines is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.`;
  let r2Y = renderJustifiedParagraphs(dirResp, 51, 8.5, 3.8, 3.5);

  doc.setFont('helvetica', 'bold');
  doc.text("Accounting Officer's Responsibilities", leftMargin, r2Y + 3);
  const audResp = `Since a compilation engagement is not an assurance engagement, we are not required to verify the accuracy or completeness of the information you provided to us to compile these financial statements. Accordingly, we do not express an audit opinion or a review conclusion on whether these financial statements are prepared in accordance with IFRS for SMEs.`;
  renderJustifiedParagraphs(audResp, r2Y + 8, 8.5, 3.8, 3.5);
  drawPageFooter(runningPageNumber++);

  // PAGE 7: Sign-off
  doc.addPage();
  drawPageHeader(generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report (Sign-off)" : "Report of the Accounting Officer (Sign-off)");
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const commText = 'We communicate with the directors regarding, among other matters, the planned scope and timing of our compilation procedures.';
  let r3Y = renderJustifiedParagraphs(commText, 46, 8.5, 3.8, 3.5);

  doc.setFont('helvetica', 'bold');
  doc.text(generalInfo.auditorOrPractitionerFirm, leftMargin, r3Y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(generalInfo.auditorOrPractitionerTitle, leftMargin, r3Y + 17);
  doc.text(`Per: ${generalInfo.leadPartnerName || 'Kevin Freese'}`, leftMargin, r3Y + 25);
  doc.text(generalInfo.leadPartnerTitle || 'Accounting Officer BAP(SA)', leftMargin, r3Y + 29);
  doc.text(generalInfo.auditorOrPractitionerAddress, leftMargin, r3Y + 37);
  doc.setFont('helvetica', 'bold');
  doc.text(generalInfo.issuedDate, leftMargin, r3Y + 43);
  drawPageFooter(runningPageNumber++);

  // PAGE 8-9: DIRECTOR'S REPORT (JUSTIFIED)
  doc.addPage();
  drawPageHeader("Director's Report");
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`The director has pleasure in submitting her report on the financial statements of ${generalInfo.companyName} for the year ended ${generalInfo.financialYearEndedDate}.`, leftMargin, 46);

  let dY = 54;
  let sectionIndex = 1;

  if (toggles.showIncorporation && directorsReport.incorporationText) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Incorporation`, leftMargin, dY);
    dY = renderJustifiedParagraphs(directorsReport.incorporationText, dY + 4.5, 8.5, 3.8, 2.5);
    dY += 2;
  }

  if (toggles.showNatureOfBusiness && directorsReport.natureOfBusiness) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Nature of business`, leftMargin, dY);
    dY = renderJustifiedParagraphs(directorsReport.natureOfBusiness, dY + 4.5, 8.5, 3.8, 2.5);
    dY += 2;
  }

  if (toggles.showReviewOfActivities && directorsReport.reviewOfActivities) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Review of financial results and activities`, leftMargin, dY);
    dY = renderJustifiedParagraphs(directorsReport.reviewOfActivities, dY + 4.5, 8.5, 3.8, 2.5);
    dY += 2;
  }

  if (toggles.showShareCapital) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Share capital`, leftMargin, dY);
    dY += 4;

    autoTable(doc, {
      startY: dY,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      head: [['Authorised', '', '', 'Number of shares']],
      body: [[notes.note3ShareCapital.authorisedShares, '', '', '100']],
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 104 }, 1: { cellWidth: 18 }, 2: { cellWidth: 24 }, 3: { cellWidth: 24, halign: 'right' } },
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
    });

    const scY = (doc as any).lastAutoTable?.finalY || dY + 12;
    autoTable(doc, {
      startY: scY + 2,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      head: [['Issued', '2026 (R)', '2025 (R)', 'Number of shares']],
      body: [
        [
          notes.note3ShareCapital.issuedShares,
          formatRand(notes.note3ShareCapital.issuedAmount.current),
          formatRand(notes.note3ShareCapital.issuedAmount.prior),
          '100',
        ],
      ],
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 104 }, 1: { cellWidth: 22, halign: 'right' }, 2: { cellWidth: 22, halign: 'right' }, 3: { cellWidth: 22, halign: 'right' } },
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
    });

    dY = (doc as any).lastAutoTable?.finalY || scY + 12;
    dY += 3;
  }

  if (toggles.showDirectors) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Director`, leftMargin, dY + 2);

    const directorRows = generalInfo.directors.map((d) => [
      d.name,
      d.office || 'Chief Executive Officer',
      d.designation || 'Executive',
      d.nationality || 'South African',
    ]);

    autoTable(doc, {
      startY: dY + 5,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      head: [['Director', 'Office', 'Designation', 'Nationality']],
      body: directorRows,
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 35 }, 3: { cellWidth: 35 } },
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
    });

    dY = (doc as any).lastAutoTable?.finalY || dY + 20;
    dY += 3;
  }

  if (toggles.showEventsAfterReportingPeriod) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Events after the reporting period`, leftMargin, dY + 2);
    dY = renderJustifiedParagraphs(directorsReport.eventsAfterReportingPeriod, dY + 6.5, 8.5, 3.8, 2.5);
  }

  drawPageFooter(runningPageNumber++);

  // PAGE 9: DIRECTOR'S REPORT (CONTINUED)
  doc.addPage();
  drawPageHeader("Director's Report (Continued)");
  let d2Y = 46;

  if (toggles.showGoingConcern) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${sectionIndex++}. Going concern`, leftMargin, d2Y);
    d2Y = renderJustifiedParagraphs(directorsReport.goingConcernText, d2Y + 4.5, 8.5, 3.8, 3);
    d2Y += 4;
  }

  if (toggles.showAuditorContinuance) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${sectionIndex++}. Accounting Officer / Auditor Continuance`, leftMargin, d2Y);
    renderJustifiedParagraphs(directorsReport.auditorOrPractitionerContinuance, d2Y + 4.5, 8.5, 3.8, 3);
  }

  drawPageFooter(runningPageNumber++);

  // STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
  doc.addPage();
  drawPageHeader(`Statement of Financial Position as at ${generalInfo.financialYearEndedDate}`);

  // Table columns: Description (104mm), Notes (18mm), 2026 (24mm), 2025 (24mm)
  const bsRows: any[] = [
    [{ content: 'Assets', styles: { fontStyle: 'bold' } }, '', '', ''],
    [{ content: 'Current Assets', styles: { fontStyle: 'bold' } }, '', '', ''],
    [
      'Cash and cash equivalents',
      dynamicNotes.noteCash ? `${dynamicNotes.noteCash}` : '',
      formatRand(statementOfFinancialPosition.currentAssets.total.current),
      formatRand(statementOfFinancialPosition.currentAssets.total.prior),
    ],
    {
      0: { content: 'Total Assets', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfFinancialPosition.totalAssets.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfFinancialPosition.totalAssets.prior), styles: { fontStyle: 'bold' } },
      isGrandTotal: true,
    },
    ['', '', '', ''],
    [{ content: 'Equity and Liabilities', styles: { fontStyle: 'bold' } }, '', '', ''],
    [{ content: 'Equity', styles: { fontStyle: 'bold' } }, '', '', ''],
    [
      'Share capital',
      dynamicNotes.noteShareCapital ? `${dynamicNotes.noteShareCapital}` : '',
      formatRand(statementOfFinancialPosition.equity.items[0]?.currentAmount || 100),
      formatRand(statementOfFinancialPosition.equity.items[0]?.priorAmount || 100),
    ],
    [
      'Accumulated loss',
      '',
      formatRand(statementOfFinancialPosition.equity.items[1]?.currentAmount || -510104),
      formatRand(statementOfFinancialPosition.equity.items[1]?.priorAmount),
    ],
    {
      0: '',
      1: '',
      2: { content: formatRand(statementOfFinancialPosition.equity.total.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfFinancialPosition.equity.total.prior), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    ['', '', '', ''],
    [{ content: 'Liabilities', styles: { fontStyle: 'bold' } }, '', '', ''],
    [{ content: 'Current Liabilities', styles: { fontStyle: 'bold' } }, '', '', ''],
    [
      'Loans from shareholder',
      dynamicNotes.noteShareholderLoans ? `${dynamicNotes.noteShareholderLoans}` : '',
      formatRand(statementOfFinancialPosition.currentLiabilities.items[0]?.currentAmount || 619901),
      formatRand(statementOfFinancialPosition.currentLiabilities.items[0]?.priorAmount),
    ],
    {
      0: { content: 'Total Liabilities', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfFinancialPosition.totalLiabilities.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfFinancialPosition.totalLiabilities.prior), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    {
      0: { content: 'Total Equity and Liabilities', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfFinancialPosition.totalEquityAndLiabilities.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfFinancialPosition.totalEquityAndLiabilities.prior), styles: { fontStyle: 'bold' } },
      isGrandTotal: true,
    },
  ];

  autoTable(doc, {
    startY: 46,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', 'Notes', '2026', '2025']],
    body: bsRows,
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 104 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
    },
    headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
    didDrawCell: accountingDidDrawCell,
  });
  drawPageFooter(runningPageNumber++);

  // STATEMENT OF COMPREHENSIVE INCOME
  doc.addPage();
  drawPageHeader('Statement of Profit or Loss and Other Comprehensive Income');

  const pnlTableRows: any[] = [
    [
      'Other income',
      '',
      formatRand(statementOfComprehensiveIncome.otherIncome.currentAmount),
      formatRand(statementOfComprehensiveIncome.otherIncome.priorAmount),
    ],
    [
      'Operating expenses',
      dynamicNotes.noteOperatingExpenses ? `${dynamicNotes.noteOperatingExpenses}` : '',
      formatRand(statementOfComprehensiveIncome.operatingExpenses.currentAmount),
      formatRand(statementOfComprehensiveIncome.operatingExpenses.priorAmount),
    ],
    {
      0: { content: 'Operating loss', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfComprehensiveIncome.operatingProfitOrLoss.currentAmount), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfComprehensiveIncome.operatingProfitOrLoss.priorAmount), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    {
      0: { content: 'Loss before income tax', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfComprehensiveIncome.profitOrLossBeforeTax.currentAmount), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfComprehensiveIncome.profitOrLossBeforeTax.priorAmount), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    [
      'Income tax',
      dynamicNotes.noteTaxation ? `${dynamicNotes.noteTaxation}` : '',
      formatRand(statementOfComprehensiveIncome.taxation.currentAmount),
      formatRand(statementOfComprehensiveIncome.taxation.priorAmount),
    ],
    {
      0: { content: 'Loss for the year', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfComprehensiveIncome.profitOrLossForTheYear.currentAmount), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfComprehensiveIncome.profitOrLossForTheYear.priorAmount), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    ['Other comprehensive loss', '', '-', '-'],
    {
      0: { content: 'Total comprehensive loss for the year', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfComprehensiveIncome.totalComprehensiveLossOrIncome.currentAmount), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfComprehensiveIncome.totalComprehensiveLossOrIncome.priorAmount), styles: { fontStyle: 'bold' } },
      isGrandTotal: true,
    },
  ];

  autoTable(doc, {
    startY: 46,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', 'Note(s)', '2026', '2025']],
    body: pnlTableRows,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 104 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
    },
    headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
    didDrawCell: accountingDidDrawCell,
  });
  drawPageFooter(runningPageNumber++);

  // STATEMENT OF CHANGES IN EQUITY
  doc.addPage();
  drawPageHeader('Statement of Changes in Equity');

  const eqRows: any[] = [
    [
      'Loss for the year',
      '-',
      formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear),
      formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear),
    ],
    ['Other comprehensive income', '-', '-', '-'],
    {
      0: { content: 'Total comprehensive loss for the year', styles: { fontStyle: 'bold' } },
      1: '-',
      2: { content: formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    [
      'Issue of Shares',
      formatRand(statementOfChangesInEquity.shareCapital.change),
      '-',
      formatRand(statementOfChangesInEquity.shareCapital.change),
    ],
    {
      0: { content: 'Total changes', styles: { fontStyle: 'bold' } },
      1: { content: formatRand(statementOfChangesInEquity.shareCapital.change), styles: { fontStyle: 'bold' } },
      2: '-',
      3: { content: formatRand(statementOfChangesInEquity.shareCapital.change), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    {
      0: { content: `Balance at ${generalInfo.financialYearEndedDate}`, styles: { fontStyle: 'bold' } },
      1: { content: formatRand(statementOfChangesInEquity.shareCapital.current), styles: { fontStyle: 'bold' } },
      2: { content: formatRand(statementOfChangesInEquity.accumulatedLoss.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfChangesInEquity.totalEquity.current), styles: { fontStyle: 'bold' } },
      isGrandTotal: true,
    },
  ];

  autoTable(doc, {
    startY: 46,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', 'Share capital', 'Accumulated loss', 'Total equity']],
    body: eqRows,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
    headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
    didDrawCell: accountingDidDrawCell,
  });

  const eqFinalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (dynamicNotes.noteShareCapital) {
    doc.text(`Note ${dynamicNotes.noteShareCapital}`, leftMargin, eqFinalY + 5);
  }
  drawPageFooter(runningPageNumber++);

  // STATEMENT OF CASH FLOWS
  doc.addPage();
  drawPageHeader('Statement of Cash Flows');

  const cfRows: any[] = [
    [{ content: 'Cash flows from operating activities', styles: { fontStyle: 'bold' } }, '', '', ''],
    [
      'Cash used in operations',
      dynamicNotes.noteCashUsedInOps ? `${dynamicNotes.noteCashUsedInOps}` : '',
      formatRand(statementOfCashFlows.cashUsedInOperations.current),
      formatRand(statementOfCashFlows.cashUsedInOperations.prior),
    ],
    ['', '', '', ''],
    [{ content: 'Cash flows from financing activities', styles: { fontStyle: 'bold' } }, '', '', ''],
    [
      'Proceeds on share issue',
      dynamicNotes.noteShareCapital ? `${dynamicNotes.noteShareCapital}` : '',
      formatRand(statementOfCashFlows.proceedsOnShareIssue.current),
      formatRand(statementOfCashFlows.proceedsOnShareIssue.prior),
    ],
    [
      'Cash advances received on loans from shareholders',
      '',
      formatRand(statementOfCashFlows.cashAdvancesReceivedOnLoansFromShareholders.current),
      formatRand(statementOfCashFlows.cashAdvancesReceivedOnLoansFromShareholders.prior),
    ],
    {
      0: { content: 'Net cash from financing activities', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfCashFlows.netCashFromFinancingActivities.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfCashFlows.netCashFromFinancingActivities.prior), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    ['', '', '', ''],
    {
      0: { content: 'Total cash movement for the year', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfCashFlows.totalCashMovementForTheYear.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfCashFlows.totalCashMovementForTheYear.prior), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    {
      0: { content: 'Total cash at end of the year', styles: { fontStyle: 'bold' } },
      1: dynamicNotes.noteCash ? `${dynamicNotes.noteCash}` : '',
      2: { content: formatRand(statementOfCashFlows.totalCashAtEndOfTheYear.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfCashFlows.totalCashAtEndOfTheYear.prior), styles: { fontStyle: 'bold' } },
      isGrandTotal: true,
    },
  ];

  autoTable(doc, {
    startY: 46,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Figures in Rand', 'Notes', '2026', '2025']],
    body: cfRows,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 104 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
    },
    headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
    didDrawCell: accountingDidDrawCell,
  });
  drawPageFooter(runningPageNumber++);

  // ACCOUNTING POLICIES (AUTO-PAGINATED & FULLY JUSTIFIED)
  doc.addPage();
  drawPageHeader('Accounting Policies');

  let polY = 46;
  const activePolicies = (accountingPolicies?.policies || []).filter((p) => p.enabled);

  activePolicies.forEach((pol, policyIdx) => {
    const dynamicPolicyTitle = `${policyIdx + 1}. ${cleanTitleText(pol.title)}`;

    if (polY > pageHeight - 35) {
      drawPageFooter(runningPageNumber++);
      doc.addPage();
      drawPageHeader('Accounting Policies (Continued)');
      polY = 46;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(dynamicPolicyTitle, leftMargin, polY);
    polY += 4.5;

    if (pol.subTitle) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(pol.subTitle, leftMargin, polY);
      polY += 4;
    }

    polY = renderJustifiedParagraphs(pol.content, polY, 8.5, 3.8, 2.5);
    polY += 2;
  });

  drawPageFooter(runningPageNumber++);

  // STATUTORY NOTES (PART 1)
  doc.addPage();
  drawPageHeader('Notes to the Financial Statements');

  let nY = 46;

  if (toggles.showNoteCash && dynamicNotes.noteCash) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${dynamicNotes.noteCash}. Cash and cash equivalents`, leftMargin, nY);
    doc.setFont('helvetica', 'normal');
    doc.text('Cash and cash equivalents consist of:', leftMargin, nY + 4);

    autoTable(doc, {
      startY: nY + 6,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      body: [
        [
          'Bank balances',
          '',
          formatRand(notes.note2CashAndCashEquivalents.total.current),
          formatRand(notes.note2CashAndCashEquivalents.total.prior),
        ],
      ],
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 18 },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
      },
    });
    nY = (doc as any).lastAutoTable?.finalY || nY + 16;
    nY += 4;
  }

  if (toggles.showNoteShareCapital && dynamicNotes.noteShareCapital) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${dynamicNotes.noteShareCapital}. Share capital`, leftMargin, nY);
    doc.setFont('helvetica', 'normal');

    const scRows: any[] = [
      ['Authorised', '', '', ''],
      [notes.note3ShareCapital.authorisedShares, '', '100', '-'],
      ['Issued', '', '', ''],
      {
        0: notes.note3ShareCapital.issuedShares,
        1: '',
        2: formatRand(notes.note3ShareCapital.issuedAmount.current),
        3: formatRand(notes.note3ShareCapital.issuedAmount.prior || 100),
        isSubtotal: true,
      },
    ];

    autoTable(doc, {
      startY: nY + 4,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      body: scRows,
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 18 },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
      },
      didDrawCell: accountingDidDrawCell,
    });
    nY = (doc as any).lastAutoTable?.finalY || nY + 26;
    nY += 4;
  }

  if (toggles.showNoteShareholderLoans && dynamicNotes.noteShareholderLoans) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${dynamicNotes.noteShareholderLoans}. Loans from shareholders`, leftMargin, nY);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: nY + 4,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      body: [
        [
          notes.note4LoansFromShareholders.loans[0]?.name || generalInfo.holdingCompany || 'Shareholder',
          '',
          `(${formatRand(notes.note4LoansFromShareholders.total.current)})`,
          formatRand(notes.note4LoansFromShareholders.total.prior),
        ],
      ],
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 18 },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
      },
    });

    const loanTermsY = (doc as any).lastAutoTable?.finalY || nY + 16;
    const loanTerms =
      notes.note4LoansFromShareholders.loans[0]?.terms ||
      'The loan is unsecured and bears no interest. There are no fixed repayment terms of the loan. The loan has been subordinated in favour of other creditors until the assets of the company, fairly valued, exceed its liabilities.';

    nY = renderJustifiedParagraphs(loanTerms, loanTermsY + 3, 8.5, 3.8, 2.5);
    nY += 4;
  }

  if (toggles.showNoteOperatingExpenses && dynamicNotes.noteOperatingExpenses) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${dynamicNotes.noteOperatingExpenses}. Operating expenses`, leftMargin, nY);
    doc.setFont('helvetica', 'normal');
    doc.text('Operating expenses include the following expenses:', leftMargin, nY + 4);
    doc.text('Remuneration, other than to employees, for:', leftMargin, nY + 8);

    const opRows: any[] = notes.note5OperatingExpenses.remunerationOtherThanEmployees.map((r) => [
      r.name,
      '',
      formatRand(r.current),
      formatRand(r.prior),
    ]);
    opRows.push({
      0: { content: '', styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(notes.note5OperatingExpenses.totalOperatingExpensesNote.current), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(notes.note5OperatingExpenses.totalOperatingExpensesNote.prior), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    });

    autoTable(doc, {
      startY: nY + 11,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      body: opRows,
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 18 },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
      },
      didDrawCell: accountingDidDrawCell,
    });
  }

  drawPageFooter(runningPageNumber++);

  // STATUTORY NOTES (PART 2)
  doc.addPage();
  drawPageHeader('Notes to the Financial Statements (Continued)');

  let n6Y = 46;

  if (toggles.showNoteCashUsedInOps && dynamicNotes.noteCashUsedInOps) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${dynamicNotes.noteCashUsedInOps}. Cash used in operations`, leftMargin, n6Y);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: n6Y + 4,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      body: [
        [
          'Net loss before income tax',
          '',
          formatRand(notes.note6CashUsedInOperations.netLossBeforeTax.current),
          formatRand(notes.note6CashUsedInOperations.netLossBeforeTax.prior),
        ],
      ],
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 18 },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
      },
    });
    n6Y = (doc as any).lastAutoTable?.finalY || n6Y + 15;
    n6Y += 4;
  }

  if (toggles.showNoteTaxation && dynamicNotes.noteTaxation) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${dynamicNotes.noteTaxation}. Taxation`, leftMargin, n6Y);
    doc.setFont('helvetica', 'normal');
    doc.text('Reconciliation of the tax expense', leftMargin, n6Y + 4);

    const taxRows: any[] = [
      ['Accounting loss', '', formatRand(notes.note7Taxation.accountingLoss.current), formatRand(notes.note7Taxation.accountingLoss.prior)],
      ['Tax at the applicable tax rate of 27%', '', formatRand(notes.note7Taxation.taxAtApplicableRate27.current), formatRand(notes.note7Taxation.taxAtApplicableRate27.prior)],
      ['Tax effect of adjustments on taxable income', '', '', ''],
      ['Loss carried forward', '', formatRand(notes.note7Taxation.lossCarriedForward.current), formatRand(notes.note7Taxation.lossCarriedForward.prior)],
      {
        0: '',
        1: '',
        2: '-',
        3: '-',
        isSubtotal: true,
      },
    ];

    autoTable(doc, {
      startY: n6Y + 7,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      body: taxRows,
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 18 },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
      },
      didDrawCell: accountingDidDrawCell,
    });

    const taxY = (doc as any).lastAutoTable?.finalY || n6Y + 30;
    n6Y = renderJustifiedParagraphs(notes.note7Taxation.taxNoteText, taxY + 3, 8.5, 3.8, 2.5);
    n6Y += 4;
  }

  if (toggles.showNoteRelatedParties && dynamicNotes.noteRelatedParties) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${dynamicNotes.noteRelatedParties}. Related parties`, leftMargin, n6Y);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: n6Y + 4,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      body: [
        ['Relationships', '', '', ''],
        ['Holding company', '', generalInfo.holdingCompany || 'None', ''],
        ['Directors', '', generalInfo.directors.map((d) => d.name).join(', '), ''],
        ['Related party balances', '', '', ''],
        ['Loan accounts - Owing (to) by related parties', '', '', ''],
        [
          generalInfo.holdingCompany || 'Holding Company / Shareholder',
          '',
          `(${formatRand(notes.note4LoansFromShareholders.total.current)})`,
          formatRand(notes.note4LoansFromShareholders.total.prior),
        ],
      ],
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 18 },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
      },
    });
    n6Y = (doc as any).lastAutoTable?.finalY || n6Y + 35;
    n6Y += 4;
  }

  if (toggles.showNoteGoingConcern && dynamicNotes.noteGoingConcern) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${dynamicNotes.noteGoingConcern}. Going concern`, leftMargin, n6Y);
    n6Y = renderJustifiedParagraphs(notes.note9GoingConcern.subordinationNoteText, n6Y + 4.5, 8.5, 3.8, 2.5);
    n6Y += 4;
  }

  if (toggles.showNoteEventsAfterReportingPeriod && dynamicNotes.noteEventsAfterReportingPeriod) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${dynamicNotes.noteEventsAfterReportingPeriod}. Events after the reporting period`, leftMargin, n6Y);
    renderJustifiedParagraphs(notes.note10EventsAfterReportingPeriod.statementText, n6Y + 4.5, 8.5, 3.8, 2.5);
  }

  drawPageFooter(runningPageNumber++);

  // DETAILED INCOME STATEMENT
  if (toggles.showDetailedIncomeStatement) {
    doc.addPage();
    drawPageHeader('Detailed Income Statement');

    const detRows: any[] = [
      [{ content: 'Other income', styles: { fontStyle: 'bold' } }, '', ''],
      ...detailedIncomeStatement.otherIncomeItems.map((i) => [i.name, formatRand(i.current), formatRand(i.prior)]),
      {
        0: { content: 'Total Other Income', styles: { fontStyle: 'bold' } },
        1: { content: formatRand(detailedIncomeStatement.totalOtherIncome.current), styles: { fontStyle: 'bold' } },
        2: { content: formatRand(detailedIncomeStatement.totalOtherIncome.prior), styles: { fontStyle: 'bold' } },
        isSubtotal: true,
      },
      ['', '', ''],
      [{ content: 'Operating expenses', styles: { fontStyle: 'bold' } }, '', ''],
      ...detailedIncomeStatement.operatingExpenseItems.map((i) => [i.name, `(${formatRand(i.current)})`, formatRand(i.prior)]),
      {
        0: { content: 'Total Operating Expenses', styles: { fontStyle: 'bold' } },
        1: { content: `(${formatRand(detailedIncomeStatement.totalOperatingExpenses.current)})`, styles: { fontStyle: 'bold' } },
        2: { content: formatRand(detailedIncomeStatement.totalOperatingExpenses.prior), styles: { fontStyle: 'bold' } },
        isSubtotal: true,
      },
      ['', '', ''],
      {
        0: { content: 'Loss for the year', styles: { fontStyle: 'bold' } },
        1: { content: `(${formatRand(Math.abs(detailedIncomeStatement.lossOrProfitForTheYear.current))})`, styles: { fontStyle: 'bold' } },
        2: { content: formatRand(detailedIncomeStatement.lossOrProfitForTheYear.prior), styles: { fontStyle: 'bold' } },
        isGrandTotal: true,
      },
    ];

    autoTable(doc, {
      startY: 46,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      head: [['Figures in Rand', '2026', '2025']],
      body: detRows,
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 122 },
        1: { cellWidth: 24, halign: 'right' },
        2: { cellWidth: 24, halign: 'right' },
      },
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
      didDrawCell: (hookData: any) => {
        if (hookData.section === 'body') {
          const rawRow = hookData.row.raw as any;
          const isSubtotal = rawRow?.isSubtotal;
          const isGrandTotal = rawRow?.isGrandTotal;
          const colIdx = hookData.column.index;
          if (colIdx >= 1) {
            if (isSubtotal) {
              hookData.doc.setDrawColor(0, 0, 0);
              hookData.doc.setLineWidth(0.25);
              hookData.doc.line(hookData.cell.x, hookData.cell.y, hookData.cell.x + hookData.cell.width, hookData.cell.y);
            }
            if (isGrandTotal) {
              hookData.doc.setDrawColor(0, 0, 0);
              hookData.doc.setLineWidth(0.25);
              hookData.doc.line(hookData.cell.x, hookData.cell.y, hookData.cell.x + hookData.cell.width, hookData.cell.y);
              const botY = hookData.cell.y + hookData.cell.height;
              hookData.doc.line(hookData.cell.x, botY - 1.2, hookData.cell.x + hookData.cell.width, botY - 1.2);
              hookData.doc.line(hookData.cell.x, botY - 0.4, hookData.cell.x + hookData.cell.width, botY - 0.4);
            }
          }
        }
      },
    });

    drawPageFooter(runningPageNumber++, 'The supplementary information presented does not form part of the financial statements and is unaudited');
  }

  return doc;
}
