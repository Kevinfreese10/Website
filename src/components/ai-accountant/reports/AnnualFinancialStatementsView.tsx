'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  Building,
  ShieldCheck,
  Landmark,
  UserCheck,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAnnualFinancialStatementsDataAction,
  saveAnnualFinancialStatementsConfigAction,
} from '@/app/actions/financial-statements-actions';
import type { AnnualFinancialStatementsData, AfsGeneralInfo, AfsDirector } from '@/lib/afs-types';
import AnnualFinancialStatementsPdfDownloadButton from '@/components/pdf/AnnualFinancialStatementsPdfDownloadButton';
import * as XLSX from 'xlsx-js-style';

const formatRand = (amount: number) => {
  if (amount === 0) return 'R 0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
  return isNegative ? `-R ${formatted}` : `R ${formatted}`;
};

interface AnnualFinancialStatementsViewProps {
  clientId: string;
}

export default function AnnualFinancialStatementsView({ clientId }: AnnualFinancialStatementsViewProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<AnnualFinancialStatementsData | null>(null);
  const [activeTab, setActiveTab] = useState('general_info');

  // Custom configuration state
  const [generalInfoForm, setGeneralInfoForm] = useState<AfsGeneralInfo | null>(null);

  const fetchAfsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAnnualFinancialStatementsDataAction({ clientId });
      if (res.success && res.data) {
        setData(res.data);
        setGeneralInfoForm(res.data.generalInfo);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to compile AFS data', variant: 'destructive' });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to compile AFS data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    fetchAfsData();
  }, [fetchAfsData]);

  const handleSaveConfig = async () => {
    if (!generalInfoForm) return;
    setIsSaving(true);
    try {
      const res = await saveAnnualFinancialStatementsConfigAction({ clientId, config: generalInfoForm });
      if (res.success) {
        toast({ title: 'Settings Saved', description: 'Statutory AFS details updated successfully.' });
        fetchAfsData();
      } else {
        toast({ title: 'Save Failed', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Save Failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    try {
      const wb = XLSX.utils.book_new();

      // 1. Balance Sheet Sheet
      const bsRows = [
        [data.generalInfo.companyName.toUpperCase()],
        [`Registration number: ${data.generalInfo.registrationNumber}`],
        [`Statement of Financial Position as at ${data.generalInfo.financialYearEndedDate}`],
        [],
        ['Figures in Rand', 'Notes', '2025'],
        ['Assets'],
        ['Current Assets'],
        ...data.statementOfFinancialPosition.currentAssets.items.map((i) => [i.name, i.noteNumber || '', i.currentAmount]),
        ['Total Assets', '', data.statementOfFinancialPosition.totalAssets.current],
        [],
        ['Equity and Liabilities'],
        ['Equity'],
        ...data.statementOfFinancialPosition.equity.items.map((i) => [i.name, i.noteNumber || '', i.currentAmount]),
        ['Total Equity', '', data.statementOfFinancialPosition.equity.total.current],
        [],
        ['Current Liabilities'],
        ...data.statementOfFinancialPosition.currentLiabilities.items.map((i) => [i.name, i.noteNumber || '', i.currentAmount]),
        ['Total Liabilities', '', data.statementOfFinancialPosition.totalLiabilities.current],
        ['Total Equity and Liabilities', '', data.statementOfFinancialPosition.totalEquityAndLiabilities.current],
      ];
      const wsBs = XLSX.utils.aoa_to_sheet(bsRows);
      XLSX.utils.book_append_sheet(wb, wsBs, 'Balance Sheet');

      // 2. Comprehensive Income Sheet
      const pnlRows = [
        [data.generalInfo.companyName.toUpperCase()],
        [`Registration number: ${data.generalInfo.registrationNumber}`],
        [`Statement of Profit or Loss and Other Comprehensive Income for the year ended ${data.generalInfo.financialYearEndedDate}`],
        [],
        ['Figures in Rand', 'Notes', '2025'],
        ['Other income', '', data.statementOfComprehensiveIncome.otherIncome.currentAmount],
        ['Operating expenses', '5', data.statementOfComprehensiveIncome.operatingExpenses.currentAmount],
        ['Operating loss', '', data.statementOfComprehensiveIncome.operatingProfitOrLoss.currentAmount],
        ['Loss before income tax', '', data.statementOfComprehensiveIncome.profitOrLossBeforeTax.currentAmount],
        ['Income tax', '7', '-'],
        ['Loss for the year', '', data.statementOfComprehensiveIncome.profitOrLossForTheYear.currentAmount],
        ['Total comprehensive loss for the year', '', data.statementOfComprehensiveIncome.totalComprehensiveLossOrIncome.currentAmount],
      ];
      const wsPnl = XLSX.utils.aoa_to_sheet(pnlRows);
      XLSX.utils.book_append_sheet(wb, wsPnl, 'Comprehensive Income');

      // 3. Detailed Income Statement
      const detRows = [
        [data.generalInfo.companyName.toUpperCase()],
        ['Detailed Income Statement (Unaudited Supplementary Schedule)'],
        [],
        ['Figures in Rand', '2025'],
        ['Other income'],
        ...data.detailedIncomeStatement.otherIncomeItems.map((i) => [i.name, i.current]),
        ['Total Other Income', data.detailedIncomeStatement.totalOtherIncome.current],
        [],
        ['Operating expenses'],
        ...data.detailedIncomeStatement.operatingExpenseItems.map((i) => [i.name, -i.current]),
        ['Total Operating Expenses', -data.detailedIncomeStatement.totalOperatingExpenses.current],
        ['Loss for the year', data.detailedIncomeStatement.lossOrProfitForTheYear.current],
      ];
      const wsDet = XLSX.utils.aoa_to_sheet(detRows);
      XLSX.utils.book_append_sheet(wb, wsDet, 'Detailed Income Statement');

      const filename = `${data.generalInfo.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Financial_Statements_${data.generalInfo.financialYearEndedDate.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({ title: 'Excel Exported', description: 'Financial Statements workbook downloaded.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Export Failed', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Compiling 16-Page Statutory Annual Financial Statements (IFRS for SMEs)...</p>
      </div>
    );
  }

  if (!data || !generalInfoForm) return null;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Controls */}
      <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Annual Financial Statements (AFS)</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">
                IFRS for SMEs®
              </Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                Companies Act Compliant
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.generalInfo.companyName} • Registration: {data.generalInfo.registrationNumber} • Year ended {data.generalInfo.financialYearEndedDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="font-bold text-xs h-9 gap-1.5 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export AFS Excel</span>
            </Button>

            <AnnualFinancialStatementsPdfDownloadButton data={data} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border flex-wrap h-auto gap-1">
          <TabsTrigger value="general_info" className="font-bold text-xs">
            1. General Info & Assurance
          </TabsTrigger>
          <TabsTrigger value="balance_sheet" className="font-bold text-xs">
            2. Statement of Financial Position
          </TabsTrigger>
          <TabsTrigger value="income_statement" className="font-bold text-xs">
            3. Comprehensive Income (P&L)
          </TabsTrigger>
          <TabsTrigger value="equity_cashflows" className="font-bold text-xs">
            4. Equity & Cash Flows
          </TabsTrigger>
          <TabsTrigger value="notes" className="font-bold text-xs">
            5. Notes & Disclosures (Notes 2-10)
          </TabsTrigger>
          <TabsTrigger value="detailed_income" className="font-bold text-xs">
            6. Detailed Income Schedule
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL INFO & ASSURANCE */}
        <TabsContent value="general_info">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">General Information & Statutory Preamble</CardTitle>
                <CardDescription className="text-xs">
                  Configure company details, assurance level, auditor/practitioner details, and directors in office.
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveConfig} disabled={isSaving} className="gap-1.5 font-bold text-xs">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold">Company Name</Label>
                  <Input
                    value={generalInfoForm.companyName}
                    onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold">Registration Number</Label>
                  <Input
                    value={generalInfoForm.registrationNumber}
                    onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, registrationNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold">Nature of Business</Label>
                  <Input
                    value={generalInfoForm.natureOfBusiness}
                    onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, natureOfBusiness: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold">Holding Company</Label>
                  <Input
                    value={generalInfoForm.holdingCompany || ''}
                    onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, holdingCompany: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="font-bold">Registered Office & Business Address</Label>
                  <Input
                    value={generalInfoForm.registeredOffice}
                    onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, registeredOffice: e.target.value, businessAddress: e.target.value })}
                  />
                </div>
              </div>

              {/* Assurance & Practitioner Setup */}
              <div className="pt-4 border-t space-y-4">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" /> Assurance Level & Practitioner / Auditor Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold">Assurance Level</Label>
                    <Select
                      value={generalInfoForm.assuranceLevel}
                      onValueChange={(val: any) => setGeneralInfoForm({ ...generalInfoForm, assuranceLevel: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="audited">Audited (Registered Auditor)</SelectItem>
                        <SelectItem value="accounting_officer">Accounting Officer / Compilation Report</SelectItem>
                        <SelectItem value="independent_review">Independent Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold">Auditor / Practitioner Firm Name</Label>
                    <Input
                      value={generalInfoForm.auditorOrPractitionerFirm}
                      onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, auditorOrPractitionerFirm: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold">Lead Partner / Signatory</Label>
                    <Input
                      value={generalInfoForm.leadPartnerName || ''}
                      onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, leadPartnerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="font-bold">Auditor / Practitioner Address</Label>
                    <Input
                      value={generalInfoForm.auditorOrPractitionerAddress}
                      onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, auditorOrPractitionerAddress: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold">Issued Date</Label>
                    <Input
                      value={generalInfoForm.issuedDate}
                      onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, issuedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Directors in Office */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-600" /> Directors in Office
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setGeneralInfoForm({
                        ...generalInfoForm,
                        directors: [...generalInfoForm.directors, { name: '', designation: 'Executive Director', changes: 'In office' }],
                      })
                    }
                    className="h-7 text-xs font-bold gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Director
                  </Button>
                </div>

                <div className="space-y-2">
                  {generalInfoForm.directors.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border">
                      <Input
                        placeholder="Director Name"
                        value={d.name}
                        onChange={(e) => {
                          const updated = [...generalInfoForm.directors];
                          updated[idx].name = e.target.value;
                          setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                        }}
                        className="h-8 text-xs bg-white"
                      />
                      <Input
                        placeholder="Designation (e.g. Executive Director)"
                        value={d.designation}
                        onChange={(e) => {
                          const updated = [...generalInfoForm.directors];
                          updated[idx].designation = e.target.value;
                          setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                        }}
                        className="h-8 text-xs bg-white"
                      />
                      <Input
                        placeholder="Changes (e.g. Appointed 25 July 2024)"
                        value={d.changes || ''}
                        onChange={(e) => {
                          const updated = [...generalInfoForm.directors];
                          updated[idx].changes = e.target.value;
                          setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                        }}
                        className="h-8 text-xs bg-white"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = generalInfoForm.directors.filter((_, i) => i !== idx);
                          setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                        }}
                        className="h-8 w-8 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: STATEMENT OF FINANCIAL POSITION */}
        <TabsContent value="balance_sheet">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Statement of Financial Position as at {data.generalInfo.financialYearEndedDate}</CardTitle>
              <CardDescription className="text-xs">
                Official statutory balance sheet with Note cross-references.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 font-bold">
                  <TableRow>
                    <TableHead>Figures in Rand</TableHead>
                    <TableHead className="w-[100px] text-center">Notes</TableHead>
                    <TableHead className="w-[160px] text-right">2025</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-bold bg-slate-50/50">
                    <TableCell colSpan={3}>Assets</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold text-slate-700">
                    <TableCell colSpan={3} className="pl-6">Current Assets</TableCell>
                  </TableRow>
                  {data.statementOfFinancialPosition.currentAssets.items.map((i, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-10">{i.name}</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{i.noteNumber}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatRand(i.currentAmount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-slate-100 border-t">
                    <TableCell className="pl-6">Total Assets</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-black text-sm">{formatRand(data.statementOfFinancialPosition.totalAssets.current)}</TableCell>
                  </TableRow>

                  <TableRow className="font-bold bg-slate-50/50 pt-4">
                    <TableCell colSpan={3}>Equity and Liabilities</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold text-slate-700">
                    <TableCell colSpan={3} className="pl-6">Equity</TableCell>
                  </TableRow>
                  {data.statementOfFinancialPosition.equity.items.map((i, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-10">{i.name}</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{i.noteNumber || ''}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatRand(i.currentAmount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold text-slate-800">
                    <TableCell className="pl-6"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatRand(data.statementOfFinancialPosition.equity.total.current)}</TableCell>
                  </TableRow>

                  <TableRow className="font-semibold text-slate-700">
                    <TableCell colSpan={3} className="pl-6">Current Liabilities</TableCell>
                  </TableRow>
                  {data.statementOfFinancialPosition.currentLiabilities.items.map((i, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-10">{i.name}</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{i.noteNumber || ''}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatRand(i.currentAmount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-slate-50 border-t">
                    <TableCell className="pl-6">Total Liabilities</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatRand(data.statementOfFinancialPosition.totalLiabilities.current)}</TableCell>
                  </TableRow>

                  <TableRow className="font-bold bg-slate-200 border-t-2 border-b-2 text-sm">
                    <TableCell className="pl-6">Total Equity and Liabilities</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-black">{formatRand(data.statementOfFinancialPosition.totalEquityAndLiabilities.current)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: STATEMENT OF COMPREHENSIVE INCOME */}
        <TabsContent value="income_statement">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Statement of Profit or Loss and Other Comprehensive Income</CardTitle>
              <CardDescription className="text-xs">
                For the year ended {data.generalInfo.financialYearEndedDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 font-bold">
                  <TableRow>
                    <TableHead>Figures in Rand</TableHead>
                    <TableHead className="w-[100px] text-center">Note(s)</TableHead>
                    <TableHead className="w-[160px] text-right">2025</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Other income</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono">{formatRand(data.statementOfComprehensiveIncome.otherIncome.currentAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Operating expenses</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">5</TableCell>
                    <TableCell className="text-right font-mono">{formatRand(data.statementOfComprehensiveIncome.operatingExpenses.currentAmount)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-slate-50">
                    <TableCell>Operating loss</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-bold text-rose-700">{formatRand(data.statementOfComprehensiveIncome.operatingProfitOrLoss.currentAmount)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-slate-50">
                    <TableCell>Loss before income tax</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-bold text-rose-700">{formatRand(data.statementOfComprehensiveIncome.profitOrLossBeforeTax.currentAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Income tax</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">7</TableCell>
                    <TableCell className="text-right font-mono">-</TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-slate-100 text-sm">
                    <TableCell>Loss for the year</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-black text-rose-800">{formatRand(data.statementOfComprehensiveIncome.profitOrLossForTheYear.currentAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Other comprehensive loss</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono">-</TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-slate-200 border-t-2 border-b-2 text-sm">
                    <TableCell>Total comprehensive loss for the year</TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-black text-rose-900">{formatRand(data.statementOfComprehensiveIncome.totalComprehensiveLossOrIncome.currentAmount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: EQUITY & CASH FLOWS */}
        <TabsContent value="equity_cashflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold">Statement of Changes in Equity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-50 font-bold">
                    <TableRow>
                      <TableHead>Figures in Rand</TableHead>
                      <TableHead className="text-right">Share capital</TableHead>
                      <TableHead className="text-right">Accumulated loss</TableHead>
                      <TableHead className="text-right">Total equity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Loss for the year</TableCell>
                      <TableCell className="text-right font-mono">-</TableCell>
                      <TableCell className="text-right font-mono">{formatRand(data.statementOfChangesInEquity.accumulatedLoss.lossForTheYear)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-rose-700">{formatRand(data.statementOfChangesInEquity.accumulatedLoss.lossForTheYear)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Issue of Shares</TableCell>
                      <TableCell className="text-right font-mono">{formatRand(data.statementOfChangesInEquity.shareCapital.change)}</TableCell>
                      <TableCell className="text-right font-mono">-</TableCell>
                      <TableCell className="text-right font-mono font-bold">{formatRand(data.statementOfChangesInEquity.shareCapital.change)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-slate-100 border-t-2">
                      <TableCell>Balance at {data.generalInfo.financialYearEndedDate}</TableCell>
                      <TableCell className="text-right font-mono">{formatRand(data.statementOfChangesInEquity.shareCapital.current)}</TableCell>
                      <TableCell className="text-right font-mono">{formatRand(data.statementOfChangesInEquity.accumulatedLoss.current)}</TableCell>
                      <TableCell className="text-right font-mono font-black">{formatRand(data.statementOfChangesInEquity.totalEquity.current)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold">Statement of Cash Flows</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-50 font-bold">
                    <TableRow>
                      <TableHead>Figures in Rand</TableHead>
                      <TableHead className="w-[80px] text-center">Notes</TableHead>
                      <TableHead className="text-right">2025</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Cash used in operations</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">6</TableCell>
                      <TableCell className="text-right font-mono">{formatRand(data.statementOfCashFlows.cashUsedInOperations.current)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Proceeds on share issue</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">3</TableCell>
                      <TableCell className="text-right font-mono">{formatRand(data.statementOfCashFlows.proceedsOnShareIssue.current)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cash advances on loans from shareholders</TableCell>
                      <TableCell className="text-center"></TableCell>
                      <TableCell className="text-right font-mono">{formatRand(data.statementOfCashFlows.cashAdvancesReceivedOnLoansFromShareholders.current)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-slate-50">
                      <TableCell>Net cash from financing activities</TableCell>
                      <TableCell className="text-center"></TableCell>
                      <TableCell className="text-right font-mono font-bold">{formatRand(data.statementOfCashFlows.netCashFromFinancingActivities.current)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-slate-100 border-t-2">
                      <TableCell>Total cash movement for the year</TableCell>
                      <TableCell className="text-center"></TableCell>
                      <TableCell className="text-right font-mono font-black">{formatRand(data.statementOfCashFlows.totalCashMovementForTheYear.current)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold">
                      <TableCell>Total cash at end of the year</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">2</TableCell>
                      <TableCell className="text-right font-mono font-black text-blue-700">{formatRand(data.statementOfCashFlows.totalCashAtEndOfTheYear.current)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: STATUTORY NOTES & DISCLOSURES */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Notes to the Financial Statements (Notes 2 to 10)</CardTitle>
              <CardDescription className="text-xs">
                Statutory disclosures, share capital, shareholder loan terms & subordination, tax reconciliation (27%), and going concern.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              {/* Note 2 */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border">
                <h4 className="font-bold text-slate-900 text-sm">Note 2. Cash and cash equivalents</h4>
                <p className="text-slate-600">Bank balances: <span className="font-mono font-bold text-slate-900">{formatRand(data.notes.note2CashAndCashEquivalents.total.current)}</span></p>
              </div>

              {/* Note 3 */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border">
                <h4 className="font-bold text-slate-900 text-sm">Note 3. Share capital</h4>
                <p className="text-slate-600">Authorised: <span className="font-bold text-slate-900">{data.notes.note3ShareCapital.authorisedShares}</span></p>
                <p className="text-slate-600">Issued: <span className="font-bold text-slate-900">{data.notes.note3ShareCapital.issuedShares} ({formatRand(data.notes.note3ShareCapital.issuedAmount.current)})</span></p>
              </div>

              {/* Note 4 */}
              <div className="space-y-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-950 text-sm">Note 4. Loans from shareholders & Subordination Terms</h4>
                <p className="text-slate-700 font-bold">{data.notes.note4LoansFromShareholders.loans[0]?.name}: <span className="font-mono">{formatRand(data.notes.note4LoansFromShareholders.total.current)}</span></p>
                <p className="text-slate-600 leading-relaxed italic">{data.notes.note4LoansFromShareholders.loans[0]?.terms}</p>
              </div>

              {/* Note 5 */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border">
                <h4 className="font-bold text-slate-900 text-sm">Note 5. Operating expenses breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {data.notes.note5OperatingExpenses.remunerationOtherThanEmployees.map((item, i) => (
                    <div key={i} className="flex justify-between py-1 border-b">
                      <span>{item.name}:</span>
                      <span className="font-mono font-bold">{formatRand(item.current)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note 7 */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border">
                <h4 className="font-bold text-slate-900 text-sm">Note 7. Taxation & 27% Rate Reconciliation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span>Accounting loss:</span>
                    <span className="font-mono">{formatRand(data.notes.note7Taxation.accountingLoss.current)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Tax at 27%:</span>
                    <span className="font-mono">{formatRand(data.notes.note7Taxation.taxAtApplicableRate27.current)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Loss carried forward:</span>
                    <span className="font-mono">{formatRand(data.notes.note7Taxation.lossCarriedForward.current)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Tax expense:</span>
                    <span className="font-mono font-bold">R 0 (Nil)</span>
                  </div>
                </div>
              </div>

              {/* Note 9 */}
              <div className="space-y-2 p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-950 text-sm">Note 9. Going Concern & Solvency Evaluation</h4>
                <p className="text-amber-900 leading-relaxed">{data.notes.note9GoingConcern.subordinationNoteText}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: DETAILED INCOME STATEMENT SCHEDULE */}
        <TabsContent value="detailed_income">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Detailed Income Statement (Unaudited Supplementary Schedule)</CardTitle>
              <CardDescription className="text-xs">
                Comprehensive nominal ledger schedule of operating expenses and other income accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 font-bold">
                  <TableRow>
                    <TableHead>Account Description</TableHead>
                    <TableHead className="w-[160px] text-right">2025 (ZAR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-bold bg-slate-50/50">
                    <TableCell colSpan={2}>Other income</TableCell>
                  </TableRow>
                  {data.detailedIncomeStatement.otherIncomeItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6">{item.name}</TableCell>
                      <TableCell className="text-right font-mono">{formatRand(item.current)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-slate-100">
                    <TableCell>Total Other Income</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatRand(data.detailedIncomeStatement.totalOtherIncome.current)}</TableCell>
                  </TableRow>

                  <TableRow className="font-bold bg-slate-50/50 pt-3">
                    <TableCell colSpan={2}>Operating expenses</TableCell>
                  </TableRow>
                  {data.detailedIncomeStatement.operatingExpenseItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6">{item.name}</TableCell>
                      <TableCell className="text-right font-mono text-rose-700">({formatRand(item.current)})</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-slate-100">
                    <TableCell>Total Operating Expenses</TableCell>
                    <TableCell className="text-right font-mono font-bold text-rose-800">({formatRand(data.detailedIncomeStatement.totalOperatingExpenses.current)})</TableCell>
                  </TableRow>

                  <TableRow className="font-bold bg-rose-100 text-sm border-t-2 border-b-2">
                    <TableCell>Loss for the year</TableCell>
                    <TableCell className="text-right font-mono font-black text-rose-950">{formatRand(data.detailedIncomeStatement.lossOrProfitForTheYear.current)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
