import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  CheckCircle2, 
  HelpCircle,
  Cloud,
  Check,
  ArrowRight,
  TrendingUp,
  Laptop
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Certified Xero Accountant South Africa | My Accountant',
        description: 'Scale your business with our certified Xero accounting services. Automated bank feeds, real-time reports, and professional monthly bookkeeping.',
    };
    return getStaticPageMetadata('xero-accountant-south-africa', defaults);
}

export default function XeroAccountantSouthAfricaPage() {
  const features = [
    {
      title: "Automated Bank Feeds",
      description: "Direct connection with Nedbank, FNB, Standard Bank, and Absa. Daily transaction imports eliminate manual entries."
    },
    {
      title: "Professional Invoicing",
      description: "Send branded, professional invoices and automated payment reminders directly from your smartphone or tablet."
    },
    {
      title: "Real-Time Reports",
      description: "Access instant Balance Sheet and Profit & Loss statements anytime, anywhere, keeping you in full control of your cash flow."
    }
  ];

  const advantages = [
    "Certified Xero Advisors overseeing your books",
    "Transition and data migration from desktop software",
    "Custom chart of accounts configuration for SA tax rules",
    "VAT201 reporting directly matched with Xero ledgers",
    "Continuous remote support and platform training"
  ];

  const faqs = [
    {
      q: "Do I need to buy a Xero license myself?",
      a: "No. While you can purchase a license directly from Xero, we can bundle your Xero subscription into our flat monthly accounting packages, often giving you access to partner discounts and free setups."
    },
    {
      q: "How does the migration from Pastel or Excel to Xero work?",
      a: "Our certified advisors handle the entire process. We export your historical ledger details, clean up the customer and supplier databases, set up the opening balances in Xero, and link your bank accounts for a seamless transition."
    },
    {
      q: "Can Xero handle South African VAT and payroll?",
      a: "Yes, Xero is fully localized for South Africa. It calculates VAT201 returns accurately and integrates with payroll systems to automatically journal monthly salaries."
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
            <Cloud className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Certified Xero Accountants in South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Beautiful cloud accounting. Run your business efficiently with real-time bank feeds, modern invoicing, and tax compliance.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Speak to a Xero Advisor</Link>
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

      {/* Xero Features */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Why Choose Xero for Your Business?</h2>
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

      {/* Value Proposition */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold text-foreground text-center">Our Xero Accounting Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {advantages.map((adv, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-foreground/80">{adv}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-slate-900 text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Ready to Move to Xero?</h3>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Our certified Xero team will set up your ledger, import opening balances, and automate bank reconciliations so you can see your cash flow clearly.
          </p>
          <Button asChild size="lg" className="font-bold h-12">
            <Link href="/contact">Request Migration Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
