import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Briefcase, ArrowRight, Globe, Heart, Award, Package } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Specialist Business & Compliance Services | My Accountant',
        description: 'Specialist services including CSD registration, NPO registration, BEE certification & tender-ready company packages. Expert compliance solutions for South African businesses.',
    };
    return getStaticPageMetadata('specialist-services', defaults);
}

export default function SpecialistServicesPage() {
  const services = [
    {
      title: "CSD Registration",
      description: "Register your business on the Central Supplier Database (CSD) to become eligible for government tenders and procurement opportunities. We handle the full registration process including document verification, bank account confirmation, and tax compliance validation required by National Treasury.",
      icon: Globe,
      link: "/products/csd-registration",
    },
    {
      title: "NPO Registration",
      description: "Establish your non-profit organisation with the Department of Social Development. We prepare your NPO constitution, founding statement, and all supporting documentation, guiding you through the registration process so your organisation can start making an impact while staying fully compliant.",
      icon: Heart,
      link: "/products/npo-registration",
    },
    {
      title: "BEE Certificate",
      description: "Secure your B-BBEE compliance certificate to unlock tendering opportunities and demonstrate your commitment to transformation. We assess your BEE scorecard, identify areas for improvement, and issue valid certificates recognised by government and private-sector procurement departments.",
      icon: Award,
      link: "/products/bee-certificate",
    },
    {
      title: "Tender-Ready Company Package",
      description: "Get your company fully tender-ready with our comprehensive registration package. We bundle CIPC registration, SARS tax registrations, CSD profile setup, BEE certification, and COIDA registration into a single offering — everything you need to bid on government contracts from day one.",
      icon: Package,
      link: "/products/tender-ready-company-registration-package",
    },
  ];

  const faqs = [
    {
      q: "What is CSD registration and why do I need it?",
      a: "The Central Supplier Database (CSD) is a single database managed by National Treasury that stores supplier information for all government departments and entities. Registration on the CSD is mandatory for any business that wants to supply goods or services to government through tenders or quotations. The CSD verifies your tax compliance, bank account details, company registration, and BEE status. My Accountant handles the full CSD registration process, ensuring your profile is complete, verified, and ready to receive tender invitations.",
    },
    {
      q: "How do I register as an NPO in South Africa?",
      a: "To register a Non-Profit Organisation (NPO) in South Africa, you must submit an application to the Department of Social Development with a founding document (constitution), a narrative report on planned activities, and details of the organisation's office bearers. The constitution must comply with the NPO Act and include specific clauses on governance, financial management, and dissolution. Registration typically takes 2 to 3 months. Once registered, your NPO must file annual narrative and financial reports. We assist with the full application and ongoing compliance requirements.",
    },
    {
      q: "What is a tender-ready company and what do I need?",
      a: "A tender-ready company is a business that has all the registrations, certifications, and compliance documents in place to immediately bid on government tenders. This typically includes a registered Pty Ltd company, SARS tax clearance certificate, valid BEE certificate, CSD registration, COIDA letter of good standing, UIF compliance, and in some cases CIDB registration (for construction) or specific industry licences. Our tender-ready package bundles all essential registrations into one affordable offering, saving you time and ensuring nothing is missed.",
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
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Specialist Business & Compliance Services
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From CSD registration and NPO setup to BEE certification and tender-ready company packages — we provide the specialist services South African businesses need to access new opportunities and stay compliant.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Explore Specialist Services</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Specialist Services We Offer</h2>
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
          <h3 className="text-3xl font-bold">Need a Specialist Service?</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Whether you&apos;re registering an NPO, getting tender-ready, or need a BEE certificate, our specialist team has the expertise to get it done right. Contact us today for a free consultation.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get Started Today <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Specialist Services FAQs</h2>
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
