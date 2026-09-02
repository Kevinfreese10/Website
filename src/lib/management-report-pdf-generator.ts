import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ManagementReportData, ManagementReportAnalysisOutput } from './management-report-types';

export function generateManagementReportPdf({
  data,
  analysis,
  customNotes,
}: {
  data: ManagementReportData;
  analysis?: ManagementReportAnalysisOutput | null;
  customNotes?: string;
}): jsPDF {
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

  const formatRand = (amount: number) => {
    const isNeg = amount < 0;
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return isNeg ? `-R ${formatted}` : `R ${formatted}`;
  };

  const drawPageHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(data.client.companyName, leftMargin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Registration: ${data.client.registrationNumber || 'N/A'} • Period: ${data.period.label}`, leftMargin, 24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(title, leftMargin, 33);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(leftMargin, 36, pageWidth - rightMargin, 36);
  };

  const drawPageFooter = (pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Prepared by My Accountant • Confidential Executive Report', leftMargin, pageHeight - 12);
    doc.text(`Page ${pageNum}`, pageWidth - rightMargin, pageHeight - 12, { align: 'right' });
  };

  // PAGE 1: COVER & EXECUTIVE SUMMARY
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('EXECUTIVE MANAGEMENT REPORT', leftMargin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`${data.client.companyName} • Period: ${data.period.label}`, leftMargin, 32);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { dateStyle: 'long' })}`, leftMargin, 38);

  // Key KPI Summary Cards
  const kpis = [
    { label: 'Total Turnover', val: formatRand(data.kpis.revenue.current) },
    { label: 'Gross Profit Margin', val: `${data.kpis.grossProfit.marginCurrentPct.toFixed(1)}%` },
    { label: 'Net Profit / (Loss)', val: formatRand(data.kpis.netProfit.current) },
    { label: 'Net Margin', val: `${data.kpis.netProfit.marginCurrentPct.toFixed(1)}%` },
    { label: 'Cash Balance', val: formatRand(data.kpis.cashBalance.current) },
    { label: 'Working Capital', val: formatRand(data.kpis.workingCapital.current) },
  ];

  let kpiY = 66;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Performance Indicators (KPIs)', leftMargin, kpiY);

  autoTable(doc, {
    startY: kpiY + 4,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'grid',
    head: [['Financial Metric', 'Current Value', 'Status']],
    body: kpis.map((k) => [k.label, k.val, 'Tracked']),
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
  });

  let execY = (doc as any).lastAutoTable?.finalY || 140;

  if (analysis?.executiveSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('AI Executive Financial Commentary', leftMargin, execY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const execSplit = doc.splitTextToSize(analysis.executiveSummary, contentWidth);
    doc.text(execSplit, leftMargin, execY + 13);
    execY = execY + 13 + execSplit.length * 4 + 4;
  }

  drawPageFooter(1);

  // PAGE 2: STATEMENT OF PROFIT OR LOSS
  doc.addPage();
  drawPageHeader('Statement of Comprehensive Income (Profit & Loss)');

  const pnlStatements = [
    data.profitAndLoss.revenue,
    data.profitAndLoss.costOfSales,
    data.profitAndLoss.operatingExpenses,
  ];

  const pnlRows: any[] = [];
  pnlStatements.forEach((stmt) => {
    pnlRows.push([{ content: stmt.title.toUpperCase(), styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, '', '', '']);
    stmt.items.forEach((item) => {
      pnlRows.push([`  ${item.name}`, formatRand(item.currentAmount), formatRand(item.priorAmount || 0), `${(item.variancePct || 0).toFixed(1)}%`]);
    });
    pnlRows.push([{ content: `Total ${stmt.title}`, styles: { fontStyle: 'bold' } }, { content: formatRand(stmt.currentTotal), styles: { fontStyle: 'bold' } }, { content: formatRand(stmt.priorTotal || 0), styles: { fontStyle: 'bold' } }, '']);
  });

  pnlRows.push([
    { content: 'NET PROFIT BEFORE TAX', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: formatRand(data.profitAndLoss.netProfitBeforeTax.current), styles: { fontStyle: 'bold' } },
    { content: formatRand(data.profitAndLoss.netProfitBeforeTax.prior || 0), styles: { fontStyle: 'bold' } },
    `${(data.profitAndLoss.netProfitBeforeTax.variancePct || 0).toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: 42,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Account Description', 'Current Period', 'Prior Period', 'Variance %']],
    body: pnlRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 30, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 25, halign: 'right' } },
  });

  drawPageFooter(2);

  // PAGE 3: STATEMENT OF FINANCIAL POSITION
  doc.addPage();
  drawPageHeader('Statement of Financial Position (Balance Sheet)');

  const bsStatements = [
    data.balanceSheet.currentAssets,
    data.balanceSheet.nonCurrentAssets,
    data.balanceSheet.equity,
    data.balanceSheet.currentLiabilities,
    data.balanceSheet.nonCurrentLiabilities,
  ];

  const bsRows: any[] = [];
  bsStatements.forEach((stmt) => {
    bsRows.push([{ content: stmt.title.toUpperCase(), styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, '', '', '']);
    stmt.items.forEach((item) => {
      bsRows.push([`  ${item.name}`, formatRand(item.currentAmount), formatRand(item.priorAmount || 0), `${(item.variancePct || 0).toFixed(1)}%`]);
    });
    bsRows.push([{ content: `Total ${stmt.title}`, styles: { fontStyle: 'bold' } }, { content: formatRand(stmt.currentTotal), styles: { fontStyle: 'bold' } }, { content: formatRand(stmt.priorTotal || 0), styles: { fontStyle: 'bold' } }, '']);
  });

  autoTable(doc, {
    startY: 42,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'plain',
    head: [['Account Description', 'Current Period', 'Prior Period', 'Variance %']],
    body: bsRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 30, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 25, halign: 'right' } },
  });

  drawPageFooter(3);

  // PAGE 4: TAX & STRATEGIC RECOMMENDATIONS
  doc.addPage();
  drawPageHeader('Taxation, Working Capital & Key Recommendations');

  let tY = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('SARS Tax Compliance & Effective Rate', leftMargin, tY);

  autoTable(doc, {
    startY: tY + 3,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'grid',
    head: [['Tax Parameter', 'Amount / Status']],
    body: [
      ['Estimated Corporate Income Tax', formatRand(data.taxAndVat.estimatedCorporateTax)],
      ['Assessed Loss Carried Forward', formatRand(data.taxAndVat.assessedLossCarriedForward)],
      ['VAT Liability / (Refund)', formatRand(data.taxAndVat.vatLiabilityOrRefund)],
      ['VAT Period Status', data.taxAndVat.vatPeriodStatus || 'Up to date'],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
  });

  let recY = (doc as any).lastAutoTable?.finalY || 120;

  if (analysis?.keyRecommendations && analysis.keyRecommendations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Recommendations', leftMargin, recY + 8);

    const recTableRows = analysis.keyRecommendations.map((rec, idx) => [
      `${idx + 1}. ${rec}`,
      'Action Item',
      'HIGH',
    ]);

    autoTable(doc, {
      startY: recY + 12,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'grid',
      head: [['Recommendation', 'Type', 'Priority']],
      body: recTableRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 35 }, 2: { cellWidth: 25, halign: 'center' } },
    });
  }

  drawPageFooter(4);

  return doc;
}
