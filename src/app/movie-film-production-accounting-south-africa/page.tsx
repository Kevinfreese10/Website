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
  Award,
  ArrowRight,
  TrendingUp,
  FileText,
  MapPin
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Movie & Film Production Accounting South Africa | My Accountant',
        description: 'Specialised movie and film production accounting services in South Africa. Manage production budgets, SARS Section 12O tax incentives, cast & crew payroll, and VAT audits.',
    };
    return getStaticPageMetadata('movie-film-production-accounting-south-africa', defaults);
}

export default function MovieFilmProductionAccountingSouthAfricaPage() {
  const coreServices = [
    {
      title: "Cost Reporting & Budgeting",
      description: "Match actual expenditures against production budgets. Deliver compliant cost logs for co-productions, investors, and broadcasters (Netflix, Showmax, MultiChoice).",
      icon: Coins
    },
    {
      title: "SARS Section 12O Incentives",
      description: "Expert advisory and record-keeping to maximize your South African Film & TV tax incentive claims. Track qualifying production expenditure (QSAPE).",
      icon: Award
    },
    {
      title: "Fast-Tracked VAT Audits",
      description: "Film productions spend heavily upfront. We structure audit-ready VAT submissions to speed up your refund payouts for equipment, crew, and logistics.",
      icon: FileText
    }
  ];

  const highlights = [
    "Specialised payroll for cast, crew, and foreign talent",
    "Tailored SAG (South African Guild of Actors) tax directive compliance",
    "Corporate governance and SPV (Special Purpose Vehicle) setups",
    "Production wrap audits and post-production compliance files",
    "Comprehensive expense tracking for multi-currency co-productions"
  ];

  const hubs = [
    "Johannesburg (Randburg & Ferndale)", "Cape Town (Woodstock & Waterfront)", "Durban", "Gauteng (Midrand & Sandton)"
  ];

  const faqs = [
    {
      q: "What is Section 12O and how do you help with it?",
      a: "Section 12O of the Income Tax Act provides tax exemption for income derived from certified South African film productions. We assist in setting up proper accounting records, separating qualifying and non-qualifying expenses (QSAPE), and compiling the financial files required by the Department of Trade, Industry and Competition (the dtic) and SARS."
    },
    {
      q: "How does tax withholding work for cast and crew in South Africa?",
      a: "Freelance crew and actors are often considered independent contractors, but they are subject to specific SARS withholding tax rules (e.g. 25% or 30% PAYE for freelance actors unless a SARS tax directive is provided). We handle the complex payroll runs, issue IRP5s, and manage non-resident tax withholding for foreign directors or talent."
    },
    {
      q: "Why is VAT administration so critical for film production companies?",
      a: "Film productions usually incur huge upfront VAT on camera rentals, locations, wardrobe, and catering, while their end-product may be zero-rated (e.g., servicing a foreign production company). This results in large VAT refund claims. SARS flags these for audit. We ensure all invoices conform strictly to the VAT Act so refunds are approved without delay."
    }
  ];

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <section className="relative bg-slate-50 text-slate-900 py-20 lg:py-32 border-b border-slate-200/50 overflow-hidden">
         {/* Spotlight Effect */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
         
         <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
           <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
             <Film className="h-8 w-8 text-primary" />
           </div>
           <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-slate-900">
             Movie & Film Production Accounting in South Africa
           </h1>
           <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
             From script to screen. Keep your production on budget, claim SARS Section 12O incentives, and secure rapid VAT refunds with registered production accountants.
           </p>
           <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
             <Button asChild size="lg" className="font-bold px-10 h-12">
               <Link href="/contact">Book a Production Consultation</Link>
             </Button>
             <Button asChild variant="outline" size="lg" className="font-bold h-12">
               <Link href="/products">Explore Packages</Link>
             </Button>
           </div>
         </div>
       </section>

       {/* Trust Widget */}
       <div className="container mx-auto px-4">
         <TrustIndexWidget />
       </div>

       {/* Core Film Accounting Services */}
       <section className="container mx-auto px-4 max-w-5xl space-y-12">
         <div className="text-center space-y-4">
           <h2 className="text-3xl font-bold text-slate-900">Production-Focused Financial Services</h2>
           <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {coreServices.map((service, i) => (
             <Card key={i} className="border shadow-sm border-border bg-card flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
               <CardHeader className="space-y-3">
                 <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                   <service.icon className="h-6 w-6 text-primary" />
                 </div>
                 <CardTitle className="text-xl font-bold text-slate-900">{service.title}</CardTitle>
               </CardHeader>
               <CardContent className="text-slate-600 text-sm leading-relaxed">
                 {service.description}
               </CardContent>
             </Card>
           ))}
         </div>
       </section>

       {/* Value Proposition */}
       <section className="bg-slate-50 py-16 border-y border-slate-200/50">
         <div className="container mx-auto px-4 max-w-4xl space-y-8">
           <h2 className="text-3xl font-bold text-slate-900 text-center">Behind-the-Scenes Financial Support</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {highlights.map((adv, i) => (
               <div key={i} className="flex items-start gap-3">
                 <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                 <span className="text-sm font-medium text-slate-700">{adv}</span>
               </div>
             ))}
           </div>
         </div>
       </section>

       {/* Regional Film Hubs */}
       <section className="container mx-auto px-4 max-w-5xl space-y-8">
         <div className="text-center space-y-4">
           <h2 className="text-3xl font-bold text-slate-900">Serving South African Film Hubs</h2>
           <p className="text-slate-600 max-w-xl mx-auto">
             We provide remote and on-location accounting services for film, TV, and commercial shoots across major South African production centers:
           </p>
         </div>

         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
           {hubs.map((hub, i) => (
             <div key={i} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-border justify-center font-semibold text-slate-700 shadow-sm text-sm">
               <MapPin className="h-4 w-4 text-primary shrink-0" />
               {hub}
             </div>
           ))}
         </div>
       </section>

       {/* Call To Action */}
       <section className="container mx-auto px-4 max-w-4xl">
         <div className="bg-slate-900 text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl relative overflow-hidden">
           <h3 className="text-3xl font-bold">Simplify Your Production Accounting</h3>
           <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
             Concentrate on your creative vision while our registered SARS tax practitioners handle wraps, payroll administration, compliance files, and tax rebates.
           </p>
           <Button asChild size="lg" className="font-bold h-12">
             <Link href="/contact">Request a Cost Estimate <ArrowRight className="ml-2 h-4 w-4" /></Link>
           </Button>
         </div>
       </section>

       {/* FAQs */}
       <section className="container mx-auto px-4 max-w-4xl space-y-8">
         <div className="text-center space-y-4">
           <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
           <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
         </div>

         <Accordion type="single" collapsible className="w-full">
           {faqs.map((faq, i) => (
             <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
               <AccordionTrigger className="text-left font-bold text-slate-900 py-4 hover:underline">
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
