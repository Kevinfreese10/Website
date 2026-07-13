import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { LineChart, ArrowRight, Briefcase, BarChart3, FileSignature, MessageCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Financial Advisory & Consulting Services | My Accountant',
        description: 'Expert financial advisory services in South Africa. Fractional CFO, financial planning, debt restructuring & loan support. Strategic guidance for growing businesses.',
    };
    return getStaticPageMetadata('financial-advisory', defaults);
}

export default function FinancialAdvisoryPage() {
  const services = [
    {
      title: "Fractional CFO Services",
      description: "Access experienced CFO-level financial leadership without the full-time salary. Our fractional CFOs provide strategic cash flow management, financial forecasting, investor reporting, and boardroom-ready insights tailored to your growth stage.",
      icon: Briefcase,
      link: "/fractional-cfo-services-south-africa",
    },
    {
      title: "Management Accounts & Reporting",
      description: "Monthly and quarterly management accounts that translate raw financial data into actionable business intelligence. Includes profit and loss analysis, cash flow projections, KPI dashboards, and variance commentary to keep you in control.",
      icon: BarChart3,
      link: "/management-accounts",
    },
    {
      title: "Accountant's Letters & Certifications",
      description: "Need a letter of good standing, confirmation of income, or a certified financial opinion for a bank loan, tender, or visa application? We prepare professional accountant's letters that meet the requirements of financial institutions and government bodies.",
      icon: FileSignature,
      link: "/products/accountants-letter",
    },
    {
      title: "Personalised Financial Consultation",
      description: "Book a one-on-one consultation with a senior financial advisor to discuss your unique situation — whether it's business restructuring, estate planning, debt management, or preparing for a funding round. Practical advice, no jargon.",
      icon: MessageCircle,
      link: "/contact",
    },
  ];

  const faqs = [
    {
      q: "What does a financial advisor do?",
      a: "A financial advisor helps individuals and businesses make informed decisions about managing, growing, and protecting their wealth. For businesses, this includes cash flow optimisation, financial forecasting, capital structuring, risk management, and strategic planning. For individuals, advisory services may cover tax-efficient investment strategies, retirement planning, estate planning, and debt management. Unlike an accountant who focuses on historical compliance and reporting, a financial advisor is forward-looking — helping you plan for what comes next.",
    },
    {
      q: "What is the difference between a financial advisor and an accountant?",
      a: "An accountant primarily handles the recording, reporting, and compliance aspects of your finances — bookkeeping, tax returns, financial statements, and SARS submissions. A financial advisor, on the other hand, focuses on strategic planning and future-oriented decision-making such as cash flow forecasting, investment analysis, business valuations, and funding strategies. Many businesses benefit from both: an accountant to keep the books accurate and compliant, and a financial advisor to guide growth and mitigate risks. At My Accountant, we offer both under one roof.",
    },
    {
      q: "When should I get financial advisory help?",
      a: "You should consider engaging a financial advisor when your business is experiencing rapid growth, preparing for a funding round, undergoing restructuring, or facing cash flow challenges. Other common triggers include taking on significant debt, entering a new market, planning for succession or exit, or needing to present financials to investors or lenders. For individuals, key moments include major life events like starting a business, buying property, inheritance planning, or approaching retirement. Early advisory intervention often saves significant money compared to reactive problem-solving.",
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
            <LineChart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Financial Advisory &amp; Consulting Services
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Strategic financial guidance from experienced advisors who understand the South African business landscape. From fractional CFO services to debt restructuring — we help you plan, grow, and protect your wealth.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Speak to a Financial Advisor</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View Our Services</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Advisory & Consulting Services</h2>
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
          <h3 className="text-3xl font-bold">Make Smarter Financial Decisions</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Whether you need a fractional CFO to steer your growth strategy or expert advice on a specific financial challenge, our advisory team is ready to help you move forward with confidence.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Speak to a Financial Advisor <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Financial Advisory FAQs</h2>
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
