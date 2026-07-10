'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    {
      q: 'How much does a bookkeeper cost per month in South Africa?',
      a: 'The cost of a bookkeeper in South Africa depends entirely on your monthly transaction volume and the complexity of your business. Outsourcing to My Accountant starts with affordable fixed monthly retainers, which is typically 70% cheaper than hiring a full-time, in-house bookkeeper.',
    },
    {
      q: 'Do I need a bookkeeper for a small business in SA?',
      a: 'Yes. Every registered business in South Africa (including Sole Proprietors) is required by SARS to keep accurate financial records. A bookkeeper ensures your bank accounts reconcile, your expenses are categorized correctly, and you are prepared for provisional tax and VAT submissions.',
    },
    {
      q: 'What is the difference between a bookkeeper and a tax practitioner?',
      a: 'A bookkeeper manages the day-to-day recording of your financial transactions (invoicing, bank feeds, expenses). A tax practitioner takes those organized records and legally submits your tax returns (ITR14, EMP201, VAT201) to SARS, representing you in case of audits or disputes.',
    }
  ];

  const keywordButtons = [
    { label: 'Monthly Accounting', href: '/monthly-accounting' },
    { label: 'Management Accounts', href: '/products/management-accounts' },
    { label: 'VAT Registration', href: '/products/vat-registration' },
    { label: 'SARS Services', href: '/products#sars-services' },
    { label: 'Payroll Services', href: '/products#payroll-services' },
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

        <div className="container relative z-10 mx-auto px-4 max-w-4xl">
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Professional <span className="text-gradient">Bookkeeping</span> Services
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto text-center leading-relaxed">
            Focus on growing your business while our certified team handles your daily books, bank reconciliations, and ledgers in South Africa. Get clean, compliant, and tax-ready financial records.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-6">
            <Button asChild size="lg" className="font-bold px-10 shadow-xl">
              <Link href="/contact">Get a Bookkeeping Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold px-10 border-primary">
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
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Why Outsource Your Bookkeeping to Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Get peace of mind and professional excellence at a fraction of the cost of a full-time employee.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((card, index) => (
              <Card key={index} className="glass-card border shadow-sm hover:shadow-md transition-shadow">
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
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">What Our Bookkeeping Service Covers</h2>
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

      {/* ACCOUNTING SOFTWARE */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Which Accounting Software Do You Use?</h2>
            <p className="text-sm text-muted-foreground font-semibold">We are certified partners for South Africa's leading cloud platforms.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#13b5ea]">Xero Accounting</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm leading-relaxed">
                As Xero Silver Partners, we highly recommend Xero for its automated bank feeds, intuitive dashboard, and seamless integration with hundreds of apps (like Hubdoc for receipt scanning). It is perfect for SMEs looking for real-time data.
              </CardContent>
            </Card>
            <Card className="border shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[#00d639]">Sage Business Cloud</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm leading-relaxed">
                Sage is a powerful, locally-compliant software excellent for South African VAT tracking and inventory management. Our Sage Certified Advisers can train your team or manage the entire platform on your behalf.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground font-semibold">Everything you need to know about bookkeeping and invoicing setups.</p>
          </div>
          <div className="w-full space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="container mx-auto px-4 text-center max-w-3xl py-12">
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 md:p-12 space-y-6">
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Ready to Clean Up Your Accounts?</h2>
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
