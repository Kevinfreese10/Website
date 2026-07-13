import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Scale, ArrowRight, BookOpen, UserCheck, Building2, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Expert Tax Consulting & Advisory Services | My Accountant',
        description: 'Professional tax consulting services in South Africa. Strategic tax advice for businesses and individuals from qualified tax practitioners. Book a consultation today.',
    };
    return getStaticPageMetadata('tax-consulting', defaults);
}

export default function TaxConsultingPage() {
  const services = [
    {
      title: "Comprehensive Tax Services",
      description: "From individual income tax to corporate tax structuring, our qualified tax practitioners cover every aspect of South African taxation. We stay current with SARS legislation so you can focus on growing your business.",
      icon: BookOpen,
      link: "/tax-services-south-africa",
    },
    {
      title: "Complex Individual Tax Returns",
      description: "Capital gains, foreign income, rental properties, share options, and crypto assets all require specialist knowledge. Our consultants ensure every deduction is claimed and every disclosure is accurate on your ITR12.",
      icon: UserCheck,
      link: "/products/complex-individual-income-tax-return-itr12-filing",
    },
    {
      title: "Corporate Tax Advisory",
      description: "Strategic tax planning for companies, including ITR14 preparation, assessed loss optimisation, Section 12J investments, and transfer pricing. We help reduce your effective tax rate within the bounds of the law.",
      icon: Building2,
      link: "/products/itr14-company-income-tax-return-trading-entities",
    },
    {
      title: "One-on-One Tax Consultation",
      description: "Book a personalised session with one of our senior tax consultants. Whether you need a second opinion on a SARS assessment, advice on structuring a transaction, or guidance on emigration tax implications — we're here to help.",
      icon: MessageSquare,
      link: "/contact",
    },
  ];

  const faqs = [
    {
      q: "When should I hire a tax consultant in South Africa?",
      a: "You should consider hiring a tax consultant when your tax affairs become complex — for example, if you earn foreign income, have capital gains from property or share disposals, run a business with multiple revenue streams, receive a SARS audit notification, or need to restructure your affairs for tax efficiency. A tax consultant is also invaluable during major life events such as emigration, divorce settlements involving assets, or estate planning.",
    },
    {
      q: "What is the difference between a tax consultant and an accountant?",
      a: "While both professionals deal with financial matters, a tax consultant specialises in tax legislation, SARS procedures, and strategic tax planning. An accountant typically focuses on bookkeeping, financial statements, and general financial management. At My Accountant, our team includes both — giving you access to day-to-day accounting support and specialist tax advisory under one roof, ensuring seamless coordination between your financial records and tax strategy.",
    },
    {
      q: "How much does a tax consultation cost in South Africa?",
      a: "Tax consultation fees vary depending on the complexity of your situation. A straightforward individual tax review may start from a few hundred rand, while complex corporate advisory, international tax structuring, or SARS dispute resolution will be priced according to the scope of work. At My Accountant, we provide transparent, upfront pricing for all our services — contact us for a free initial assessment and quote tailored to your specific needs.",
    },
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Expert Tax Consulting & Advisory Services
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Navigate South Africa&apos;s complex tax landscape with confidence. Our qualified tax practitioners provide strategic advice to minimise your tax burden legally and keep you SARS-compliant.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Book a Tax Consultation</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">Explore Our Services</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Tax Advisory & Consulting Solutions</h2>
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
        <div className="bg-primary text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Get Expert Tax Advice Today</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Whether you&apos;re an individual with complex tax affairs or a business seeking strategic tax planning, our consultants deliver clear, actionable advice you can trust.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Book a Tax Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Tax Consulting FAQs</h2>
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
