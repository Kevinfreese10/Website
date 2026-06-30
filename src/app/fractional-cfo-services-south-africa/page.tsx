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
  Briefcase,
  Check,
  ArrowRight,
  TrendingUp,
  Presentation,
  DollarSign
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Fractional CFO Services South Africa | Outsourced CFO | My Accountant',
        description: 'Access executive financial leadership at a fraction of the cost. Our outsourced CFO services in South Africa cover strategy, cash flow management, and board reports.',
    };
    return getStaticPageMetadata('fractional-cfo-services-south-africa', defaults);
}

export default function FractionalCfoServicesSouthAfricaPage() {
  const services = [
    {
      title: "Strategic Financial Planning",
      description: "Building 3-to-5 year financial forecasts, budgeting, and aligning your financial structure to support rapid business scaling.",
      icon: TrendingUp
    },
    {
      title: "Board Pack & Report Compilation",
      description: "Creating professional monthly and quarterly board packs, financial slide decks, and delivering executive insights to shareholders.",
      icon: Presentation
    },
    {
      title: "Cash Flow & Capital Management",
      description: "Advanced working capital optimization, cash flow run-rate forecasting, and strategic advisory for capital raising or debt restructuring.",
      icon: DollarSign
    }
  ];

  const highlights = [
    "Registered Chartered Business Accountants (CIBA) and Tax Practitioners",
    "Tailored dashboard reporting linking accounting software (Xero/Sage/Zoho)",
    "Assistance with mergers, acquisitions, and business valuations",
    "Independent oversight of your internal bookkeeping and billing teams",
    "Strategic support for commercial negotiations and large contracts"
  ];

  const faqs = [
    {
      q: "What is a Fractional CFO?",
      a: "A Fractional CFO (Chief Financial Officer) is an experienced finance executive who provides strategic financial management on a part-time or contract basis. This allows small and medium-sized enterprises (SMEs) to access senior corporate experience without the high salary commitment of a full-time hire."
    },
    {
      q: "How does this differ from standard monthly bookkeeping?",
      a: "Bookkeeping focuses on recording historical transactions and compliance (VAT, payroll). A Fractional CFO focuses on the future: analyzing margins, managing cash flow runway, designing financial strategies, preparing board packs, and advising on capital allocation."
    },
    {
      q: "What does a typical fractional CFO retainer cost in South Africa?",
      a: "Pricing is highly customized depending on the size of your business and the frequency of interaction. Typically, retainers start from R7,500 per month for monthly advisory and review, scaling upward for weekly strategic workshops and board-level involvement."
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
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-foreground">
            Fractional CFO Services in South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Executive financial leadership to scale your business. Access senior corporate advisory, cash flow modeling, and board reporting at a fraction of the cost.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Book a Strategy Session</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="#services">Explore CFO Offerings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Widget */}
      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* CFO Offerings */}
      <section id="services" className="container mx-auto px-4 max-w-5xl space-y-12 scroll-m-24">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Our Strategic CFO Services</h2>
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
              <CardContent className="text-slate-600 text-sm leading-relaxed">
                {service.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold text-foreground text-center">Why Partner With Our Fractional CFOs?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((hl, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-foreground/80">{hl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-slate-900 text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Access Corporate Finance Expertise Today</h3>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Stop making critical business decisions blindly. Set up a consultation to see how an outsourced CFO can restructure your balance sheet and optimize your margins.
          </p>
          <Button asChild size="lg" className="font-bold h-12">
            <Link href="/contact">Request CFO Advisory <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
