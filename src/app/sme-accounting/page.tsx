import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Store, ArrowRight, Calculator, BookOpen, BarChart3, Receipt } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'SME & Small Business Accounting Services | My Accountant',
        description: 'Affordable accounting services for SMEs & small businesses in South Africa. Monthly accounting, bookkeeping, management accounts & tax compliance from R1,500/month.',
    };
    return getStaticPageMetadata('sme-accounting', defaults);
}

export default function SmeAccountingPage() {
  const services = [
    {
      title: "Small Business Accounting",
      description: "Purpose-built accounting solutions for South African small businesses. From sole proprietors to growing Pty Ltd companies, we provide accurate financial record-keeping, SARS compliance, and strategic insights that help small businesses thrive without the overhead of a full-time accountant.",
      icon: Calculator,
      link: "/small-business-accounting-south-africa",
    },
    {
      title: "Monthly Accounting",
      description: "Stay on top of your finances with our monthly accounting service. We process your transactions, reconcile bank accounts, prepare monthly financial reports, and ensure your books are always up to date — giving you a clear picture of your business health every month.",
      icon: Receipt,
      link: "/monthly-accounting",
    },
    {
      title: "Bookkeeping Services",
      description: "Accurate bookkeeping is the foundation of sound financial management. Our bookkeeping service covers transaction processing, bank reconciliation, creditor and debtor management, and VAT-ready record-keeping — all tailored to the needs and budgets of small and medium enterprises.",
      icon: BookOpen,
      link: "/bookkeeping",
    },
    {
      title: "Management Accounts",
      description: "Make better business decisions with detailed management accounts prepared monthly or quarterly. Our reports include income statements, balance sheets, cash flow analysis, and KPI dashboards that give SME owners the financial clarity they need to plan, grow, and secure funding.",
      icon: BarChart3,
      link: "/products/management-accounts",
    },
  ];

  const faqs = [
    {
      q: "Do small businesses in South Africa need an accountant?",
      a: "While not legally required for all businesses, having a professional accountant is strongly recommended. SARS requires all registered businesses to maintain accurate financial records and file returns on time. An accountant ensures your books are compliant, helps you claim legitimate tax deductions, avoids costly penalties, and provides the financial insights you need to make informed decisions. For most SMEs, the cost of an accountant is far less than the cost of non-compliance.",
    },
    {
      q: "How much does accounting cost for an SME in South Africa?",
      a: "The cost of accounting services for SMEs in South Africa depends on the size and complexity of your business. Basic bookkeeping and monthly accounting packages typically start from around R1,500 to R3,500 per month for small businesses with low transaction volumes. More comprehensive packages including VAT submissions, payroll, and management accounts range from R4,000 to R8,000 per month. My Accountant offers transparent, fixed-fee packages with no hidden costs.",
    },
    {
      q: "What are the tax obligations for small businesses in South Africa?",
      a: "Small businesses in South Africa must register for income tax and file annual ITR14 returns (for companies) or ITR12 returns (for sole proprietors). If your turnover exceeds R1 million in a 12-month period, VAT registration is compulsory. Employers must register for PAYE, UIF, and SDL, and submit monthly EMP201 returns and annual EMP501 reconciliations. Provisional tax payments (IRP6) are due twice a year. Qualifying small business corporations may benefit from reduced tax rates under the SBC tax regime.",
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
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            SME & Small Business Accounting Services
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Affordable, professional accounting tailored to South African SMEs. From monthly bookkeeping to management accounts and tax compliance — we give small businesses big-firm expertise at SME-friendly prices.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get an SME Accounting Quote</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Accounting Services for SMEs</h2>
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
          <h3 className="text-3xl font-bold">Accounting That Grows With Your Business</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Whether you&apos;re a startup founder or an established SME, our scalable accounting packages are designed to fit your budget today and grow with you tomorrow. Get a free, no-obligation quote.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get Your Free Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">SME Accounting FAQs</h2>
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
