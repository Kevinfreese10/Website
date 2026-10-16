import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Shield, ArrowRight, FileSignature, Users, Landmark, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Trust Registration, Tax & Accounting Services South Africa',
        description: 'Register and administer trusts in South Africa. SARS ITR12T income tax registration, Master of the High Court beneficial ownership & trust accounting.',
    };
    return getStaticPageMetadata('trust-services', defaults);
}

export default function TrustServicesPage() {
  const services = [
    {
      title: "Trust Income Tax Registration",
      description: "Every trust operating in South Africa must be registered with SARS for income tax purposes. We handle the full registration process, ensuring your trust receives its tax reference number and is set up correctly for annual ITR12T filing from day one.",
      icon: FileSignature,
      link: "/products/trust-income-tax-registration",
    },
    {
      title: "Beneficial Ownership Declaration",
      description: "Trusts are now required to file beneficial ownership information to meet regulatory transparency requirements. We prepare and submit your trust's BO declaration, identifying all beneficiaries, trustees, and founders as required by current legislation.",
      icon: Users,
      link: "/products/beneficial-ownership-declaration",
    },
    {
      title: "Trust Tax & Compliance Services",
      description: "Trusts have unique tax obligations including annual income tax returns, capital gains tax considerations, and distributions reporting. Our tax specialists ensure your trust remains fully compliant with SARS while optimising the tax position of the trust and its beneficiaries.",
      icon: Landmark,
      link: "/tax-consulting",
    },
    {
      title: "Trust Administration Support",
      description: "Need guidance on trust resolutions, trustee appointments, or trust deed amendments? Our team provides ongoing administration support, helping trustees fulfil their fiduciary duties and maintain proper trust governance records throughout the life of the trust.",
      icon: MessageSquare,
      link: "/contact",
    },
  ];

  const faqs = [
    {
      q: "How do I register a trust in South Africa?",
      a: "To register a trust in South Africa, you must draft a trust deed (prepared by an attorney or trust specialist), then lodge it with the Master of the High Court in the jurisdiction where the trust will be administered. The Master will issue Letters of Authority once the trust deed and all supporting documents (including certified IDs of trustees and a trust property schedule) are accepted. After registration with the Master, the trust must be registered with SARS for income tax. My Accountant handles the SARS registration and ongoing compliance for your trust.",
    },
    {
      q: "How much does it cost to register a trust in South Africa?",
      a: "The cost of registering a trust in South Africa includes legal fees for drafting the trust deed (typically R5,000 to R15,000 depending on complexity), the Master of the High Court lodgement fee (currently R100), and SARS tax registration fees. Ongoing costs include annual income tax return preparation, accounting fees, and compliance filings. My Accountant offers competitive fixed-fee packages for trust tax registration and annual compliance.",
    },
    {
      q: "What is the difference between an inter vivos and testamentary trust?",
      a: "An inter vivos (living) trust is created during the founder's lifetime by signing a trust deed and registering it with the Master of the High Court. It is commonly used for asset protection, estate planning, and business succession. A testamentary trust is created through a will and only comes into effect upon the death of the testator. Testamentary trusts are often used to protect minor beneficiaries or manage inherited assets. Both types must register with SARS and file annual income tax returns. The tax treatment differs — testamentary trusts for minor beneficiaries are taxed at individual rates, while inter vivos trusts are generally taxed at a flat rate of 45%.",
    },
  ];

  const trustSchema = generateServicePillarSchema({
    title: 'Trust Registration, Tax & Accounting Services South Africa',
    description: 'Register and administer trusts in South Africa. SARS ITR12T income tax registration, Master of the High Court beneficial ownership & trust accounting.',
    slug: '/trust-services',
    serviceType: 'AccountingService',
    priceRange: 'From R1,250',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Tax & Trusts', url: '/tax-consulting' },
      { name: 'Trust Services', url: '/trust-services' },
    ],
    faqs,
  });

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(trustSchema) }}
      />
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Trust Registration & Administration Services
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Expert trust formation, SARS registration, and ongoing administration for South African inter vivos and testamentary trusts. We ensure your trust is compliant, tax-efficient, and properly governed.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Register a Trust Today</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View All Services</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Our Trust Services</h2>
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
          <h3 className="text-3xl font-bold">Protect Your Assets With a Properly Managed Trust</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Whether you&apos;re forming a new trust for estate planning or need help administering an existing one, our team of specialists will ensure your trust is registered, compliant, and tax-efficient.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Speak to a Trust Specialist <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Trust Registration FAQs</h2>
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
