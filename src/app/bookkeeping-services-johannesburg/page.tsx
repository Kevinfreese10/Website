import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ArrowRight, 
  HelpCircle,
  Building2,
  Calculator,
  Users
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Bookkeeping Services Johannesburg | Local Accountants | My Accountant',
        description: 'Reliable monthly bookkeeping services for small and medium businesses in Johannesburg. Certified accountants handling bank reconciliations, VAT, and SARS compliance.',
    };
    return getStaticPageMetadata('bookkeeping-services-johannesburg', defaults);
}

export default function BookkeepingServicesJohannesburgPage() {
  const services = [
    {
      title: "Bank Reconciliations",
      description: "Automated importing and coding of your bank statements. We ensure every transaction matches your ledger.",
      icon: Calculator
    },
    {
      title: "VAT201 Submissions",
      description: "Accurate calculation and submission of your VAT returns to SARS to avoid late filing penalties.",
      icon: Building2
    },
    {
      title: "Management Accounts",
      description: "Monthly or quarterly financial reports (balance sheets, profit & loss) to help you make informed decisions.",
      icon: Users
    }
  ];

  const suburbs = [
    "Sandton", "Randburg", "Rosebank", "Midrand", "Roodepoort", "Fourways", "Johannesburg CBD", "Bedfordview"
  ];

  const faqs = [
    {
      q: "Do you offer bookkeeping on-site in Johannesburg?",
      a: "We operate as a modern, cloud-first accounting firm. All our bookkeeping is managed securely online using cloud software like Xero, Sage, or Zoho. This allows us to serve businesses throughout Johannesburg efficiently without expensive on-site visits."
    },
    {
      q: "Are your bookkeepers and accountants registered?",
      a: "Yes, our team consists of fully qualified accountants registered with professional bodies such as CIBA (Chartered Institute for Business Accountants) and SAIT (South African Institute of Taxation), and we are registered SARS tax practitioners."
    },
    {
      q: "How do we send our receipts and invoices to you?",
      a: "We make it simple. You can upload your invoices, receipts, and bank statements directly through our secure client portal, or drop them into shared folders. Our team processes them weekly."
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
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Professional Bookkeeping Services in Johannesburg
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Local expertise meeting national standards. Let our registered accountants handle your monthly books, SARS VAT201, and CIPC compliance.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Book a Consultation</Link>
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

      {/* Key Bookkeeping Services */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Our Comprehensive Bookkeeping Solutions</h2>
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

      {/* Local Footprint / Suburbs */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Serving Businesses Across Johannesburg</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Our cloud bookkeeping model allows us to service clients across all major hubs in the Greater Johannesburg area, including:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {suburbs.map((suburb, i) => (
              <div key={i} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-border justify-center font-semibold text-foreground/80 shadow-sm text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {suburb}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-primary text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Simplify Your Business Accounting</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Focus on growing your company in Johannesburg while our certified accountants take care of the paperwork, payroll, and SARS tax submissions.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get a Free Compliance Assessment <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
