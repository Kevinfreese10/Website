import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ManagementReportData } from '@/app/actions/management-report-actions';
import { ManagementReportAnalysisOutput } from '@/ai/flows/generate-management-report-analysis';

const formatZar = (amount: number) => {
  if (amount === 0) return 'R 0.00';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNegative ? `(R ${formatted})` : `R ${formatted}`;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 36,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  subHeader: {
    fontSize: 9,
    color: '#64748B',
    lineHeight: 1.3,
  },
  reportBadgeContainer: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginTop: 2,
  },
  generatedDate: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  kpiCard: {
    width: '24%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 6,
  },
  kpiLabel: {
    fontSize: 7.5,
    color: '#64748B',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: 7,
    color: '#64748B',
    marginTop: 2,
  },
  commentaryBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  commentaryHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  commentaryText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#334155',
    marginBottom: 6,
  },
  recommendationItem: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.3,
    marginBottom: 3,
  },
  table: {
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableSubtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#94A3B8',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
  },
  colDesc: { width: '46%' },
  colCur: { width: '18%', textAlign: 'right' },
  colPri: { width: '18%', textAlign: 'right' },
  colVar: { width: '18%', textAlign: 'right' },
  cellText: { fontSize: 8, color: '#334155' },
  cellTextBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  cellTextPositive: { fontSize: 8, color: '#16A34A', textAlign: 'right' },
  cellTextNegative: { fontSize: 8, color: '#DC2626', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
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
  const { client, period, kpis, profitAndLoss, balanceSheet, workingCapital, taxAndVat } = data;

  return (
    <Document title={`Management Report - ${client.companyName} - ${period.label}`}>
      {/* PAGE 1: EXECUTIVE SUMMARY & FINANCIAL HIGHLIGHTS */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={{ maxWidth: '60%' }}>
            <Text style={styles.companyName}>{client.companyName}</Text>
            {client.tradingName ? <Text style={styles.subHeader}>Trading as: {client.tradingName}</Text> : null}
            {client.registrationNumber ? <Text style={styles.subHeader}>Reg No: {client.registrationNumber}</Text> : null}
            {client.taxNumber ? <Text style={styles.subHeader}>Income Tax: {client.taxNumber}</Text> : null}
            {client.vatNumber ? <Text style={styles.subHeader}>VAT No: {client.vatNumber}</Text> : null}
          </View>
          <View style={styles.reportBadgeContainer}>
            <Text style={styles.reportTitle}>Management Accounts</Text>
            <Text style={styles.periodLabel}>Period: {period.label}</Text>
            <Text style={styles.generatedDate}>Comparative: {period.comparativeLabel}</Text>
            <Text style={styles.generatedDate}>Issued: {new Date().toLocaleDateString('en-ZA')}</Text>
          </View>
        </View>

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Revenue</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.revenue.current)}</Text>
            <Text style={styles.kpiSub}>
              {kpis.revenue.changePct >= 0 ? `+${kpis.revenue.changePct}%` : `${kpis.revenue.changePct}%`} vs prior
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Gross Margin</Text>
            <Text style={styles.kpiValue}>{kpis.grossProfit.marginCurrentPct}%</Text>
            <Text style={styles.kpiSub}>{formatZar(kpis.grossProfit.current)} GP</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Net Profit</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.netProfit.current)}</Text>
            <Text style={styles.kpiSub}>{kpis.netProfit.marginCurrentPct}% Margin</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Cash & Bank</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.cashBalance.current)}</Text>
            <Text style={styles.kpiSub}>Net: {formatZar(kpis.cashBalance.netChange)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Debtors (DSO)</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.debtors.current)}</Text>
            <Text style={styles.kpiSub}>{kpis.debtors.dso} Days Sales Out</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Creditors (DPO)</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.creditors.current)}</Text>
            <Text style={styles.kpiSub}>{kpis.creditors.dpo} Days Payable Out</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Working Capital</Text>
            <Text style={styles.kpiValue}>{formatZar(kpis.workingCapital.current)}</Text>
            <Text style={styles.kpiSub}>Ratio: {kpis.workingCapital.ratio}x</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Health Score</Text>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>
              {analysis?.healthScore ? `${analysis.healthScore} / 100` : 'Evaluated'}
            </Text>
            <Text style={styles.kpiSub}>AI Financial Index</Text>
          </View>
        </View>

        {/* Executive Commentary */}
        <Text style={styles.sectionTitle}>Executive Commentary & Insights</Text>
        <View style={styles.commentaryBox}>
          <Text style={styles.commentaryHeading}>Financial Overview (Khai AI CA(SA)):</Text>
          <Text style={styles.commentaryText}>
            {analysis?.executiveSummary ||
              `During the period ${period.label}, ${client.companyName} achieved total revenue of ${formatZar(
                kpis.revenue.current
              )} with a gross profit margin of ${kpis.grossProfit.marginCurrentPct}% and net operating profit of ${formatZar(
                kpis.netProfit.current
              )}. Working capital closed at ${formatZar(kpis.workingCapital.current)} with a healthy cash balance of ${formatZar(
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
              <Text style={styles.commentaryHeading}>Cash Flow & Working Capital Health:</Text>
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
              <Text style={[styles.commentaryHeading, { marginTop: 6 }]}>Director / Accountant Notes:</Text>
              <Text style={styles.commentaryText}>{customNotes}</Text>
            </>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Prepared by AI Accountant • MyAcc (Pty) Ltd</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Confidential Board Document</Text>
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
            <Text style={styles.periodLabel}>{period.label}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Profit & Loss Performance</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Account Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colCur]}>{period.label}</Text>
            <Text style={[styles.tableHeaderCell, styles.colPri]}>{period.comparativeLabel}</Text>
            <Text style={[styles.tableHeaderCell, styles.colVar]}>Variance</Text>
          </View>

          {/* Revenue */}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Revenue & Turnover</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(profitAndLoss.revenue.currentTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(profitAndLoss.revenue.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>{formatZar(profitAndLoss.revenue.varianceAmount)}</Text>
          </View>
          {profitAndLoss.revenue.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>
                {item.accountNumber ? `${item.accountNumber} - ` : ''}
                {item.name}
              </Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[item.varianceAmount >= 0 ? styles.cellTextPositive : styles.cellTextNegative, styles.colVar]}>
                {formatZar(item.varianceAmount)}
              </Text>
            </View>
          ))}

          {/* Cost of Sales */}
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Cost of Sales</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(profitAndLoss.costOfSales.currentTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(profitAndLoss.costOfSales.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>{formatZar(profitAndLoss.costOfSales.varianceAmount)}</Text>
          </View>
          {profitAndLoss.costOfSales.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>
                {item.accountNumber ? `${item.accountNumber} - ` : ''}
                {item.name}
              </Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[item.varianceAmount <= 0 ? styles.cellTextPositive : styles.cellTextNegative, styles.colVar]}>
                {formatZar(item.varianceAmount)}
              </Text>
            </View>
          ))}

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
          <View style={styles.tableSubtotalRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Operating Expenses</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>
              {formatZar(profitAndLoss.operatingExpenses.currentTotal)}
            </Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(profitAndLoss.operatingExpenses.priorTotal)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>
              {formatZar(profitAndLoss.operatingExpenses.varianceAmount)}
            </Text>
          </View>
          {profitAndLoss.operatingExpenses.items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.cellText, styles.colDesc]}>
                {item.accountNumber ? `${item.accountNumber} - ` : ''}
                {item.name}
              </Text>
              <Text style={[styles.cellText, styles.colCur]}>{formatZar(item.currentAmount)}</Text>
              <Text style={[styles.cellText, styles.colPri]}>{formatZar(item.priorAmount)}</Text>
              <Text style={[item.varianceAmount <= 0 ? styles.cellTextPositive : styles.cellTextNegative, styles.colVar]}>
                {formatZar(item.varianceAmount)}
              </Text>
            </View>
          ))}

          {/* Net Profit */}
          <View style={[styles.tableTotalRow, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.cellTextBold, styles.colDesc, { color: '#15803D' }]}>NET OPERATING PROFIT / (LOSS)</Text>
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
          <Text>Prepared by AI Accountant • MyAcc (Pty) Ltd</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Confidential Board Document</Text>
        </View>
      </Page>

      {/* PAGE 3: BALANCE SHEET, WORKING CAPITAL & STATUTORY */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.companyName}>{client.companyName}</Text>
            <Text style={styles.subHeader}>Statement of Financial Position & Working Capital</Text>
          </View>
          <View style={styles.reportBadgeContainer}>
            <Text style={styles.periodLabel}>As at {period.endDate}</Text>
          </View>
        </View>

        {/* Balance Sheet Summary */}
        <Text style={styles.sectionTitle}>Financial Position Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Balance Sheet Category</Text>
            <Text style={[styles.tableHeaderCell, styles.colCur]}>Current Position</Text>
            <Text style={[styles.tableHeaderCell, styles.colPri]}>Prior Position</Text>
            <Text style={[styles.tableHeaderCell, styles.colVar]}>Movement</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Non-Current Assets</Text>
            <Text style={[styles.cellText, styles.colCur]}>{formatZar(balanceSheet.nonCurrentAssets.currentTotal)}</Text>
            <Text style={[styles.cellText, styles.colPri]}>{formatZar(balanceSheet.nonCurrentAssets.priorTotal)}</Text>
            <Text style={[styles.cellText, styles.colVar]}>{formatZar(balanceSheet.nonCurrentAssets.varianceAmount)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Current Assets (Bank, Debtors, Inventory)</Text>
            <Text style={[styles.cellText, styles.colCur]}>{formatZar(balanceSheet.currentAssets.currentTotal)}</Text>
            <Text style={[styles.cellText, styles.colPri]}>{formatZar(balanceSheet.currentAssets.priorTotal)}</Text>
            <Text style={[styles.cellText, styles.colVar]}>{formatZar(balanceSheet.currentAssets.varianceAmount)}</Text>
          </View>
          <View style={[styles.tableSubtotalRow, { backgroundColor: '#F1F5F9' }]}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>TOTAL ASSETS</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>{formatZar(balanceSheet.totalAssets.current)}</Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>{formatZar(balanceSheet.totalAssets.prior)}</Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>
              {formatZar(balanceSheet.totalAssets.current - balanceSheet.totalAssets.prior)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Equity & Retained Earnings</Text>
            <Text style={[styles.cellText, styles.colCur]}>{formatZar(balanceSheet.equity.currentTotal)}</Text>
            <Text style={[styles.cellText, styles.colPri]}>{formatZar(balanceSheet.equity.priorTotal)}</Text>
            <Text style={[styles.cellText, styles.colVar]}>{formatZar(balanceSheet.equity.varianceAmount)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Non-Current Liabilities</Text>
            <Text style={[styles.cellText, styles.colCur]}>
              {formatZar(balanceSheet.nonCurrentLiabilities.currentTotal)}
            </Text>
            <Text style={[styles.cellText, styles.colPri]}>
              {formatZar(balanceSheet.nonCurrentLiabilities.priorTotal)}
            </Text>
            <Text style={[styles.cellText, styles.colVar]}>
              {formatZar(balanceSheet.nonCurrentLiabilities.varianceAmount)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>Current Liabilities (Creditors, VAT, Tax)</Text>
            <Text style={[styles.cellText, styles.colCur]}>{formatZar(balanceSheet.currentLiabilities.currentTotal)}</Text>
            <Text style={[styles.cellText, styles.colPri]}>{formatZar(balanceSheet.currentLiabilities.priorTotal)}</Text>
            <Text style={[styles.cellText, styles.colVar]}>
              {formatZar(balanceSheet.currentLiabilities.varianceAmount)}
            </Text>
          </View>
          <View style={[styles.tableTotalRow, { backgroundColor: '#E2E8F0' }]}>
            <Text style={[styles.cellTextBold, styles.colDesc]}>TOTAL EQUITY & LIABILITIES</Text>
            <Text style={[styles.cellTextBold, styles.colCur]}>
              {formatZar(balanceSheet.totalEquityAndLiabilities.current)}
            </Text>
            <Text style={[styles.cellTextBold, styles.colPri]}>
              {formatZar(balanceSheet.totalEquityAndLiabilities.prior)}
            </Text>
            <Text style={[styles.cellTextBold, styles.colVar]}>
              {formatZar(balanceSheet.totalEquityAndLiabilities.current - balanceSheet.totalEquityAndLiabilities.prior)}
            </Text>
          </View>
        </View>

        {/* Working Capital & Ageing */}
        <Text style={styles.sectionTitle}>Working Capital & Age Analysis</Text>
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
        <Text style={styles.sectionTitle}>Tax & Statutory Compliance Snapshot</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { width: '48%' }]}>
            <Text style={styles.kpiLabel}>VAT Position (SARS)</Text>
            <Text style={styles.kpiValue}>{formatZar(taxAndVat.vatLiabilityOrRefund)}</Text>
            <Text style={styles.kpiSub}>Status: {taxAndVat.vatPeriodStatus}</Text>
          </View>
          <View style={[styles.kpiCard, { width: '48%' }]}>
            <Text style={styles.kpiLabel}>Est. Corporate Tax Provision (27%)</Text>
            <Text style={styles.kpiValue}>{formatZar(taxAndVat.estimatedCorporateTax)}</Text>
            <Text style={styles.kpiSub}>Provisional tax reserve</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Prepared by AI Accountant • MyAcc (Pty) Ltd</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Confidential Board Document</Text>
        </View>
      </Page>
    </Document>
  );
};
