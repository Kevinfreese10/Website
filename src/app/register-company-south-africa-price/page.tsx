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
  Coins,
  ShieldAlert,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Company Registration Price South Africa | CIPC Cost | My Accountant',
        description: 'How much does it cost to register a company in South Africa? View our transparent CIPC registration fees and package pricing with no hidden costs.',
    };
    return getStaticPageMetadata('register-company-south-africa-price', defaults);
}

export default function RegisterCompanySouthAfricaPricePage() {
  const packages = [
    {
      name: "Standard CIPC Pty Ltd",
      price: "R950",
      description: "Ideal for starting out. Official CIPC company registration with immediate tax number.",
      features: [
        "CIPC Filing & Name Reservation Fees",
        "COR14.3 Official Certificate",
        "SARS Income Tax Number",
        "Standard Memorandum of Incorporation (MOI)",
        "Share Certificates for all Directors"
      ]
    },
    {
      name: "Compliance Startup Bundle",
      price: "R1,950",
      description: "Great value. Includes essential certifications to apply for government contracts & corporate work.",
      features: [
        "Everything in the Standard Package",
        "BEE Sworn Affidavit Certificate",
        "SARS Tax Clearance Certificate Pin",
        "Official Bank Account opening assistance",
        "1-Hour Consultation with Senior Accountant"
      ]
    },
    {
      name: "Elite Corporate Package",
      price: "R3,450",
      description: "For high-scale businesses requiring immediate VAT compliance and operational setup.",
      features: [
        "Everything in the Startup Bundle",
        "SARS VAT Registration Submission",
        "UIF & COIDA Registration Setup",
        "Custom Share Shareholders Agreement Draft",
        "3 Months Free Bookkeeping Consultation"
      ]
    }
  ];

  const faqs = [
    {
      q: "What is the official CIPC filing fee in South Africa?",
      a: "The CIPC charges a base fee of R125 for a private company registration without a name reservation, and R175 including name reservation. Our package prices cover all CIPC official filing fees, system admin charges, name reservation fee, and professional handling to ensure compliance."
    },
    {
      q: "Are there any hidden or monthly costs after registration?",
      a: "No, our company registration pricing is a transparent, one-time payment. After registration, the only recurring statutory fee you must pay is your CIPC Annual Return, which is due every year on the anniversary of your registration date (ranging from R100 depending on turnover)."
    },
    {
      q: "Why should I pay a professional to register my company?",
      a: "While you can attempt to register directly, mistakes in name applications, director ID submissions, or MOI selections can lead to rejected transactions, lost fees, and complex amendment processes. Our professionals ensure it is done correctly the first time, including official share certificate drafting."
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
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-foreground">
            Company Registration Price in South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Compare transparent CIPC registration packages. No hidden costs. Get official certificates, share shares, and a SARS tax number.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Select a Package</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="#pricing-comparison">Compare Costs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Widget */}
      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Packages Grid */}
      <section id="pricing-comparison" className="container mx-auto px-4 max-w-6xl space-y-12 scroll-m-24">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Transparent Cost Packages</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, i) => (
            <Card key={i} className={`border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden ${i === 1 ? 'border-2 border-primary/30 relative' : ''}`}>
              {i === 1 && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-bl-lg">
                  Best Value
                </div>
              )}
              <div className="p-6 space-y-4">
                <CardHeader className="p-0 space-y-2">
                  <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground">{pkg.price}</span>
                    <span className="text-xs text-slate-500">once-off</span>
                  </div>
                </CardHeader>
                <p className="text-slate-600 text-xs leading-relaxed">{pkg.description}</p>
                <Separator />
                <ul className="space-y-3 pt-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 pt-0">
                <Button asChild className="w-full font-bold h-10" variant={i === 1 ? 'default' : 'outline'}>
                  <Link href="/contact">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Warning / Advisory */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <div className="flex items-center gap-3 text-red-700">
            <ShieldAlert className="h-8 w-8 shrink-0" />
            <h3 className="text-2xl font-bold">Beware of Extremely Cheap Schemes</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Some online operators advertise company registration prices under R300. Often, these services fail to issue legitimate <strong>Share Certificates</strong> (which legally define ownership) or leave your business unregistered for income tax with SARS. Fixing incomplete registrations can cost thousands of Rands in CIPC amendment and lodging fees.
          </p>
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
