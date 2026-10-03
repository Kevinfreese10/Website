import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShieldCheck, Users, FileUp, Scale, CheckCircle2, AlertTriangle, FileText, ArrowRight, HelpCircle, Building2, Clock, Landmark, Coins } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'UIF & SDL Compliance Services South Africa | My Accountant',
        description: 'Comprehensive UIF and SDL compliance, monthly uFiling declarations, UI-19 employee registrations, and Letters of Good Standing under Act 63 of 2001.',
    };
    return getStaticPageMetadata('uif-compliance', defaults);
}

const uifFaqs = [
  {
    q: 'What is the current UIF remuneration ceiling and contribution calculation in South Africa?',
    a: 'Under the Unemployment Insurance Contributions Act 4 of 2002, the statutory contribution is 2% of the employee gross remuneration, split equally: 1% deducted from the employee and 1% contributed by the employer. The current statutory remuneration ceiling is R17,712 per month (R212,544 annually). For any employee earning equal to or greater than R17,712 per month, the employee deduction is capped at R177.12 per month, resulting in a maximum total employer and employee contribution of R354.24 per month.'
  },
  {
    q: 'When is a South African employer required to pay Skills Development Levies (SDL)?',
    a: 'Under the Skills Development Levies Act 9 of 1999, an employer is legally required to register for and pay SDL if their total gross leviable payroll across all employees exceeds R500,000 over the preceding 12-month period. The levy is calculated strictly as 1% of the total leviable payroll and is payable monthly to SARS via the EMP201 return. Employers with an annual payroll below R500,000, approved Public Benefit Organisations (PBOs), and religious institutions are exempt from SDL.'
  },
  {
    q: 'What is the difference between paying UIF via SARS EMP201 and submitting declarations on uFiling?',
    a: 'SARS collects monetary UIF payments via the monthly EMP201 return, acting as a collection agent for the Department of Employment and Labour (DoEL). However, the SARS EMP201 only records bulk monetary values, not individual employee records. To ensure workers are eligible to claim maternity, illness, or retrenchment benefits, employers must also submit monthly nominal declarations (UI-19 employee breakdowns) directly to the Department of Employment and Labour via the uFiling portal or automated electronic payroll data transfer.'
  },
  {
    q: 'What is a UI-19 form and why is it essential for staff claiming benefits?',
    a: 'Form UI-19 is the official declaration of employee information submitted to the Unemployment Insurance Fund. It reflects each worker employment dates, identity number, monthly remuneration, working hours, and termination reason. When an employee is retrenched, dismissed, takes maternity leave, or falls ill, the Department of Employment and Labour checks their UI-19 record history. If the employer has failed to keep these records updated on uFiling, the employee claim will be rejected or severely delayed.'
  },
  {
    q: 'How do I obtain a Department of Employment and Labour UIF Letter of Good Standing?',
    a: 'A UIF Letter of Good Standing (Compliance Certificate) confirms that an employer has fully registered with the Department of Employment and Labour, has declared all employees up to the current calendar month, and maintains a zero outstanding balance on contributions, penalties, and interest. My Accountant conducts a comprehensive compliance audit, submits any backdated declarations, clears disputed balances, and retrieves the verified digital certificate directly from the Department of Employment and Labour.'
  }
];

const uifSchema = generateServicePillarSchema({
  title: 'UIF & SDL Compliance Services South Africa',
  description: 'Expert Unemployment Insurance Fund (UIF) and Skills Development Levy (SDL) administration, uFiling declarations, UI-19 submissions, and Letters of Good Standing.',
  slug: '/uif-compliance',
  serviceType: 'AccountingService',
  priceRange: 'From R450/month',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Payroll & Labour', url: '/products#payroll-services' },
    { name: 'UIF & SDL Compliance', url: '/uif-compliance' },
  ],
  faqs: uifFaqs
});

