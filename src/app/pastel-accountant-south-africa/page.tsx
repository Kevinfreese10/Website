import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Pastel Accountant South Africa | Partner & Evolution | My Accountant',
        description: 'Professional Sage Pastel accounting, database cleanup, and support. We assist with legacy Pastel Partner to Sage Cloud migrations.',
    };
    return getStaticPageMetadata('pastel-accountant-south-africa', defaults);
}

export default function PastelAccountantSouthAfricaPage() {
  const offerings = [
    {
      title: "Pastel Partner Support",
      description: "Comprehensive processing support, chart of accounts restructuring, bank manager statement imports, and backup troubleshooting."
    },
    {
      title: "Sage Evolution (BIC) Reporting",
      description: "Advanced business intelligence reports setup, segment tracking configuration, and multisite inventory reconciliation."
    },
    {
      title: "Pastel Database Repair & Cleanup",
      description: "Resolving out-of-balance ledgers, database corruptions, incorrect VAT categories mapping, and rollover errors."
    }
  ];

  const highlights = [
    "Experienced Pastel desktop support technicians",
    "Processing backlog clearance and account reconciliations",
    "Transition from desktop Pastel to Sage Business Cloud Accounting",
    "Official year-end audits and Annual Financial Statements",
    "SARS audit support and documentation preparation from Pastel history"
  ];

  const faqs = [
    {
      q: "Can you assist with a Pastel year-end rollover?",
      a: "Yes. Year-end rollovers in desktop Pastel Partner require precise backups and audit trail verifications. We perform this process safely to ensure no financial data is corrupted or lost."
    },
    {
      q: "Do you support Sage Evolution ERP?",
      a: "Yes, our senior accounting consultants have extensive experience supporting Sage Pastel Evolution, handling branch accounting integrations, and customizing Business Intelligence Centre (BIC) templates."
    },
    {
      q: "How do we collaborate on a desktop Pastel file?",
      a: "We accommodate both remote server connections (e.g. VPN or Remote Desktop) and physical backup restorations. For continuous work, we strongly recommend migrating to Sage Cloud or Xero, which we manage for you."
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
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Pastel Partner & Evolution Accounting Services South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Professional Sage Pastel accounting, database rollovers, backlog cleanups, and seamless cloud migrations under registered expert supervision.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get Pastel Support</Link>
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

      {/* Pastel Offerings */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Our Desktop Pastel & Evolution Support</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {offerings.map((offering, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">{offering.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-xs leading-relaxed">
                {offering.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold text-foreground text-center">Pastel Processing & Compliance Experts</h2>
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
          <h3 className="text-3xl font-bold">Struggling with Pastel Errors or Rollovers?</h3>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Our Pastel accounting consultants will diagnose database corruptions, process historical transactions, and help you transition smoothly to the next financial year.
          </p>
          <Button asChild size="lg" className="font-bold h-12">
            <Link href="/contact">Book Pastel Support <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                  {faq.q}
                </div>
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
