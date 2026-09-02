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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  ShieldCheck,
  Building,
  UserCheck,
  Save,
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAnnualFinancialStatementsDataAction,
  saveAnnualFinancialStatementsConfigAction,
} from '@/app/actions/financial-statements-actions';
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
import { getDynamicNoteNumbers } from '@/lib/afs-pdf-generator';
import AnnualFinancialStatementsPdfDownloadButton from '@/components/pdf/AnnualFinancialStatementsPdfDownloadButton';
import * as XLSX from 'xlsx-js-style';

const formatRand = (amount: number) => {
  if (amount === 0) return 'R 0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
  return isNegative ? `-R ${formatted}` : `R ${formatted}`;
};

const cleanTitleText = (title: string) => title.replace(/^\d+(\.\d+)*\.\s*/, '').trim();

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
  const [responsibilitiesForm, setResponsibilitiesForm] = useState<AfsDirectorsResponsibilities | null>(null);
  const [directorsReportForm, setDirectorsReportForm] = useState<AfsDirectorsReportData | null>(null);
  const [accountingPoliciesForm, setAccountingPoliciesForm] = useState<AfsAccountingPoliciesData | null>(null);
  const [sectionTogglesForm, setSectionTogglesForm] = useState<AfsSectionToggles | null>(null);

  const fetchAfsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAnnualFinancialStatementsDataAction({ clientId });
      if (res.success && res.data) {
        setData(res.data);
        setGeneralInfoForm(res.data.generalInfo);
        setResponsibilitiesForm(res.data.directorsResponsibilities);
        setDirectorsReportForm(res.data.directorsReport);
        setAccountingPoliciesForm(res.data.accountingPolicies);
        setSectionTogglesForm(res.data.sectionToggles);
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
    if (!generalInfoForm || !responsibilitiesForm || !directorsReportForm || !accountingPoliciesForm || !sectionTogglesForm) return;
    setIsSaving(true);
    try {
      const payload = {
        ...generalInfoForm,
        responsibilitiesText: responsibilitiesForm.responsibilitiesText,
        approvalDate: responsibilitiesForm.approvalDate,
        signatoryName: responsibilitiesForm.signatoryName,
        signatoryTitle: responsibilitiesForm.signatoryTitle,
        incorporationText: directorsReportForm.incorporationText,
        natureOfBusinessReport: directorsReportForm.natureOfBusiness,
        reviewOfActivities: directorsReportForm.reviewOfActivities,
        shareCapitalDetails: directorsReportForm.shareCapitalDetails,
        eventsAfterReportingPeriod: directorsReportForm.eventsAfterReportingPeriod,
        goingConcernText: directorsReportForm.goingConcernText,
        auditorOrPractitionerContinuance: directorsReportForm.auditorOrPractitionerContinuance,
        accountingPolicies: accountingPoliciesForm,
        sectionToggles: sectionTogglesForm,
      };

      const res = await saveAnnualFinancialStatementsConfigAction({ clientId, config: payload });
      if (res.success) {
        toast({ title: 'Settings Saved', description: 'Statutory AFS details & dynamic numbering updated successfully.' });
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
        ['Figures in Rand', 'Notes', '2026'],
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
        ['Figures in Rand', 'Notes', '2026'],
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
        ['Figures in Rand', '2026'],
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

  if (!data || !generalInfoForm || !responsibilitiesForm || !directorsReportForm || !accountingPoliciesForm || !sectionTogglesForm) return null;

  // Dynamic note numbering based on active switches
  const dynamicNotes = getDynamicNoteNumbers(sectionTogglesForm);

  // Dynamic director report numbering
  let dirCounter = 1;
  const secIncorporation = sectionTogglesForm.showIncorporation ? dirCounter++ : null;
  const secNatureOfBusiness = sectionTogglesForm.showNatureOfBusiness ? dirCounter++ : null;
  const secReviewOfActivities = sectionTogglesForm.showReviewOfActivities ? dirCounter++ : null;
  const secShareCapital = sectionTogglesForm.showShareCapital ? dirCounter++ : null;
  const secDirectors = sectionTogglesForm.showDirectors ? dirCounter++ : null;
  const secEventsAfterReportingPeriod = sectionTogglesForm.showEventsAfterReportingPeriod ? dirCounter++ : null;
  const secGoingConcern = sectionTogglesForm.showGoingConcern ? dirCounter++ : null;
  const secAuditorContinuance = sectionTogglesForm.showAuditorContinuance ? dirCounter++ : null;

  // Dynamic policy numbering map
  let policyCounter = 1;
  const policyNumberMap = new Map<number, number | null>();
  accountingPoliciesForm.policies.forEach((p, idx) => {
    if (p.enabled) {
      policyNumberMap.set(idx, policyCounter++);
    } else {
      policyNumberMap.set(idx, null);
    }
  });

  // Sync state for live PDF rendering
  const liveAfsData: AnnualFinancialStatementsData = {
    ...data,
    generalInfo: generalInfoForm,
    directorsResponsibilities: responsibilitiesForm,
    directorsReport: {
      ...directorsReportForm,
      directors: generalInfoForm.directors,
    },
    accountingPolicies: accountingPoliciesForm,
    sectionToggles: sectionTogglesForm,
  };

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
              {generalInfoForm.companyName} • Registration: {generalInfoForm.registrationNumber} • Year ended {generalInfoForm.financialYearEndedDate}
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

            <Button
              variant="default"
              size="sm"
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="font-bold text-xs h-9 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>Save AFS Setup</span>
            </Button>

            <AnnualFinancialStatementsPdfDownloadButton data={liveAfsData} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border flex-wrap h-auto gap-1">
          <TabsTrigger value="general_info" className="font-bold text-xs">
            1. General Info & Assurance
          </TabsTrigger>
          <TabsTrigger value="responsibilities" className="font-bold text-xs">
            2. Director's Responsibilities & Approval
          </TabsTrigger>
          <TabsTrigger value="directors_report" className="font-bold text-xs">
            3. Director's Report
          </TabsTrigger>
          <TabsTrigger value="accounting_policies" className="font-bold text-xs">
            4. Accounting Policies
          </TabsTrigger>
          <TabsTrigger value="balance_sheet" className="font-bold text-xs">
            5. Statement of Financial Position
          </TabsTrigger>
          <TabsTrigger value="income_statement" className="font-bold text-xs">
            6. Comprehensive Income (P&L)
          </TabsTrigger>
          <TabsTrigger value="equity_cashflows" className="font-bold text-xs">
            7. Equity & Cash Flows
          </TabsTrigger>
          <TabsTrigger value="notes" className="font-bold text-xs">
            8. Notes & Disclosures
          </TabsTrigger>
          <TabsTrigger value="detailed_income" className="font-bold text-xs">
            9. Detailed Income Schedule
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL INFO & ASSURANCE */}
        <TabsContent value="general_info">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">General Information & Statutory Preamble</CardTitle>
                <CardDescription className="text-xs">
                  Configure company details, assurance level, practitioner details, issued date, and directors in office.
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
                  <Label className="font-bold">Holding Company (Optional)</Label>
                  <Input
                    value={generalInfoForm.holdingCompany || ''}
                    placeholder="None / Parent Company Name"
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
                        <SelectItem value="accounting_officer">Accounting Officer / Compilation Report</SelectItem>
                        <SelectItem value="audited">Audited (Registered Auditor)</SelectItem>
                        <SelectItem value="independent_review">Independent Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold">Practitioner Firm Name</Label>
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

                  <div className="space-y-1.5">
                    <Label className="font-bold">Practitioner Designation</Label>
                    <Input
                      value={generalInfoForm.auditorOrPractitionerTitle}
                      onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, auditorOrPractitionerTitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="font-bold">Practitioner Address</Label>
                    <Input
                      value={generalInfoForm.auditorOrPractitionerAddress}
                      onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, auditorOrPractitionerAddress: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" /> Issued Date (Date Selector)
                    </Label>
                    <Input
                      type="date"
                      value={generalInfoForm.issuedDate?.includes('-') && generalInfoForm.issuedDate.length === 10 ? generalInfoForm.issuedDate : '2026-08-19'}
                      onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, issuedDate: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Directors in Office */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" /> Directors in Office
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Manage active directors, office title, designation, nationality, and appointment date.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setGeneralInfoForm({
                        ...generalInfoForm,
                        directors: [
                          ...generalInfoForm.directors,
                          {
                            name: '',
                            office: 'Chief Executive Officer',
                            designation: 'Executive',
                            nationality: 'South African',
                            appointmentDate: new Date().toISOString().split('T')[0],
                            changes: 'Appointed',
                          },
                        ],
                      })
                    }
                    className="h-7 text-xs font-bold gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Director
                  </Button>
                </div>

                <div className="space-y-3">
                  {generalInfoForm.directors.map((d, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-lg border items-center">
                      <div className="sm:col-span-3">
                        <Label className="text-[10px] text-muted-foreground">Director Name</Label>
                        <Input
                          placeholder="Director Name"
                          value={d.name}
                          onChange={(e) => {
                            const updated = [...generalInfoForm.directors];
                            updated[idx].name = e.target.value;
                            setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                          }}
                          className="h-8 text-xs bg-white mt-1"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-[10px] text-muted-foreground">Office</Label>
                        <Input
                          placeholder="Office (e.g. Chief Executive Officer)"
                          value={d.office || ''}
                          onChange={(e) => {
                            const updated = [...generalInfoForm.directors];
                            updated[idx].office = e.target.value;
                            setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                          }}
                          className="h-8 text-xs bg-white mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Designation</Label>
                        <Select
                          value={d.designation || 'Executive'}
                          onValueChange={(val) => {
                            const updated = [...generalInfoForm.directors];
                            updated[idx].designation = val;
                            setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Executive">Executive</SelectItem>
                            <SelectItem value="Non-Executive">Non-Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Nationality</Label>
                        <Input
                          placeholder="Nationality"
                          value={d.nationality || 'South African'}
                          onChange={(e) => {
                            const updated = [...generalInfoForm.directors];
                            updated[idx].nationality = e.target.value;
                            setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                          }}
                          className="h-8 text-xs bg-white mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-1.5 mt-4 sm:mt-0">
                        <div className="flex-1">
                          <Label className="text-[10px] text-muted-foreground">Appointment Date</Label>
                          <Input
                            type="date"
                            value={d.appointmentDate || '2023-01-16'}
                            onChange={(e) => {
                              const updated = [...generalInfoForm.directors];
                              updated[idx].appointmentDate = e.target.value;
                              setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                            }}
                            className="h-8 text-xs bg-white mt-1"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = generalInfoForm.directors.filter((_, i) => i !== idx);
                            setGeneralInfoForm({ ...generalInfoForm, directors: updated });
                          }}
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 mt-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DIRECTOR'S RESPONSIBILITIES AND APPROVAL */}
        <TabsContent value="responsibilities">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Director's Responsibilities and Approval</CardTitle>
                <CardDescription className="text-xs">
                  Review and customize the statutory director responsibilities and approval declaration.
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveConfig} disabled={isSaving} className="gap-1.5 font-bold text-xs">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Declaration
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-5 text-xs">
              <div className="space-y-2">
                <Label className="font-bold text-slate-800">Responsibilities and Internal Financial Control Statement</Label>
                <Textarea
                  rows={14}
                  value={responsibilitiesForm.responsibilitiesText}
                  onChange={(e) => setResponsibilitiesForm({ ...responsibilitiesForm, responsibilitiesText: e.target.value })}
                  className="font-sans text-xs leading-relaxed p-4 bg-slate-50/50"
                />
              </div>

              <div className="pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" /> Approval Date (Date Selector)
                  </Label>
                  <Input
                    type="date"
                    value={responsibilitiesForm.approvalDate || '2026-08-19'}
                    onChange={(e) => setResponsibilitiesForm({ ...responsibilitiesForm, approvalDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold">Signatory Director</Label>
                  <Select
                    value={responsibilitiesForm.signatoryName || generalInfoForm.directors[0]?.name}
                    onValueChange={(val) => setResponsibilitiesForm({ ...responsibilitiesForm, signatoryName: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generalInfoForm.directors.map((d, i) => (
                        <SelectItem key={i} value={d.name || `Director ${i + 1}`}>
                          {d.name || `Director ${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold">Signatory Designation</Label>
                  <Input
                    value={responsibilitiesForm.signatoryTitle || 'Director'}
                    onChange={(e) => setResponsibilitiesForm({ ...responsibilitiesForm, signatoryTitle: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DIRECTOR'S REPORT */}
        <TabsContent value="directors_report">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Director's Report</CardTitle>
                <CardDescription className="text-xs">
                  Review and customize statutory report sections with automatic sequential numbering.
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveConfig} disabled={isSaving} className="gap-1.5 font-bold text-xs">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Report
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              {/* 1. Incorporation */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm">
                    {secIncorporation ? `${secIncorporation}. ` : ''}Incorporation
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showIncorporation ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showIncorporation}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showIncorporation: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showIncorporation && (
                  <Input
                    value={directorsReportForm.incorporationText}
                    onChange={(e) => setDirectorsReportForm({ ...directorsReportForm, incorporationText: e.target.value })}
                    className="bg-white text-xs mt-2"
                  />
                )}
              </div>

              {/* 2. Nature of business */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm">
                    {secNatureOfBusiness ? `${secNatureOfBusiness}. ` : ''}Nature of business
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNatureOfBusiness ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNatureOfBusiness}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNatureOfBusiness: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNatureOfBusiness && (
                  <Textarea
                    rows={3}
                    value={directorsReportForm.natureOfBusiness}
                    onChange={(e) => setDirectorsReportForm({ ...directorsReportForm, natureOfBusiness: e.target.value })}
                    className="bg-white text-xs mt-2"
                  />
                )}
              </div>

              {/* 3. Review of financial results and activities */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm">
                    {secReviewOfActivities ? `${secReviewOfActivities}. ` : ''}Review of financial results and activities
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showReviewOfActivities ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showReviewOfActivities}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showReviewOfActivities: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showReviewOfActivities && (
                  <Textarea
                    rows={4}
                    value={directorsReportForm.reviewOfActivities}
                    onChange={(e) => setDirectorsReportForm({ ...directorsReportForm, reviewOfActivities: e.target.value })}
                    className="bg-white text-xs mt-2"
                  />
                )}
              </div>

              {/* 4. Share capital */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm">
                    {secShareCapital ? `${secShareCapital}. ` : ''}Share capital
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showShareCapital ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showShareCapital}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showShareCapital: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showShareCapital && (
                  <Textarea
                    rows={3}
                    value={directorsReportForm.shareCapitalDetails}
                    onChange={(e) => setDirectorsReportForm({ ...directorsReportForm, shareCapitalDetails: e.target.value })}
                    className="bg-white text-xs mt-2"
                  />
                )}
              </div>

              {/* 5. Director in Office */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm">
                    {secDirectors ? `${secDirectors}. ` : ''}Director in Office Table
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showDirectors ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showDirectors}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showDirectors: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showDirectors && (
                  <div className="bg-white p-3 rounded-lg border mt-2">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Director</TableHead>
                          <TableHead>Office</TableHead>
                          <TableHead>Designation</TableHead>
                          <TableHead>Nationality</TableHead>
                          <TableHead>Appointment Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generalInfoForm.directors.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-bold">{d.name}</TableCell>
                            <TableCell>{d.office || 'Chief Executive Officer'}</TableCell>
                            <TableCell>{d.designation || 'Executive'}</TableCell>
                            <TableCell>{d.nationality || 'South African'}</TableCell>
                            <TableCell className="font-mono">{d.appointmentDate || '2023-01-16'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* 6. Events after the reporting period */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm">
                    {secEventsAfterReportingPeriod ? `${secEventsAfterReportingPeriod}. ` : ''}Events after the reporting period
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showEventsAfterReportingPeriod ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showEventsAfterReportingPeriod}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showEventsAfterReportingPeriod: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showEventsAfterReportingPeriod && (
                  <Input
                    value={directorsReportForm.eventsAfterReportingPeriod}
                    onChange={(e) => setDirectorsReportForm({ ...directorsReportForm, eventsAfterReportingPeriod: e.target.value })}
                    className="bg-white text-xs mt-2"
                  />
                )}
              </div>

              {/* 7. Going concern */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm">
                    {secGoingConcern ? `${secGoingConcern}. ` : ''}Going concern statement
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showGoingConcern ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showGoingConcern}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showGoingConcern: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showGoingConcern && (
                  <Textarea
                    rows={3}
                    value={directorsReportForm.goingConcernText}
                    onChange={(e) => setDirectorsReportForm({ ...directorsReportForm, goingConcernText: e.target.value })}
                    className="bg-white text-xs mt-2"
                  />
                )}
              </div>

              {/* 8. Accounting Officer / Auditor Continuance */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900 text-sm">
                    {secAuditorContinuance ? `${secAuditorContinuance}. ` : ''}Accounting Officer Continuance
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showAuditorContinuance ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showAuditorContinuance}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showAuditorContinuance: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showAuditorContinuance && (
                  <Input
                    value={directorsReportForm.auditorOrPractitionerContinuance}
                    onChange={(e) => setDirectorsReportForm({ ...directorsReportForm, auditorOrPractitionerContinuance: e.target.value })}
                    className="bg-white text-xs mt-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: ACCOUNTING POLICIES */}
        <TabsContent value="accounting_policies">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" /> Material Accounting Policies (IFRS for SMEs®)
                </CardTitle>
                <CardDescription className="text-xs">
                  Policies are automatically re-numbered sequentially when items are enabled or disabled.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newPolicy: AfsAccountingPolicyItem = {
                      id: `custom_${Date.now()}`,
                      title: 'Custom Accounting Policy',
                      content: 'Description of the accounting policy.',
                      enabled: true,
                    };
                    setAccountingPoliciesForm({
                      ...accountingPoliciesForm,
                      policies: [...accountingPoliciesForm.policies, newPolicy],
                    });
                  }}
                  className="h-8 text-xs font-bold gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Policy
                </Button>
                <Button size="sm" onClick={handleSaveConfig} disabled={isSaving} className="gap-1.5 font-bold text-xs h-8">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Policies
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              {accountingPoliciesForm.policies.map((policy, idx) => {
                const dynamicNum = policyNumberMap.get(idx);
                const cleanTitle = cleanTitleText(policy.title);

                return (
                  <div
                    key={policy.id || idx}
                    className={`p-4 rounded-lg border transition-all ${
                      policy.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/70 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b mb-3">
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        {policy.enabled && dynamicNum ? (
                          <span className="font-bold text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            {dynamicNum}.
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground bg-slate-100">
                            Disabled
                          </Badge>
                        )}
                        <Input
                          value={cleanTitle}
                          onChange={(e) => {
                            const updated = [...accountingPoliciesForm.policies];
                            updated[idx].title = e.target.value;
                            setAccountingPoliciesForm({ ...accountingPoliciesForm, policies: updated });
                          }}
                          className="font-bold text-xs h-8 bg-transparent flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">{policy.enabled ? 'Enabled' : 'Disabled'}</span>
                          <Switch
                            checked={policy.enabled}
                            onCheckedChange={(checked) => {
                              const updated = [...accountingPoliciesForm.policies];
                              updated[idx].enabled = checked;
                              setAccountingPoliciesForm({ ...accountingPoliciesForm, policies: updated });
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = accountingPoliciesForm.policies.filter((_, i) => i !== idx);
                            setAccountingPoliciesForm({ ...accountingPoliciesForm, policies: updated });
                          }}
                          className="h-7 w-7 text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {policy.enabled && (
                      <div className="space-y-2">
                        {policy.subTitle !== undefined && (
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Sub-heading</Label>
                            <Input
                              value={policy.subTitle || ''}
                              placeholder="Optional sub-heading"
                              onChange={(e) => {
                                const updated = [...accountingPoliciesForm.policies];
                                updated[idx].subTitle = e.target.value;
                                setAccountingPoliciesForm({ ...accountingPoliciesForm, policies: updated });
                              }}
                              className="h-7 text-xs bg-slate-50 mt-0.5"
                            />
                          </div>
                        )}
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Policy Text</Label>
                          <Textarea
                            rows={3}
                            value={policy.content}
                            onChange={(e) => {
                              const updated = [...accountingPoliciesForm.policies];
                              updated[idx].content = e.target.value;
                              setAccountingPoliciesForm({ ...accountingPoliciesForm, policies: updated });
                            }}
                            className="text-xs leading-relaxed mt-0.5 bg-slate-50/50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: STATEMENT OF FINANCIAL POSITION */}
        <TabsContent value="balance_sheet">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Statement of Financial Position as at {generalInfoForm.financialYearEndedDate}</CardTitle>
              <CardDescription className="text-xs">
                Official statutory balance sheet with dynamic note cross-references.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 font-bold">
                  <TableRow>
                    <TableHead>Figures in Rand</TableHead>
                    <TableHead className="w-[100px] text-center">Notes</TableHead>
                    <TableHead className="w-[160px] text-right">2026</TableHead>
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
                      <TableCell className="text-center font-bold text-blue-600">{dynamicNotes.noteCash || ''}</TableCell>
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
                  <TableRow>
                    <TableCell className="pl-10">Share capital</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">{dynamicNotes.noteShareCapital || ''}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatRand(data.statementOfFinancialPosition.equity.items[0]?.currentAmount || 100)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-10">Accumulated loss</TableCell>
                    <TableCell className="text-center font-bold text-blue-600"></TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatRand(data.statementOfFinancialPosition.equity.items[1]?.currentAmount || -510104)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold text-slate-800">
                    <TableCell className="pl-6"></TableCell>
                    <TableCell className="text-center"></TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatRand(data.statementOfFinancialPosition.equity.total.current)}</TableCell>
                  </TableRow>

                  <TableRow className="font-semibold text-slate-700">
                    <TableCell colSpan={3} className="pl-6">Current Liabilities</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-10">Loans from shareholder</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">{dynamicNotes.noteShareholderLoans || ''}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatRand(data.statementOfFinancialPosition.currentLiabilities.items[0]?.currentAmount || 619901)}</TableCell>
                  </TableRow>
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

        {/* TAB 6: STATEMENT OF COMPREHENSIVE INCOME */}
        <TabsContent value="income_statement">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Statement of Profit or Loss and Other Comprehensive Income</CardTitle>
              <CardDescription className="text-xs">
                For the year ended {generalInfoForm.financialYearEndedDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 font-bold">
                  <TableRow>
                    <TableHead>Figures in Rand</TableHead>
                    <TableHead className="w-[100px] text-center">Note(s)</TableHead>
                    <TableHead className="w-[160px] text-right">2026</TableHead>
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
                    <TableCell className="text-center font-bold text-blue-600">{dynamicNotes.noteOperatingExpenses || ''}</TableCell>
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
                    <TableCell className="text-center font-bold text-blue-600">{dynamicNotes.noteTaxation || ''}</TableCell>
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

        {/* TAB 7: EQUITY & CASH FLOWS */}
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
                      <TableCell>Balance at {generalInfoForm.financialYearEndedDate}</TableCell>
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
                      <TableHead className="text-right">2026</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Cash used in operations</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{dynamicNotes.noteCashUsedInOps || ''}</TableCell>
                      <TableCell className="text-right font-mono">{formatRand(data.statementOfCashFlows.cashUsedInOperations.current)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Proceeds on share issue</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{dynamicNotes.noteShareCapital || ''}</TableCell>
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
                      <TableCell className="text-center font-bold text-blue-600">{dynamicNotes.noteCash || ''}</TableCell>
                      <TableCell className="text-right font-mono font-black text-blue-700">{formatRand(data.statementOfCashFlows.totalCashAtEndOfTheYear.current)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 8: STATUTORY NOTES & DISCLOSURES */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Notes to the Financial Statements</CardTitle>
                <CardDescription className="text-xs">
                  Statutory notes are dynamically numbered based on active items.
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveConfig} disabled={isSaving} className="gap-1.5 font-bold text-xs">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Notes
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-5 text-xs">
              {/* Note Cash */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {dynamicNotes.noteCash ? `Note ${dynamicNotes.noteCash}. ` : ''}Cash and cash equivalents
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteCash ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteCash}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteCash: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteCash && (
                  <p className="text-slate-600">Bank balances: <span className="font-mono font-bold text-slate-900">{formatRand(data.notes.note2CashAndCashEquivalents.total.current)}</span></p>
                )}
              </div>

              {/* Note Share Capital */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {dynamicNotes.noteShareCapital ? `Note ${dynamicNotes.noteShareCapital}. ` : ''}Share capital
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteShareCapital ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteShareCapital}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteShareCapital: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteShareCapital && (
                  <div>
                    <p className="text-slate-600">Authorised: <span className="font-bold text-slate-900">{data.notes.note3ShareCapital.authorisedShares}</span></p>
                    <p className="text-slate-600">Issued: <span className="font-bold text-slate-900">{data.notes.note3ShareCapital.issuedShares} ({formatRand(data.notes.note3ShareCapital.issuedAmount.current)})</span></p>
                  </div>
                )}
              </div>

              {/* Note Shareholder Loans */}
              <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-950 text-sm">
                    {dynamicNotes.noteShareholderLoans ? `Note ${dynamicNotes.noteShareholderLoans}. ` : ''}Loans from shareholders & Subordination Terms
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteShareholderLoans ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteShareholderLoans}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteShareholderLoans: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteShareholderLoans && (
                  <div>
                    <p className="text-slate-700 font-bold">{data.notes.note4LoansFromShareholders.loans[0]?.name}: <span className="font-mono">{formatRand(data.notes.note4LoansFromShareholders.total.current)}</span></p>
                    <p className="text-slate-600 leading-relaxed italic mt-1">{data.notes.note4LoansFromShareholders.loans[0]?.terms}</p>
                  </div>
                )}
              </div>

              {/* Note Operating Expenses */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {dynamicNotes.noteOperatingExpenses ? `Note ${dynamicNotes.noteOperatingExpenses}. ` : ''}Operating expenses breakdown
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteOperatingExpenses ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteOperatingExpenses}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteOperatingExpenses: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteOperatingExpenses && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {data.notes.note5OperatingExpenses.remunerationOtherThanEmployees.map((item, i) => (
                      <div key={i} className="flex justify-between py-1 border-b">
                        <span>{item.name}:</span>
                        <span className="font-mono font-bold">{formatRand(item.current)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Note Cash in Ops */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {dynamicNotes.noteCashUsedInOps ? `Note ${dynamicNotes.noteCashUsedInOps}. ` : ''}Cash used in operations reconciliation
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteCashUsedInOps ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteCashUsedInOps}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteCashUsedInOps: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteCashUsedInOps && (
                  <p className="text-slate-600">Net loss before tax: <span className="font-mono font-bold text-slate-900">{formatRand(data.notes.note6CashUsedInOperations.total.current)}</span></p>
                )}
              </div>

              {/* Note Taxation */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {dynamicNotes.noteTaxation ? `Note ${dynamicNotes.noteTaxation}. ` : ''}Taxation & 27% Rate Reconciliation
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteTaxation ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteTaxation}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteTaxation: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteTaxation && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
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
                )}
              </div>

              {/* Note Related Parties */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {dynamicNotes.noteRelatedParties ? `Note ${dynamicNotes.noteRelatedParties}. ` : ''}Related parties
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteRelatedParties ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteRelatedParties}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteRelatedParties: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteRelatedParties && (
                  <p className="text-slate-600">Directors & Shareholder balances: <span className="font-bold text-slate-900">{generalInfoForm.directors.map(d => d.name).join(', ')}</span></p>
                )}
              </div>

              {/* Note Going Concern */}
              <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-950 text-sm">
                    {dynamicNotes.noteGoingConcern ? `Note ${dynamicNotes.noteGoingConcern}. ` : ''}Going Concern Disclosures
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteGoingConcern ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteGoingConcern}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteGoingConcern: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteGoingConcern && (
                  <p className="text-amber-900 leading-relaxed">{data.notes.note9GoingConcern.subordinationNoteText}</p>
                )}
              </div>

              {/* Note Events after Reporting Period */}
              <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {dynamicNotes.noteEventsAfterReportingPeriod ? `Note ${dynamicNotes.noteEventsAfterReportingPeriod}. ` : ''}Events after the reporting period
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showNoteEventsAfterReportingPeriod ? 'Included' : 'Excluded'}</span>
                    <Switch
                      checked={sectionTogglesForm.showNoteEventsAfterReportingPeriod}
                      onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showNoteEventsAfterReportingPeriod: checked })}
                    />
                  </div>
                </div>
                {sectionTogglesForm.showNoteEventsAfterReportingPeriod && (
                  <p className="text-slate-600">{data.notes.note10EventsAfterReportingPeriod.statementText}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 9: DETAILED INCOME STATEMENT SCHEDULE */}
        <TabsContent value="detailed_income">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Detailed Income Statement (Unaudited Supplementary Schedule)</CardTitle>
                <CardDescription className="text-xs">
                  Comprehensive nominal ledger schedule of operating expenses and other income accounts.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-[11px] text-muted-foreground">{sectionTogglesForm.showDetailedIncomeStatement ? 'Included in PDF' : 'Excluded from PDF'}</span>
                  <Switch
                    checked={sectionTogglesForm.showDetailedIncomeStatement}
                    onCheckedChange={(checked) => setSectionTogglesForm({ ...sectionTogglesForm, showDetailedIncomeStatement: checked })}
                  />
                </div>
                <Button size="sm" onClick={handleSaveConfig} disabled={isSaving} className="gap-1.5 font-bold text-xs h-8">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Setup
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 font-bold">
                  <TableRow>
                    <TableHead>Account Description</TableHead>
                    <TableHead className="w-[160px] text-right">2026 (ZAR)</TableHead>
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