export default function UifCompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(uifSchema) }}
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
              <ShieldCheck className="h-4 w-4" /> Department of Labour & SARS Compliance
            </div>
            <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center text-hero-gradient pb-2">
              <span className="text-gradient">UIF & SDL Compliance Services</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Protect your workforce and insulate your business against Department of Employment and Labour enforcement. We manage statutory registrations, monthly uFiling declarations, UI-19 submissions, and compliance certificates across South Africa.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Check My UIF Status</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="#pricing">View Compliance Packages</Link>
              </Button>
            </div>
          </div>
        </section>

        <TrustIndexWidget />

        {/* SECTION 1: STATUTORY LEGAL FRAMEWORK */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Statutory Legal Framework: Unemployment Insurance & Skills Development Levies
            </h2>
            <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-base leading-relaxed">
              Employer obligations in South Africa are governed by strict statutory enactments designed to fund social security safety nets and national workforce training.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Unemployment Insurance Act 63 of 2001 (UI Act)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The Unemployment Insurance Act 63 of 2001, read together with the Unemployment Insurance Contributions Act 4 of 2002, requires every commercial employer in South Africa who employs staff for more than 24 hours per month to contribute to the Unemployment Insurance Fund (UIF).
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border space-y-2">
                  <div className="font-semibold text-foreground">Statutory Contribution Breakdown:</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong className="text-foreground">Employee Deduction:</strong> 1% of gross remuneration.</li>
                    <li><strong className="text-foreground">Employer Contribution:</strong> 1% matching contribution.</li>
                    <li><strong className="text-foreground">Total Contribution:</strong> 2% of gross remuneration.</li>
                    <li><strong className="text-foreground">Statutory Ceiling:</strong> R17,712 per month (R212,544 per annum).</li>
                    <li><strong className="text-foreground">Maximum Monthly Contribution:</strong> R177.12 employee + R177.12 employer = R354.24 total per worker.</li>
                  </ul>
                </div>
                <p>
                  Even when an employee earns significantly above the R17,712 monthly threshold, contributions must continue to be withheld and declared at the statutory maximum.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Skills Development Levies Act 9 of 1999 (SDLA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The Skills Development Levies Act 9 of 1999 imposes a statutory training levy on South African employers to fund occupational skills development through Sector Education and Training Authorities (SETAs) and the National Skills Fund.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border space-y-2">
                  <div className="font-semibold text-foreground">SDL Statutory Rules:</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong className="text-foreground">Mandatory Threshold:</strong> Annual leviable payroll exceeding R500,000.</li>
                    <li><strong className="text-foreground">Levy Rate:</strong> 1% of the total leviable payroll amount.</li>
                    <li><strong className="text-foreground">Exemptions:</strong> Employers with annual payroll under R500,000, approved public benefit organisations (PBOs), and religious institutions.</li>
                    <li><strong className="text-foreground">Levy Allocation:</strong> 80% to the registered SETA and 20% to the National Skills Fund.</li>
                    <li><strong className="text-foreground">Grant Recovery:</strong> Eligible employers can claim back up to 20% of their SDL via mandatory grant submissions (Workplace Skills Plan & Annual Training Report) by 30 April annually.</li>
                  </ul>
                </div>
                <p>
                  SDL is declared and remitted monthly directly to SARS via the EMP201 return alongside employee PAYE and UIF contributions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 2: CORE DELIVERABLES */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Comprehensive Labour Compliance Solutions</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              From foundational company registrations to monthly nominal declarations and audit defense, we manage your complete DoEL regulatory posture.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">DoEL Employer Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Full commercial employer registration with the Department of Employment and Labour, securing your official DoEL reference number and active uFiling corporate profile.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <FileUp className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Monthly uFiling Declarations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Monthly electronic filing of individual employee status, hours worked, gross earnings, and termination updates in full alignment with SARS EMP201 records.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">SDL Compliance & SETA Alignment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Threshold monitoring against the R500,000 annual payroll limit, SETA classification, and support for Workplace Skills Plan (WSP) levy recovery grants.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">UIF Compliance Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Retrieval of official Letters of Good Standing for tenders, corporate supplier accreditation, CIPC filings, and CIDB contractor grade renewals.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Historical Arrears Remediation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Auditing and reconciling backdated employee records, clearing DoEL assessment gaps, and negotiating waiver of administrative penalty charges.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">Benefit Claim Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Rapid issuance of certified UI-19 and UI-2.7 forms for employees claiming maternity, parental, adoption, illness, or retrenchment benefits.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 3: STEP-BY-STEP PROCESS */}
        <section className="bg-slate-50 dark:bg-slate-900/40 py-16 border-y">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">Step-by-Step uFiling Registration & Declaration Workflow</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
                How My Accountant delivers continuous statutory compliance and audit-ready records.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  01
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Employer Profile & Entity Setup</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We review your CIPC registration, SARS income tax reference, and DoEL records. We prepare Form UI-8D to secure or activate your commercial employer uFiling profile.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  02
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Employee Demographic Ingestion</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We capture all staff details including South African ID numbers, foreign passports, work permits, start dates, and remuneration packages into our compliant payroll system.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  03
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Dual-Channel Reconciliation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Each month, we balance your SARS EMP201 monetary returns against the detailed individual employee UI-19 declarations on uFiling to ensure 100% mathematical parity.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  04
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Payment Allocation & PRN Tracking</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We generate accurate payment reference numbers (PRNs) for DoEL and SARS, ensuring payments are allocated against the correct employer account without unallocated credit traps.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg mb-4">
                  05
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Compliance Certificate Retrieval</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once your account reflects zero arrears and current returns, we generate and deliver your official Department of Employment and Labour Letter of Good Standing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: REQUIRED DOCUMENTATION & STATUTORY FORMS */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Essential Statutory UIF Forms & Documentation</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              Navigating the Department of Employment and Labour requires precise documentation. Here are the core statutory instruments our team manages for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-3">
                  UI-8D Form
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Application for Commercial Employer Registration</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The foundational statutory application submitted to register a business as an employer under Section 56 of the UI Act. Required before any employee contributions can be legally attributed.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-3">
                  UI-19 Form
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Declaration of Information of Commercial Employees</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mandatory declaration detailing all employee engagements, monthly remuneration amounts, employment status changes, dismissals, retrenchments, resignations, and maternity leave dates.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-3">
                  UI-2.7 Form
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Remuneration Received Whilst in Employment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Required by the Department of Employment and Labour when employees apply for maternity, illness, or reduced working time benefits to verify any ongoing partial employer payments.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-3">
                  Compliance Certificate
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">DoEL Letter of Good Standing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Authoritative certification confirming that all historical monthly declarations and payments are fully reconciled with zero outstanding balance. Indispensable for corporate tenders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: PENALTIES & CONSEQUENCES */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="p-8 md:p-10 rounded-2xl border border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Statutory Penalties, Compound Interest & Legal Consequences of Non-Compliance
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Department of Employment and Labour and SARS enforce non-compliance aggressively. Failing to register, withhold contributions, or submit monthly declarations carries significant administrative, financial, and criminal exposure under South African law:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-background p-4 rounded-lg border text-sm space-y-1">
                    <div className="font-bold text-foreground">10% Late Payment Penalty</div>
                    <p className="text-xs text-muted-foreground">
                      Section 13(1) of the Unemployment Insurance Contributions Act imposes an immediate, automatic 10% penalty on all late or unpaid monthly contributions.
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border text-sm space-y-1">
                    <div className="font-bold text-foreground">Prescribed Compound Interest</div>
                    <p className="text-xs text-muted-foreground">
                      Interest compounds monthly on outstanding balances at the statutory rate determined under the Public Finance Management Act (currently 11.75% per annum).
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border text-sm space-y-1">
                    <div className="font-bold text-foreground">Section 56 Criminal Sanctions</div>
                    <p className="text-xs text-muted-foreground">
                      Failure to submit monthly UI-19 declarations or unlawfully deducting UIF without remitting it is a criminal offence punishable by a fine or up to 12 months imprisonment.
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border text-sm space-y-1">
                    <div className="font-bold text-foreground">Commercial & Tender Disqualification</div>
                    <p className="text-xs text-muted-foreground">
                      Businesses in arrears are refused a Letter of Good Standing, instantly disqualifying them from public sector tenders, CIDB upgrades, and corporate vendor panels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: TRANSPARENT PRICING */}
        <section id="pricing" className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Transparent UIF & SDL Compliance Packages</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              Predictable, flat-fee pricing with rapid turnaround times and dedicated South African payroll compliance specialists.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">UIF Employer Registration</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R950</span>
                  <span className="text-sm font-medium text-muted-foreground">/once-off</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ideal for new businesses or unregistered employers needing statutory DoEL registration.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Form UI-8D preparation and DoEL lodgement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Commercial DoEL reference number retrieval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Full uFiling corporate profile setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Initial employee batch ingestion (up to 5 staff)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Turnaround SLA: 3 to 5 business days</span>
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
                <CardTitle className="text-xl font-bold">Monthly uFiling Retainer</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R450</span>
                  <span className="text-sm font-medium text-muted-foreground">/per month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Monthly declaration compliance for micro and small teams (1 to 5 employees).
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Monthly UI-19 employee declaration submission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>SARS EMP201 to uFiling cross-reconciliation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>New hire onboarding and termination filings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Staff maternity and illness form assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Continuous compliance monitoring</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6 font-bold" variant="default">
                  <Link href="/contact">Select Package</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Letter of Good Standing</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">R1,250</span>
                  <span className="text-sm font-medium text-muted-foreground">/per certificate</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Expedited compliance audit and certificate retrieval for tenders and contracts.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>DoEL account statement audit and reconciliation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Identification of missing declaration periods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Assistance resolving outstanding balance queries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Official DoEL compliance certificate issuance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Turnaround SLA: 24 to 48 hours upon zero balance</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6 font-bold" variant="outline">
                  <Link href="/contact">Select Package</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 7: STRUCTURED FAQS ACCORDION */}
        <section className="container mx-auto px-4 max-w-4xl py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              <HelpCircle className="h-8 w-8 text-primary" /> Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground mt-2">
              Common questions about Unemployment Insurance and Skills Development Levies for South African employers.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="faq-0" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What is the current UIF remuneration ceiling and contribution calculation in South Africa?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Under the Unemployment Insurance Contributions Act 4 of 2002, the statutory contribution is 2% of the employee gross remuneration, split equally: 1% deducted from the employee and 1% contributed by the employer. The current statutory remuneration ceiling is R17,712 per month (R212,544 annually). For any employee earning equal to or greater than R17,712 per month, the employee deduction is capped at R177.12 per month, resulting in a maximum total employer and employee contribution of R354.24 per month.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-1" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                When is a South African employer required to pay Skills Development Levies (SDL)?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Under the Skills Development Levies Act 9 of 1999, an employer is legally required to register for and pay SDL if their total gross leviable payroll across all employees exceeds R500,000 over the preceding 12-month period. The levy is calculated strictly as 1% of the total leviable payroll and is payable monthly to SARS via the EMP201 return. Employers with an annual payroll below R500,000, approved Public Benefit Organisations (PBOs), and religious institutions are exempt from SDL.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What is the difference between paying UIF via SARS EMP201 and submitting declarations on uFiling?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                SARS collects monetary UIF payments via the monthly EMP201 return, acting as a collection agent for the Department of Employment and Labour (DoEL). However, the SARS EMP201 only records bulk monetary values, not individual employee records. To ensure workers are eligible to claim maternity, illness, or retrenchment benefits, employers must also submit monthly nominal declarations (UI-19 employee breakdowns) directly to the Department of Employment and Labour via the uFiling portal or automated electronic payroll data transfer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                What is a UI-19 form and why is it essential for staff claiming benefits?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                Form UI-19 is the official declaration of employee information submitted to the Unemployment Insurance Fund. It reflects each worker employment dates, identity number, monthly remuneration, working hours, and termination reason. When an employee is retrenched, dismissed, takes maternity leave, or falls ill, the Department of Employment and Labour checks their UI-19 record history. If the employer has failed to keep these records updated on uFiling, the employee claim will be rejected or severely delayed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                How do I obtain a Department of Employment and Labour UIF Letter of Good Standing?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                A UIF Letter of Good Standing (Compliance Certificate) confirms that an employer has fully registered with the Department of Employment and Labour, has declared all employees up to the current calendar month, and maintains a zero outstanding balance on contributions, penalties, and interest. My Accountant conducts a comprehensive compliance audit, submits any backdated declarations, clears disputed balances, and retrieves the verified digital certificate directly from the Department of Employment and Labour.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* SECTION 8: CLOSING CONVERSION BANNER */}
        <section className="container mx-auto px-4 text-center py-12">
          <div className="max-w-3xl mx-auto p-12 rounded-2xl glass-card border shadow-lg space-y-6">
            <h2 className="text-3xl font-black text-foreground">Ensure 100% Labour Compliance Today</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Do not let missing UI-19 declarations or unallocated DoEL assessments disrupt your company operations or vendor accreditations. Speak with our certified payroll specialists today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Book a Compliance Audit</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="/payroll-administration">Explore Full Payroll Services</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
