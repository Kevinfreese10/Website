import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Users, Receipt, Clock, ShieldCheck, CheckCircle2, AlertTriangle, FileText, ArrowRight, HelpCircle, Briefcase, CalendarCheck, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Payroll Administration & EMP201/EMP501 Filing South Africa',
        description: 'End-to-end payroll administration for South African businesses. BCEA compliance, encrypted payslips, EMP201 submissions, and bi-annual EMP501 reconciliations.',
    };
    return getStaticPageMetadata('payroll-administration', defaults);
}

const payrollFaqs = [
  {
    q: 'What statutory information must be included on an employee payslip under the BCEA?',
    a: 'Under Section 33 of the Basic Conditions of Employment Act 75 of 1997 (BCEA), an employer is legally required to deliver a written or secure digital payslip on or before payday. The payslip must explicitly detail: the employer registered name and physical or postal address; the employee name and occupation; the period for which payment is made; the employee gross remuneration; the calculation of any variable overtime or allowances; itemized statutory deductions (PAYE, UIF) and voluntary deductions; and the final net remuneration paid.'
  },
  {
    q: 'When are the mandatory deadlines for bi-annual EMP501 reconciliations?',
    a: 'SARS mandates two statutory EMP501 reconciliation filing periods annually. The Interim Reconciliation covers the first six months of the tax year (1 March to 31 August) and must be submitted between 1 September and 31 October. The Annual Reconciliation covers the full 12-month tax year (1 March to 28/29 February) and must be lodged between 1 April and 31 May. During the annual recon, final employee tax certificates (IRP5/IT3(a)) are generated, validated, and issued to staff.'
  },
  {
    q: 'How does South African labour law govern overtime calculation and maximum working hours?',
    a: 'The BCEA limits ordinary working hours to a maximum of 45 hours per week (9 hours per day for a 5-day week, or 8 hours per day for workweeks exceeding 5 days). Overtime is capped at a strict maximum of 10 hours per week and must be agreed upon by contract. Normal overtime must be remunerated at 1.5 times the employee normal hourly wage. Work performed on Sundays or statutory public holidays must be paid at double (2.0x) the ordinary rate, unless Sunday is a normal scheduled rostered workday, in which case 1.5x applies.'
  },
  {
    q: 'What are Seventh Schedule fringe benefits and how do they affect employee payroll?',
    a: 'Under the Seventh Schedule to the Income Tax Act 58 of 1962, non-cash benefits provided by employers—such as company cars, employer-paid medical scheme contributions, employer retirement fund contributions, low-interest staff loans, and residential accommodation—constitute taxable fringe benefits. The cash equivalent value of these perks must be calculated each month and added to the employee gross remuneration to determine the correct PAYE deduction.'
  },
  {
    q: 'How do you handle staff leave balances and leave liability provisions in financial reports?',
    a: 'We track every day and hour of annual, sick, family responsibility, and parental leave in our automated payroll system. Under Section 20 of the BCEA, employees accumulate at least 21 consecutive days of paid annual leave per cycle. Because untaken annual leave represents an accrued legal liability that must be paid out upon termination, our monthly payroll pack provides a detailed Leave Liability Valuation Report for your general ledger balance sheet.'
  }
];

const payrollSchema = generateServicePillarSchema({
  title: 'Payroll Administration & EMP201/EMP501 Filing South Africa',
  description: 'Outsourced payroll administration, digital payslips, BCEA compliance, EMP201 declarations, and EMP501 tax reconciliations for South African companies.',
  slug: '/payroll-administration',
  serviceType: 'AccountingService',
  priceRange: 'From R650/month',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Payroll Services', url: '/payroll-services' },
    { name: 'Payroll Administration', url: '/payroll-administration' },
  ],
  faqs: payrollFaqs
});

