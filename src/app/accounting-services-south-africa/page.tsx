import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  Building2, 
  Calculator, 
  LineChart, 
  ArrowRight,
  ShieldCheck,
  Banknote,
  FileText
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Accounting Services South Africa | Top Accountants | My Accountant',
        description: 'Professional accounting services in South Africa for small to medium businesses. Monthly accounting, management accounts, and bookkeeping on Xero & Sage.',
    };
    return getStaticPageMetadata('accounting-services-south-africa', defaults);
}

export default function AccountingServicesSouthAfricaPage() {
  const services = [
    {
      title: "Monthly Accounting",
      description: "Full-suite accounting packages that include bank reconciliations, VAT submissions, and payroll management.",
      icon: Calculator,
      link: "/monthly-accounting"
    },
    {
      title: "Management Accounts",
      description: "Detailed monthly or quarterly financial reporting to give you insights into profitability and cash flow.",
      icon: LineChart,
      link: "/management-accounts"
    },
    {
      title: "Bookkeeping Services",
      description: "Accurate day-to-day recording of your business transactions on Xero or Sage cloud platforms.",
      icon: FileText,
      link: "/bookkeeping-services"
    }
  ];

  const benefits = [
    {
      title: "Registered Professionals",
      description: "Our accountants are registered with CIBA and SAIT, ensuring compliance and peace of mind.",
      icon: ShieldCheck
    },
    {
      title: "Fixed Monthly Fees",
      description: "No surprise bills. We operate on a fixed retainer basis tailored to your business volume.",
      icon: Banknote
    },
    {
      title: "Cloud-First Approach",
      description: "100% digital workflows using Xero, Sage, and our proprietary client portal.",
      icon: Building2
    }
  ];

  const faqs = [
    {
      q: "Do I need a dedicated accountant for my small business?",
      a: "Yes, even small businesses need proper accounting to ensure SARS compliance (VAT, PAYE, Income Tax) and to maintain good standing with CIPC. An accountant also helps you understand your cash flow and profitability."
    },
    {
      q: "What accounting software do you use?",
      a: "We are certified partners of Xero and Sage Business Cloud Accounting. We can migrate your existing records or set up a brand new profile for you."
    },
    {
      q: "Can you help with historical or overdue accounting?",
      a: "Absolutely. We specialize in 'catch-up' accounting to bring your financial records up to date and resolve any outstanding SARS compliance issues."
    }
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <LineChart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-foreground">
            Top-Rated Accounting Services in South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Outsource your financial management to our team of registered professionals. From daily bookkeeping to complex tax planning and management accounts.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get a Quote</Link>
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

      {/* Core Services */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Our Core Accounting Solutions</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

      {/* Benefits */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Why Choose My Accountant?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-primary">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold">{benefit.title}</h3>
                <p className="text-slate-600 text-sm max-w-xs">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Accounting FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
              <AccordionTrigger className="text-left font-bold text-foreground py-4 hover:underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pl-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
