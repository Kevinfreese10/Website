import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BarChart3, Calculator, TrendingUp, ShieldCheck, CheckCircle2, FileText, ArrowRight, HelpCircle, Briefcase, Activity, Clock, Scale } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Management Accounts & Financial Reports | My Accountant',
        description: 'Professional monthly and quarterly management accounts for South African businesses. IFRS for SMEs reporting, 13-week cash flow forecasts, and budget variance analysis.',
    };
    return getStaticPageMetadata('management-accounts', defaults);
}

const mgmtFaqs = [
  {
    q: 'How do monthly management accounts differ from statutory annual financial statements (AFS)?',
    a: 'Annual Financial Statements (AFS) are backward-looking statutory compliance documents compiled once a year for SARS, CIPC, and financial institutions under Companies Act regulations. Management accounts, by contrast, are forward-looking decision-making tools prepared monthly or quarterly. They provide granular divisional profitability, operational margins, working capital metrics (DSO, DPO), budget variances, and rolling cash flow projections, enabling business leaders to make timely strategic adjustments rather than waiting months after year-end.'
  },
  {
    q: 'What is the significance of the Companies Act Section 4 Solvency and Liquidity Test?',
    a: 'Under Section 4 of the Companies Act 71 of 2008, a South African company satisfies the solvency and liquidity test only if: (1) the fairly valued assets of the company equal or exceed its fairly valued liabilities (solvency), and (2) it appears that the company will be able to pay its debts as they become due in the ordinary course of business for a period of 12 months (liquidity). Monthly management accounts provide directors with the requisite financial evidence to legally authorize dividends, share repurchases, and director loans under Sections 45 and 46.'
  },
  {
    q: 'Why is a 13-week rolling cash flow forecast essential for growing businesses?',
    a: 'Profit on an income statement does not equate to cash in the bank. Fast-growing SMEs frequently face cash crunches due to delayed customer payments or capital tied up in inventory. A 13-week rolling cash flow forecast models granular operational cash inflows and mandatory outflows (salaries, supplier terms, SARS EMP201 and VAT201 payments) week by week, giving management 90 days of forward visibility to arrange credit lines or adjust terms before liquidity shortages arise.'
  },
  {
    q: 'What working capital efficiency metrics are included in your management pack?',
    a: 'Our management reporting packs analyze your complete Cash Conversion Cycle (CCC = DIO + DSO - DPO). We track Days Sales Outstanding (DSO) to measure how quickly customers settle invoices, Days Inventory Outstanding (DIO) to evaluate inventory turnover and avoid dead stock, and Days Payable Outstanding (DPO) to optimize supplier credit terms. Tracking these metrics reveals precisely how much operational capital is trapped in your business cycle.'
  },
  {
    q: 'What is your turnaround time for delivering monthly management packs?',
    a: 'Our standard Service Level Agreement (SLA) delivers the completed monthly management pack by the 10th or 15th calendar day following month-end close. This turnaround requires that all source documents, supplier invoices, and bank feeds are locked by the 3rd business day of the new month, allowing our chartered accountants to reconcile ledgers, post accruals, and compile variance reports swiftly.'
  }
];

const mgmtSchema = generateServicePillarSchema({
  title: 'Management Accounts & Financial Reporting South Africa',
  description: 'Strategic monthly management accounting, IFRS for SMEs reporting, P&L, balance sheet reviews, 13-week cash flow forecasting, and KPI dashboards for SMEs.',
  slug: '/management-accounts',
  serviceType: 'AccountingService',
  priceRange: 'From R1,850/quarter',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Accounting Services', url: '/products#accounting' },
    { name: 'Management Accounts', url: '/management-accounts' },
  ],
  faqs: mgmtFaqs
});

