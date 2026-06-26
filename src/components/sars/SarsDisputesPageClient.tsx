'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle, 
  ShieldCheck, 
  Scale, 
  FileText, 
  Gavel, 
  AlertCircle,
  Landmark,
  Calculator,
  TrendingUp,
  Search,
  CheckCircle2,
  Users,
  MapPin,
  ArrowRight,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SarsDisputesPageClient() {
  const serviceList = [
    'SARS objections',
    'SARS appeals',
    'Disputed assessments',
    'VAT disputes',
    'PAYE disputes',
    'Income tax disputes',
    'Penalty disputes',
    'Interest disputes',
    'SARS audit disputes',
    'Estimated assessments',
    'Suspension of payment applications',
    'SARS debt disputes',
  ];

  const commonDisputes = [
    'Additional income tax assessments',
    'VAT adjustments',
    'PAYE disputes',
    'Disallowed expenses or deductions',
    'Estimated assessments',
    'Administrative penalties',
    'Understatement penalties',
    'Interest charges',
    'Audit findings',
    'Customs and excise disputes',
    'Disputes relating to tax debt collection',
  ];

  const objectionServices = [
    'Reviewing SARS assessments',
    'Analysing audit findings',
    'Preparing legal grounds for objection',
    'Drafting detailed objection submissions',
    'Supporting document preparation',
    'Tax legislation analysis',
    'SARS procedural compliance',
    'Uploading objections through eFiling',
    'Managing SARS correspondence',
  ];

  const appealServices = [
    'Notice of Appeal preparation',
    'Alternative dispute resolution support',
    'Tax Board and Tax Court preparation',
    'Legal and financial analysis',
    'Negotiation support',
    'Supporting affidavit preparation',
    'Tax technical submissions',
    'SARS settlement discussions',
  ];

  const auditSupport = [
    'SARS audit responses',
    'Supporting documentation preparation',
    'Tax reconciliation reviews',
    'Financial statement analysis',
    'VAT and payroll reconciliations',
    'Legal response drafting',
    'SARS engagement and negotiations',
  ];

  const industries = [
    'Construction companies',
    'Retail businesses',
    'E-commerce businesses',
    'Property companies',
    'Consultants and freelancers',
    'Production and media companies',
    'Logistics businesses',
    'NGOs and non-profit organisations',
    'Professional service firms',
    'Small and medium enterprises',
  ];

  const whyChooseUs = [
    'Experienced SARS tax practitioners',
    'Knowledge of the Tax Administration Act',
    'Assistance with objections and appeals',
    'SARS audit support',
    'Tax debt negotiation expertise',
    'Online service delivery nationwide',
    'Strategic dispute management',
    'Professional tax analysis',
    'Fast turnaround times',
    'Dedicated client support',
  ];

  const faqs = [
    {
      q: "How do I dispute a SARS assessment?",
      a: "Taxpayers may dispute a SARS assessment by lodging a formal Notice of Objection through SARS eFiling within the prescribed timeframes."
    },
    {
      q: "How long do SARS disputes take?",
      a: "The timeframe varies depending on the complexity of the dispute, SARS response times, and whether the matter proceeds to appeal or Tax Court."
    },
    {
      q: "Can SARS collect money while a dispute is ongoing?",
      a: "Yes. SARS may continue collection action unless a suspension of payment application is approved."
    },
    {
      q: "What happens if SARS rejects my objection?",
      a: "If SARS disallows an objection, taxpayers may lodge an appeal and pursue further dispute resolution procedures."
    },
    {
      q: "Can penalties and interest be disputed?",
      a: "Yes. Certain penalties and interest charges may be disputed or remitted where valid legal grounds exist."
    }
  ];

  return (
    <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
            SARS Dispute Resolution South Africa
          </Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Professional Assistance With SARS <span className="text-gradient">Objections, Appeals</span> & Tax Disputes
          </h1>
          <div className="mx-auto mb-10 max-w-4xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            <p>
              Receiving an additional assessment, audit finding, penalty, or demand from the South African Revenue Service can place significant financial pressure. We provide professional dispute resolution to protect your rights.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold shadow-xl">
              <Link href="/contact">Speak to a Dispute Specialist</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* OVERVIEW SECTION */}
      <section className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Protect Your Rights Under the TAA</h2>
                <p className="text-muted-foreground leading-relaxed">Our experienced tax practitioners assist businesses and individuals with a full range of formal dispute services:</p>
                <div className="grid grid-cols-1 gap-2">
                    {serviceList.map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {item}
                        </div>
                    ))}
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <Gavel className="h-6 w-6" /> What is a SARS Dispute?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A SARS dispute arises when a taxpayer disagrees with an assessment, penalty, decision, or finding. Formal resolution procedures are provided for under the Tax Administration Act.
                  </p>
                  <Separator />
                  <div className="grid grid-cols-1 gap-1.5">
                      {commonDisputes.slice(0, 5).map(d => (
                          <div key={d} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                              <ArrowRight className="h-3 w-3 text-primary" /> {d}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* CORE PILLARS */}
      <section className="py-24">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Objections */}
                <Card className="border-2 border-slate-100 shadow-sm flex flex-col hover:border-primary/20 transition-all">
                    <CardHeader className="pb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <FileText className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">SARS Objections</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Notice of Objection (NOO)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-6">The first formal step in challenging a SARS decision. We ensure submissions are technically aligned with legislation.</p>
                        <ul className="space-y-3">
                            {objectionServices.slice(0, 6).map((service, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Appeals */}
                <Card className="border-2 border-slate-100 shadow-sm flex flex-col hover:border-primary/20 transition-all">
                    <CardHeader className="pb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <Scale className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">SARS Appeals</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Appellate Procedures</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-6">If an objection is disallowed, we represent you in alternative dispute resolution (ADR) and preparaty phases.</p>
                        <ul className="space-y-3">
                            {appealServices.slice(0, 6).map((service, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Audits */}
                <Card className="border-2 border-slate-100 shadow-sm flex flex-col hover:border-primary/20 transition-all">
                    <CardHeader className="pb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <Search className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Audit Disputes</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Verification Support</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-6">Managing SARS engagements early during audits to prevent incorrect assessments and penalties.</p>
                        <ul className="space-y-3">
                            {auditSupport.slice(0, 6).map((service, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs font-medium text-foreground/80">
                                    <CheckCircle2 className="h-4 w-4 text-foreground shrink-0" />
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      {/* SUSPENSION OF PAYMENT */}
      <section className="container mx-auto px-4 max-w-4xl py-12">
          <Card className="border-2 border-destructive/20 bg-destructive/5 shadow-lg overflow-hidden">
              <CardHeader className="bg-destructive/10 pb-4 border-b border-destructive/10">
                  <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-6 w-6" />
                      Suspension of Payment Applications
                  </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                  <p className="text-sm font-medium leading-relaxed">
                    Lodging an objection does NOT automatically stop SARS from collecting debt. We apply for a formal "Suspension of Payment" to protect your cash flow during the dispute.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {[
                          'Legal motivation for suspension',
                          'Financial hardship representations',
                          'SARS collection management',
                          'Debt negotiation support'
                      ].map(item => (
                          <div key={item} className="flex items-center gap-2 text-xs font-bold text-destructive">
                              <CheckCircle className="h-4 w-4 shrink-0" /> {item}
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      </section>

      {/* ESTIMATED ASSESSMENTS */}
      <section className="container mx-auto px-4 max-w-5xl py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">Estimated Assessments & SARS Debt</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    SARS may issue estimates when returns are outstanding or information is incomplete. These often significantly overstate liabilities.
                </p>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        'Reviewing estimated assessments',
                        'Correcting historical returns',
                        'Reconstructing financial records',
                        'Submitting revised information',
                        'Challenging incorrect findings'
                    ].map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {item}
                        </div>
                    ))}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 text-foreground p-8 rounded-3xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-primary">Penalty & Interest Remissions</h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">SARS imposes administrative and understatement penalties (up to 200%). We request remission based on "Reasonable Grounds" or exceptional circumstances.</p>
                  <Button asChild className="w-full font-bold">
                      <Link href="/remission-of-fines">Learn About Remissions</Link>
                  </Button>
              </div>
          </div>
      </section>

      {/* INDUSTRIES & WHY US */}
      <section className="py-24">
          <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-8">
                      <h2 className="text-3xl font-bold text-foreground">Why Choose My Accountant?</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {whyChooseUs.map(item => (
                            <div key={item} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-primary/20 transition-all">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                <span className="text-xs font-bold text-foreground/80">{item}</span>
                            </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Our professionals are associated with recognized organisations including SAICA, CIBA, and SAIT.
                      </p>
                  </div>
                  <div className="space-y-6">
                      <h2 className="text-3xl font-bold text-foreground">Industries We Assist</h2>
                      <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {industries.map(item => (
                                <div key={item} className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                                    <Users className="h-4 w-4 text-primary" /> {item}
                                </div>
                            ))}
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* REGIONAL SEO SECTION */}
      <section className="container mx-auto px-4 max-w-6xl py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><MapPin className="h-6 w-6" /></div>
                  <div className="space-y-4 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-foreground">SARS Dispute Resolution Across South Africa</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        My Accountant provides online SARS dispute resolution services to taxpayers throughout South Africa. Our secure systems allow for professional assistance from anywhere.
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                        {["Johannesburg", "Randburg", "Sandton", "Midrand", "Pretoria", "Durban", "Cape Town", "Gauteng"].map(loc => (
                            <Badge key={loc} variant="outline" className="bg-white border-primary/20 text-primary font-bold">{loc}</Badge>
                        ))}
                    </div>
                  </div>
              </div>
              <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl border-8 border-slate-50">
                  <iframe
                      src="https://www.google.com/maps?q=Stonemill+Office+Park+Johannesburg&output=embed"
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                  ></iframe>
              </div>
          </div>
      </section>

      {/* FAQ SECTION */}
      <section className="container mx-auto px-4 max-w-4xl py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <HelpCircle className="h-8 w-8 text-primary" /> Frequently Asked Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="bg-card/50 border rounded-xl px-6">
                <AccordionTrigger className="text-left font-bold text-foreground hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-sm font-medium pb-6">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
      </section>

      {/* FINAL CTA */}
      <section className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto p-12 rounded-[3rem] bg-slate-50 border border-slate-200/60 text-foreground shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
                <h2 className="text-4xl font-black text-foreground">Speak to a SARS Dispute Specialist</h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    If you are facing a SARS audit, disputed assessment, tax penalties, or collection pressure, we can assist with professional dispute resolution services.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-14 px-12 text-lg font-bold shadow-lg">
                        <Link href="/contact">Contact My Accountant Today</Link>
                    </Button>
                </div>
            </div>
            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none text-foreground/5"><ShieldCheck size={400} /></div>
        </div>
      </section>
    </div>
  );
}

