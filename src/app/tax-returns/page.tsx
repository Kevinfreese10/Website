import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { FileText, ArrowRight, User, UserCog, Building, Briefcase } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Tax Return Filing Services South Africa | My Accountant',
        description: 'Professional tax return filing for individuals and companies. ITR12 and ITR14 submissions to SARS. Accurate, on-time filing to avoid penalties. Get your quote today.',
    };
    return getStaticPageMetadata('tax-returns', defaults);
}

export default function TaxReturnsPage() {
  const services = [
    {
      title: "Individual Tax Return (ITR12 — Simple)",
      description: "For salaried employees with straightforward tax affairs. We file your ITR12 accurately using your IRP5, medical aid certificate, and retirement annuity contributions — maximising your refund while ensuring full SARS compliance.",
      icon: User,
      link: "/products/individual-income-tax-return-itr12-simple",
    },
    {
      title: "Complex Individual Tax Return (ITR12)",
      description: "Earn foreign income, rental income, capital gains, or freelance fees? Our complex ITR12 service covers all income sources, applicable deductions, and required schedules to ensure nothing is missed and your tax liability is correctly calculated.",
      icon: UserCog,
      link: "/products/complex-individual-income-tax-return-itr12-filing",
    },
    {
      title: "Company Tax Return (ITR14)",
      description: "Accurate ITR14 filing for trading companies, aligned with your annual financial statements. We calculate corporate income tax, apply allowable deductions, and handle assessed losses — submitted to SARS before the deadline.",
      icon: Building,
      link: "/products/itr14-company-income-tax-return-trading-entities",
    },
    {
      title: "Sole Proprietor Tax Return (ITR12)",
      description: "Sole proprietors have unique tax obligations including business income declarations, allowable business expenses, and wear-and-tear allowances. We prepare your ITR12 with the correct trade schedules to keep you compliant and tax-efficient.",
      icon: Briefcase,
      link: "/products/income-tax-return-for-sole-proprietors-itr12",
    },
  ];

  const faqs = [
    {
      q: "What are the SARS tax return filing deadlines?",
      a: "SARS tax season typically opens in July each year for individual taxpayers. Non-provisional taxpayers filing via eFiling usually have until late October, while provisional taxpayers have until late January of the following year. Companies must file their ITR14 within 12 months of their financial year-end. It's critical to file on time — late submissions attract administrative penalties that accumulate monthly. Contact us early to ensure your return is prepared well before the deadline.",
    },
    {
      q: "What documents do I need to file my tax return?",
      a: "For an individual ITR12, you'll typically need your IRP5/IT3(a) certificate from your employer, medical aid tax certificate (IT3(a)), retirement annuity fund certificate, investment income certificates (IT3(b)), logbook records if claiming travel, rental income statements, and proof of any other income or deductions. For companies filing an ITR14, you'll need signed annual financial statements, a trial balance, and supporting schedules. We provide a complete checklist tailored to your situation when you engage our services.",
    },
    {
      q: "What happens if I submit my tax return late?",
      a: "SARS imposes administrative non-compliance penalties for late submissions under Section 210 of the Tax Administration Act. The penalty amount depends on your taxable income and ranges from R250 to R16,000 per month, accumulating for up to 47 months. Beyond penalties, late filing can affect your tax compliance status, prevent you from obtaining a Tax Clearance Certificate, and delay any refunds you may be owed. If you have outstanding returns from previous years, we can help you catch up and get compliant.",
    },
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Tax Return Filing Services South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Accurate, on-time tax return submissions for individuals and companies. From simple ITR12 filings to complex corporate ITR14 returns — we handle it all so you don&apos;t have to.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">File Your Tax Return Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">Browse Tax Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Services Grid */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Tax Return Services for Every Taxpayer</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm leading-relaxed space-y-4">
                <p>{service.description}</p>
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link href={service.link}>Learn more <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-primary text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Tax Season Doesn&apos;t Have to Be Stressful</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Let our experienced tax practitioners handle your return from start to finish. We collect your documents, prepare your return, maximise your deductions, and submit to SARS — all at an affordable fixed fee.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">File Your Tax Return Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Tax Return Filing FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
