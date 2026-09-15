import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { ShieldCheck, ArrowRight, FileCheck, KeyRound, ClipboardCheck, BadgeDollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Tax Compliance Services in South Africa | My Accountant',
        description: 'Stay SARS compliant with expert tax compliance services. Tax clearance certificates, compliance audits, and tax health reviews for South African businesses and individuals.',
    };
    return getStaticPageMetadata('tax-compliance', defaults);
}

export default function TaxCompliancePage() {
  const services = [
    {
      title: "Tax Clearance Certificate (TCC)",
      description: "Obtain your SARS Tax Clearance Certificate for tenders, emigration, or good standing purposes. We handle the full application process, ensuring your tax affairs are in order before submission to avoid delays or rejections.",
      icon: FileCheck,
      link: "/products/tax-clearance-certificate",
    },
    {
      title: "Tax Clearance PIN",
      description: "Apply for a SARS Tax Clearance PIN — the digital verification tool that allows third parties to confirm your tax compliance status in real time. Essential for government tenders and supplier applications.",
      icon: KeyRound,
      link: "/products/tax-clearance-pin",
    },
    {
      title: "Full Compliance Health Check",
      description: "Our comprehensive compliance review covers income tax, VAT, PAYE, and UIF obligations. We identify outstanding returns, unresolved queries, and compliance gaps before SARS does — helping you avoid penalties and interest.",
      icon: ClipboardCheck,
      link: "/compliance",
    },
    {
      title: "SARS Tax Refund Assistance",
      description: "If SARS owes you money, we help you claim it. From verifying your assessment to following up on delayed refunds and resolving verification queries, we ensure you receive every rand you're entitled to.",
      icon: BadgeDollarSign,
      link: "/sars-tax-refund",
    },
  ];

  const faqs = [
    {
      q: "What are the penalties for non-compliance with SARS?",
      a: "SARS imposes administrative non-compliance penalties under Section 210 of the Tax Administration Act. These range from R250 to R16,000 per month depending on your assessed taxable income, and they accumulate for every month a return remains outstanding — up to a maximum of 47 months. Additionally, SARS can charge interest on unpaid tax at the prescribed rate, issue a reduced assessment, or initiate criminal proceedings for deliberate tax evasion.",
    },
    {
      q: "How do I become tax compliant in South Africa?",
      a: "To achieve full SARS tax compliance, you need to ensure all your tax returns (ITR12, ITR14, VAT201, EMP201, EMP501) are filed up to date, all assessed taxes are paid or arrangements are in place, your registered details are current, and there are no outstanding SARS queries or disputes. Our compliance health check identifies every gap and creates a prioritised action plan to bring you into good standing as quickly as possible.",
    },
    {
      q: "What is a Tax Clearance Certificate and when do I need one?",
      a: "A Tax Clearance Certificate (TCC) is an official SARS document confirming that your tax affairs are in order. You typically need one when applying for government tenders (via the CSD), emigrating and transferring funds through the South African Reserve Bank, applying for certain licences, or when a third party requires proof of tax compliance. Since 2015, SARS has moved to a PIN-based verification system, but the underlying compliance requirements remain the same.",
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
          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Tax Compliance Services in South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Avoid SARS penalties and keep your tax affairs in perfect order. From tax clearance certificates to full compliance health checks, we ensure your business stays on the right side of the law.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get Tax Compliant Today</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View All Services</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Our Tax Compliance Services</h2>
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
        <div className="bg-primary text-white p-8 lg:p-12 rounded-xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Don&apos;t Wait for a SARS Audit</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Proactive compliance saves you money and stress. Let our team review your entire tax profile, resolve outstanding issues, and keep you penalty-free — starting today.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get Tax Compliant Today <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Tax Compliance FAQs</h2>
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
