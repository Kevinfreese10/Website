import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Calendar, ArrowRight, FileText, FileX, RefreshCw, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Provisional Tax (IRP6) Services South Africa | My Accountant',
        description: 'Expert IRP6 provisional tax filing services in South Africa. We handle bi-annual submissions, estimated tax payments & SARS compliance. Get your IRP6 filed on time.',
    };
    return getStaticPageMetadata('provisional-tax', defaults);
}

export default function ProvisionalTaxPage() {
  const services = [
    {
      title: "IRP6 Filing for Trading Entities",
      description: "Complete IRP6 provisional tax return preparation and submission for active trading businesses. We calculate your estimated taxable income, apply the correct rates, and file directly with SARS before the deadline.",
      icon: FileText,
      link: "/products/irp6-provisional-tax-return-filing-for-trading-entities",
    },
    {
      title: "IRP6 Nil Returns",
      description: "If your company or trust had no taxable income during the period, a nil IRP6 return must still be submitted to SARS. We ensure your nil return is filed correctly and on time to avoid unnecessary penalties.",
      icon: FileX,
      link: "/products/irp6-provisional-tax-return-nil",
    },
    {
      title: "Provisional Tax Return Submissions",
      description: "End-to-end provisional tax return services covering both the first and second provisional tax periods. We review your financials, estimate your liability, and submit your IRP6 with supporting schedules.",
      icon: RefreshCw,
      link: "/products/provisional-tax-return-irp6-for-trading-entities",
    },
    {
      title: "Full Tax Services",
      description: "Beyond provisional tax, we offer comprehensive tax services including income tax returns, VAT, PAYE, and SARS dispute resolution. Let us manage your entire tax compliance calendar so you never miss a deadline.",
      icon: Shield,
      link: "/tax-services-south-africa",
    },
  ];

  const faqs = [
    {
      q: "Who must pay provisional tax in South Africa?",
      a: "Any person who earns income that is not subject to employees' tax (PAYE) must register as a provisional taxpayer. This includes sole proprietors, freelancers, companies, close corporations, and trusts that derive taxable income. Salaried employees who earn additional income — such as rental income, freelance fees, or investment returns exceeding R30,000 per year — are also required to submit provisional tax returns.",
    },
    {
      q: "What are the IRP6 submission deadlines?",
      a: "For taxpayers with a February year-end, the first provisional tax payment (IRP6) is due by 31 August, and the second payment is due by the last day of February the following year. An optional third 'top-up' payment can be made by 30 September to reduce interest charges. Companies with different financial year-ends follow a similar six-month cycle based on their year-end date. Late submissions attract penalties and interest from SARS.",
    },
    {
      q: "What penalties apply for late provisional tax submissions?",
      a: "SARS imposes a 10% penalty on the estimated tax amount if your IRP6 return is submitted late or not at all. If your estimate of taxable income is less than 80% of the actual taxable income (or less than 90% for taxable income exceeding R1 million), SARS may levy an additional underestimation penalty of up to 20%. Interest is also charged on any underpayment from the due date until the date of final assessment.",
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
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Provisional Tax (IRP6) Services South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Stay ahead of SARS deadlines with accurate IRP6 provisional tax returns. We calculate your estimated liability, prepare your submissions, and file on time — every time.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">File Your IRP6 Return</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View All Tax Services</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Our Provisional Tax Services</h2>
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
          <h3 className="text-3xl font-bold">Don&apos;t Risk Penalties — File Your IRP6 Today</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Late provisional tax submissions attract hefty penalties and interest from SARS. Let our tax professionals handle your IRP6 so you can focus on running your business.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">File Your IRP6 Return <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Provisional Tax FAQs</h2>
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
