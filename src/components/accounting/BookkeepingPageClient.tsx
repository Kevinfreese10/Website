'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, ShieldCheck, Scale, FileText, BadgeDollarSign, Laptop, Users, CalendarClock, History } from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';

export default function BookkeepingPageClient() {
  const serviceIncludes = [
    'Daily or monthly processing of financial transactions',
    'Bank, credit card, and petty cash reconciliations',
    'Maintenance of sales (debtors) and purchase (creditors) ledgers',
    'Preparation of monthly management reports',
    'Setting up and optimizing cloud accounting software (Xero, Sage, QuickBooks)',
    'Preparation of year-end folders for annual audit or AFS drafting',
  ];

  const whyChooseUs = [
    {
      title: 'Dedicated Bookkeepers',
      description: 'Your accounts are handled by qualified professionals supervised by CIBA members.',
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      title: 'Cloud Accounting Integration',
      description: 'We are certified partners of Xero and Sage, ensuring modern, real-time access to numbers.',
      icon: <Laptop className="h-5 w-5 text-primary" />,
    },
    {
      title: 'Fixed Monthly Plans',
      description: 'Transparent pricing that scales with your transaction volume—no surprise billable hours.',
      icon: <BadgeDollarSign className="h-5 w-5 text-primary" />,
    },
    {
      title: 'Tax-Ready Reconciliations',
      description: 'We ensure all VAT, PAYE, and income tax categorizations are 100% compliant with SARS guidelines.',
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    },
  ];

  const faqs = [
    {
      q: 'What is the difference between bookkeeping and accounting?',
      a: 'Bookkeeping is the administrative process of recording daily transactions, reconciling bank statements, and keeping files organized. Accounting takes that recorded data to prepare statutory financial statements, analyze financial performance, tax structure, and handle SARS compliance audits. At My Accountant, we provide both seamlessly.',
    },
    {
      q: 'Which accounting platforms do you support?',
      a: 'We work primarily with Xero, Sage Business Cloud Accounting, and QuickBooks Online. If you do not have software yet, our team will set up and customize a Xero or Sage profile for your business as part of onboarding.',
    },
    {
      q: 'How do I submit my bank statements and invoices to my bookkeeper?',
      a: 'You can upload documents securely through our digital client portal, integrate automated bank feeds directly, or forward digital supplier invoices to a dedicated email address that extracts invoice data automatically.',
    },
    {
      q: 'Can you clean up my previous years’ messy bookkeeping records?',
      a: 'Yes! We specialize in "catch-up bookkeeping" for dormant or legacy entities. We will reconstruct your records, compile them into compliant ledgers, and prepare them for tax filing to bring your business back to good standing.',
    },
  ];

  const keywordButtons = [
    { label: 'Monthly Accounting', href: '/monthly-accounting' },
    { label: 'Management Accounts', href: '/products/management-accounts' },
    { label: 'VAT Registration', href: '/products/vat-registration' },
    { label: 'SARS Services', href: '/products#sars-services' },
    { label: 'Payroll Services', href: '/products#payroll-services' },
  ];

  return (
    <div className="space-y-16 pb-16 bg-white">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-slate-50 pt-16 lg:pt-24 pb-20 border-b text-center">
        <div className="container relative z-10 mx-auto px-4 max-w-4xl">
          <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            Professional <span className="text-gradient">Bookkeeping</span> Services
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto text-center leading-relaxed">
            Focus on growing your business while our certified team handles your daily books, bank reconciliations, and ledgers in South Africa. Get clean, compliant, and tax-ready financial records.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-6">
            <Button asChild size="lg" className="font-bold px-10 shadow-xl">
              <Link href="/contact">Get a Bookkeeping Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold px-10">
              <Link href="/products">View Accounting Packages</Link>
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

      {/* WHY CHOOSE US */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Why Outsource Your Bookkeeping to Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Get peace of mind and professional excellence at a fraction of the cost of a full-time employee.</p>
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
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">What Our Bookkeeping Service Covers</h2>
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
            <p className="text-sm text-muted-foreground font-semibold">Everything you need to know about bookkeeping and invoicing setups.</p>
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
          <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Ready to Clean Up Your Accounts?</h2>
          <p className="text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto">
            Request a call from our onboarding team. We will review your transaction volumes and suggest a perfect custom plan to suit your budget.
          </p>
          <div className="pt-4">
            <Button asChild size="lg" className="shadow-xl font-bold px-10">
              <Link href="/contact">Speak with a Bookkeeper</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
