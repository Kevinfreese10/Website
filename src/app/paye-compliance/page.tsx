import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Landmark, Users, Receipt, ShieldCheck, CheckCircle2, AlertTriangle, FileText, ArrowRight, HelpCircle, Calculator, Scale, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'PAYE Compliance & EMP201 Returns | My Accountant',
        description: 'Statutory PAYE management, EMP201 submissions, 4th Schedule tax bracket calculations, and SARS penalty prevention under the Tax Administration Act.',
    };
    return getStaticPageMetadata('paye-compliance', defaults);
}

const payeFaqs = [
  {
    q: 'When is the mandatory deadline for filing the monthly EMP201 return and paying PAYE to SARS?',
    a: 'Under the Fourth Schedule to the Income Tax Act 58 of 1962, the EMP201 declaration and full payment of Pay-As-You-Earn (PAYE), Skills Development Levies (SDL), and Unemployment Insurance (UIF) must be received by SARS on or before the 7th calendar day of the month following the payroll deduction period. If the 7th falls on a Saturday, Sunday, or statutory public holiday, the return and payment must be submitted by the last business day immediately preceding the 7th.'
  },
  {
    q: 'What penalties are triggered if an employer makes a late PAYE payment to SARS?',
    a: 'Under Section 213 of the Tax Administration Act 28 of 2011 (TAA), an automatic and immediate 10% late payment penalty is assessed against the employer on the total unpaid balance of PAYE, SDL, and UIF. Furthermore, under Section 89(2) of the Income Tax Act, interest compounds monthly at the prescribed statutory PFMA rate (currently 11.75% per annum) from the first day following the due date until full settlement.'
  },
  {
    q: 'Can company directors be held personally liable for unpaid employee taxes?',
    a: 'Yes. Under Section 180 of the Tax Administration Act, SARS has explicit statutory power to hold company directors, public officers, and financial managers personally liable for unpaid employee tax debts if they intentionally or negligently withheld taxes from workers without remitting those funds to the SARS commissioner. This personal liability pierces the corporate veil.'
  },
  {
    q: 'How do Section 6A and 6B Medical Scheme Fees Tax Credits reduce employee PAYE?',
    a: 'Section 6A provides a direct monthly tax credit deductible against an employee calculated PAYE: R364 per month for the principal member, R364 per month for the first dependant, and R246 per month for each additional dependant. Section 6B provides additional medical tax credits for qualifying disability expenses or out-of-pocket medical expenditures exceeding statutory threshold percentages.'
  },
  {
    q: 'How should remuneration and PAYE be handled for company directors and shareholders?',
    a: 'Under the Fourth Schedule, company directors are classified as employees for PAYE purposes. Directors salaries, directors fees, and bonus drawings are subject to statutory PAYE withholding at standard personal income tax rates. Remuneration cannot be treated as informal drawings without triggering deemed dividend taxes or fringe benefit loans under Section 64E and Seventh Schedule rules.'
  }
];

const payeSchema = generateServicePillarSchema({
  title: 'PAYE Compliance & EMP201 Returns South Africa',
  description: 'Expert management of monthly SARS EMP201 returns, Fourth Schedule PAYE calculations, tax rebates, and employer penalty prevention.',
  slug: '/paye-compliance',
  serviceType: 'TaxConsultant',
  priceRange: 'From R550/month',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Tax Services', url: '/products#tax-returns' },
    { name: 'PAYE Compliance', url: '/paye-compliance' },
  ],
  faqs: payeFaqs
});

