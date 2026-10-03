'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, ShieldCheck, Scale, FileText, BadgeDollarSign, FileWarning, AlertTriangle, HelpCircle, Clock, ArrowRight, Landmark, FileCheck } from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';

export default function RemissionOfFinesPageClient() {
  return (
    <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
            <Scale className="h-4 w-4" /> Tax Administration Act Chapter 15 Penalty Relief
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Remission of <span className="text-gradient">SARS Fines & Penalties</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            SARS administrative penalties are aggressive, recurring, and distressing—but they are not always final. If you have been assessed with Section 211 monthly non-compliance fines or Section 213 late payment charges, our accredited tax practitioners can help you dispute and waive them.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
            <Button asChild size="lg" className="font-bold px-10 shadow-xl">
              <Link href="/contact">Request a Penalty Assessment</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold px-8">
              <Link href="#penalty-table">View Penalty Rates Table</Link>
            </Button>
          </div>
        </div>
      </section>

      <TrustIndexWidget />

      {/* SECTION 1: STATUTORY FRAMEWORK & SECTION 211 PENALTY TABLE */}
      <section id="penalty-table" className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">
            Statutory Framework: TAA Chapter 15 & Section 211 Penalty Tables
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-base leading-relaxed">
            Under Chapter 15 of the Tax Administration Act 28 of 2011, SARS automatically imposes fixed-amount administrative penalties on individual and corporate taxpayers who fail to submit required returns by statutory deadlines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card className="glass-card border-primary/20 p-4">
            <CardHeader className="p-2">
              <FileWarning className="h-8 w-8 text-amber-500 mb-2" />
              <CardTitle className="text-lg font-bold">Section 211 Recurring Fines</CardTitle>
            </CardHeader>
            <CardContent className="p-2 text-xs text-muted-foreground leading-relaxed">
              Levied monthly for every single outstanding return (ITR12, ITR14, EMP501). Continues compounding every month for up to <strong>35 months</strong> until the return is submitted.
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20 p-4">
            <CardHeader className="p-2">
              <BadgeDollarSign className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg font-bold">Section 213 Late Payment</CardTitle>
            </CardHeader>
            <CardContent className="p-2 text-xs text-muted-foreground leading-relaxed">
              Immediate, automatic <strong>10% penalty</strong> on unpaid PAYE, SDL, UIF, VAT, or provisional tax amounts if received past statutory due dates.
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20 p-4">
            <CardHeader className="p-2">
              <Scale className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg font-bold">Section 89(2) Interest</CardTitle>
            </CardHeader>
            <CardContent className="p-2 text-xs text-muted-foreground leading-relaxed">
              Compound statutory interest charged monthly at the prescribed PFMA rate of <strong>11.75% per annum</strong> on all overdue capital and penalty debts.
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" /> Official SARS Section 211 Fixed-Amount Monthly Penalty Table
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Based on assessed loss or taxable income for the preceding tax year. Penalties repeat every month for up to 35 months.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-6 py-3 font-bold">Taxable Income Tier / Assessed Loss</th>
                    <th className="px-6 py-3 font-bold">Monthly Recurring Penalty</th>
                    <th className="px-6 py-3 font-bold">Maximum Statutory Penalty (35 Months)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700 dark:text-slate-300">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3 font-semibold text-foreground">Assessed Loss</td>
                    <td className="px-6 py-3 text-primary font-bold">R250 / month</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">Up to R8,750 (35 mo)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3 font-semibold text-foreground">R0 – R250,000</td>
                    <td className="px-6 py-3 text-primary font-bold">R250 / month</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">Up to R8,750 (35 mo)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3 font-semibold text-foreground">R250,001 – R500,000</td>
                    <td className="px-6 py-3 text-primary font-bold">R500 / month</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">Up to R17,500 (35 mo)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3 font-semibold text-foreground">R500,001 – R1,000,000</td>
                    <td className="px-6 py-3 text-primary font-bold">R1,000 / month</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">Up to R35,000 (35 mo)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3 font-semibold text-foreground">R1,000,001 – R5,000,000</td>
                    <td className="px-6 py-3 text-primary font-bold">R2,000 / month</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">Up to R70,000 (35 mo)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3 font-semibold text-foreground">R5,000,001 – R10,000,000</td>
                    <td className="px-6 py-3 text-primary font-bold">R4,000 / month</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">Up to R140,000 (35 mo)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3 font-semibold text-foreground">R10,000,001 – R50,000,000</td>
                    <td className="px-6 py-3 text-primary font-bold">R8,000 / month</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">Up to R280,000 (35 mo)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-3 font-semibold text-foreground">R50,000,001+</td>
                    <td className="px-6 py-3 text-primary font-bold">R16,000 / month</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">Up to R560,000 (35 mo)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 2: STATUTORY GROUNDS: SECTIONS 217 & 218 */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">
            Statutory Grounds for Penalty Remission: Sections 217 & 218
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-base leading-relaxed">
            SARS does not waive penalties based on general hardship or sympathy. Remission requires strict legal alignment with statutory grounds under the Tax Administration Act.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="glass-card border-primary/20 shadow-sm">
            <CardHeader>
              <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-2">
                TAA Section 217
              </div>
              <CardTitle className="text-xl font-bold">Nominal Non-Compliance / First Incidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                SARS may remit a fixed-amount administrative penalty if the underlying non-compliance has been remedied (return filed or payment cleared) and one of the following statutory conditions is satisfied:
              </p>
              <ul className="space-y-2 list-disc list-inside bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
                <li><strong className="text-foreground">First Incidence in 36 Months:</strong> The taxpayer has had no other administrative non-compliance penalties imposed within the preceding 36-month period.</li>
                <li><strong className="text-foreground">Failure Under 5 Days:</strong> The duration of the non-compliance was under 5 business days and reasonable grounds existed for the slight delay.</li>
                <li><strong className="text-foreground">Penalty Under R2,000:</strong> The total penalty is less than R2,000 and reasonable grounds are demonstrated.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20 shadow-sm">
            <CardHeader>
              <div className="inline-block px-3 py-1 rounded-md bg-amber-500/10 text-amber-600 text-xs font-bold mb-2">
                TAA Section 218
              </div>
              <CardTitle className="text-xl font-bold">Exceptional Circumstances Beyond Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Section 218 grants full remission where non-compliance resulted directly from extraordinary events beyond the taxpayer control:
              </p>
              <ul className="space-y-2 list-disc list-inside bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
                <li><strong className="text-foreground">Natural or Human Disaster:</strong> Fire, flood, severe storm, or major infrastructural disruption.</li>
                <li><strong className="text-foreground">Civil Disturbance or Riot:</strong> Public violence, strikes, or widespread civil disorder.</li>
                <li><strong className="text-foreground">Serious Illness or Accident:</strong> Hospitalization or incapacitation of the taxpayer or essential payroll officer.</li>
                <li><strong className="text-foreground">Bereavement:</strong> Profound psychological distress caused by the death of an immediate family member.</li>
                <li><strong className="text-foreground">SARS System Downtime:</strong> Recorded eFiling portal outages, technical system blocks, or official SARS errors.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: STEP-BY-STEP RFR01 WORKFLOW */}
      <section className="bg-slate-50 dark:bg-slate-900/40 py-16 border-y">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Step-by-Step SARS RFR01 Dispute Workflow</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
              Our structured 6-stage legal procedure to dispute and eliminate unfair tax penalty assessments.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm mb-3">
                01
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Diagnostic Compliance Audit</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We examine your SARS Statement of Account, identify exact penalty transaction codes, assess penalty legality, and determine your total exposure.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm mb-3">
                02
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Remedying Default</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                SARS auto-rejects RFRs if non-compliance is ongoing. We prepare and file any outstanding returns or compute missing payments before submission.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm mb-3">
                03
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Statutory Motivation Drafting</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our tax practitioners formulate formal legal arguments citing specific grounds under TAA Section 217 (first incidence) or Section 218 (exceptional circumstances).
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm mb-3">
                04
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Evidentiary Portfolio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We organize supporting evidence including medical certificates, death notices, police affidavits, bank statements, or documented SARS eFiling system error logs.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm mb-3">
                05
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">eFiling RFR01 Lodgement</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We lodge the formal Request for Remission (RFR01) directly through the SARS eFiling Dispute Resolution engine, securing an official SARS case tracking number.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm mb-3">
                06
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Adjudication & Escalation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                SARS has 21 business days to issue an outcome. If disallowed, we have 30 business days to escalate by lodging a formal Section 104 Notice of Objection (DISP01).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: TRANSPARENT PRICING */}
      <section id="pricing" className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Transparent Penalty Remission Packages</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
            Fixed professional fees with comprehensive legal motivation drafting by registered tax practitioners.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="glass-card h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl font-bold">First-Incidence Remission</CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-foreground">R1,850</span>
                <span className="text-sm font-medium text-muted-foreground">/per application</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ideal for taxpayers with a single tax type or first penalty occurrence within 36 months.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Statement of Account and penalty assessment audit</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Section 217 statutory legal motivation drafting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Submission of Form RFR01 on SARS eFiling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>SARS case tracking and 21-day outcome monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Turnaround SLA: Application prepared in 3 business days</span>
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
              <CardTitle className="text-xl font-bold">Exceptional Circumstances RFR</CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-foreground">R3,500</span>
                <span className="text-sm font-medium text-muted-foreground">/per application</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                For complex multi-period penalties involving Section 218 medical, system, or disaster grounds.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Multi-year penalty analysis and remediation plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Section 218 exceptional circumstances motivation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Compilation of certified evidentiary portfolio</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Liaison with SARS Debt Management to suspend collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Turnaround SLA: Application prepared in 5 business days</span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6 font-bold" variant="default">
                <Link href="/contact">Select Package</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Section 104 Formal Objection</CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-foreground">R4,500</span>
                <span className="text-sm font-medium text-muted-foreground">/per objection</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Statutory escalation when an initial RFR has been unfairly disallowed by SARS.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Review of SARS RFR disallowance notice</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Comprehensive legal dispute argument drafting (DISP01)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Full dispute bundle submission via SARS Dispute Resolution</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Escalation to SARS Appeals Committee if required</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Representation by Senior Master Tax Practitioner</span>
                </li>
              </ul>
              <Button asChild className="w-full mt-6 font-bold" variant="outline">
                <Link href="/contact">Select Package</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 5: STRUCTURED FAQS ACCORDION - Actively rendered in UI */}
      <section className="container mx-auto px-4 max-w-4xl py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" /> Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-2">
            Common questions regarding SARS administrative penalties, Section 217/218 remission, and dispute resolution.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="faq-0" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
              What is a SARS Request for Remission (RFR01)?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
              A Request for Remission (RFR01) is the formal statutory process under Chapter 15 of the Tax Administration Act 28 of 2011 (TAA) whereby a taxpayer requests the SARS Commissioner to remit (waive or cancel) administrative non-compliance penalties, late payment penalties, or accrued interest charges assessed against their tax account.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-1" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
              How are Section 211 fixed-amount monthly administrative penalties calculated?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
              Under Section 211 of the TAA, SARS imposes a recurring monthly administrative penalty for each month a required tax return remains unsubmitted (up to 35 months). The penalty amount ranges from R250 per month (for assessed loss or taxable income under R250k) up to R16,000 per month (for taxable income exceeding R50M). If an unfiled return spans multiple months, penalties accumulate rapidly into tens of thousands of Rands.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
              What grounds qualify for remission under Section 217 (nominal non-compliance / first incidence)?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
              Under Section 217 of the TAA, SARS may remit a fixed-amount penalty if the taxpayer has remedied the non-compliance (filed the outstanding return or paid the debt) AND either: (1) it is a first incidence of non-compliance in the preceding 36 months, (2) the duration of non-compliance was under 5 business days with reasonable cause, or (3) the total penalty is less than R2,000 and reasonable grounds for the failure existed.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
              What constitutes exceptional circumstances under Section 218 of the Tax Administration Act?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
              Section 218 authorizes SARS to remit penalties if the failure resulted from extraordinary circumstances beyond the taxpayer control, including: natural or human-made disasters; civil disturbance or public violence; serious illness or physical accident affecting the taxpayer or key financial personnel; profound psychological distress or bereavement; documented SARS eFiling system errors or official website downtime; or postal and third-party delivery delays.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4" className="border rounded-xl px-5 py-2 bg-card shadow-sm">
            <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
              What is the procedure if SARS disallows or rejects my Request for Remission?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
              SARS is required to issue an outcome letter within 21 business days. If SARS disallows the RFR in whole or in part, the taxpayer has the statutory right under Section 104 of the TAA to lodge a formal Notice of Objection (DISP01) within 30 business days of the outcome date, citing legal and factual grounds to the SARS Dispute Resolution division.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* SECTION 6: CLOSING CONVERSION BANNER */}
      <section className="container mx-auto px-4 text-center py-12">
        <div className="max-w-3xl mx-auto p-12 rounded-2xl glass-card border shadow-lg space-y-6">
          <h2 className="text-3xl font-black text-foreground">Stop SARS Penalties From Draining Your Cash Flow</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Do not let administrative penalties accumulate unnoticed on your SARS Statement of Account. Our tax dispute specialists evaluate your assessment and lodge your formal Request for Remission today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button asChild size="lg" className="font-bold px-10 shadow-xl">
              <Link href="/contact">Get Penalty Relief Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold px-8">
              <Link href="/monthly-accounting">Explore Ongoing Tax Compliance</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
