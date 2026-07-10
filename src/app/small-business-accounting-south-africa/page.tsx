import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  Building2, 
  Store,
  LineChart, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PiggyBank
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Small Business Accounting South Africa | SME Financial Services',
        description: 'Affordable accounting and bookkeeping packages tailored specifically for startups and small businesses in South Africa. Get Xero integration and SARS compliance.',
    };
    return getStaticPageMetadata('small-business-accounting-south-africa', defaults);
}

export default function SmallBusinessAccountingPage() {
  const features = [
    {
      title: "Cloud Bookkeeping",
      description: "Real-time tracking of your income and expenses using Xero or Sage, so you always know where your SME stands.",
      icon: LineChart
    },
    {
      title: "Tax & Compliance",
      description: "We handle all SARS deadlines including VAT, PAYE, and Provisional Tax, keeping your small business penalty-free.",
      icon: ShieldCheck
    },
    {
      title: "Growth Advisory",
      description: "Beyond just capturing data, we help you understand your profit margins and cash flow to scale your business safely.",
      icon: TrendingUp
    }
  ];

  const faqs = [
    {
      q: "How much does accounting cost for a small business in SA?",
      a: "Our monthly accounting packages for small businesses start from affordable fixed rates based on your transaction volume, ensuring you only pay for what you need as you grow."
    },
    {
      q: "Can I manage my own invoices while you do the tax?",
      a: "Yes! We can set you up on cloud accounting software where you issue quotes and invoices to your clients, and we handle the backend reconciliations and SARS submissions."
    },
    {
      q: "What if I am a sole proprietor?",
      a: "We service all entities including Sole Proprietors, Startups, and registered PTY LTD companies. We tailor our services based on your specific legal and tax requirements."
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
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Accounting for Small Businesses & Startups
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Your dedicated financial partner. We provide affordable, scalable, and fully compliant accounting solutions for growing SMEs in South Africa.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get SME Pricing</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* SME Features */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Built for South African SMEs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm leading-relaxed">
                <p>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-primary text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <PiggyBank className="h-12 w-12 text-white/80 mx-auto" />
          <h3 className="text-3xl font-bold">Stop Overpaying for Accounting</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Transition your startup to our modern, cloud-first accounting model. Save time, reduce costs, and get real-time insights into your business.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/monthly-accounting">View Monthly Packages <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">SME Accounting FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
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