export default function PayrollAdministrationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(payrollSchema) }}
      />
      <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
        {/* HERO SECTION - Typo eliminated (no #) */}
        <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
          <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container relative z-10 mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
              <Briefcase className="h-4 w-4" /> South African Labour & Employer Payroll
            </div>
            <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center text-hero-gradient pb-2">
              <span className="text-gradient">Payroll Administration &amp; EMP201/EMP501 Filing South Africa</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Accurate, on-time, and strictly compliant. We remove the administrative complexity of paying your team, managing BCEA leave rules, SARS EMP201 submissions, and bi-annual EMP501 tax reconciliations.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Enquire About Payroll</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="#pricing">View Pricing Tiers</Link>
              </Button>
            </div>
          </div>
        </section>

        <TrustIndexWidget />

        {/* SECTION 1: BCEA STATUTORY COMPLIANCE */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              BCEA Statutory Compliance: Working Hours, Overtime & Leave Rules
            </h2>
            <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-base leading-relaxed">
              The Basic Conditions of Employment Act 75 of 1997 sets non-negotiable minimum statutory standards for employer-employee relationships. Failing to calculate or document these correctly exposes employers to CCMA disputes and Department of Labour audits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-2">
                  BCEA Sections 9 & 10
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Ordinary Hours & Overtime Caps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Maximum ordinary working week is 45 hours (9 hours per day for a 5-day week, or 8 hours per day for more than 5 days). Overtime is capped at 10 hours per week and compensated at 1.5x normal rate on workdays and 2.0x on Sundays and public holidays.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-2">
                  BCEA Sections 20 & 22
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Annual & Sick Leave Entitlements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Employees are entitled to 21 consecutive days of paid annual leave per year (or 1 day per 17 days worked). Paid sick leave equals the number of days an employee would ordinarily work in a 6-week period over every 36-month cycle.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-2">
                  BCEA Sections 27 & Labour Laws Amendment
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Family & Parental Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Full-time employees receive 3 days of paid family responsibility leave annually for the birth or illness of a child, or the death of an immediate family member. In addition, 10 consecutive days of unpaid parental leave are claimable directly via the UIF.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-2">
                  BCEA Section 33 Mandatory Disclosures
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Section 33 Payslip Disclosures</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every employee must receive an itemized payslip on or before payday showing employer details, employee name, pay period, gross remuneration, overtime calculations, statutory tax deductions, and final net remuneration.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 2: BI-ANNUAL EMP501 & IRP5 RECONCILIATIONS */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="p-8 md:p-10 rounded-2xl border bg-card shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Bi-Annual EMP501 Reconciliations & IRP5 Generation
              </h2>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Employer tax compliance extends far beyond monthly EMP201 payments. Under the Tax Administration Act and Fourth Schedule to the Income Tax Act, South African employers must execute two bi-annual EMP501 reconciliations each tax year, balancing monthly payments against total employee tax certificates:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border space-y-2">
                <div className="font-bold text-foreground text-base">Interim EMP501 Filing (1 Sep to 31 Oct)</div>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Reconciles monthly EMP201 declarations and payments made to SARS for the first 6 months (March to August). Identifies any calculation variances, unallocated payments, or payroll errors before year-end.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border space-y-2">
                <div className="font-bold text-foreground text-base">Annual EMP501 Filing (1 Apr to 31 May)</div>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Finalizes the entire 12-month tax year (March to February). Generates, validates, and distributes statutory IRP5/IT3(a) tax certificates to staff so they can submit their personal ITR12 tax returns.
                </p>
              </div>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-muted-foreground">
                <strong className="text-foreground">Section 212 Non-Compliance Penalty:</strong> Failing to submit an EMP501 reconciliation on time triggers an immediate administrative penalty of up to 10% of the employer total annual PAYE liability.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: CORE DELIVERABLES */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Comprehensive Payroll Deliverables</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              Everything your business needs to guarantee seamless, stress-free monthly pay runs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Encrypted Digital Payslips</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automated monthly or bi-weekly digital payslips delivered directly to employee emails with AES password encryption and complete Section 33 BCEA disclosures.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">BCEA Statutory Leave Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Accurate tracking of statutory annual leave (21 days), sick leave (30-day 3-year cycle), family responsibility leave (3 days), and parental leave with accrued liability reporting.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Monthly EMP201 Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Precise monthly calculations and eFiling submission of PAYE, UIF, and SDL, generating Payment Reference Numbers (PRNs) before the statutory 7th-of-the-month cutoff.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Bi-Annual EMP501 Reconciliations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  End-to-end management of the Interim and Annual SARS EMP501 recons via e@syFile, resolving electronic validation warnings and generating validated IRP5/IT3(a) certificates.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Net Pay Bank ACB Export Files</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Standardized automated bank upload files (ACB / CSV) formatted for all major South African commercial banks (FNB, Standard Bank, Nedbank, ABSA, Investec) for 1-click salary payouts.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Third-Party Deduction Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automated schedules and payment reconciliation for medical aid schemes, provident/pension funds, group life policies, and statutory court garnishee orders.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 4: STEP-BY-STEP PROCESS */}
        <section className="bg-slate-50 dark:bg-slate-900/40 py-16 border-y">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">Our Monthly Payroll Workflow & SLAs</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
                A disciplined 5-stage monthly process ensuring precision and zero payroll errors.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  01
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Variable Data Ingestion</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By the 25th of the month, we ingest your variable payroll data: approved timesheets, overtime hours, sales commissions, expense claims, and unpaid leave days.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  02
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Statutory Computations</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our engine applies 2026/2027 tax brackets, Section 6A medical credits, UIF caps (R17,712), SDL thresholds, and 7th Schedule fringe benefit tax valuations.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  03
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Executive Pre-Approval</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We present business leadership with a comprehensive payroll audit pack: Net Pay Variance Report, Gross-to-Net Summary, and Departmental Cost Centers for sign-off.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  04
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Encrypted Payslips Dispatch</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upon approval, password-encrypted payslips are emailed to employees, and the ACB salary payment file is provided for immediate bank batch release.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  05
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Statutory SARS Filings</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We submit your EMP201 return to SARS and file the monthly UI-19 employee declaration with the Department of Employment and Labour, providing confirmed PRNs for payment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: TRANSPARENT PRICING */}
        <section id="pricing" className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Transparent Payroll Packages</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              Scalable, fixed-fee monthly packages with zero hidden software maintenance charges.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Small Team Payroll</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R650</span>
                  <span className="text-sm font-medium text-muted-foreground">/per month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Complete payroll administration for micro-enterprises and startups with 1 to 5 employees.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Up to 5 monthly employee payslips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Password-encrypted email dispatch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Monthly EMP201 return preparation & submission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Monthly DoEL uFiling declaration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>BCEA statutory leave balance tracking</span>
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
                <CardTitle className="text-xl font-bold">Growing Team Payroll</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R1,150</span>
                  <span className="text-sm font-medium text-muted-foreground">/per month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ideal for established businesses and professional firms employing 6 to 15 team members.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>6 to 15 monthly employee payslips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Automated ACB bank salary upload file</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>EMP201 preparation, PRN generation & submission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Seventh Schedule fringe benefit tax calculations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Third-party schedules (Medical Aid, Provident Fund)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Full Bi-Annual EMP501 recons included</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6 font-bold" variant="default">
                  <Link href="/contact">Select Package</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Mid-Market & Enterprise</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R65</span>
                  <span className="text-sm font-medium text-muted-foreground">/per employee/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tailored payroll engine for mid-market employers with 16 to 100+ active workforce staff.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Dedicated senior payroll manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Multi-departmental and cost center reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Custom shift work & complex overtime rules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Automated leave liability balance sheet reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Bi-annual EMP501 recons & e@syFile synchronization</span>
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
              Common questions regarding payroll outsourcing, labour legislation, and employer tax filing in South Africa.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="faq-0" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What statutory information must be included on an employee payslip under the BCEA?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Under Section 33 of the Basic Conditions of Employment Act 75 of 1997 (BCEA), an employer is legally required to deliver a written or secure digital payslip on or before payday. The payslip must explicitly detail: the employer registered name and physical or postal address; the employee name and occupation; the period for which payment is made; the employee gross remuneration; the calculation of any variable overtime or allowances; itemized statutory deductions (PAYE, UIF) and voluntary deductions; and the final net remuneration paid.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-1" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                When are the mandatory deadlines for bi-annual EMP501 reconciliations?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                SARS mandates two statutory EMP501 reconciliation filing periods annually. The Interim Reconciliation covers the first six months of the tax year (1 March to 31 August) and must be submitted between 1 September and 31 October. The Annual Reconciliation covers the full 12-month tax year (1 March to 28/29 February) and must be lodged between 1 April and 31 May. During the annual recon, final employee tax certificates (IRP5/IT3(a)) are generated, validated, and issued to staff.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                How does South African labour law govern overtime calculation and maximum working hours?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                The BCEA limits ordinary working hours to a maximum of 45 hours per week (9 hours per day for a 5-day week, or 8 hours per day for workweeks exceeding 5 days). Overtime is capped at a strict maximum of 10 hours per week and must be agreed upon by contract. Normal overtime must be remunerated at 1.5 times the employee normal hourly wage. Work performed on Sundays or statutory public holidays must be paid at double (2.0x) the ordinary rate, unless Sunday is a normal scheduled rostered workday, in which case 1.5x applies.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What are Seventh Schedule fringe benefits and how do they affect employee payroll?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Under the Seventh Schedule to the Income Tax Act 58 of 1962, non-cash benefits provided by employers—such as company cars, employer-paid medical scheme contributions, employer retirement fund contributions, low-interest staff loans, and residential accommodation—constitute taxable fringe benefits. The cash equivalent value of these perks must be calculated each month and added to the employee gross remuneration to determine the correct PAYE deduction.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                How do you handle staff leave balances and leave liability provisions in financial reports?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                We track every day and hour of annual, sick, family responsibility, and parental leave in our automated payroll system. Under Section 20 of the BCEA, employees accumulate at least 21 consecutive days of paid annual leave per cycle. Because untaken annual leave represents an accrued legal liability that must be paid out upon termination, our monthly payroll pack provides a detailed Leave Liability Valuation Report for your general ledger balance sheet.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* SECTION 7: CLOSING CONVERSION BANNER */}
        <section className="container mx-auto px-4 text-center py-12">
          <div className="max-w-3xl mx-auto p-12 rounded-2xl glass-card border shadow-lg space-y-6">
            <h2 className="text-3xl font-black text-foreground">Ready to Outsource Your Payroll Headaches?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Join hundreds of South African business leaders who trust My Accountant to deliver error-free payslips, precise SARS compliance, and dependable workforce administration every month.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Get a Payroll Quote</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="/paye-compliance">View PAYE & EMP201 Details</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
