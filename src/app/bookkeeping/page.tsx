import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { BookOpen, ArrowRight, Calculator, BarChart3, MapPin, Layers } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Professional Bookkeeping Services South Africa | My Accountant',
        description: 'Reliable bookkeeping services across South Africa. Monthly bookkeeping, cloud accounting, bank reconciliations & financial reporting. Affordable packages for SMEs.',
    };
    return getStaticPageMetadata('bookkeeping', defaults);
}

export default function BookkeepingPage() {
  const services = [
    {
      title: "Bookkeeping Services",
      description: "Comprehensive bookkeeping for South African businesses of all sizes. We handle bank reconciliations, creditor and debtor management, general ledger maintenance, and monthly trial balance preparation using cloud-based platforms.",
      icon: Calculator,
      link: "/bookkeeping-services",
    },
    {
      title: "Monthly Accounting",
      description: "Go beyond basic bookkeeping with our monthly accounting service. Receive management-ready financial reports including income statements, balance sheets, and cash flow summaries — giving you the insights to make smarter business decisions.",
      icon: Layers,
      link: "/monthly-accounting",
    },
    {
      title: "Management Accounts",
      description: "Detailed management accounts prepared monthly or quarterly to give business owners, directors, and investors a clear picture of financial performance. Includes variance analysis, ratio analysis, and budget comparisons.",
      icon: BarChart3,
      link: "/products/management-accounts",
    },
    {
      title: "Bookkeeping in Johannesburg",
      description: "Based in Gauteng? Our Johannesburg-focused bookkeeping team understands the unique needs of businesses in the economic hub of South Africa. Local expertise with the convenience of remote, cloud-based service delivery.",
      icon: MapPin,
      link: "/bookkeeping-services-johannesburg",
    },
  ];

  const faqs = [
    {
      q: "What is the difference between bookkeeping and accounting?",
      a: "Bookkeeping is the systematic recording and organising of daily financial transactions — including sales, purchases, receipts, and payments. Accounting takes that recorded data and interprets it to produce financial statements, tax returns, and strategic insights. In practice, a bookkeeper captures the data while an accountant analyses it. Most small businesses in South Africa need both: accurate bookkeeping as the foundation, and professional accounting for compliance and decision-making.",
    },
    {
      q: "How much does bookkeeping cost in South Africa?",
      a: "Bookkeeping fees in South Africa depend on the volume of transactions, whether the business is VAT-registered, and the complexity of the chart of accounts. For a small business processing fewer than 100 transactions per month, fees typically range from R1,500 to R4,000 per month. VAT-registered businesses and those with multiple bank accounts or foreign currency transactions can expect higher fees. Our packages are transparent and all-inclusive — no hidden costs for bank reconciliations or monthly reports.",
    },
    {
      q: "What software do South African bookkeepers use?",
      a: "The most widely used bookkeeping software in South Africa includes Xero, Sage Business Cloud Accounting (formerly Sage One), QuickBooks Online, and Dext (formerly Receipt Bank) for automated receipt capture. These cloud-based platforms allow real-time collaboration between business owners and their bookkeepers, automatic bank feeds from major South African banks, and SARS-ready reporting. Our team is proficient across all major platforms and can recommend the best fit for your business needs and budget.",
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
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Professional Bookkeeping Services South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Keep your books accurate and up to date with professional bookkeeping from a team that understands South African tax and compliance requirements inside out.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get a Bookkeeping Quote</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">Explore Our Services</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Bookkeeping & Financial Reporting</h2>
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
          <h3 className="text-3xl font-bold">Your Books, Sorted — Every Month</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Stop stressing about bank reconciliations and messy records. Our bookkeepers deliver clean, accurate financials every month so you always know where your business stands.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get a Bookkeeping Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Bookkeeping FAQs</h2>
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
