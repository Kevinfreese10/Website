import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  CheckCircle2, 
  HelpCircle,
  Laptop,
  Check,
  ArrowRight,
  Blocks
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Zoho Books Accountant South Africa | My Accountant',
        description: 'Automate your bookkeeping with certified Zoho Books accountants in South Africa. Complete integration with Zoho CRM, inventory, and expense tracking.',
    };
    return getStaticPageMetadata('zoho-accountant-south-africa', defaults);
}

export default function ZohoAccountantSouthAfricaPage() {
  const features = [
    {
      title: "Zoho Books Bookkeeping",
      description: "Direct bank feeds, customer portal setup, automated expense tagging, and multi-currency tracking designed for scaling businesses."
    },
    {
      title: "Zoho Finance Suite Setup",
      description: "Integrate Zoho Books with Zoho Inventory, Zoho Expense, Zoho Subscriptions, and Zoho Invoice for an end-to-end financial system."
    },
    {
      title: "Zoho CRM Automation",
      description: "Automate sales journal entries by linking your Zoho CRM pipeline directly to Zoho Books, reducing duplicate inputs."
    }
  ];

  const benefits = [
    "Certified Zoho Books accountants managing your ledger",
    "Tailored setup of Zoho tax groups for South African VAT (15%)",
    "Custom report dashboards for monthly management meetings",
    "Transition support from Excel or desktop platforms to Zoho",
    "VAT201 audits and submissions based on Zoho transactions"
  ];

  const faqs = [
    {
      q: "Does Zoho Books support South African VAT?",
      a: "Yes. Zoho Books has built-in localization for South Africa. It correctly calculates standard-rated, zero-rated, and exempt transactions, and generates VAT returns in accordance with SARS rules."
    },
    {
      q: "Can you help connect Zoho Books with Zoho CRM?",
      a: "Yes, our team specializes in Zoho ecosystem integrations. We configure the standard Zoho integration so that approved CRM deals automatically generate draft sales invoices inside Zoho Books."
    },
    {
      q: "Is Zoho Books suitable for small businesses in SA?",
      a: "Absolutely. Zoho Books is highly cost-effective, offers a robust mobile application, and features advanced automation capabilities that make it ideal for tech-startups, service providers, and agencies."
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
          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Blocks className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Zoho Books Accountant South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Automated bookkeeping. Optimize your Zoho Books and the broader Zoho Finance suite with certified professional support.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Speak to a Zoho Advisor</Link>
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

      {/* Zoho Features */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">End-to-End Zoho Financial Automation</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Laptop className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-xs leading-relaxed">
                {feature.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold text-foreground text-center">Our Zoho Books Management Solutions</h2>
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
        <div className="bg-slate-900 text-white p-8 lg:p-12 rounded-xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Deploy Zoho Books compliant bookkeeping</h3>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Configure automated customer payment tracking and sync Zoho with your local business bank account under expert supervision.
          </p>
          <Button asChild size="lg" className="font-bold h-12">
            <Link href="/contact">Request Zoho Assessment <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
