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
  Film,
  Coins,
  Users,
  MapPin,
  ArrowRight,
  Tv,
  Calendar,
  Layers
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Movie & Film Production Accountant Randburg | My Accountant',
        description: 'Professional film and TV production accountants in Randburg. Supporting production companies near MultiChoice, Ferndale, and Johannesburg. SARS compliance, cost reporting, and payroll.',
    };
    return getStaticPageMetadata('movie-film-production-accountant-randburg', defaults);
}

export default function MovieFilmProductionAccountantRandburgPage() {
  const localServices = [
    {
      title: "Studio & Location Proximity",
      description: "Conveniently located in Darrenwood / Randburg, right on the doorstep of MultiChoice City (DSTV/M-Net) and Ferndale production houses. We support on-site wraps.",
      icon: MapPin
    },
    {
      title: "Cast & Crew Payroll",
      description: "Handle monthly and weekly payroll runs for local actors, freelance crew, directors, and extras, ensuring proper SARS withholding tax compliance.",
      icon: Users
    },
    {
      title: "SPV & Wrap Reporting",
      description: "Establish dedicated Special Purpose Vehicles (SPVs) for individual productions, compile cost reports, and deliver audit-ready wrap files.",
      icon: Layers
    }
  ];

  const benefits = [
    "Expertise in South African Guild of Actors (SAGA) tax directive administration",
    "Rapid VAT201 submissions to reclaim input VAT on production rentals and logistics",
    "Direct integration with Xero, Sage, or custom production cost logs",
    "Close proximity to Johannesburg's major broadcasting and editing suites",
    "Compliance management (UIF, SDL, and COIDA Letter of Good Standing)"
  ];

  const suburbs = [
    "Ferndale", "Darrenwood", "Linden", "Blairgowrie", "Bordeaux", "Sandton", "Kensington B", "Robindale"
  ];

  const faqs = [
    {
      q: "Can you provide production accountants to work on-site at Randburg studios?",
      a: "Yes. While we leverage cloud tools (Xero, Google Workspace) for ongoing bookkeeping, our proximity to the Randburg/Ferndale studio hub allows us to attend on-site production wraps, run physical audits, and coordinate directly with your line producers."
    },
    {
      q: "How do you help Randburg creative agencies and boutique production houses?",
      a: "Boutique studios often struggle with the cash-flow volatility of commercial and TV shoots. We help you manage working capital, track project budgets (actual vs. budget), and handle PAYE and VAT compliance so you stay audit-safe."
    },
    {
      q: "Do you assist freelance crew members with their personal tax returns?",
      a: "Absolutely. In addition to serving production companies, we advise freelance directors, camera operators, editors, and makeup artists on claiming home office deductions, equipment depreciation, and managing their biannual provisional tax submissions."
    }
  ];

  return (
    <div className="space-y-16 pb-24 bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-24 lg:py-36 border-b border-white/[0.06] overflow-hidden">
        {/* Spotlight Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Tv className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white animate-fade-in">
            Film & TV Production Accountant in Randburg
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Supporting Randburg's creative industry. Registered accountants specializing in cost tracking, cast & crew payroll, and SARS tax compliance for production studios.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12 bg-primary text-slate-900 hover:bg-primary/90">
              <Link href="/contact">Schedule a Local Consultation</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12 border-white/10 text-white hover:bg-white/[0.05]">
              <Link href="/products">View Accounting Packages</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Widget */}
      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Localized Services */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">Tailored Solutions for Randburg Filmmakers</h2>
          <Separator className="w-16 mx-auto bg-primary/30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {localServices.map((service, i) => (
            <Card key={i} className="border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold text-white">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-400 text-sm leading-relaxed">
                {service.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-slate-900 py-16 border-y border-white/[0.06]">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold text-white text-center">Why Work With a Local Production Accountant?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suburbs We Serve */}
      <section className="container mx-auto px-4 max-w-5xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">Serving the Randburg Creative District</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            We work with production houses, freelance crew, and creative agencies throughout Randburg and surrounding neighborhoods:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {suburbs.map((suburb, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-lg border border-white/10 justify-center font-semibold text-slate-300 shadow-sm text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              {suburb}
            </div>
          ))}
        </div>
      </section>

      {/* Call To Action */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl relative overflow-hidden">
          <h3 className="text-3xl font-bold">Ready to wrap your next project?</h3>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            From single-day commercials to long-form series, our Darrenwood-based team ensures your film finances are structured, compliant, and optimized.
          </p>
          <Button asChild size="lg" className="font-bold h-12 bg-primary text-slate-900 hover:bg-primary/90">
            <Link href="/contact">Book a Free Local Meetup <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <Separator className="w-16 mx-auto bg-primary/30" />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-white/10">
              <AccordionTrigger className="text-left font-bold text-white py-4 hover:underline">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                  {faq.q}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 leading-relaxed pl-7">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
