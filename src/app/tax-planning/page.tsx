import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Target, ArrowRight, Calculator, BookOpen, FileInput, MessageCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Strategic Tax Planning Services South Africa',
        description: 'Proactive tax planning services in South Africa to legally reduce your SARS tax burden. Section 12E SBC structuring, provisional tax, and tax directives.',
    };
    return getStaticPageMetadata('tax-planning', defaults);
}

export default function TaxPlanningPage() {
  const services = [
    {
      title: "Provisional Tax Planning (IRP6)",
      description: "Provisional tax payments can significantly impact your cash flow. We calculate accurate estimates based on projected income, ensuring you don't overpay during the year or face unexpected shortfalls when your final assessment is issued.",
      icon: Calculator,
      link: "/products/provisional-tax-return-irp6-for-trading-entities",
    },
    {
      title: "Comprehensive Tax Strategy",
      description: "Our tax strategists analyse your complete financial picture — income streams, investments, business structures, and retirement planning — to develop a lawful strategy that minimises your effective tax rate both now and in the future.",
      icon: BookOpen,
      link: "/tax-consulting",
    },
    {
      title: "Tax Directive Applications",
      description: "Need a tax directive for a lump sum withdrawal, retirement benefit, or restraint of trade payment? We prepare and submit your application to SARS, ensuring the correct tax rate is applied and preventing unnecessary over-deduction.",
      icon: FileInput,
      link: "/products/tax-directive-application",
    },
    {
      title: "Personalised Tax Planning Session",
      description: "Book a one-on-one session with our tax planning team. We'll review your current tax position, identify optimisation opportunities, and create a forward-looking plan aligned with your personal or business financial goals.",
      icon: MessageCircle,
      link: "/contact",
    },
  ];

  const faqs = [
    {
      q: "Is tax planning legal in South Africa?",
      a: "Yes, tax planning is entirely legal. There is a clear distinction in South African law between tax avoidance (legal) and tax evasion (illegal). Tax planning involves structuring your affairs within the framework of the Income Tax Act to take advantage of legitimate deductions, allowances, exemptions, and rebates. SARS itself recognises that taxpayers are entitled to arrange their affairs to pay the minimum tax required by law. However, aggressive schemes that lack commercial substance may be challenged under the General Anti-Avoidance Rules (GAAR) in Sections 80A–80L of the Income Tax Act.",
    },
    {
      q: "How can I legally reduce my tax in South Africa?",
      a: "There are numerous legal strategies to reduce your tax liability. For individuals, these include maximising retirement annuity contributions (up to 27.5% of taxable income, capped at R350,000 per year), claiming medical tax credits, utilising the annual R40,000 capital gains exclusion, structuring investments in tax-free savings accounts (up to R36,000 per year), and making donations to approved PBOs. For businesses, strategies include accelerated depreciation allowances, the small business corporation tax regime, learnership allowances, and Section 12B renewable energy incentives. Our consultants identify the most impactful strategies for your specific situation.",
    },
    {
      q: "What is a tax directive and when do I need one?",
      a: "A tax directive is an instruction from SARS to a payer (such as a retirement fund or employer) specifying the rate of tax to withhold from a specific payment. You need a tax directive when you receive a lump sum from a retirement fund (withdrawal, retirement, or retrenchment benefit), a restraint of trade payment, a severance benefit, or when an employer wants to apply a specific withholding rate. Without a tax directive, the payer must deduct tax at the maximum marginal rate, which could result in significant over-taxation. We handle the full application process on your behalf.",
    },
  ];

  const taxPlanningSchema = generateServicePillarSchema({
    title: 'Strategic Tax Planning Services South Africa',
    description: 'Proactive tax planning services in South Africa to legally reduce your SARS tax burden. Section 12E SBC structuring, provisional tax, and tax directives.',
    slug: '/tax-planning',
    serviceType: 'TaxPlanningService',
    priceRange: 'From R1,250',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Tax Consulting', url: '/tax-consulting' },
      { name: 'Tax Planning', url: '/tax-planning' },
    ],
    faqs,
  });

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(taxPlanningSchema) }}
      />
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Tax Planning & Strategy South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Pay only what you legally owe — not a cent more. Our proactive tax planning services help South African businesses and individuals structure their affairs for maximum tax efficiency.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Plan Your Tax Strategy</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Strategic Tax Planning Services</h2>
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
          <h3 className="text-3xl font-bold">Start Saving on Tax Today</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            The best time to plan your tax strategy is before the end of the tax year — but the second-best time is now. Let our experts identify opportunities to legally reduce your tax bill.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Plan Your Tax Strategy <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Tax Planning FAQs</h2>
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