export default function PayeCompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(payeSchema) }}
      />
      <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
          <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container relative z-10 mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
              <Landmark className="h-4 w-4" /> Fourth Schedule Income Tax & SARS eFiling
            </div>
            <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center text-hero-gradient pb-2">
              <span className="text-gradient">PAYE Compliance & EMP201 Returns</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Eliminate costly SARS penalties and protect company directors. We deliver meticulous monthly Pay-As-You-Earn management, EMP201 return submissions, and bi-annual EMP501 tax reconciliations.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Get a Compliance Assessment</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="#pricing">View PAYE Packages</Link>
              </Button>
            </div>
          </div>
        </section>

        <TrustIndexWidget />

        {/* SECTION 1: 4TH SCHEDULE STATUTORY FRAMEWORK */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Statutory PAYE Framework: 4th Schedule & Employer Withholding Duties
            </h2>
            <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-base leading-relaxed">
              Under the Fourth Schedule to the Income Tax Act 58 of 1962, every South African employer is an involuntary agent of the State, mandated to withhold employee tax (PAYE) at source from all remuneration paid to staff and directors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">2026/2027 Personal Income Tax Brackets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed">
                <p className="text-muted-foreground text-sm">
                  SARS applies progressive statutory tax rates to all taxable income earned by individuals:
                </p>
                <div className="divide-y border rounded-lg overflow-hidden bg-background">
                  <div className="flex justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <span className="font-semibold text-foreground">R0 – R237,100</span>
                    <span className="text-muted-foreground text-right">18% of taxable income</span>
                  </div>
                  <div className="flex justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <span className="font-semibold text-foreground">R237,101 – R370,500</span>
                    <span className="text-muted-foreground text-right">R42,678 + 26% of taxable income above R237,100</span>
                  </div>
                  <div className="flex justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <span className="font-semibold text-foreground">R370,501 – R512,800</span>
                    <span className="text-muted-foreground text-right">R77,362 + 31% of taxable income above R370,500</span>
                  </div>
                  <div className="flex justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <span className="font-semibold text-foreground">R512,801 – R673,000</span>
                    <span className="text-muted-foreground text-right">R121,475 + 36% of taxable income above R512,800</span>
                  </div>
                  <div className="flex justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <span className="font-semibold text-foreground">R673,001 – R857,900</span>
                    <span className="text-muted-foreground text-right">R179,147 + 39% of taxable income above R673,000</span>
                  </div>
                  <div className="flex justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <span className="font-semibold text-foreground">R857,901 – R1,817,000</span>
                    <span className="text-muted-foreground text-right">R251,258 + 41% of taxable income above R857,900</span>
                  </div>
                  <div className="flex justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <span className="font-semibold text-foreground">R1,817,001+</span>
                    <span className="text-muted-foreground text-right">R644,489 + 45% of taxable income above R1,817,001</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Statutory Tax Rebates & Medical Credits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Annual statutory income tax rebates directly reduce the final tax liability for South African individual taxpayers:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Primary Rebate (All Individuals)</span>
                      <span className="text-primary">R17,235</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Tax threshold: R95,750</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Secondary Rebate (Age 65 and Older)</span>
                      <span className="text-primary">R9,444</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Tax threshold: R148,217</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Tertiary Rebate (Age 75 and Older)</span>
                      <span className="text-primary">R3,145</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Tax threshold: R165,689</div>
                  </div>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs space-y-1">
                  <div className="font-bold text-foreground">Section 6A Medical Scheme Fees Tax Credit:</div>
                  <p>
                    Direct monthly tax deductions: <strong>R364 per month</strong> for the primary member, <strong>R364 per month</strong> for the first dependant, and <strong>R246 per month</strong> for each additional dependant.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 2: EMP201 DEADLINES, PENALTIES & DIRECTOR LIABILITY */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="p-8 md:p-10 rounded-2xl border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                EMP201 Deadlines, Section 213 Penalties & Director Personal Liability
              </h2>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              SARS enforces employer compliance with zero tolerance. Failing to file the EMP201 return or underpaying statutory employee tax balances triggers immediate severe legal consequences under the Tax Administration Act 28 of 2011:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-background p-5 rounded-xl border space-y-2">
                <div className="font-bold text-foreground text-base">7th-of-the-Month Deadline</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  EMP201 declarations and payments are strictly due by the 7th calendar day of the subsequent month (or last preceding business day if on a weekend or public holiday).
                </p>
              </div>
              <div className="bg-background p-5 rounded-xl border space-y-2">
                <div className="font-bold text-foreground text-base">10% Late Payment Penalty</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Section 213 of the TAA assesses an immediate 10% penalty on total overdue PAYE, SDL, and UIF amounts, plus monthly compound interest at the statutory PFMA rate of 11.75%.
                </p>
              </div>
              <div className="bg-background p-5 rounded-xl border space-y-2">
                <div className="font-bold text-foreground text-base">Section 180 Director Liability</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  SARS possesses statutory authority to hold directors, members, and financial officers personally liable for unpaid employee taxes, piercing corporate veil protections.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: MONTHLY COMPLIANCE CALENDAR */}
        <section className="bg-slate-50 dark:bg-slate-900/40 py-16 border-y">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">Monthly PAYE Compliance Calendar & Process</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
                How My Accountant coordinates your pay run to guarantee clean filings well ahead of the SARS 7th-of-the-month cutoff.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                  25th
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Payroll Cutoff</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Collation of all variable hours, overtime, bonuses, expense claims, and new staff tax declarations.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                  28th
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Tax Computation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Application of statutory tax brackets, Seventh Schedule benefits, and medical tax credits across all staff.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                  1st–4th
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">EMP201 Generation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Filing of draft EMP201 on SARS eFiling, verifying ledger matching and PRN payment advice numbers.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                  5th
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Client Pre-Approval</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Employer sign-off on total tax liabilities with clear payment instructions for electronic bank transfer.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-base mb-4">
                  7th
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Statutory Cutoff</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  SARS final payment deadline. Full payment receipt before midnight avoids automatic 10% penalty assessment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: CORE DELIVERABLES */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Comprehensive PAYE & Employer Tax Deliverables</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              Protect your business against statutory tax discrepancies with end-to-end management by accredited SARS tax practitioners.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Monthly EMP201 Preparation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Accurate preparation and calculation of monthly PAYE, SDL, and UIF liabilities on SARS eFiling, reconciling gross payroll against all statutory schedules.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Fringe Benefit Tax Valuations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seventh Schedule fringe benefit computations for company-provided vehicles, employer medical aid subsidies, low-interest staff loans, and travel allowances.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Medical Credit Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Application of Section 6A and 6B Medical Scheme Fees Tax Credits for employees and qualifying dependants, ensuring correct net tax withholding.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">PRN & Payment Reconciliation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generation of 19-digit SARS Payment Reference Numbers (PRNs) and reconciliation against electronic bank payments to prevent unallocated ledger debits.
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
                  Comprehensive balancing of monthly EMP201 declarations against bank payments and IRP5 tax certificates during the Interim (October) and Annual (May) filing windows.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">SARS Audit & Dispute Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Direct representation during SARS payroll verification audits, resolving IT180 assessments, and drafting Section 217 penalty remission requests.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 5: TRANSPARENT PRICING */}
        <section id="pricing" className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Transparent PAYE Compliance Packages</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              Flat-rate monthly compliance retainers with zero hidden setup fees or surprise admin charges.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Small Team EMP201 Retainer</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R550</span>
                  <span className="text-sm font-medium text-muted-foreground">/per month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  For small business employers with 1 to 5 staff members.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Monthly EMP201 calculation and submission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>PAYE, UIF, and SDL statutory tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Medical aid Section 6A credit calculations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>SARS PRN payment advice generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Turnaround SLA: 3 business days prior to the 7th</span>
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
                <CardTitle className="text-xl font-bold">Growing Employer Retainer</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R950</span>
                  <span className="text-sm font-medium text-muted-foreground">/per month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Comprehensive compliance for expanding teams of 6 to 20 staff.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Full monthly EMP201 submission and monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Seventh Schedule fringe benefit valuations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Director remuneration tax structuring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Bi-annual EMP501 reconciliation support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>SARS statement of account monitoring</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6 font-bold" variant="default">
                  <Link href="/contact">Select Package</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Mid-Market Employer Retainer</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R1,650</span>
                  <span className="text-sm font-medium text-muted-foreground">/per month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tailored for multi-tier enterprises with 21 to 50 active employees.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Dedicated senior tax practitioner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Complex overtime and variable commission rules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Expatriate and foreign worker tax certificates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Both Interim and Annual EMP501 recons included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Full IRP5/IT3(a) generation and bulk submission</span>
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
              Essential guidance on South African PAYE calculations, EMP201 deadlines, and SARS employer tax rules.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="faq-0" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                When is the mandatory deadline for filing the monthly EMP201 return and paying PAYE to SARS?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Under the Fourth Schedule to the Income Tax Act 58 of 1962, the EMP201 declaration and full payment of Pay-As-You-Earn (PAYE), Skills Development Levies (SDL), and Unemployment Insurance (UIF) must be received by SARS on or before the 7th calendar day of the month following the payroll deduction period. If the 7th falls on a Saturday, Sunday, or statutory public holiday, the return and payment must be submitted by the last business day immediately preceding the 7th.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-1" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What penalties are triggered if an employer makes a late PAYE payment to SARS?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Under Section 213 of the Tax Administration Act 28 of 2011 (TAA), an automatic and immediate 10% late payment penalty is assessed against the employer on the total unpaid balance of PAYE, SDL, and UIF. Furthermore, under Section 89(2) of the Income Tax Act, interest compounds monthly at the prescribed statutory PFMA rate (currently 11.75% per annum) from the first day following the due date until full settlement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                Can company directors be held personally liable for unpaid employee taxes?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Yes. Under Section 180 of the Tax Administration Act, SARS has explicit statutory power to hold company directors, public officers, and financial managers personally liable for unpaid employee tax debts if they intentionally or negligently withheld taxes from workers without remitting those funds to the SARS commissioner. This personal liability pierces the corporate veil.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                How do Section 6A and 6B Medical Scheme Fees Tax Credits reduce employee PAYE?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Section 6A provides a direct monthly tax credit deductible against an employee calculated PAYE: R364 per month for the principal member, R364 per month for the first dependant, and R246 per month for each additional dependant. Section 6B provides additional medical tax credits for qualifying disability expenses or out-of-pocket medical expenditures exceeding statutory threshold percentages.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                How should remuneration and PAYE be handled for company directors and shareholders?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Under the Fourth Schedule, company directors are classified as employees for PAYE purposes. Directors salaries, directors fees, and bonus drawings are subject to statutory PAYE withholding at standard personal income tax rates. Remuneration cannot be treated as informal drawings without triggering deemed dividend taxes or fringe benefit loans under Section 64E and Seventh Schedule rules.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* SECTION 7: CLOSING CONVERSION BANNER */}
        <section className="container mx-auto px-4 text-center py-12">
          <div className="max-w-3xl mx-auto p-12 rounded-2xl glass-card border shadow-lg space-y-6">
            <h2 className="text-3xl font-black text-foreground">Avoid Costly SARS Employer Tax Penalties</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Ensure your EMP201 returns are calculated accurately, approved on time, and paid prior to the 7th of every month. Partner with our dedicated tax team today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Book a Tax Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="/remission-of-fines">Dispute Existing SARS Penalties</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