export default function ManagementAccountsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mgmtSchema) }}
      />
      <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
        {/* HERO SECTION - Typo fixed (no #) */}
        <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
          <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container relative z-10 mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
              <Briefcase className="h-4 w-4" /> IFRS for SMEs & Executive Financial Insights
            </div>
            <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center text-hero-gradient pb-2">
              <span className="text-gradient">Management Accounts & Financial Reporting</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Decisions are only as good as the numbers behind them. We deliver monthly management packs, 13-week cash flow forecasts, working capital metrics, and variance analysis prepared under IFRS for SMEs.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Book a Financial Review</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="#pricing">Compare Reporting Packages</Link>
              </Button>
            </div>
          </div>
        </section>

        <TrustIndexWidget />

        {/* SECTION 1: STATUTORY & GOVERNANCE FRAMEWORK */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Statutory Governance: IFRS for SMEs & Companies Act Compliance
            </h2>
            <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-base leading-relaxed">
              High-level management accounts bridge the gap between day-to-day transaction processing and statutory corporate governance under South African company law.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">IFRS for SMEs Section 3 Standards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  We compile our management packs in strict alignment with Section 3 of the <em>International Financial Reporting Standard for Small and Medium-sized Entities (IFRS for SMEs)</em>:
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border space-y-2">
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong className="text-foreground">Accrual Basis Accounting:</strong> Recognizing revenue and expenses in the periods in which they occur, not merely when cash changes hands.</li>
                    <li><strong className="text-foreground">Going Concern Assumption:</strong> Formal monthly validation that the business possesses adequate resources to continue operations for at least 12 months.</li>
                    <li><strong className="text-foreground">Consistency & Comparability:</strong> Uniform application of accounting policies to ensure month-on-month and year-on-year trends reflect true performance.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Companies Act 71 of 2008 Mandates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  South African company law establishes strict personal liabilities for directors who fail to maintain continuous financial oversight:
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border space-y-2">
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong className="text-foreground">Section 4 Solvency & Liquidity:</strong> Directors must prove fairly valued assets exceed liabilities and the company can pay debts for 12 months prior to declaring dividends or loans.</li>
                    <li><strong className="text-foreground">Section 22 Reckless Trading:</strong> Operating a business in insolvent circumstances exposes directors to personal liability for company debts.</li>
                    <li><strong className="text-foreground">Sections 45 & 46 Corporate Governance:</strong> Mandatory board resolutions backed by management accounting tests for all director loans and distributions.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 2: 4-PART MANAGEMENT PACK DELIVERABLES */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">The Comprehensive 4-Part Management Accounts Pack</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              A complete executive reporting suite delivered every month to provide actionable clarity into every facet of your financial engine.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Statement of Comprehensive Income (P&L)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Granular analysis of revenue streams, direct cost of sales, gross profit margins, fixed versus variable operating overheads, EBITDA, and net operating margin trends.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Statement of Financial Position (Balance Sheet)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Complete view of current vs non-current assets, fixed asset depreciation registers, trade debtor and creditor aging balances, and statutory solvency ratios.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">13-Week Rolling Cash Flow Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dynamic forward-looking liquidity model forecasting operational inflows, payroll runs, supplier commitments, and SARS tax payments 90 days in advance.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Budget vs Actuals Variance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Detailed monthly variance reporting identifying favourable and adverse discrepancies with root-cause analysis on all operational variances exceeding 5%.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 3: WORKING CAPITAL & KPI METRICS */}
        <section className="bg-slate-50 dark:bg-slate-900/40 py-16 border-y">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">Working Capital Optimization & Performance Metrics</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
                How we diagnose liquidity bottlenecks and measure operational cash efficiency.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border bg-background shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary">DSO</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Days Sales Outstanding</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs text-foreground">
                  (Accounts Receivable / Total Credit Sales) × 365
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Measures the average number of days it takes for your company to collect cash from customers after a credit sale is completed.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-background shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary">DPO</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Days Payable Outstanding</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs text-foreground">
                  (Accounts Payable / Cost of Sales) × 365
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tracks the average number of days your business takes to pay trade suppliers, optimizing working capital liquidity without damaging trade credit terms.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-background shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary">DIO</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Days Inventory Outstanding</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs text-foreground">
                  (Ending Inventory / Cost of Sales) × 365
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quantifies how many days stock remains in your warehouse before being sold, highlighting slow-moving inventory and carrying cost waste.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-background shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary">CCC</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Cash Conversion Cycle</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs text-foreground">
                  DIO + DSO − DPO (Net Working Capital Days)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Calculates the net elapsed days required to convert operational investments in inventory and resources into cash inflows from customer sales.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: STEP-BY-STEP PROCESS */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Our Monthly Reporting Process & SLAs</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              A structured 5-stage monthly rhythm delivering finished executive packs by the 10th of every month.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="flex flex-col items-center text-center p-4 bg-card rounded-xl border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                01
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">Month-End Ledger Close</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By the 3rd business day, bank feeds are reconciled, supplier invoices matched, and month-end journal accruals and prepayments posted.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-card rounded-xl border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                02
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">IFRS Standardization</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our accountants verify revenue recognition, depreciation schedules, and Section 4 solvency criteria under Section 3 of IFRS for SMEs.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-card rounded-xl border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                03
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">Variance & Ratio Modeling</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated computation of P&L variances against operating budgets, gross margin trend lines, and working capital cycle metrics.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-card rounded-xl border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                04
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">Executive Pack Compilation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generation of high-impact visual PDF and cloud dashboard packs featuring executive summaries, KPI scorecards, and cash runways.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-card rounded-xl border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                05
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">Board Consultation Review</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A dedicated 60-minute virtual consultation with your senior accountant or CFO to review strategic insights, risks, and growth opportunities.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: TRANSPARENT PRICING */}
        <section id="pricing" className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Transparent Management Accounts Packages</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              Predictable retainers designed to scale from lean startups to mid-market enterprises.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Quarterly SME Review</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R1,850</span>
                  <span className="text-sm font-medium text-muted-foreground">/per quarter</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Essential quarterly financial review for lean startups and micro-enterprises.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Quarterly Profit and Loss statement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Quarterly Balance Sheet review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Debtor and creditor aging analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Provisional tax health check</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Turnaround SLA: 15 days following quarter-end</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6 font-bold" variant="outline">
                  <Link href="/contact">Select Package</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card h-full flex flex-col justify-between border-primary ring-1 ring-primary shadow-lg">
              <CardHeader>
                <span className="inline-block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Most Popular
                </span>
                <CardTitle className="text-xl font-bold">Monthly Management Pack</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R2,500</span>
                  <span className="text-sm font-medium text-muted-foreground">/per month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Comprehensive monthly reporting pack for growing small-to-medium businesses.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Monthly P&L with gross margin analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Monthly Balance Sheet and working capital review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>13-week rolling cash flow forecast model</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Budget vs Actuals variance report (5% highlights)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Cash Conversion Cycle (DSO, DPO, DIO) tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Turnaround SLA: Delivered by 10th of each month</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6 font-bold" variant="default">
                  <Link href="/contact">Select Package</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Executive CFO Advisory</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R5,500</span>
                  <span className="text-sm font-medium text-muted-foreground">/per month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Advanced financial management and executive leadership for scaling enterprises.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Complete 4-Part monthly management pack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Custom interactive executive KPI dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Divisional and cost-center profitability modeling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>60-minute monthly board-level review consultation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Companies Act Section 4 solvency & liquidity certifications</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6 font-bold" variant="outline">
                  <Link href="/contact">Select Package</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 6: STRUCTURED FAQS ACCORDION */}
        <section className="container mx-auto px-4 max-w-4xl py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              <HelpCircle className="h-8 w-8 text-primary" /> Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground mt-2">
              Common questions regarding monthly management reporting, cash forecasting, and governance in South Africa.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="faq-0" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                How do monthly management accounts differ from statutory annual financial statements (AFS)?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Annual Financial Statements (AFS) are backward-looking statutory compliance documents compiled once a year for SARS, CIPC, and financial institutions under Companies Act regulations. Management accounts, by contrast, are forward-looking decision-making tools prepared monthly or quarterly. They provide granular divisional profitability, operational margins, working capital metrics (DSO, DPO), budget variances, and rolling cash flow projections, enabling business leaders to make timely strategic adjustments rather than waiting months after year-end.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-1" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What is the significance of the Companies Act Section 4 Solvency and Liquidity Test?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Under Section 4 of the Companies Act 71 of 2008, a South African company satisfies the solvency and liquidity test only if: (1) the fairly valued assets of the company equal or exceed its fairly valued liabilities (solvency), and (2) it appears that the company will be able to pay its debts as they become due in the ordinary course of business for a period of 12 months (liquidity). Monthly management accounts provide directors with the requisite financial evidence to legally authorize dividends, share repurchases, and director loans under Sections 45 and 46.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                Why is a 13-week rolling cash flow forecast essential for growing businesses?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Profit on an income statement does not equate to cash in the bank. Fast-growing SMEs frequently face cash crunches due to delayed customer payments or capital tied up in inventory. A 13-week rolling cash flow forecast models granular operational cash inflows and mandatory outflows (salaries, supplier terms, SARS EMP201 and VAT201 payments) week by week, giving management 90 days of forward visibility to arrange credit lines or adjust terms before liquidity shortages arise.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What working capital efficiency metrics are included in your management pack?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Our management reporting packs analyze your complete Cash Conversion Cycle (CCC = DIO + DSO - DPO). We track Days Sales Outstanding (DSO) to measure how quickly customers settle invoices, Days Inventory Outstanding (DIO) to evaluate inventory turnover and avoid dead stock, and Days Payable Outstanding (DPO) to optimize supplier credit terms. Tracking these metrics reveals precisely how much operational capital is trapped in your business cycle.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What is your turnaround time for delivering monthly management packs?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Our standard Service Level Agreement (SLA) delivers the completed monthly management pack by the 10th or 15th calendar day following month-end close. This turnaround requires that all source documents, supplier invoices, and bank feeds are locked by the 3rd business day of the new month, allowing our chartered accountants to reconcile ledgers, post accruals, and compile variance reports swiftly.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* SECTION 7: CLOSING CONVERSION BANNER */}
        <section className="container mx-auto px-4 text-center py-12">
          <div className="max-w-3xl mx-auto p-12 rounded-2xl glass-card border shadow-lg space-y-6">
            <h2 className="text-3xl font-black text-foreground">Gain Total Clarity Over Your Financial Trajectory</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Stop guessing your cash runway. Partner with experienced chartered accountants who transform raw bank transactions into strategic operational leadership.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Schedule a Financial Review</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="/monthly-accounting">View Full Accounting Retainers</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
