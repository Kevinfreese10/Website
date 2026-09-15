import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ManagementReportData, ManagementReportAnalysisOutput } from './management-report-types';

export function formatDateStr(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

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
  const leftMargin = 16;
  const rightMargin = 16;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  const currentPeriodDates = `${formatDateStr(data.period.startDate)} – ${formatDateStr(data.period.endDate)}`;
  const priorPeriodDates = `${formatDateStr(data.period.comparativeStartDate)} – ${formatDateStr(data.period.comparativeEndDate)}`;
  const asAtCurrent = formatDateStr(data.period.endDate);
  const asAtPrior = formatDateStr(data.period.comparativeEndDate);

  const formatRand = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'R 0';
    const isNeg = amount < 0;
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    return isNeg ? `-R ${formatted}` : `R ${formatted}`;
  };

  const formatPct = (pct: number | undefined) => {
    if (pct === undefined || pct === null || isNaN(pct)) return '0.0%';
    const isPos = pct > 0;
    return `${isPos ? '+' : ''}${pct.toFixed(1)}%`;
  };

  const drawPageHeader = (title: string, subtitle?: string) => {
    // Header top accent line
    doc.setFillColor(15, 39, 68); // Deep Navy
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setFillColor(37, 99, 235); // Royal Blue accent
    doc.rect(0, 5, pageWidth, 1.5, 'F');

    // Company & Meta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(data.client.companyName, leftMargin, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const metaParts = [];
    if (data.client.registrationNumber) metaParts.push(`Reg: ${data.client.registrationNumber}`);
    if (data.client.vatNumber) metaParts.push(`VAT: ${data.client.vatNumber}`);
    metaParts.push(`Current: ${data.period.label} (${currentPeriodDates})`);
    doc.text(metaParts.join('  •  '), leftMargin, 20.5);

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 39, 68);
    doc.text(title, leftMargin, 28);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(subtitle, leftMargin, 32.5);
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(leftMargin, subtitle ? 35 : 31, pageWidth - rightMargin, subtitle ? 35 : 31);
  };

  const drawPageFooter = (pageNum: number, totalPages: number = 4) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, pageHeight - 14, pageWidth - rightMargin, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Prepared by My Accountant (Pty) Ltd • Confidential Executive Management Report', leftMargin, pageHeight - 9);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - rightMargin, pageHeight - 9, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE SUMMARY
  // ==========================================
  // Top Banner
  doc.setFillColor(15, 39, 68); // Deep Navy
  doc.rect(0, 0, pageWidth, 52, 'F');
  doc.setFillColor(37, 99, 235); // Royal Blue stripe
  doc.rect(0, 52, pageWidth, 2.5, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('EXECUTIVE MANAGEMENT REPORT', leftMargin, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(147, 197, 253); // Soft blue
  doc.text(data.client.companyName.toUpperCase(), leftMargin, 25);

  // Subtitle / Client info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  const clientSub = [
    data.client.tradingName ? `Trading as: ${data.client.tradingName}` : null,
    data.client.registrationNumber ? `Reg No: ${data.client.registrationNumber}` : null,
    data.client.taxNumber ? `Tax Ref: ${data.client.taxNumber}` : null,
    data.client.vatNumber ? `VAT No: ${data.client.vatNumber}` : null,
  ].filter(Boolean).join('  |  ');
  if (clientSub) {
    doc.text(clientSub, leftMargin, 30);
  }

  // Date badges banner in header
  doc.setFillColor(30, 58, 102); // Darker blue card
  doc.roundedRect(leftMargin, 33, contentWidth, 15, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254);
  doc.text('CURRENT REPORTING PERIOD:', leftMargin + 4, 38.5);
  doc.text('COMPARATIVE PRIOR PERIOD:', leftMargin + (contentWidth / 2) + 2, 38.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.period.label}  (${currentPeriodDates})`, leftMargin + 4, 44);
  doc.text(`${data.period.comparativeLabel}  (${priorPeriodDates})`, leftMargin + (contentWidth / 2) + 2, 44);

  // Key KPI Summary Grid (8 Colored Cards)
  let kpiY = 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 39, 68);
  doc.text('Key Performance Indicators (Executive Summary)', leftMargin, kpiY);

  const kpiCardWidth = (contentWidth - 9) / 4; // 4 columns
  const kpiCardHeight = 22;

  const kpisList = [
    {
      title: 'TOTAL TURNOVER',
      val: formatRand(data.kpis.revenue.current),
      sub: `${formatPct(data.kpis.revenue.changePct)} vs prior`,
      color: [37, 99, 235], // Blue
      subPositive: data.kpis.revenue.changePct >= 0,
    },
    {
      title: 'GROSS PROFIT',
      val: formatRand(data.kpis.grossProfit.current),
      sub: `${data.kpis.grossProfit.marginCurrentPct.toFixed(1)}% GP Margin`,
      color: [16, 185, 129], // Emerald
      subPositive: true,
    },
    {
      title: 'NET PROFIT BEFORE TAX',
      val: formatRand(data.kpis.netProfit.current),
      sub: `${data.kpis.netProfit.marginCurrentPct.toFixed(1)}% Net Margin`,
      color: data.kpis.netProfit.current >= 0 ? [5, 150, 105] : [220, 38, 38], // Emerald / Red
      subPositive: data.kpis.netProfit.current >= 0,
    },
    {
      title: 'CASH & BANK',
      val: formatRand(data.kpis.cashBalance.current),
      sub: `Net ${formatRand(data.kpis.cashBalance.netChange)}`,
      color: [2, 132, 199], // Sky Blue
      subPositive: data.kpis.cashBalance.netChange >= 0,
    },
    {
      title: 'TRADE RECEIVABLES (DSO)',
      val: formatRand(data.kpis.debtors.current),
      sub: `${data.kpis.debtors.dso} Days Sales Out`,
      color: [217, 119, 6], // Amber
      subPositive: data.kpis.debtors.dso <= 45,
    },
    {
      title: 'TRADE PAYABLES (DPO)',
      val: formatRand(data.kpis.creditors.current),
      sub: `${data.kpis.creditors.dpo} Days Payable Out`,
      color: [100, 116, 139], // Slate
      subPositive: true,
    },
    {
      title: 'WORKING CAPITAL',
      val: formatRand(data.kpis.workingCapital.current),
      sub: `Ratio ${data.kpis.workingCapital.ratio.toFixed(2)}x`,
      color: data.kpis.workingCapital.current >= 0 ? [16, 185, 129] : [220, 38, 38],
      subPositive: data.kpis.workingCapital.current >= 0,
    },
    {
      title: 'HEALTH INDEX',
      val: analysis?.healthScore ? `${analysis.healthScore} / 100` : 'Active',
      sub: 'AI Financial Score',
      color: [99, 102, 241], // Indigo
      subPositive: true,
    },
  ];

  kpisList.forEach((k, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = leftMargin + col * (kpiCardWidth + 3);
    const y = kpiY + 4 + row * (kpiCardHeight + 3);

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, kpiCardWidth, kpiCardHeight, 1.5, 1.5, 'FD');

    // Left color bar
    doc.setFillColor(k.color[0], k.color[1], k.color[2]);
    doc.roundedRect(x, y, 2.5, kpiCardHeight, 1, 1, 'F');

    // Card title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k.title, x + 4.5, y + 5);

    // Card value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(k.val, x + 4.5, y + 12);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    if (k.subPositive) {
      doc.setTextColor(22, 101, 52); // Green
    } else {
      doc.setTextColor(185, 28, 28); // Red
    }
    doc.text(k.sub, x + 4.5, y + 18);
  });

  let execY = kpiY + 4 + 2 * (kpiCardHeight + 3) + 4;

  // AI Executive Financial Commentary Card
  doc.setFillColor(240, 249, 255); // Light sky tint
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.4);
  const commBoxHeight = 110;
  doc.roundedRect(leftMargin, execY, contentWidth, commBoxHeight, 2, 2, 'FD');

  // Blue left highlight bar
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(leftMargin, execY, 3, commBoxHeight, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 39, 68);
  doc.text('Khai AI CA(SA) Executive Commentary & Insights', leftMargin + 6, execY + 7);

  let commContentY = execY + 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  const execSummaryText = analysis?.executiveSummary ||
    `During the period ${data.period.label} (${currentPeriodDates}), ${data.client.companyName} achieved total revenue of ${formatRand(
      data.kpis.revenue.current
    )} with a gross profit margin of ${data.kpis.grossProfit.marginCurrentPct.toFixed(1)}% and net operating profit before tax of ${formatRand(
      data.kpis.netProfit.current
    )}. Working capital closed at ${formatRand(data.kpis.workingCapital.current)} with cash & bank reserves standing at ${formatRand(
      data.kpis.cashBalance.current
    )}.`;

  const splitSummary = doc.splitTextToSize(execSummaryText, contentWidth - 12);
  doc.text(splitSummary, leftMargin + 6, commContentY);
  commContentY += splitSummary.length * 3.5 + 4;

  if (analysis?.revenueAndMarginInsights) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 39, 68);
    doc.text('Revenue & Margin Dynamics:', leftMargin + 6, commContentY);
    commContentY += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitRev = doc.splitTextToSize(analysis.revenueAndMarginInsights, contentWidth - 12);
    doc.text(splitRev, leftMargin + 6, commContentY);
    commContentY += splitRev.length * 3.5 + 4;
  }

  if (analysis?.cashFlowAndLiquidity && commContentY < execY + commBoxHeight - 20) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 39, 68);
    doc.text('Liquidity & Cash Runway:', leftMargin + 6, commContentY);
    commContentY += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitCash = doc.splitTextToSize(analysis.cashFlowAndLiquidity, contentWidth - 12);
    doc.text(splitCash, leftMargin + 6, commContentY);
    commContentY += splitCash.length * 3.5 + 4;
  }

  if (customNotes && commContentY < execY + commBoxHeight - 15) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 39, 68);
    doc.text('Director / Partner Notes:', leftMargin + 6, commContentY);
    commContentY += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(customNotes, contentWidth - 12);
    doc.text(splitNotes, leftMargin + 6, commContentY);
  }

  drawPageFooter(1, 4);

  // ==========================================
  // PAGE 2: STATEMENT OF COMPREHENSIVE INCOME (P&L)
  // ==========================================
  doc.addPage();
  drawPageHeader(
    'Statement of Comprehensive Income (Profit & Loss)',
    `Comparing Current Period (${currentPeriodDates}) with Prior Period (${priorPeriodDates})`
  );

  const pnlStatements = [
    { title: 'REVENUE & TURNOVER', data: data.profitAndLoss.revenue, isPositiveGood: true },
    { title: 'COST OF SALES', data: data.profitAndLoss.costOfSales, isPositiveGood: false },
    { title: 'OPERATING EXPENSES', data: data.profitAndLoss.operatingExpenses, isPositiveGood: false },
  ];

  const pnlRows: any[] = [];

  // Helper for row colors
  pnlStatements.forEach((stmt) => {
    // Category Header
    pnlRows.push([
      {
        content: stmt.title,
        colSpan: 5,
        styles: { fontStyle: 'bold', fillColor: [15, 39, 68], textColor: [255, 255, 255], fontSize: 8 },
      },
    ]);

    // Items
    stmt.data.items.forEach((item) => {
      const varAmt = item.varianceAmount || (item.currentAmount - (item.priorAmount || 0));
      const varPct = item.variancePct || (item.priorAmount ? (varAmt / item.priorAmount) * 100 : 0);
      const isGood = stmt.isPositiveGood ? varAmt >= 0 : varAmt <= 0;

      pnlRows.push([
        `  ${item.accountNumber ? item.accountNumber + ' - ' : ''}${item.name}`,
        formatRand(item.currentAmount),
        formatRand(item.priorAmount || 0),
        {
          content: formatRand(varAmt),
          styles: { textColor: isGood ? [22, 101, 52] : [185, 28, 28] },
        },
        {
          content: formatPct(varPct),
          styles: { textColor: isGood ? [22, 101, 52] : [185, 28, 28] },
        },
      ]);
    });

    // Subtotal
    const subVarAmt = stmt.data.varianceAmount || (stmt.data.currentTotal - stmt.data.priorTotal);
    const subVarPct = stmt.data.variancePct || (stmt.data.priorTotal ? (subVarAmt / stmt.data.priorTotal) * 100 : 0);
    pnlRows.push([
      { content: `Total ${stmt.data.title}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatRand(stmt.data.currentTotal), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatRand(stmt.data.priorTotal || 0), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatRand(subVarAmt), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatPct(subVarPct), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    ]);

    // Insert Gross Profit row right after Cost of Sales
    if (stmt.title === 'COST OF SALES') {
      const gp = data.profitAndLoss.grossProfit;
      pnlRows.push([
        { content: 'GROSS PROFIT', styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
        { content: formatRand(gp.current), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
        { content: formatRand(gp.prior), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
        { content: formatRand(gp.variance), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
        { content: formatPct(gp.variancePct), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
      ]);
    }
  });

  // Net Profit Row
  const np = data.profitAndLoss.netProfitBeforeTax;
  pnlRows.push([
    { content: 'NET PROFIT / (LOSS) BEFORE TAX', styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [21, 128, 61], fontSize: 9 } },
    { content: formatRand(np.current), styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [21, 128, 61], fontSize: 9 } },
    { content: formatRand(np.prior), styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [21, 128, 61], fontSize: 9 } },
    { content: formatRand(np.variance), styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [21, 128, 61], fontSize: 9 } },
    { content: formatPct(np.variancePct), styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [21, 128, 61], fontSize: 9 } },
  ]);

  autoTable(doc, {
    startY: 38,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'grid',
    head: [
      [
        'Account Description',
        `Current Period\n(${currentPeriodDates})`,
        `Prior Period\n(${priorPeriodDates})`,
        'Movement (R)',
        'Movement %',
      ],
    ],
    body: pnlRows,
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [15, 39, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 70, halign: 'left' },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  drawPageFooter(2, 4);

  // ==========================================
  // PAGE 3: STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)
  // ==========================================
  doc.addPage();
  drawPageHeader(
    'Statement of Financial Position (Balance Sheet)',
    `Financial Position as at ${asAtCurrent} compared to ${asAtPrior}`
  );

  const bsCategories = [
    { title: 'NON-CURRENT ASSETS', data: data.balanceSheet.nonCurrentAssets },
    { title: 'CURRENT ASSETS', data: data.balanceSheet.currentAssets },
    { title: 'EQUITY & RESERVES', data: data.balanceSheet.equity },
    { title: 'NON-CURRENT LIABILITIES', data: data.balanceSheet.nonCurrentLiabilities },
    { title: 'CURRENT LIABILITIES', data: data.balanceSheet.currentLiabilities },
  ];

  const bsRows: any[] = [];

  bsCategories.forEach((cat) => {
    // Header
    bsRows.push([
      {
        content: cat.title,
        colSpan: 5,
        styles: { fontStyle: 'bold', fillColor: [15, 39, 68], textColor: [255, 255, 255], fontSize: 8 },
      },
    ]);

    // Items
    cat.data.items.forEach((item) => {
      const varAmt = item.varianceAmount || (item.currentAmount - (item.priorAmount || 0));
      const varPct = item.variancePct || (item.priorAmount ? (varAmt / item.priorAmount) * 100 : 0);

      bsRows.push([
        `  ${item.accountNumber ? item.accountNumber + ' - ' : ''}${item.name}`,
        formatRand(item.currentAmount),
        formatRand(item.priorAmount || 0),
        formatRand(varAmt),
        formatPct(varPct),
      ]);
    });

    // Subtotal
    const subVarAmt = cat.data.varianceAmount || (cat.data.currentTotal - cat.data.priorTotal);
    const subVarPct = cat.data.variancePct || (cat.data.priorTotal ? (subVarAmt / cat.data.priorTotal) * 100 : 0);
    bsRows.push([
      { content: `Total ${cat.data.title}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatRand(cat.data.currentTotal), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatRand(cat.data.priorTotal || 0), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatRand(subVarAmt), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatPct(subVarPct), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    ]);

    // Total Assets insert
    if (cat.title === 'CURRENT ASSETS') {
      const totAssetsCur = data.balanceSheet.totalAssets.current;
      const totAssetsPri = data.balanceSheet.totalAssets.prior;
      const totAssetsVar = totAssetsCur - totAssetsPri;
      const totAssetsVarPct = totAssetsPri ? (totAssetsVar / totAssetsPri) * 100 : 0;

      bsRows.push([
        { content: 'TOTAL ASSETS', styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
        { content: formatRand(totAssetsCur), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
        { content: formatRand(totAssetsPri), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
        { content: formatRand(totAssetsVar), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
        { content: formatPct(totAssetsVarPct), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161], fontSize: 8.5 } },
      ]);
    }
  });

  // Total Equity & Liabilities
  const totEqLiabCur = data.balanceSheet.totalEquityAndLiabilities.current;
  const totEqLiabPri = data.balanceSheet.totalEquityAndLiabilities.prior;
  const totEqLiabVar = totEqLiabCur - totEqLiabPri;
  const totEqLiabVarPct = totEqLiabPri ? (totEqLiabVar / totEqLiabPri) * 100 : 0;

  bsRows.push([
    { content: 'TOTAL EQUITY & LIABILITIES', styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42], fontSize: 8.5 } },
    { content: formatRand(totEqLiabCur), styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42], fontSize: 8.5 } },
    { content: formatRand(totEqLiabPri), styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42], fontSize: 8.5 } },
    { content: formatRand(totEqLiabVar), styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42], fontSize: 8.5 } },
    { content: formatPct(totEqLiabVarPct), styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42], fontSize: 8.5 } },
  ]);

  autoTable(doc, {
    startY: 38,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'grid',
    head: [
      [
        'Statement Category / Item',
        `Current Position\n(As at ${asAtCurrent})`,
        `Prior Position\n(As at ${asAtPrior})`,
        'Movement (R)',
        'Movement %',
      ],
    ],
    body: bsRows,
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [15, 39, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 70, halign: 'left' },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  drawPageFooter(3, 4);

  // ==========================================
  // PAGE 4: CASH FLOW, WORKING CAPITAL & TAX COMPLIANCE
  // ==========================================
  doc.addPage();
  drawPageHeader(
    'Cash Flow, Working Capital & SARS Tax Compliance',
    `Liquidity and Statutory Overview for ${data.period.label} (${currentPeriodDates})`
  );

  let p4Y = 38;

  // 1. Cash Flow Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 39, 68);
  doc.text('1. Cash Flow Statement Summary', leftMargin, p4Y);

  const cf = data.cashFlow;
  const cfRows: any[] = [
    ['Operating Cash Flow (Inflows from Trading)', formatRand(cf.operatingCashFlow)],
    ['Investing Cash Flow (Asset Acquisitions/Disposals)', formatRand(cf.investingCashFlow)],
    ['Financing Cash Flow (Loans, Capital, Dividends)', formatRand(cf.financingCashFlow)],
    [
      { content: 'NET CASH MOVEMENT', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: formatRand(cf.netCashMovement), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    ],
    ['Opening Cash & Bank Balance', formatRand(cf.openingCash)],
    [
      { content: 'CLOSING CASH & BANK BALANCE', styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161] } },
      { content: formatRand(cf.closingCash), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161] } },
    ],
  ];

  autoTable(doc, {
    startY: p4Y + 3,
    margin: { left: leftMargin, right: (pageWidth / 2) + 2 },
    theme: 'grid',
    head: [['Cash Flow Activity', 'Amount (ZAR)']],
    body: cfRows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [15, 39, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 28, halign: 'right' } },
  });

  // 2. SARS Tax & Statutory Summary (Right column of top half)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 39, 68);
  doc.text('2. SARS Tax & Statutory Status', (pageWidth / 2) + 2, p4Y);

  const taxRows: any[] = [
    ['Estimated Corporate Tax Provision (27%)', formatRand(data.taxAndVat.estimatedCorporateTax)],
    ['Assessed Loss Carried Forward', formatRand(data.taxAndVat.assessedLossCarriedForward)],
    ['VAT Position (SARS Payable / Refund)', formatRand(data.taxAndVat.vatLiabilityOrRefund)],
    ['VAT Period Status', data.taxAndVat.vatPeriodStatus || 'Up to date / Verified'],
    ['Income Tax Reference', data.client.taxNumber || 'Active'],
    ['VAT Registration Number', data.client.vatNumber || (data.client.isVatRegistered ? 'Registered' : 'Not Registered')],
  ];

  autoTable(doc, {
    startY: p4Y + 3,
    margin: { left: (pageWidth / 2) + 2, right: rightMargin },
    theme: 'grid',
    head: [['Tax & Statutory Parameter', 'Status / Value']],
    body: taxRows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [15, 39, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 56 }, 1: { cellWidth: 32, halign: 'right' } },
  });

  const nextY = Math.max((doc as any).lastAutoTable?.finalY || 105, 105) + 8;

  // 3. Trade Receivables & Payables Age Analysis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 39, 68);
  doc.text('3. Working Capital & Trade Ageing Analysis', leftMargin, nextY);

  const ageingRows = data.workingCapital.ageingBuckets.map((b) => [
    b.label,
    formatRand(b.debtorsAmount),
    formatRand(b.creditorsAmount),
    formatRand(b.debtorsAmount - b.creditorsAmount),
  ]);

  ageingRows.push([
    { content: 'TOTAL OUTSTANDING', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } } as any,
    { content: formatRand(data.workingCapital.debtorsTotal), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } } as any,
    { content: formatRand(data.workingCapital.creditorsTotal), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } } as any,
    { content: formatRand(data.workingCapital.debtorsTotal - data.workingCapital.creditorsTotal), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } } as any,
  ]);

  autoTable(doc, {
    startY: nextY + 3,
    margin: { left: leftMargin, right: rightMargin },
    theme: 'grid',
    head: [['Ageing Bucket', 'Trade Debtors (Receivables)', 'Trade Creditors (Payables)', 'Net Working Exposure']],
    body: ageingRows,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [15, 39, 68], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 42, halign: 'right' },
      2: { cellWidth: 42, halign: 'right' },
      3: { cellWidth: 44, halign: 'right' },
    },
  });

  // 4. Strategic Director Action Items
  const recY = (doc as any).lastAutoTable?.finalY + 8;
  if (analysis?.keyRecommendations && analysis.keyRecommendations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 39, 68);
    doc.text('4. Strategic Director Action Items & Recommendations', leftMargin, recY);

    const recTableRows = analysis.keyRecommendations.map((rec, idx) => [
      `${idx + 1}. ${rec}`,
      'Director Review',
      'HIGH PRIORITY',
    ]);

    autoTable(doc, {
      startY: recY + 3,
      margin: { left: leftMargin, right: rightMargin },
      theme: 'grid',
      head: [['Recommendation / Action Plan', 'Classification', 'Priority']],
      body: recTableRows,
      styles: { fontSize: 7.5, cellPadding: 2.2 },
      headStyles: { fillColor: [15, 39, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 32 },
        2: { cellWidth: 26, halign: 'center', fontStyle: 'bold', textColor: [185, 28, 28] },
      },
    });
  }

  drawPageFooter(4, 4);

  return doc;
}
