import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { ManagementReportData, ManagementReportAnalysisOutput } from '@/lib/management-report-types';

const formatZar = (amount: number | undefined) => {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) return 'R 0.00';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNegative ? `(R ${formatted})` : `R ${formatted}`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const formatPct = (pct: number | undefined) => {
  if (pct === undefined || pct === null || isNaN(pct)) return '0.0%';
  const isPos = pct > 0;
  return `${isPos ? '+' : ''}${pct.toFixed(1)}%`;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
    paddingBottom: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0F2744',
    marginBottom: 2,
  },
  subHeader: {
    fontSize: 8,
    color: '#64748B',
    lineHeight: 1.3,
  },
  reportBadgeContainer: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0F2744',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 4,
    alignItems: 'flex-end',
  },
  periodLabelBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
  },
  periodDatesText: {
    fontSize: 7,
    color: '#3B82F6',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F2744',
    backgroundColor: '#F1F5F9',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  kpiCard: {
    width: '23.8%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3,
    borderRadius: 4,
    padding: 5.5,
  },
  kpiLabel: {
    fontSize: 6.5,
    color: '#64748B',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: 6.5,
    color: '#64748B',
    marginTop: 2,
  },
  commentaryBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  commentaryHeading: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F2744',
    marginBottom: 3,
  },
  commentaryText: {
    fontSize: 7.5,
    lineHeight: 1.4,
    color: '#334155',
    marginBottom: 5,
  },
  recommendationItem: {
    fontSize: 7.5,
    color: '#334155',
    lineHeight: 1.3,
    marginBottom: 2.5,
  },
  table: {
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0F2744',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tableHeaderCellSub: {
    fontSize: 6,
    fontFamily: 'Helvetica',
    color: '#93C5FD',
    marginTop: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableCategoryRow: {
    flexDirection: 'row',
    backgroundColor: '#0F2744',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  tableCategoryText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tableSubtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#94A3B8',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  colDesc: { width: '44%' },
  colCur: { width: '19%', textAlign: 'right' },
  colPri: { width: '19%', textAlign: 'right' },
  colVar: { width: '18%', textAlign: 'right' },
  cellText: { fontSize: 7.5, color: '#334155' },
  cellTextBold: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  cellTextPositive: { fontSize: 7.5, color: '#16A34A', textAlign: 'right' },
  cellTextNegative: { fontSize: 7.5, color: '#DC2626', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94A3B8',
  },
});

interface ManagementReportPdfDocumentProps {
  data: ManagementReportData;
  analysis?: ManagementReportAnalysisOutput | null;
  customNotes?: string;
}

