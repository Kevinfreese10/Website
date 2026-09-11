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
    accountingOfficerReport,
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
  const currentYear = new Date(generalInfo.financialYearEndedDateIso || generalInfo.financialYearEndedDate || '2026-03-31').getFullYear() || 2026;
  const priorYear = currentYear - 1;
  const isProfitable = (statementOfComprehensiveIncome.profitOrLossForTheYear?.currentAmount || 0) >= 0;

  const cleanTitleText = (title: string) => title.replace(/^\d+(\.\d+)*\.\s*/, '').trim();

  const formatRand = (val?: number, blankIfZero = false) => {
    if (val === undefined || val === 0) return blankIfZero ? '' : '-';
    const isNeg = val < 0;
    const abs = Math.abs(val);
    const formatted = abs.toLocaleString('en-US', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
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
    doc.setFontSize(12);
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

  // Robust clean paragraph renderer with proper line-height and no overlapping
  const renderParagraphs = (
    text: string,
    startY: number,
    fontSize = 8.5,
    lineSpacing = 4.1,
    paraSpacing = 3.5,
    pageBreakHeader = 'Accounting Policies (Continued)'
  ): number => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);

    const paragraphs = text.split('\n\n').filter(Boolean);
    let curY = startY;

    paragraphs.forEach((p) => {
      // Always reset to body font before computing split (font state may have changed)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0);
      const splitLines = doc.splitTextToSize(p.trim(), contentWidth);
      if (curY + splitLines.length * lineSpacing > pageHeight - 22) {
        drawPageFooter(runningPageNumber++);
        doc.addPage();
        drawPageHeader(pageBreakHeader);
        curY = 46;
        // Reset font after drawPageHeader() which leaves bold 12pt active
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0);
      }
      doc.text(splitLines, leftMargin, curY);
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

      // Apply accounting lines to amount columns (index >= 1)
      if (colIdx >= 1) {
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
    [generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report" : "Report of the Accounting Officer", '4'],
    ["Director's Report", '5 - 6'],
    ['Statement of Financial Position', '7'],
    ['Statement of Profit or Loss and Other Comprehensive Income', '8'],
    ['Statement of Changes in Equity', '9'],
    ['Statement of Cash Flows', '10'],
    ['Accounting Policies', '11 - 12'],
    ['Notes to the Financial Statements', '13 - 14'],
  ];

  autoTable(doc, {
    startY: 53,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    body: indexItems,
    styles: { fontSize: 8.5, cellPadding: 2.2 },
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
      body: [['Detailed Income Statement', '15']],
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: 'right' } },
    });
  }
  drawPageFooter(runningPageNumber++);

  // PAGE 4: DIRECTOR'S RESPONSIBILITIES AND APPROVAL
  doc.addPage();
  drawPageHeader("Director's Responsibilities and Approval");

  let pY = renderParagraphs(directorsResponsibilities.responsibilitiesText || '', 46, 8.5, 4.0, 4.0);

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

  // PAGE 5: REPORT OF THE ACCOUNTING OFFICER (FITS CLEANLY ON 1 PAGE)
  doc.addPage();
  drawPageHeader(accountingOfficerReport.title || (generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report" : "Report of the Accounting Officer"));
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(accountingOfficerReport.addressee || `To the Shareholder of ${generalInfo.companyName}`, leftMargin, 44);

  let aoY = 50;

  // Report text
  doc.setFont('helvetica', 'bold');
  doc.text('Report on the Financial Statements', leftMargin, aoY);
  aoY = renderParagraphs(accountingOfficerReport.reportText, aoY + 4, 8, 3.6, 2.5);

  // Basis of compilation
  doc.setFont('helvetica', 'bold');
  doc.text('Basis of Compilation', leftMargin, aoY + 1);
  aoY = renderParagraphs(accountingOfficerReport.basisText, aoY + 5, 8, 3.6, 2.5);

  // Responsibilities of director
  doc.setFont('helvetica', 'bold');
  doc.text('Responsibilities of the Director', leftMargin, aoY + 1);
  aoY = renderParagraphs(accountingOfficerReport.directorResponsibilityText, aoY + 5, 8, 3.6, 2.5);

  // Accounting officer responsibilities
  doc.setFont('helvetica', 'bold');
  doc.text("Accounting Officer's Responsibilities", leftMargin, aoY + 1);
  aoY = renderParagraphs(accountingOfficerReport.practitionerResponsibilityText, aoY + 5, 8, 3.6, 2.5);

  // Conclusion / Communication
  if (accountingOfficerReport.conclusionText) {
    aoY = renderParagraphs(accountingOfficerReport.conclusionText, aoY, 8, 3.6, 2.5);
  }

  // Sign-off block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(accountingOfficerReport.firmName || generalInfo.auditorOrPractitionerFirm, leftMargin, aoY + 3);
  doc.setFont('helvetica', 'normal');
  doc.text(accountingOfficerReport.firmTitle || generalInfo.auditorOrPractitionerTitle, leftMargin, aoY + 7);
  doc.text(`Per: ${accountingOfficerReport.leadPartnerName || generalInfo.leadPartnerName || 'Kevin Freese'}`, leftMargin, aoY + 13);
  doc.text(accountingOfficerReport.leadPartnerTitle || generalInfo.leadPartnerTitle || 'Accounting Officer / Business Accountant in Practice (SA)', leftMargin, aoY + 17);
  doc.text(accountingOfficerReport.firmAddress || generalInfo.auditorOrPractitionerAddress, leftMargin, aoY + 23);
  doc.setFont('helvetica', 'bold');
  doc.text(accountingOfficerReport.date || generalInfo.issuedDate, leftMargin, aoY + 28);

  drawPageFooter(runningPageNumber++);

  // PAGE 6-7: DIRECTOR'S REPORT
  doc.addPage();
  drawPageHeader("Director's Report");
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`The director has pleasure in submitting her report on the financial statements of ${generalInfo.companyName} for the year ended ${generalInfo.financialYearEndedDate}.`, leftMargin, 46);

  let dY = 56;
  let sectionIndex = 1;

  if (toggles.showIncorporation && directorsReport.incorporationText) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Incorporation`, leftMargin, dY);
    dY = renderParagraphs(directorsReport.incorporationText, dY + 5, 8.5, 4.0, 3.5, "Director's Report (Continued)");
    dY += 3;
  }

  if (toggles.showNatureOfBusiness && directorsReport.natureOfBusiness) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Nature of business`, leftMargin, dY);
    dY = renderParagraphs(directorsReport.natureOfBusiness, dY + 5, 8.5, 4.0, 3.5, "Director's Report (Continued)");
    dY += 3;
  }

  if (toggles.showReviewOfActivities && directorsReport.reviewOfActivities) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Review of financial results and activities`, leftMargin, dY);
    dY = renderParagraphs(directorsReport.reviewOfActivities, dY + 5, 8.5, 4.0, 3.5, "Director's Report (Continued)");
    dY += 3;
  }

  // Unified Clean Share Capital Table
  if (toggles.showShareCapital) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Share capital`, leftMargin, dY);
    dY += 5;

    const unifiedShareCapitalRows: any[] = [
      [{ content: 'Authorised', styles: { fontStyle: 'bold' } }, '', '', ''],
      [notes.note3ShareCapital.authorisedShares, '', '', '100'],
      [{ content: 'Issued', styles: { fontStyle: 'bold' } }, '', '', ''],
      [
        notes.note3ShareCapital.issuedShares,
        formatRand(notes.note3ShareCapital.issuedAmount.current),
        formatRand(notes.note3ShareCapital.issuedAmount.prior),
        '100',
      ],
    ];

    autoTable(doc, {
      startY: dY,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      head: [['Class of shares', `${currentYear} (R)`, `${priorYear} (R)`, 'Number of shares']],
      body: unifiedShareCapitalRows,
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
      },
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
      didDrawCell: accountingDidDrawCell,
    });

    dY = (doc as any).lastAutoTable?.finalY || dY + 22;
    dY += 6;
  }

  if (toggles.showDirectors) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Director in Office`, leftMargin, dY);
    dY += 5;

    const directorRows = generalInfo.directors.map((d) => [
      d.name,
      d.office || 'Chief Executive Officer',
      d.designation || 'Executive',
      d.nationality || 'South African',
    ]);

    autoTable(doc, {
      startY: dY,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      head: [['Director', 'Office', 'Designation', 'Nationality']],
      body: directorRows,
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 35 }, 3: { cellWidth: 35 } },
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
    });

    dY = (doc as any).lastAutoTable?.finalY || dY + 20;
    dY += 6;
  }

  if (toggles.showEventsAfterReportingPeriod) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionIndex++}. Events after the reporting period`, leftMargin, dY);
    dY = renderParagraphs(directorsReport.eventsAfterReportingPeriod, dY + 5, 8.5, 4.0, 3.5, "Director's Report (Continued)");
    dY += 3;
  }

  drawPageFooter(runningPageNumber++);

  // PAGE 7: DIRECTOR'S REPORT (CONTINUED)
  doc.addPage();
  drawPageHeader("Director's Report (Continued)");
  let d2Y = 46;

  if (toggles.showGoingConcern) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${sectionIndex++}. Going concern`, leftMargin, d2Y);
    d2Y = renderParagraphs(directorsReport.goingConcernText, d2Y + 5, 8.5, 4.0, 3.5, "Director's Report (Continued)");
    d2Y += 5;
  }

  if (toggles.showAuditorContinuance) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${sectionIndex++}. Accounting Officer / Auditor Continuance`, leftMargin, d2Y);
    renderParagraphs(directorsReport.auditorOrPractitionerContinuance, d2Y + 5, 8.5, 4.0, 3.5, "Director's Report (Continued)");
  }

  drawPageFooter(runningPageNumber++);

  // STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
  doc.addPage();
  drawPageHeader(`Statement of Financial Position as at ${generalInfo.financialYearEndedDate}`);

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
      statementOfFinancialPosition.equity.items[1]?.name || (isProfitable ? 'Retained earnings' : 'Accumulated loss'),
      '',
      formatRand(statementOfFinancialPosition.equity.items[1]?.currentAmount),
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
      statementOfFinancialPosition.currentLiabilities.items[0]?.name || 'Loans from shareholder',
      dynamicNotes.noteShareholderLoans ? `${dynamicNotes.noteShareholderLoans}` : '',
      formatRand(statementOfFinancialPosition.currentLiabilities.items[0]?.currentAmount),
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
    head: [['Figures in Rand', 'Notes', `${currentYear}`, `${priorYear}`]],
    body: bsRows,
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 104 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
    },
    headStyles: { fontStyle: 'bold', textColor: [0, 0, 0], lineWidth: { bottom: 0.25 }, lineColor: [0, 0, 0] },
    didDrawCell: (hookData) => {
      // Right-align year headers
      if (hookData.section === 'head' && hookData.column.index >= 2) {
        hookData.cell.styles.halign = 'right';
      }
      accountingDidDrawCell(hookData);
    },
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
      0: { content: statementOfComprehensiveIncome.operatingProfitOrLoss.name || (isProfitable ? 'Operating profit' : 'Operating loss'), styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfComprehensiveIncome.operatingProfitOrLoss.currentAmount), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfComprehensiveIncome.operatingProfitOrLoss.priorAmount), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    {
      0: { content: statementOfComprehensiveIncome.profitOrLossBeforeTax.name || (isProfitable ? 'Profit before income tax' : 'Loss before income tax'), styles: { fontStyle: 'bold' } },
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
      0: { content: statementOfComprehensiveIncome.profitOrLossForTheYear.name || (isProfitable ? 'Profit for the year' : 'Loss for the year'), styles: { fontStyle: 'bold' } },
      1: '',
      2: { content: formatRand(statementOfComprehensiveIncome.profitOrLossForTheYear.currentAmount), styles: { fontStyle: 'bold' } },
      3: { content: formatRand(statementOfComprehensiveIncome.profitOrLossForTheYear.priorAmount), styles: { fontStyle: 'bold' } },
      isSubtotal: true,
    },
    ['Other comprehensive loss', '', '-', '-'],
    {
      0: { content: statementOfComprehensiveIncome.totalComprehensiveLossOrIncome.name || (isProfitable ? 'Total comprehensive income for the year' : 'Total comprehensive loss for the year'), styles: { fontStyle: 'bold' } },
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
    head: [['Figures in Rand', 'Note(s)', `${currentYear}`, `${priorYear}`]],
    body: pnlTableRows,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 104 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
    },
    headStyles: { fontStyle: 'bold', textColor: [0, 0, 0], lineWidth: { bottom: 0.25 }, lineColor: [0, 0, 0] },
    didDrawCell: accountingDidDrawCell,
  });
  drawPageFooter(runningPageNumber++);

  // STATEMENT OF CHANGES IN EQUITY
  doc.addPage();
  drawPageHeader('Statement of Changes in Equity');

  const eqRows: any[] = [
    [
      isProfitable ? 'Profit for the year' : 'Loss for the year',
      '-',
      formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear),
      formatRand(statementOfChangesInEquity.accumulatedLoss.prior),
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
    head: [['Figures in Rand', 'Share capital', isProfitable ? 'Retained earnings' : 'Accumulated loss', 'Total equity']],
    body: eqRows,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
    headStyles: { fontStyle: 'bold', textColor: [0, 0, 0], lineWidth: { bottom: 0.25 }, lineColor: [0, 0, 0] },
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
    head: [['Figures in Rand', 'Notes', `${currentYear}`, `${priorYear}`]],
    body: cfRows,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 104 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
    },
    headStyles: { fontStyle: 'bold', textColor: [0, 0, 0], lineWidth: { bottom: 0.25 }, lineColor: [0, 0, 0] },
    didDrawCell: accountingDidDrawCell,
  });
  drawPageFooter(runningPageNumber++);

  // ACCOUNTING POLICIES (AUTO-PAGINATED WITH ZERO OVERLAPPING & SPACIOUS HEADINGS)
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

    // Heading with ample space — 9pt bold for clear hierarchy
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(dynamicPolicyTitle, leftMargin, polY);
    polY += 5.5;

    if (pol.subTitle) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(pol.subTitle, leftMargin, polY);
      polY += 4.5;
    }

    polY = renderParagraphs(pol.content, polY, 8.5, 4.0, 3.5, 'Accounting Policies (Continued)');
    polY += 4.0;
  });

  drawPageFooter(runningPageNumber++);

  // STATUTORY NOTES (PART 1)
  doc.addPage();
  drawPageHeader('Notes to the Financial Statements');

  let nY = 46;

  if (toggles.showNoteCash && dynamicNotes.noteCash) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteCash}. Cash and cash equivalents`, leftMargin, nY);
    doc.setFont('helvetica', 'normal');
    doc.text('Cash and cash equivalents consist of:', leftMargin, nY + 4.5);

    autoTable(doc, {
      startY: nY + 7,
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
    nY += 6;
  }

  if (toggles.showNoteShareCapital && dynamicNotes.noteShareCapital) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteShareCapital}. Share capital`, leftMargin, nY);
    nY += 5;

    const scRows: any[] = [
      [{ content: 'Authorised', styles: { fontStyle: 'bold' } }, '', '', ''],
      [notes.note3ShareCapital.authorisedShares, '', '', '100'],
      [{ content: 'Issued', styles: { fontStyle: 'bold' } }, '', '', ''],
      [
        notes.note3ShareCapital.issuedShares,
        formatRand(notes.note3ShareCapital.issuedAmount.current),
        formatRand(notes.note3ShareCapital.issuedAmount.prior || 100),
        '100',
      ],
    ];

    autoTable(doc, {
      startY: nY,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'plain',
      head: [['Class of shares', `${currentYear} (R)`, `${priorYear} (R)`, 'Number of shares']],
      body: scRows,
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 104 },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
      },
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
      didDrawCell: accountingDidDrawCell,
    });
    nY = (doc as any).lastAutoTable?.finalY || nY + 26;
    nY += 6;
  }

  if (toggles.showNoteShareholderLoans && dynamicNotes.noteShareholderLoans) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteShareholderLoans}. Loans from shareholders`, leftMargin, nY);
    nY += 5;

    autoTable(doc, {
      startY: nY,
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

    nY = renderParagraphs(loanTerms, loanTermsY + 4, 8.5, 4.0, 3.0, 'Notes to the Financial Statements (Continued)');
    nY += 6;
  }

  if (toggles.showNoteOperatingExpenses && dynamicNotes.noteOperatingExpenses) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteOperatingExpenses}. Operating expenses`, leftMargin, nY);
    doc.setFont('helvetica', 'normal');
    doc.text('Operating expenses include the following expenses:', leftMargin, nY + 4.5);
    doc.text('Remuneration, other than to employees, for:', leftMargin, nY + 9);

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
      startY: nY + 12,
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
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteCashUsedInOps}. Cash used in operations`, leftMargin, n6Y);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: n6Y + 5,
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
    n6Y += 6;
  }

  if (toggles.showNoteTaxation && dynamicNotes.noteTaxation) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteTaxation}. Taxation`, leftMargin, n6Y);
    doc.setFont('helvetica', 'normal');
    doc.text('Reconciliation of the tax expense', leftMargin, n6Y + 4.5);

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
      startY: n6Y + 8,
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
    n6Y = renderParagraphs(notes.note7Taxation.taxNoteText, taxY + 4, 8.5, 4.0, 3.0, 'Notes to the Financial Statements (Continued)');
    n6Y += 6;
  }

  if (toggles.showNoteRelatedParties && dynamicNotes.noteRelatedParties) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteRelatedParties}. Related parties`, leftMargin, n6Y);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: n6Y + 5,
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
    n6Y += 6;
  }

  if (toggles.showNoteGoingConcern && dynamicNotes.noteGoingConcern) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteGoingConcern}. Going concern`, leftMargin, n6Y);
    n6Y = renderParagraphs(notes.note9GoingConcern.subordinationNoteText, n6Y + 5, 8.5, 4.0, 3.0, 'Notes to the Financial Statements (Continued)');
    n6Y += 6;
  }

  if (toggles.showNoteEventsAfterReportingPeriod && dynamicNotes.noteEventsAfterReportingPeriod) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${dynamicNotes.noteEventsAfterReportingPeriod}. Events after the reporting period`, leftMargin, n6Y);
    renderParagraphs(notes.note10EventsAfterReportingPeriod.statementText, n6Y + 5, 8.5, 4.0, 3.0, 'Notes to the Financial Statements (Continued)');
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
      head: [['Figures in Rand', `${currentYear}`, `${priorYear}`]],
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
