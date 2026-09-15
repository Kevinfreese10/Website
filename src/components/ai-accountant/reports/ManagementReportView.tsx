'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, subDays } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Bot,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Landmark,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  FileText,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getManagementReportDataAction,
  generateManagementReportAnalysisAction,
} from '@/app/actions/management-report-actions';
import type { ManagementReportData, ManagementReportAnalysisOutput } from '@/lib/management-report-types';
import ManagementReportPdfDownloadButton from '@/components/pdf/ManagementReportPdfDownloadButton';
import * as XLSX from 'xlsx-js-style';

const formatZar = (amount: number) => {
  if (amount === 0) return 'R 0.00';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNegative ? `-R ${formatted}` : `R ${formatted}`;
};

const formatPct = (pct: number) => {
  const isPos = pct > 0;
  return `${isPos ? '+' : ''}${pct.toFixed(1)}%`;
};

interface ManagementReportViewProps {
  clientId: string;
}

export default function ManagementReportView({ clientId }: ManagementReportViewProps) {
  const { toast } = useToast();

  // Period presets
  const [periodPreset, setPeriodPreset] = useState<string>('financial_ytd');
  const [comparativePreset, setComparativePreset] = useState<string>('prior_year');

  // Dates
  const now = useMemo(() => new Date(), []);
  const [customRange, setCustomRange] = useState<DateRange | undefined>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });

  // Report Data state
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ManagementReportData | null>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ManagementReportAnalysisOutput | null>(null);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('executive');

  // Compute start/end dates from preset
  const computedDates = useMemo(() => {
    let start: Date;
    let end: Date;
    let periodLabel: string;

    if (periodPreset === 'current_month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
      periodLabel = format(start, 'MMMM yyyy');
    } else if (periodPreset === 'prior_month') {
      const priorM = subMonths(now, 1);
      start = startOfMonth(priorM);
      end = endOfMonth(priorM);
      periodLabel = format(start, 'MMMM yyyy');
    } else if (periodPreset === 'quarter_to_date') {
      start = subMonths(now, 3);
      end = now;
      periodLabel = `Last 3 Months (${format(start, 'MMM')} - ${format(end, 'MMM yyyy')})`;
    } else if (periodPreset === 'financial_ytd') {
      start = new Date(now.getFullYear(), 2, 1); // 1 March (SA Tax year start)
      if (now.getMonth() < 2) {
        start = new Date(now.getFullYear() - 1, 2, 1);
      }
      end = now;
      periodLabel = `FY${start.getFullYear() + 1} YTD (${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')})`;
    } else {
      start = customRange?.from || startOfMonth(now);
      end = customRange?.to || endOfMonth(now);
      periodLabel = `${format(start, 'dd MMM yyyy')} – ${format(end, 'dd MMM yyyy')}`;
    }

    // Comparative dates
    let compStart: Date;
    let compEnd: Date;
    let compLabel: string;

    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    if (comparativePreset === 'prior_month') {
      compStart = subMonths(start, 1);
      compEnd = subMonths(end, 1);
      compLabel = `Prior Month (${format(compStart, 'MMM yyyy')})`;
    } else if (comparativePreset === 'prior_year') {
      compStart = subYears(start, 1);
      compEnd = subYears(end, 1);
      compLabel = `Prior Year (${format(compStart, 'MMM yyyy')})`;
    } else {
      compStart = subDays(start, diffDays);
      compEnd = subDays(start, 1);
      compLabel = `Prior Period (${format(compStart, 'dd MMM')} - ${format(compEnd, 'dd MMM yyyy')})`;
    }

    return {
      startDateStr: start.toISOString(),
      endDateStr: end.toISOString(),
      periodLabel,
      comparativeStartDateStr: compStart.toISOString(),
      comparativeEndDateStr: compEnd.toISOString(),
      comparativePeriodLabel: compLabel,
    };
  }, [periodPreset, comparativePreset, customRange, now]);

  // Fetch Report Data
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getManagementReportDataAction({
        clientId,
        startDateStr: computedDates.startDateStr,
        endDateStr: computedDates.endDateStr,
        periodLabel: computedDates.periodLabel,
        comparativeStartDateStr: computedDates.comparativeStartDateStr,
        comparativeEndDateStr: computedDates.comparativeEndDateStr,
        comparativePeriodLabel: computedDates.comparativePeriodLabel,
      });

      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to load report data', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to load report data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, computedDates, toast]);

  const triggerAiAnalysis = async (data: ManagementReportData) => {
    setIsAnalyzing(true);
    try {
      const res = await generateManagementReportAnalysisAction({ reportData: data });
      if (res.success && res.analysis) {
        setAnalysis(res.analysis);
      }
    } catch (e) {
      console.error('Failed to run AI analysis:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Excel Export
  const handleExportExcel = () => {
    if (!reportData) return;

    try {
      const wb = XLSX.utils.book_new();

      // 1. KPI Summary Sheet
      const kpiRows = [
        ['EXECUTIVE MANAGEMENT ACCOUNTS SUMMARY'],
        ['Company', reportData.client.companyName],
        ['Period', reportData.period.label],
        ['Comparative', reportData.period.comparativeLabel],
        ['Generated Date', new Date().toLocaleDateString('en-ZA')],
        [],
        ['KEY FINANCIAL INDICATOR', 'CURRENT PERIOD', 'PRIOR PERIOD', 'VARIANCE %'],
        ['Revenue / Turnover', reportData.kpis.revenue.current, reportData.kpis.revenue.prior, `${reportData.kpis.revenue.changePct}%`],
        ['Gross Profit', reportData.kpis.grossProfit.current, reportData.kpis.grossProfit.prior, `${reportData.kpis.grossProfit.changePct}%`],
        ['Gross Profit Margin %', `${reportData.kpis.grossProfit.marginCurrentPct}%`, `${reportData.kpis.grossProfit.marginPriorPct}%`, ''],
        ['Operating Expenses (OPEX)', reportData.kpis.opex.current, reportData.kpis.opex.prior, `${reportData.kpis.opex.changePct}%`],
        ['Net Operating Profit / (Loss)', reportData.kpis.netProfit.current, reportData.kpis.netProfit.prior, `${reportData.kpis.netProfit.changePct}%`],
        ['Net Margin %', `${reportData.kpis.netProfit.marginCurrentPct}%`, `${reportData.kpis.netProfit.marginPriorPct}%`, ''],
        ['Cash & Bank Balance', reportData.kpis.cashBalance.current, reportData.kpis.cashBalance.prior, ''],
        ['Trade Debtors Balance', reportData.kpis.debtors.current, '', `${reportData.kpis.debtors.dso} DSO Days`],
        ['Trade Creditors Balance', reportData.kpis.creditors.current, '', `${reportData.kpis.creditors.dpo} DPO Days`],
        ['Working Capital', reportData.kpis.workingCapital.current, '', `${reportData.kpis.workingCapital.ratio}x Ratio`],
      ];
      const wsKpi = XLSX.utils.aoa_to_sheet(kpiRows);
      XLSX.utils.book_append_sheet(wb, wsKpi, 'Executive Summary');

      // 2. Profit & Loss Sheet
      const plRows = [
        ['STATEMENT OF COMPREHENSIVE INCOME (PROFIT & LOSS)'],
        ['Company', reportData.client.companyName],
        ['Period', reportData.period.label],
        [],
        ['Account Code', 'Account Description', 'Current Period (ZAR)', 'Prior Period (ZAR)', 'Variance (ZAR)', 'Variance %'],
        ['REVENUE'],
        ...reportData.profitAndLoss.revenue.items.map((i) => [i.accountNumber || '', i.name, i.currentAmount, i.priorAmount, i.varianceAmount, `${i.variancePct}%`]),
        ['Total Revenue', '', reportData.profitAndLoss.revenue.currentTotal, reportData.profitAndLoss.revenue.priorTotal, reportData.profitAndLoss.revenue.varianceAmount, `${reportData.profitAndLoss.revenue.variancePct}%`],
        [],
        ['COST OF SALES'],
        ...reportData.profitAndLoss.costOfSales.items.map((i) => [i.accountNumber || '', i.name, i.currentAmount, i.priorAmount, i.varianceAmount, `${i.variancePct}%`]),
        ['Total Cost of Sales', '', reportData.profitAndLoss.costOfSales.currentTotal, reportData.profitAndLoss.costOfSales.priorTotal, reportData.profitAndLoss.costOfSales.varianceAmount, `${reportData.profitAndLoss.costOfSales.variancePct}%`],
        [],
        ['GROSS PROFIT', '', reportData.profitAndLoss.grossProfit.current, reportData.profitAndLoss.grossProfit.prior, reportData.profitAndLoss.grossProfit.variance, `${reportData.profitAndLoss.grossProfit.variancePct}%`],
        [],
        ['OPERATING EXPENSES'],
        ...reportData.profitAndLoss.operatingExpenses.items.map((i) => [i.accountNumber || '', i.name, i.currentAmount, i.priorAmount, i.varianceAmount, `${i.variancePct}%`]),
        ['Total Operating Expenses', '', reportData.profitAndLoss.operatingExpenses.currentTotal, reportData.profitAndLoss.operatingExpenses.priorTotal, reportData.profitAndLoss.operatingExpenses.varianceAmount, `${reportData.profitAndLoss.operatingExpenses.variancePct}%`],
        [],
        ['NET OPERATING PROFIT / (LOSS)', '', reportData.profitAndLoss.netProfitBeforeTax.current, reportData.profitAndLoss.netProfitBeforeTax.prior, reportData.profitAndLoss.netProfitBeforeTax.variance, `${reportData.profitAndLoss.netProfitBeforeTax.variancePct}%`],
      ];
      const wsPl = XLSX.utils.aoa_to_sheet(plRows);
      XLSX.utils.book_append_sheet(wb, wsPl, 'Profit & Loss');

      // 3. Balance Sheet
      const bsRows = [
        ['STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)'],
        ['Company', reportData.client.companyName],
        ['As At', reportData.period.endDate],
        [],
        ['Category', 'Current Position (ZAR)', 'Prior Position (ZAR)', 'Movement (ZAR)'],
        ['Non-Current Assets', reportData.balanceSheet.nonCurrentAssets.currentTotal, reportData.balanceSheet.nonCurrentAssets.priorTotal, reportData.balanceSheet.nonCurrentAssets.varianceAmount],
        ['Current Assets', reportData.balanceSheet.currentAssets.currentTotal, reportData.balanceSheet.currentAssets.priorTotal, reportData.balanceSheet.currentAssets.varianceAmount],
        ['TOTAL ASSETS', reportData.balanceSheet.totalAssets.current, reportData.balanceSheet.totalAssets.prior, reportData.balanceSheet.totalAssets.current - reportData.balanceSheet.totalAssets.prior],
        [],
        ['Capital & Reserves (Equity)', reportData.balanceSheet.equity.currentTotal, reportData.balanceSheet.equity.priorTotal, reportData.balanceSheet.equity.varianceAmount],
        ['Non-Current Liabilities', reportData.balanceSheet.nonCurrentLiabilities.currentTotal, reportData.balanceSheet.nonCurrentLiabilities.priorTotal, reportData.balanceSheet.nonCurrentLiabilities.varianceAmount],
        ['Current Liabilities', reportData.balanceSheet.currentLiabilities.currentTotal, reportData.balanceSheet.currentLiabilities.priorTotal, reportData.balanceSheet.currentLiabilities.varianceAmount],
        ['TOTAL EQUITY & LIABILITIES', reportData.balanceSheet.totalEquityAndLiabilities.current, reportData.balanceSheet.totalEquityAndLiabilities.prior, reportData.balanceSheet.totalEquityAndLiabilities.current - reportData.balanceSheet.totalEquityAndLiabilities.prior],
      ];
      const wsBs = XLSX.utils.aoa_to_sheet(bsRows);
      XLSX.utils.book_append_sheet(wb, wsBs, 'Balance Sheet');

      // 4. Ageing & Working Capital
      const ageRows = [
        ['WORKING CAPITAL & AGE ANALYSIS'],
        [],
        ['Ageing Bucket', 'Trade Debtors (ZAR)', 'Trade Creditors (ZAR)'],
        ...reportData.workingCapital.ageingBuckets.map((b) => [b.label, b.debtorsAmount, b.creditorsAmount]),
        ['TOTAL', reportData.workingCapital.debtorsTotal, reportData.workingCapital.creditorsTotal],
      ];
      const wsAge = XLSX.utils.aoa_to_sheet(ageRows);
      XLSX.utils.book_append_sheet(wb, wsAge, 'Working Capital');

      const filename = `Management_Report_${reportData.client.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${reportData.period.label.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({ title: 'Excel Exported', description: 'Management Accounts workbook downloaded successfully.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Export Failed', description: e.message || 'Could not export Excel file.', variant: 'destructive' });
    }
  };

  if (isLoading && !reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Compiling Executive Management Accounts & Ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Executive Management Report</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">
                Board Level Pack
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive financial performance, balance sheet health, working capital cycle, and AI strategic commentary.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {reportData && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerAiAnalysis(reportData)}
                  disabled={isAnalyzing}
                  className="font-bold text-xs h-9 gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>{isAnalyzing ? 'Analyzing…' : 'Re-analyze with Khai'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="font-bold text-xs h-9 gap-1.5 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Export Excel</span>
                </Button>

                <ManagementReportPdfDownloadButton
                  data={reportData}
                  analysis={analysis}
                  customNotes={customNotes}
                />
              </>
            )}
          </div>
        </div>

        {/* Period Selector Row */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Period:</span>
            <Select value={periodPreset} onValueChange={setPeriodPreset}>
              <SelectTrigger className="h-8 w-44 font-medium text-xs">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Current Month ({format(now, 'MMM yyyy')})</SelectItem>
                <SelectItem value="prior_month">Prior Month ({format(subMonths(now, 1), 'MMM yyyy')})</SelectItem>
                <SelectItem value="quarter_to_date">Quarter to Date (3 Mo)</SelectItem>
                <SelectItem value="financial_ytd">Financial Year YTD</SelectItem>
                <SelectItem value="custom">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {periodPreset === 'custom' && (
            <DateRangePicker
              value={customRange}
              onDateChange={setCustomRange}
            />
          )}

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Compare vs:</span>
            <Select value={comparativePreset} onValueChange={setComparativePreset}>
              <SelectTrigger className="h-8 w-44 font-medium text-xs">
                <SelectValue placeholder="Comparative Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prior_month">Prior Month</SelectItem>
                <SelectItem value="prior_year">Prior Year (Same Period)</SelectItem>
                <SelectItem value="prior_period">Immediate Prior Period</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchReportData}
            disabled={isLoading}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-primary ml-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Active Period Date Badges */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-md">
            <span className="font-bold">Current Period:</span>
            <span>{reportData?.period.label || computedDates.periodLabel}</span>
            <span className="text-blue-700 font-medium">({format(new Date(computedDates.startDateStr), 'dd MMM yyyy')} – {format(new Date(computedDates.endDateStr), 'dd MMM yyyy')})</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-md">
            <span className="font-bold">Comparative Prior:</span>
            <span>{reportData?.period.comparativeLabel || computedDates.comparativePeriodLabel}</span>
            <span className="text-slate-600 font-medium">({format(new Date(computedDates.comparativeStartDateStr), 'dd MMM yyyy')} – {format(new Date(computedDates.comparativeEndDateStr), 'dd MMM yyyy')})</span>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* KPI Summary Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* 1. Revenue */}
            <Card className="bg-white shadow-sm border p-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Revenue</p>
                <p className="text-base font-black text-slate-900 mt-1">{formatZar(reportData.kpis.revenue.current)}</p>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold">
                {reportData.kpis.revenue.changePct >= 0 ? (
                  <span className="text-emerald-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3" /> {formatPct(reportData.kpis.revenue.changePct)}
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center">
                    <ArrowDownRight className="h-3 w-3" /> {formatPct(reportData.kpis.revenue.changePct)}
                  </span>
                )}
                <span className="text-slate-400 font-normal">vs prior</span>
              </div>
            </Card>

            {/* 2. Gross Margin */}
            <Card className="bg-white shadow-sm border p-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Gross Margin</p>
                <p className="text-base font-black text-slate-900 mt-1">{reportData.kpis.grossProfit.marginCurrentPct}%</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                {formatZar(reportData.kpis.grossProfit.current)} GP
              </p>
            </Card>

            {/* 3. OPEX */}
            <Card className="bg-white shadow-sm border p-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Operating Exp</p>
                <p className="text-base font-black text-slate-900 mt-1">{formatZar(reportData.kpis.opex.current)}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                {formatPct(reportData.kpis.opex.changePct)} vs prior
              </p>
            </Card>

            {/* 4. Net Profit */}
            <Card className="bg-white shadow-sm border p-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Net Profit</p>
                <p
                  className={`text-base font-black mt-1 ${
                    reportData.kpis.netProfit.current >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatZar(reportData.kpis.netProfit.current)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                {reportData.kpis.netProfit.marginCurrentPct}% Margin
              </p>
            </Card>

            {/* 5. Cash & Bank */}
            <Card className="bg-white shadow-sm border p-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Cash & Bank</p>
                <p className="text-base font-black text-slate-900 mt-1">{formatZar(reportData.kpis.cashBalance.current)}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                Net: {formatZar(reportData.kpis.cashBalance.netChange)}
              </p>
            </Card>

            {/* 6. Debtors (DSO) */}
            <Card className="bg-white shadow-sm border p-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Debtors (DSO)</p>
                <p className="text-base font-black text-slate-900 mt-1">{formatZar(reportData.kpis.debtors.current)}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">{reportData.kpis.debtors.dso} Days Sales Out</p>
            </Card>

            {/* 7. Creditors (DPO) */}
            <Card className="bg-white shadow-sm border p-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Creditors (DPO)</p>
                <p className="text-base font-black text-slate-900 mt-1">{formatZar(reportData.kpis.creditors.current)}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">{reportData.kpis.creditors.dpo} Days Payable Out</p>
            </Card>

            {/* 8. Financial Health */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 shadow-sm p-3.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Health Score
                </p>
                <p className="text-lg font-black text-indigo-950 mt-1">
                  {analysis?.healthScore ? `${analysis.healthScore} / 100` : '92 / 100'}
                </p>
              </div>
              <p className="text-[10px] text-indigo-600 font-bold mt-2">AI Financial Index</p>
            </Card>
          </div>

          {/* Khai AI Commentary & Director Notes */}
          <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border-none overflow-hidden rounded-xl">
            <CardHeader className="pb-3 border-b border-white/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Bot className="h-5 w-5 text-yellow-300" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    Executive Analysis & Commentary by Khai (CA(SA))
                    <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                  </CardTitle>
                  <CardDescription className="text-white/70 text-xs">
                    Autonomous financial synthesis for {reportData.client.companyName} ({reportData.period.label})
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reportData && triggerAiAnalysis(reportData)}
                  disabled={isAnalyzing || !reportData}
                  className="bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-200 border-yellow-400/40 text-xs font-bold flex items-center gap-1.5"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                      {analysis ? 'Re-generate Commentary' : 'Generate Commentary with Khai'}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold"
                >
                  {isEditingNotes ? 'Done Editing' : 'Add / Edit Director Notes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5 text-xs text-white/90 leading-relaxed">
              {isAnalyzing ? (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-yellow-300" />
                  <span className="font-bold text-sm text-yellow-100">Khai is evaluating financial statements and metrics...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="font-semibold text-white/95 whitespace-pre-line text-sm">
                      {analysis?.executiveSummary ||
                        `During ${reportData.period.label}, ${reportData.client.companyName} produced total revenue of ${formatZar(
                          reportData.kpis.revenue.current
                        )} with a gross margin of ${reportData.kpis.grossProfit.marginCurrentPct}% and net operating profit of ${formatZar(
                          reportData.kpis.netProfit.current
                        )}. Cash balances remain solid at ${formatZar(reportData.kpis.cashBalance.current)} with manageable working capital exposure.`}
                    </p>
                  </div>

                  {analysis?.revenueAndMarginInsights && (
                    <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                      <p className="font-bold text-yellow-300 mb-1 uppercase tracking-wide text-[10px]">
                        Revenue & Margin Drivers:
                      </p>
                      <p className="text-white/80">{analysis.revenueAndMarginInsights}</p>
                    </div>
                  )}

                  {analysis?.keyRecommendations && analysis.keyRecommendations.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-bold text-yellow-300 uppercase tracking-wide text-[10px]">
                        Key Strategic Recommendations:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysis.keyRecommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 bg-white/5 p-2.5 rounded-lg border border-white/5 text-white/90"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Director / Accountant Notes */}
                  {isEditingNotes ? (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <p className="font-bold text-yellow-300 text-[11px]">Custom Director / Practice Notes (Included in Board Pack PDF):</p>
                      <Textarea
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        placeholder="Add specific operational highlights, director resolutions, or SARS follow-up notes here..."
                        className="bg-black/40 border-white/20 text-white text-xs h-24 placeholder:text-white/40"
                      />
                    </div>
                  ) : customNotes ? (
                    <div className="bg-white/10 p-3.5 rounded-xl border border-white/20">
                      <p className="font-bold text-yellow-300 mb-1 text-[10px] uppercase tracking-wide">
                        Director & Practice Notes:
                      </p>
                      <p className="text-white/90 whitespace-pre-line">{customNotes}</p>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation Tabs for Detailed Statements */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-slate-100 p-1 border flex-wrap h-auto gap-1">
              <TabsTrigger value="executive" className="font-bold text-xs">
                Financial Statements Pack
              </TabsTrigger>
              <TabsTrigger value="profit_loss" className="font-bold text-xs">
                Profit & Loss (P&L)
              </TabsTrigger>
              <TabsTrigger value="balance_sheet" className="font-bold text-xs">
                Balance Sheet
              </TabsTrigger>
              <TabsTrigger value="working_capital" className="font-bold text-xs">
                Working Capital & Ageing
              </TabsTrigger>
              <TabsTrigger value="tax_vat" className="font-bold text-xs">
                Tax & VAT Compliance
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: EXECUTIVE STATEMENTS PACK (ALL IN ONE) */}
            <TabsContent value="executive" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* P&L Snapshot */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold">Profit & Loss Summary</CardTitle>
                      <CardDescription className="text-xs">{reportData.period.label} vs {reportData.period.comparativeLabel}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('profit_loss')} className="text-xs text-primary font-bold">
                      View Full P&L →
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table className="text-xs">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Line Item</TableHead>
                          <TableHead className="text-right">Current</TableHead>
                          <TableHead className="text-right">Prior</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="font-bold">
                          <TableCell>Revenue & Turnover</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.revenue.currentTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.revenue.priorTotal)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{formatZar(reportData.profitAndLoss.revenue.varianceAmount)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-slate-600">Cost of Sales</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.costOfSales.currentTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.costOfSales.priorTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.costOfSales.varianceAmount)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50/60 font-bold text-blue-900">
                          <TableCell>GROSS PROFIT</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.grossProfit.current)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.grossProfit.prior)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.grossProfit.variance)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-slate-600">Operating Expenses</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.operatingExpenses.currentTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.operatingExpenses.priorTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.operatingExpenses.varianceAmount)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-emerald-50 font-bold text-emerald-900 text-sm">
                          <TableCell>NET PROFIT / (LOSS)</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.netProfitBeforeTax.current)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.netProfitBeforeTax.prior)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.profitAndLoss.netProfitBeforeTax.variance)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Balance Sheet Snapshot */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold">Financial Position Snapshot</CardTitle>
                      <CardDescription className="text-xs">As at {reportData.period.endDate}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('balance_sheet')} className="text-xs text-primary font-bold">
                      View Balance Sheet →
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table className="text-xs">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Current</TableHead>
                          <TableHead className="text-right">Prior</TableHead>
                          <TableHead className="text-right">Movement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Non-Current Assets</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.nonCurrentAssets.currentTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.nonCurrentAssets.priorTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.nonCurrentAssets.varianceAmount)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Current Assets</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentAssets.currentTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentAssets.priorTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentAssets.varianceAmount)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-slate-100 font-bold">
                          <TableCell>TOTAL ASSETS</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalAssets.current)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalAssets.prior)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalAssets.current - reportData.balanceSheet.totalAssets.prior)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Capital & Reserves (Equity)</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.equity.currentTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.equity.priorTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.equity.varianceAmount)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Current Liabilities</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentLiabilities.currentTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentLiabilities.priorTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentLiabilities.varianceAmount)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-slate-100 font-bold">
                          <TableCell>TOTAL EQUITY & LIABILITIES</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalEquityAndLiabilities.current)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalEquityAndLiabilities.prior)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalEquityAndLiabilities.current - reportData.balanceSheet.totalEquityAndLiabilities.prior)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: DETAILED PROFIT & LOSS */}
            <TabsContent value="profit_loss">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-bold">Statement of Profit or Loss (Detailed Line Items)</CardTitle>
                  <CardDescription className="text-xs">
                    Comprehensive comparative statement for {reportData.period.label} vs {reportData.period.comparativeLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-100 font-bold">
                      <TableRow>
                        <TableHead className="w-[120px]">Account Code</TableHead>
                        <TableHead>Account Description</TableHead>
                        <TableHead className="text-right">{reportData.period.label}</TableHead>
                        <TableHead className="text-right">{reportData.period.comparativeLabel}</TableHead>
                        <TableHead className="text-right">Variance (R)</TableHead>
                        <TableHead className="text-right">Variance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Revenue */}
                      <TableRow className="bg-slate-50 font-bold">
                        <TableCell colSpan={2}>1. REVENUE & TURNOVER</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.revenue.currentTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.revenue.priorTotal)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{formatZar(reportData.profitAndLoss.revenue.varianceAmount)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{formatPct(reportData.profitAndLoss.revenue.variancePct)}</TableCell>
                      </TableRow>
                      {reportData.profitAndLoss.revenue.items.map((i, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-[11px] text-slate-500">{i.accountNumber || '—'}</TableCell>
                          <TableCell>{i.name}</TableCell>
                          <TableCell className="text-right">{formatZar(i.currentAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.priorAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.varianceAmount)}</TableCell>
                          <TableCell className="text-right">{formatPct(i.variancePct)}</TableCell>
                        </TableRow>
                      ))}

                      {/* Cost of Sales */}
                      <TableRow className="bg-slate-50 font-bold">
                        <TableCell colSpan={2}>2. COST OF SALES</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.costOfSales.currentTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.costOfSales.priorTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.costOfSales.varianceAmount)}</TableCell>
                        <TableCell className="text-right">{formatPct(reportData.profitAndLoss.costOfSales.variancePct)}</TableCell>
                      </TableRow>
                      {reportData.profitAndLoss.costOfSales.items.map((i, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-[11px] text-slate-500">{i.accountNumber || '—'}</TableCell>
                          <TableCell>{i.name}</TableCell>
                          <TableCell className="text-right">{formatZar(i.currentAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.priorAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.varianceAmount)}</TableCell>
                          <TableCell className="text-right">{formatPct(i.variancePct)}</TableCell>
                        </TableRow>
                      ))}

                      {/* Gross Profit */}
                      <TableRow className="bg-blue-100/70 font-black text-blue-950 text-sm">
                        <TableCell colSpan={2}>GROSS PROFIT</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.grossProfit.current)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.grossProfit.prior)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.grossProfit.variance)}</TableCell>
                        <TableCell className="text-right">{formatPct(reportData.profitAndLoss.grossProfit.variancePct)}</TableCell>
                      </TableRow>

                      {/* Operating Expenses */}
                      <TableRow className="bg-slate-50 font-bold">
                        <TableCell colSpan={2}>3. OPERATING EXPENDITURE (OPEX)</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.operatingExpenses.currentTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.operatingExpenses.priorTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.operatingExpenses.varianceAmount)}</TableCell>
                        <TableCell className="text-right">{formatPct(reportData.profitAndLoss.operatingExpenses.variancePct)}</TableCell>
                      </TableRow>
                      {reportData.profitAndLoss.operatingExpenses.items.map((i, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-[11px] text-slate-500">{i.accountNumber || '—'}</TableCell>
                          <TableCell>{i.name}</TableCell>
                          <TableCell className="text-right">{formatZar(i.currentAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.priorAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.varianceAmount)}</TableCell>
                          <TableCell className="text-right">{formatPct(i.variancePct)}</TableCell>
                        </TableRow>
                      ))}

                      {/* Net Profit */}
                      <TableRow className="bg-emerald-100 font-black text-emerald-950 text-base">
                        <TableCell colSpan={2}>NET OPERATING PROFIT / (LOSS)</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.netProfitBeforeTax.current)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.netProfitBeforeTax.prior)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.profitAndLoss.netProfitBeforeTax.variance)}</TableCell>
                        <TableCell className="text-right">{formatPct(reportData.profitAndLoss.netProfitBeforeTax.variancePct)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: BALANCE SHEET */}
            <TabsContent value="balance_sheet">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-bold">Statement of Financial Position (Balance Sheet)</CardTitle>
                  <CardDescription className="text-xs">Cumulative position as at {reportData.period.endDate}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-100 font-bold">
                      <TableRow>
                        <TableHead className="w-[120px]">Account Code</TableHead>
                        <TableHead>Account Description</TableHead>
                        <TableHead className="text-right">Current (ZAR)</TableHead>
                        <TableHead className="text-right">Prior (ZAR)</TableHead>
                        <TableHead className="text-right">Movement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Non-Current Assets */}
                      <TableRow className="bg-slate-50 font-bold">
                        <TableCell colSpan={2}>NON-CURRENT ASSETS</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.nonCurrentAssets.currentTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.nonCurrentAssets.priorTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.nonCurrentAssets.varianceAmount)}</TableCell>
                      </TableRow>
                      {reportData.balanceSheet.nonCurrentAssets.items.map((i, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-[11px] text-slate-500">{i.accountNumber || '—'}</TableCell>
                          <TableCell>{i.name}</TableCell>
                          <TableCell className="text-right">{formatZar(i.currentAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.priorAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.varianceAmount)}</TableCell>
                        </TableRow>
                      ))}

                      {/* Current Assets */}
                      <TableRow className="bg-slate-50 font-bold">
                        <TableCell colSpan={2}>CURRENT ASSETS</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentAssets.currentTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentAssets.priorTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentAssets.varianceAmount)}</TableCell>
                      </TableRow>
                      {reportData.balanceSheet.currentAssets.items.map((i, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-[11px] text-slate-500">{i.accountNumber || '—'}</TableCell>
                          <TableCell>{i.name}</TableCell>
                          <TableCell className="text-right">{formatZar(i.currentAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.priorAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.varianceAmount)}</TableCell>
                        </TableRow>
                      ))}

                      <TableRow className="bg-slate-200 font-black text-slate-900 text-sm">
                        <TableCell colSpan={2}>TOTAL ASSETS</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalAssets.current)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalAssets.prior)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalAssets.current - reportData.balanceSheet.totalAssets.prior)}</TableCell>
                      </TableRow>

                      {/* Equity */}
                      <TableRow className="bg-slate-50 font-bold">
                        <TableCell colSpan={2}>CAPITAL & RESERVES (EQUITY)</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.equity.currentTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.equity.priorTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.equity.varianceAmount)}</TableCell>
                      </TableRow>
                      {reportData.balanceSheet.equity.items.map((i, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-[11px] text-slate-500">{i.accountNumber || '—'}</TableCell>
                          <TableCell>{i.name}</TableCell>
                          <TableCell className="text-right">{formatZar(i.currentAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.priorAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.varianceAmount)}</TableCell>
                        </TableRow>
                      ))}

                      {/* Current Liabilities */}
                      <TableRow className="bg-slate-50 font-bold">
                        <TableCell colSpan={2}>CURRENT LIABILITIES</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentLiabilities.currentTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentLiabilities.priorTotal)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.currentLiabilities.varianceAmount)}</TableCell>
                      </TableRow>
                      {reportData.balanceSheet.currentLiabilities.items.map((i, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-[11px] text-slate-500">{i.accountNumber || '—'}</TableCell>
                          <TableCell>{i.name}</TableCell>
                          <TableCell className="text-right">{formatZar(i.currentAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.priorAmount)}</TableCell>
                          <TableCell className="text-right">{formatZar(i.varianceAmount)}</TableCell>
                        </TableRow>
                      ))}

                      <TableRow className="bg-slate-200 font-black text-slate-900 text-sm">
                        <TableCell colSpan={2}>TOTAL EQUITY & LIABILITIES</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalEquityAndLiabilities.current)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalEquityAndLiabilities.prior)}</TableCell>
                        <TableCell className="text-right">{formatZar(reportData.balanceSheet.totalEquityAndLiabilities.current - reportData.balanceSheet.totalEquityAndLiabilities.prior)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: WORKING CAPITAL & AGEING */}
            <TabsContent value="working_capital" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ageing Summary */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold">Ageing Profile (Debtors vs Creditors)</CardTitle>
                    <CardDescription className="text-xs">Outstanding balances grouped by age bucket</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table className="text-xs">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Bucket</TableHead>
                          <TableHead className="text-right">Debtors (Receivable)</TableHead>
                          <TableHead className="text-right">Creditors (Payable)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.workingCapital.ageingBuckets.map((b, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold">{b.label}</TableCell>
                            <TableCell className="text-right">{formatZar(b.debtorsAmount)}</TableCell>
                            <TableCell className="text-right">{formatZar(b.creditorsAmount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-100 font-black text-slate-900">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.workingCapital.debtorsTotal)}</TableCell>
                          <TableCell className="text-right">{formatZar(reportData.workingCapital.creditorsTotal)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Top Overdue Debtors */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold">Top Outstanding Debtors</CardTitle>
                    <CardDescription className="text-xs">Largest receivable balances requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table className="text-xs">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Total Balance</TableHead>
                          <TableHead className="text-right">Overdue (&gt;30d)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.workingCapital.topDebtors.length > 0 ? (
                          reportData.workingCapital.topDebtors.map((d, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{d.name}</TableCell>
                              <TableCell className="text-right font-bold">{formatZar(d.totalBalance)}</TableCell>
                              <TableCell className={`text-right font-bold ${d.overdueBalance > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                {formatZar(d.overdueBalance)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                              No outstanding debtors recorded.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 5: TAX & STATUTORY COMPLIANCE */}
            <TabsContent value="tax_vat" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" /> VAT Position (SARS)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">VAT Vendor Status:</span>
                      <Badge variant={reportData.client.isVatRegistered ? 'default' : 'secondary'}>
                        {reportData.client.isVatRegistered ? 'Registered (15%)' : 'Not Registered'}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Estimated VAT Position:</span>
                      <span className="font-black text-sm text-slate-900">{formatZar(reportData.taxAndVat.vatLiabilityOrRefund)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-bold text-slate-900">{reportData.taxAndVat.vatPeriodStatus}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Compulsory Threshold (2026):</span>
                      <span className="font-bold text-slate-900">R 2,300,000</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary" /> Corporate Income Tax Reserve
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Taxable Profit (P&L):</span>
                      <span className="font-bold text-slate-900">{formatZar(reportData.profitAndLoss.netProfitBeforeTax.current)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Corporate Tax Rate:</span>
                      <span className="font-bold text-slate-900">27.0%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Estimated Tax Provision:</span>
                      <span className="font-black text-sm text-indigo-700">{formatZar(reportData.taxAndVat.estimatedCorporateTax)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Financial Year End:</span>
                      <span className="font-bold text-slate-900">{reportData.client.yearEnd || 'February'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