export const ManagementReportPdfDocument: React.FC<ManagementReportPdfDocumentProps> = ({
  data,
  analysis,
  customNotes,
}) => {
  const { client, period, kpis, profitAndLoss, balanceSheet, workingCapital, taxAndVat, cashFlow } = data;

  const currentDates = `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`;
  const priorDates = `${formatDate(period.comparativeStartDate)} – ${formatDate(period.comparativeEndDate)}`;
  const asAtCurrent = formatDate(period.endDate);
  const asAtPrior = formatDate(period.comparativeEndDate);

  return (
    <Document title={`Management Report - ${client.companyName} - ${period.label}`}>
      {/* PAGE 1: EXECUTIVE SUMMARY & FINANCIAL HIGHLIGHTS */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={{ maxWidth: '58%' }}>
            <Text style={styles.companyName}>{client.companyName}</Text>
            {client.tradingName ? <Text style={styles.subHeader}>Trading as: {client.tradingName}</Text> : null}
            {client.registrationNumber ? <Text style={styles.subHeader}>Reg No: {client.registrationNumber}</Text> : null}
            {client.taxNumber ? <Text style={styles.subHeader}>Income Tax: {client.taxNumber}</Text> : null}
            {client.vatNumber ? <Text style={styles.subHeader}>VAT No: {client.vatNumber}</Text> : null}
          </View>
          <View style={styles.reportBadgeContainer}>
            <Text style={styles.reportTitle}>Executive Management Report</Text>
            <View style={styles.periodBadge}>
              <Text style={styles.periodLabelBold}>Current: {period.label}</Text>
              <Text style={styles.periodDatesText}>{currentDates}</Text>
              <Text style={[styles.periodDatesText, { color: '#64748B' }]}>Prior: {period.comparativeLabel} ({priorDates})</Text>
            </View>
          </View>
        </View>

        {/* KPI Grid (8 Cards) */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: '#2563EB' }]}>
            <Text style={styles.kpiLabel}>Turnover</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.revenue.current)}</Text>
            <Text style={[styles.kpiSub, { color: kpis.revenue.changePct >= 0 ? '#16A34A' : '#DC2626' }]}>
              {formatPct(kpis.revenue.changePct)} vs prior
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.kpiLabel}>Gross Profit</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.grossProfit.current)}</Text>
            <Text style={styles.kpiSub}>{kpis.grossProfit.marginCurrentPct.toFixed(1)}% GP Margin</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: kpis.netProfit.current >= 0 ? '#059669' : '#DC2626' }]}>
            <Text style={styles.kpiLabel}>Net Profit Pre-Tax</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.netProfit.current)}</Text>
            <Text style={styles.kpiSub}>{kpis.netProfit.marginCurrentPct.toFixed(1)}% Net Margin</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#0284C7' }]}>
            <Text style={styles.kpiLabel}>Cash & Bank</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.cashBalance.current)}</Text>
            <Text style={styles.kpiSub}>Net: {formatZar(kpis.cashBalance.netChange)}</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#D97706' }]}>
            <Text style={styles.kpiLabel}>Debtors (DSO)</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.debtors.current)}</Text>
            <Text style={styles.kpiSub}>{kpis.debtors.dso} Days Sales Out</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#64748B' }]}>
            <Text style={styles.kpiLabel}>Creditors (DPO)</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.creditors.current)}</Text>
            <Text style={styles.kpiSub}>{kpis.creditors.dpo} Days Payable Out</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: kpis.workingCapital.current >= 0 ? '#10B981' : '#DC2626' }]}>
            <Text style={styles.kpiLabel}>Working Capital</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.workingCapital.current)}</Text>
            <Text style={styles.kpiSub}>Ratio: {kpis.workingCapital.ratio.toFixed(2)}x</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#6366F1' }]}>
            <Text style={styles.kpiLabel}>Health Score</Text>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>
              {analysis?.healthScore ? `${analysis.healthScore} / 100` : 'Active'}
            </Text>
            <Text style={styles.kpiSub}>AI Financial Index</Text>
          </View>
        </View>

        {/* Executive Commentary */}
        <Text style={styles.sectionTitle}>Executive Commentary & Insights</Text>
        <View style={styles.commentaryBox}>
          <Text style={styles.commentaryHeading}>Khai AI CA(SA) Financial Analysis:</Text>
          <Text style={styles.commentaryText}>
            {analysis?.executiveSummary ||
              `During the period ${period.label} (${currentDates}), ${client.companyName} achieved total revenue of ${formatZar(
                kpis.revenue.current
              )} with a gross profit margin of ${kpis.grossProfit.marginCurrentPct.toFixed(1)}% and net operating profit before tax of ${formatZar(
                kpis.netProfit.current
              )}. Working capital closed at ${formatZar(kpis.workingCapital.current)} with cash & bank reserves of ${formatZar(
                kpis.cashBalance.current
              )}.`}
          </Text>

          {analysis?.revenueAndMarginInsights ? (
            <>
              <Text style={styles.commentaryHeading}>Revenue & Margin Dynamics:</Text>
              <Text style={styles.commentaryText}>{analysis.revenueAndMarginInsights}</Text>
            </>
          ) : null}

          {analysis?.cashFlowAndLiquidity ? (
            <>
              <Text style={styles.commentaryHeading}>Cash Flow & Liquidity Health:</Text>
              <Text style={styles.commentaryText}>{analysis.cashFlowAndLiquidity}</Text>
            </>
          ) : null}

          {analysis?.keyRecommendations && analysis.keyRecommendations.length > 0 ? (
            <>
              <Text style={styles.commentaryHeading}>Strategic Director Recommendations:</Text>
              {analysis.keyRecommendations.map((rec, i) => (
                <Text key={i} style={styles.recommendationItem}>
                  • {rec}
                </Text>
              ))}
            </>
          ) : null}

          {customNotes ? (
            <>
              <Text style={[styles.commentaryHeading, { marginTop: 4 }]}>Director / Accountant Notes:</Text>
              <Text style={styles.commentaryText}>{customNotes}</Text>
            </>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Prepared by My Accountant (Pty) Ltd • AI Accountant</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Confidential Executive Report</Text>
        </View>
      </Page>

      {/* PAGE 2: STATEMENT OF PROFIT OR LOSS */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.companyName}>{client.companyName}</Text>
            <Text style={styles.subHeader}>Statement of Comprehensive Income (Profit & Loss)</Text>
          </View>
          <View style={styles.reportBadgeContainer}>
            <Text style={styles.periodLabelBold}>Current: {period.label} ({currentDates})</Text>
            <Text style={styles.subHeader}>Comparative: {period.comparativeLabel} ({priorDates})</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Profit & Loss Performance</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderCell}>Account Description</Text>
            </View>
            <View style={styles.colCur}>
              <Text style={styles.tableHeaderCell}>Current Period</Text>
              <Text style={styles.tableHeaderCellSub}>{currentDates}</Text>
            </View>
            <View style={styles.colPri}>
              <Text style={styles.tableHeaderCell}>Prior Period</Text>
              <Text style={styles.tableHeaderCellSub}>{priorDates}</Text>
            </View>
            <View style={styles.colVar}>
              <Text style={styles.tableHeaderCell}>Variance (R)</Text>
            </View>
          </View>

          {/* Revenue */}
          <View style={styles.tableCategoryRow}>
            <Text style={styles.tableCategoryText}>Revenue & Turnover</Text>
          </View>
          {profitAndLoss.revenue.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>
                {item.accountNumber ? `${item.accountNumber} - ` : ''}{item.name}
              </Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[item.varianceAmount >= 0 ? styles.cellTextPositive : styles.cellTextNegative, styles.colVar]}>
                {formatZar(item.varianceAmount)}
              </Text>
            </View>
          ))}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Total Revenue</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(profitAndLoss.revenue.currentTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(profitAndLoss.revenue.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>{formatZar(profitAndLoss.revenue.varianceAmount)}</Text>
          </View>

          {/* Cost of Sales */}
          <View style={styles.tableCategoryRow}>
            <Text style={styles.tableCategoryText}>Cost of Sales</Text>
          </View>
          {profitAndLoss.costOfSales.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>
                {item.accountNumber ? `${item.accountNumber} - ` : ''}{item.name}
              </Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[item.varianceAmount <= 0 ? styles.cellTextPositive : styles.cellTextNegative, styles.colVar]}>
                {formatZar(item.varianceAmount)}
              </Text>
            </View>
          ))}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Total Cost of Sales</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(profitAndLoss.costOfSales.currentTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(profitAndLoss.costOfSales.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>{formatZar(profitAndLoss.costOfSales.varianceAmount)}</Text>
          </View>

          {/* Gross Profit */}
          <View style={[styles.tableTotalRow, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.cellTextBold, styles.colDesc, { color: '#0369A1' }]}>GROSS PROFIT</Text>
            <Text style={[styles.cellTextBold, styles.colCur, { color: '#0369A1' }]}>
              {formatZar(profitAndLoss.grossProfit.current)}
            </Text>
            <Text style={[styles.cellTextBold, styles.colPri, { color: '#0369A1' }]}>
              {formatZar(profitAndLoss.grossProfit.prior)}
            </Text>
            <Text style={[styles.cellTextBold, styles.colVar, { color: '#0369A1' }]}>
              {formatZar(profitAndLoss.grossProfit.variance)}
            </Text>
          </View>

          {/* Operating Expenses */}
          <View style={styles.tableCategoryRow}>
            <Text style={styles.tableCategoryText}>Operating Expenses</Text>
          </View>
          {profitAndLoss.operatingExpenses.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>
                {item.accountNumber ? `${item.accountNumber} - ` : ''}{item.name}
              </Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[item.varianceAmount <= 0 ? styles.cellTextPositive : styles.cellTextNegative, styles.colVar]}>
                {formatZar(item.varianceAmount)}
              </Text>
            </View>
          ))}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Total Operating Expenses</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>
              {formatZar(profitAndLoss.operatingExpenses.currentTotal)}
            </Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(profitAndLoss.operatingExpenses.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>
              {formatZar(profitAndLoss.operatingExpenses.varianceAmount)}
            </Text>
          </View>

          {/* Net Profit */}
          <View style={[styles.tableTotalRow, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.cellTextBold, styles.colDesc, { color: '#15803D' }]}>NET OPERATING PROFIT / (LOSS) BEFORE TAX</Text>
            <Text style={[styles.cellTextBold, styles.colCur, { color: '#15803D' }]}>
              {formatZar(profitAndLoss.netProfitBeforeTax.current)}
            </Text>
            <Text style={[styles.cellTextBold, styles.colPri, { color: '#15803D' }]}>
              {formatZar(profitAndLoss.netProfitBeforeTax.prior)}
            </Text>
            <Text style={[styles.cellTextBold, styles.colVar, { color: '#15803D' }]}>
              {formatZar(profitAndLoss.netProfitBeforeTax.variance)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Prepared by My Accountant (Pty) Ltd • AI Accountant</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Confidential Executive Report</Text>
        </View>
      </Page>

      {/* PAGE 3: BALANCE SHEET & FINANCIAL POSITION */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.companyName}>{client.companyName}</Text>
            <Text style={styles.subHeader}>Statement of Financial Position (Balance Sheet)</Text>
          </View>
          <View style={styles.reportBadgeContainer}>
            <Text style={styles.periodLabelBold}>Current: As at {asAtCurrent}</Text>
            <Text style={styles.subHeader}>Prior: As at {asAtPrior}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Financial Position Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderCell}>Balance Sheet Category</Text>
            </View>
            <View style={styles.colCur}>
              <Text style={styles.tableHeaderCell}>Current Position</Text>
              <Text style={styles.tableHeaderCellSub}>As at {asAtCurrent}</Text>
            </View>
            <View style={styles.colPri}>
              <Text style={styles.tableHeaderCell}>Prior Position</Text>
              <Text style={styles.tableHeaderCellSub}>As at {asAtPrior}</Text>
            </View>
            <View style={styles.colVar}>
              <Text style={styles.tableHeaderCell}>Movement (R)</Text>
            </View>
          </View>

          {/* Non-Current Assets */}
          <View style={styles.tableCategoryRow}>
            <Text style={styles.tableCategoryText}>Non-Current Assets</Text>
          </View>
          {balanceSheet.nonCurrentAssets.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>{item.name}</Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[styles.cellText, styles.colVar]}>{formatZar(item.varianceAmount)}</Text>
            </View>
          ))}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Total Non-Current Assets</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(balanceSheet.nonCurrentAssets.currentTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(balanceSheet.nonCurrentAssets.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>{formatZar(balanceSheet.nonCurrentAssets.varianceAmount)}</Text>
          </View>

          {/* Current Assets */}
          <View style={styles.tableCategoryRow}>
            <Text style={styles.tableCategoryText}>Current Assets (Bank, Receivables, Inventory)</Text>
          </View>
          {balanceSheet.currentAssets.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>{item.name}</Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[styles.cellText, styles.colVar]}>{formatZar(item.varianceAmount)}</Text>
            </View>
          ))}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Total Current Assets</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(balanceSheet.currentAssets.currentTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(balanceSheet.currentAssets.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>{formatZar(balanceSheet.currentAssets.varianceAmount)}</Text>
          </View>

          {/* Total Assets */}
          <View style={[styles.tableTotalRow, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.cellTextBold, styles.colDesc, { color: '#0369A1' }]}>TOTAL ASSETS</Text>
            <Text style={[styles.cellTextBold, styles.colCur, { color: '#0369A1' }]}>{formatZar(balanceSheet.totalAssets.current)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri, { color: '#0369A1' }]}>{formatZar(balanceSheet.totalAssets.prior)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar, { color: '#0369A1' }]}>
              {formatZar(balanceSheet.totalAssets.current - balanceSheet.totalAssets.prior)}
            </Text>
          </View>

          {/* Equity */}
          <View style={styles.tableCategoryRow}>
            <Text style={styles.tableCategoryText}>Equity & Retained Earnings</Text>
          </View>
          {balanceSheet.equity.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>{item.name}</Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[styles.cellText, styles.colVar]}>{formatZar(item.varianceAmount)}</Text>
            </View>
          ))}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Total Equity</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(balanceSheet.equity.currentTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(balanceSheet.equity.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>{formatZar(balanceSheet.equity.varianceAmount)}</Text>
          </View>

          {/* Non-Current Liabilities */}
          <View style={styles.tableCategoryRow}>
            <Text style={styles.tableCategoryText}>Non-Current Liabilities</Text>
          </View>
          {balanceSheet.nonCurrentLiabilities.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>{item.name}</Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[styles.cellText, styles.colVar]}>{formatZar(item.varianceAmount)}</Text>
            </View>
          ))}

          {/* Current Liabilities */}
          <View style={styles.tableCategoryRow}>
            <Text style={styles.tableCategoryText}>Current Liabilities (Payables, Tax, Provisions)</Text>
          </View>
          {balanceSheet.currentLiabilities.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>{item.name}</Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[styles.cellText, styles.colVar]}>{formatZar(item.varianceAmount)}</Text>
            </View>
          ))}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Total Current Liabilities</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(balanceSheet.currentLiabilities.currentTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(balanceSheet.currentLiabilities.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>{formatZar(balanceSheet.currentLiabilities.varianceAmount)}</Text>
          </View>

          {/* Total Equity & Liabilities */}
          <View style={[styles.tableTotalRow, { backgroundColor: '#E2E8F0' }]}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>TOTAL EQUITY & LIABILITIES</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(balanceSheet.totalEquityAndLiabilities.current)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(balanceSheet.totalEquityAndLiabilities.prior)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>
              {formatZar(balanceSheet.totalEquityAndLiabilities.current - balanceSheet.totalEquityAndLiabilities.prior)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Prepared by My Accountant (Pty) Ltd • AI Accountant</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Confidential Executive Report</Text>
        </View>
      </Page>

      {/* PAGE 4: CASH FLOW, WORKING CAPITAL & STATUTORY */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.companyName}>{client.companyName}</Text>
            <Text style={styles.subHeader}>Cash Flow, Working Capital & SARS Compliance</Text>
          </View>
          <View style={styles.reportBadgeContainer}>
            <Text style={styles.periodLabelBold}>{period.label}</Text>
            <Text style={styles.subHeader}>{currentDates}</Text>
          </View>
        </View>

        {/* Cash Flow Summary */}
        <Text style={styles.sectionTitle}>Cash Flow Statement Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: '70%' }]}>Cash Flow Activity</Text>
            <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>Amount (ZAR)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cellText, { width: '70%' }]}>Operating Cash Flow (Inflows from Operations)</Text>
            <Text style={[styles.cellText, { width: '30%', textAlign: 'right' }]}>{formatZar(cashFlow.operatingCashFlow)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={[styles.cellText, { width: '70%' }]}>Investing Cash Flow (Asset Investments / Capex)</Text>
            <Text style={[styles.cellText, { width: '30%', textAlign: 'right' }]}>{formatZar(cashFlow.investingCashFlow)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cellText, { width: '70%' }]}>Financing Cash Flow (Loans, Capital & Equity)</Text>
            <Text style={[styles.cellText, { width: '30%', textAlign: 'right' }]}>{formatZar(cashFlow.financingCashFlow)}</Text>
          </View>
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, { width: '70%' }]}>NET CASH MOVEMENT</Text>
            <Text style={[styles.cellTextBold, { width: '30%', textAlign: 'right' }]}>{formatZar(cashFlow.netCashMovement)}</Text>
          </View>
          <View style={[styles.tableTotalRow, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.cellTextBold, { width: '70%', color: '#0369A1' }]}>CLOSING CASH & BANK BALANCE</Text>
            <Text style={[styles.cellTextBold, { width: '30%', textAlign: 'right', color: '#0369A1' }]}>
              {formatZar(cashFlow.closingCash)}
            </Text>
          </View>
        </View>

        {/* Working Capital Ageing */}
        <Text style={styles.sectionTitle}>Working Capital & Trade Ageing Analysis</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Ageing Bucket</Text>
            <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>Trade Debtors (Receivables)</Text>
            <Text style={[styles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>Trade Creditors (Payables)</Text>
          </View>
          {workingCapital.ageingBuckets.map((b, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellTextBold, { width: '40%' }]}>{b.label}</Text>
              <Text style={[styles.cellText, { width: '30%', textAlign: 'right' }]}>{formatZar(b.debtorsAmount)}</Text>
              <Text style={[styles.cellText, { width: '30%', textAlign: 'right' }]}>{formatZar(b.creditorsAmount)}</Text>
            </View>
          ))}
          <View style={styles.tableTotalRow}>
            <Text style={[styles.cellTextBold, { width: '40%' }]}>TOTAL OUTSTANDING</Text>
            <Text style={[styles.cellTextBold, { width: '30%', textAlign: 'right' }]}>
              {formatZar(workingCapital.debtorsTotal)}
            </Text>
            <Text style={[styles.cellTextBold, { width: '30%', textAlign: 'right' }]}>
              {formatZar(workingCapital.creditorsTotal)}
            </Text>
          </View>
        </View>

        {/* Tax & VAT Overview */}
        <Text style={styles.sectionTitle}>SARS Tax & Statutory Compliance Snapshot</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { width: '48%', borderLeftColor: '#0284C7' }]}>
            <Text style={styles.kpiLabel}>VAT Position (SARS)</Text>
            <Text style={styles.kpiValue}>{formatZar(taxAndVat.vatLiabilityOrRefund)}</Text>
            <Text style={styles.kpiSub}>Status: {taxAndVat.vatPeriodStatus || 'Up to date'}</Text>
          </View>
          <View style={[styles.kpiCard, { width: '48%', borderLeftColor: '#D97706' }]}>
            <Text style={styles.kpiLabel}>Est. Corporate Tax Provision (27%)</Text>
            <Text style={styles.kpiValue}>{formatZar(taxAndVat.estimatedCorporateTax)}</Text>
            <Text style={styles.kpiSub}>Assessed Loss: {formatZar(taxAndVat.assessedLossCarriedForward)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Prepared by My Accountant (Pty) Ltd • AI Accountant</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Confidential Executive Report</Text>
        </View>
      </Page>
    </Document>
  );
};
