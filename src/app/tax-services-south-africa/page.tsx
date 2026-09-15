import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  Building2, 
  Calculator, 
  ArrowRight,
  ShieldAlert,
  FileSearch,
  BadgePercent
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Tax Services South Africa | SARS Compliance & Advisory',
        description: 'Expert tax services in South Africa. We handle ITR12, Provisional Tax, Corporate Tax, VAT, and SARS disputes. Get compliant today.',
    };
    return getStaticPageMetadata('tax-services-south-africa', defaults);
}

export default function TaxServicesSouthAfricaPage() {
  const services = [
    {
      title: "Corporate Tax & Provisional",
      description: "Submission of ITR14 corporate tax returns and bi-annual IRP6 provisional tax to keep your company compliant.",
      icon: Building2,
      link: "/products"
    },
    {
      title: "Personal Income Tax (ITR12)",
      description: "Accurate filing of personal tax returns for directors, independent contractors, and high-net-worth individuals.",
      icon: Calculator,
      link: "/products"
    },
    {
      title: "SARS Disputes & Compromise",
      description: "Expert handling of SARS objections, VDP, and Section 200 debt compromise applications.",
      icon: ShieldAlert,
      link: "/sars-disputes"
    },
    {
      title: "VAT Registration & Returns",
      description: "Assistance with mandatory or voluntary VAT registrations and bi-monthly VAT201 submissions.",
      icon: BadgePercent,
      link: "/products/vat-registration"
    }
  ];

  const faqs = [
    {
      q: "What are the penalties for late tax submissions in South Africa?",
      a: "SARS imposes administrative penalties for late submissions ranging from R250 to R16,000 per month depending on your assessed loss or taxable income. Interest is also charged on outstanding tax debt."
    },
    {
      q: "Can you assist if I haven't filed taxes in years?",
      a: "Yes. Our tax specialists can request your historical data from SARS, perform a full catch-up on your bookkeeping, and submit all outstanding returns to bring you back into compliance."
    },
    {
      q: "What is a SARS Section 200 compromise?",
      a: "If your business has a large SARS debt that it cannot afford to pay, Section 200 of the Tax Administration Act allows us to negotiate a compromise, potentially reducing your tax debt by up to 80%."
    }
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <FileSearch className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Specialist Tax Services in South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Ensure complete compliance with SARS. We provide comprehensive tax planning, filing, and dispute resolution for individuals and businesses across South Africa.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Book a Tax Consultation</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View Tax Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Services Grid */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Comprehensive Tax Solutions</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm leading-relaxed space-y-4">
                <p>{service.description}</p>
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link href={service.link}>Learn more <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-primary text-white p-8 lg:p-12 rounded-xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Facing a SARS Audit or Dispute?</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Do not face SARS alone. Let our registered tax practitioners navigate the complex dispute process and negotiate on your behalf.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/sars-disputes">Get SARS Dispute Help <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Tax Services FAQs</h2>
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
