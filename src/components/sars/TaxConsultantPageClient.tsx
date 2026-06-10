'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, ShieldCheck, Scale, FileText, BadgeDollarSign, Gavel, HelpCircle, FileWarning } from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';

export default function TaxConsultantPageClient() {
  const serviceIncludes = [
    'SARS audit and verification representation',
    'Filing objections (Section 104) and appeals against incorrect assessments',
    'SARS Section 200 Compromise of Debt applications for financial distress',
    'Request for Remission (RFR) of administrative and understatement penalties',
    'Corporate and personal income tax planning and optimization',
    'SARS eFiling profile recovery, merging, and cleanups',
  ];

  const whyChooseUs = [
    {
      title: 'SARS Tax Practitioners',
      description: 'Our consultants hold certified SAIT and CIBA designations with active SARS practitioner IDs.',
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    },
    {
      title: 'Dispute Experts',
      description: 'We specialize in navigating Chapter 9 of the Tax Administration Act for objections and appeals.',
      icon: <Gavel className="h-5 w-5 text-primary" />,
    },
    {
      title: 'Debt Compromises',
      description: 'Proven experience compiling and negotiating Section 200 settlements to reduce actual tax debt.',
      icon: <BadgeDollarSign className="h-5 w-5 text-primary" />,
    },
    {
      title: 'Comprehensive Compliance',
      description: 'We identify root causes of non-compliance to secure long-term Tax Compliance Status (TCS).',
      icon: <CheckCircle className="h-5 w-5 text-primary" />,
    },
  ];

  const faqs = [
    {
      q: 'When should I hire a tax consultant instead of submitting on eFiling myself?',
      a: 'While simple salary returns are straightforward, you should hire a tax consultant if you have multiple income streams, own a business, trade goods internationally, face a SARS audit, or need to lodge a formal objection against an assessment. Professional tax planning can save significant money in legal penalties and incorrect deductions.',
    },
    {
      q: 'What should I do if SARS selects my profile for an audit or verification?',
      a: 'First, do not ignore the notification. SARS verifies profiles regularly. You must submit the requested relevant material (supporting documents) within 21 business days. A tax consultant will review your documents beforehand to ensure they match your submitted returns, preventing automatic adjustments and understatement penalties.',
    },
    {
      q: 'Can you help resolve outstanding tax debt with SARS?',
      a: 'Yes. Under the Tax Administration Act, we can negotiate a deferral of payment (installment agreement) or a Section 200 Debt Compromise. A compromise allows you to settle a tax debt by paying a reduced lump sum, provided you meet strict financial distress requirements.',
    },
    {
      q: 'What is the RFR process for penalties and interest?',
      a: 'A Request for Remission (RFR) is submitted via eFiling to request a waiver of administrative non-compliance penalties or interest. You must have a valid reason, such as a first-time mistake or exceptional circumstances (natural disaster, serious illness, or SARS error). If approved, SARS will credit your account statement.',
    },
  ];

  const keywordButtons = [
    { label: 'SARS Disputes', href: '/sars-disputes' },
    { label: 'SARS Debt Compromise', href: '/sars-compromise' },
    { label: 'Remission of Penalties', href: '/remission-of-fines' },
    { label: 'Tax Clearance Certificate', href: '/products/tax-clearance-certificate' },
    { label: 'ITR14 Company Tax', href: '/products/itr14-company-income-tax-return-trading-entities' },
  ];

  return (
    <div className="space-y-16 pb-16 bg-white">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-slate-50 pt-16 lg:pt-24 pb-20 border-b text-center">
        <div className="container relative z-10 mx-auto px-4 max-w-4xl">
          <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            SARS Tax <span className="text-gradient">Consulting</span> Specialists
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto text-center leading-relaxed">
            Resolve SARS disputes, manage audits, reduce penalties, and optimize corporate tax structuring. Talk to our registered South African Tax Practitioners today for legal compliance and peace of mind.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-6">
            <Button asChild size="lg" className="font-bold px-10 shadow-xl">
              <Link href="/contact">Book a Tax Consultation</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold px-10">
              <Link href="/compliance">Get Free Compliance Check</Link>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-8">
            {keywordButtons.map((btn) => (
              <Button key={btn.label} asChild variant="outline" className="h-9 md:h-11 px-4 md:px-6 rounded-full font-bold transition-all text-xs md:text-sm">
                <Link href={btn.href}>{btn.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <TrustIndexWidget />

      {/* SERVICE AREAS */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Expert SARS Advisory & Disputes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We bridge the gap between businesses and SARS, using the Tax Administration Act to defend your rights and minimize liability.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((card, index) => (
              <Card key={index} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="space-y-4">
                  <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
                    {card.icon}
                  </div>
                  <CardTitle className="text-lg font-bold">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE INCLUDES */}
      <section className="py-16 bg-slate-50 border-y">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">How Our Tax Consultants Can Assist</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {serviceIncludes.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-850 text-sm md:text-base leading-relaxed">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground font-semibold">Answers to common SARS audit, dispute, and debt questions.</p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-slate-50 border rounded-xl px-5 shadow-sm overflow-hidden">
                <AccordionTrigger className="text-left font-bold text-slate-900 hover:no-underline py-4">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="container mx-auto px-4 text-center max-w-3xl py-12">
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 md:p-12 space-y-6">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Facing a SARS Dispute or Audit?</h2>
          <p className="text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto">
            Don't leave your tax affairs to chance. Our registered tax practitioners can review your case and represent you directly with SARS, saving you time and protecting your assets.
          </p>
          <div className="pt-4">
            <Button asChild size="lg" className="shadow-xl font-bold px-10">
              <Link href="/contact">Talk to a Tax Consultant</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
