import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  CheckCircle2, 
  HelpCircle,
  Server,
  Check,
  ArrowRight,
  Database
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Sage Accountant South Africa | Pastel Support | My Accountant',
        description: 'Expert Sage accounting and Pastel support for South African businesses. Transition to the cloud, automate payroll, and stay compliant with SARS.',
    };
    return getStaticPageMetadata('sage-accountant-south-africa', defaults);
}

export default function SageAccountantSouthAfricaPage() {
  const services = [
    {
      title: "Sage Business Cloud Setup",
      description: "Complete setup of Sage Business Cloud Accounting (formerly Sage One). We configure charts of accounts, customer groups, and item lists."
    },
    {
      title: "Sage Pastel Desktop Support",
      description: "Support for legacy Pastel Partner and Evolution. We help with database cleanups, back-up issues, and yearly rollovers."
    },
    {
      title: "Sage Payroll Integration",
      description: "Connect Sage Payroll to your general ledger for seamless reporting of salaries, wages, PAYE, and UIF."
    }
  ];

  const benefits = [
    "Registered Sage partners assisting your setup",
    "Backlog bookkeeping and ledger review services",
    "Pastel desktop to Sage Cloud migration experts",
    "Compliant VAT201 reporting directly from Sage data",
    "Year-end financial statement preparation from Sage reports"
  ];

  const faqs = [
    {
      q: "Can you help migrate my offline Pastel database to the cloud?",
      a: "Yes. We specialize in migrating legacy desktop Pastel Partner or Xpress databases directly to Sage Business Cloud Accounting, ensuring you keep your customer history and ledger balances."
    },
    {
      q: "Which is better for South African businesses: Xero or Sage?",
      a: "Both platforms are highly capable. Sage has a strong legacy in South Africa and is popular with accountants due to its robust inventory management and Pastel compatibility, while Xero offers an exceptionally modern user interface. We support both and help you choose the best fit."
    },
    {
      q: "How does Sage handle SARS VAT submissions?",
      a: "Sage Business Cloud generates standard South African VAT201 audit reports. We review these ledgers monthly to ensure accurate classification before submitting them on eFiling."
    }
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Server className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-foreground">
            Sage Pastel & Business Cloud Accountants South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Reliable Sage accounting and Pastel software solutions. Move your offline databases to the cloud or optimize your existing setup.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get Sage Support</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">Explore Bookkeeping Packages</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Widget */}
      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Sage Offerings */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Our Professional Sage & Pastel Services</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-xs leading-relaxed">
                {service.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold text-foreground text-center">Why Outsource Your Sage Bookkeeping to Us?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-foreground/80">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-slate-900 text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Need Sage Support or Migration?</h3>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Whether you run Pastel Partner, Evolution, or Sage Business Cloud, our certified advisors will ensure your financial records are clean and tax-compliant.
          </p>
          <Button asChild size="lg" className="font-bold h-12">
            <Link href="/contact">Book a Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
              <AccordionTrigger className="text-left font-bold text-foreground py-4 hover:underline">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                  {faq.q}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pl-7">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
