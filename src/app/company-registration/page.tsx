import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Building2, ArrowRight, FileCheck, RotateCcw, Users, Landmark } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'CIPC Company Registration & Secretarial Services South Africa',
        description: 'Register your Pty Ltd company with CIPC online. Fast private company registration, company reinstatement, beneficial ownership filing & CIPC secretarial compliance in South Africa.',
    };
    return getStaticPageMetadata('company-registration', defaults);
}

const companyRegistrationFaqs = [
  {
    q: "How long does CIPC company registration take in South Africa?",
    a: "A standard CIPC company registration typically takes between 3 to 7 business days once all required documents are submitted. Name reservations are usually processed within 1 to 2 business days. With My Accountant handling the process, we ensure your documentation is correct from the start, avoiding common delays caused by incomplete or incorrect applications.",
  },
  {
    q: "What documents are needed to register a company with CIPC?",
    a: "To register a private company (Pty Ltd) with CIPC, you'll need certified copies of ID documents for all directors, proof of residential address for each director, a completed CoR 14.1 form, and a Memorandum of Incorporation (MOI). If you're reserving a company name, a CoR 9.1 form is also required. Our team prepares all documentation on your behalf to ensure a smooth registration.",
  },
  {
    q: "How much does it cost to register a company in South Africa?",
    a: "CIPC charges a name reservation fee of R75 and a company registration fee of R175 for online submissions. However, professional service fees for preparing documentation, filing, and post-registration setup (such as tax registrations and banking letters) are additional. My Accountant offers transparent, all-inclusive packages so you know exactly what you're paying upfront — with no hidden costs.",
  },
];

const companyRegistrationSchema = generateServicePillarSchema({
  title: 'CIPC Company Registration & Company Secretarial Services',
  description: 'Online private company (Pty Ltd) registration with CIPC, name reservation, MOI, tax numbers, and statutory secretarial maintenance.',
  slug: '/company-registration',
  serviceType: 'ProfessionalService',
  priceRange: 'From R950',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Company Secretarial', url: '/products#company-secretarial' },
    { name: 'Company Registration', url: '/company-registration' }
  ],
  faqs: companyRegistrationFaqs
});

export default function CompanyRegistrationPage() {
  const services = [
    {
      title: "Private Company Registration",
      description: "Register a new Pty Ltd company with CIPC quickly and affordably. We handle the full application process including name reservation, MOI filing, and issuing your registration certificate — so you can focus on launching your business.",
      icon: Building2,
      link: "/products/private-company-registration",
    },
    {
      title: "Company Reinstatement",
      description: "Has your company been deregistered by CIPC? We assist with the full reinstatement process, restoring your entity to good standing so you can resume trading, contracting, and accessing financial services without delay.",
      icon: RotateCcw,
      link: "/products/company-reinstatement",
    },
    {
      title: "Beneficial Ownership Declaration",
      description: "South African companies are required to file beneficial ownership information with CIPC. We prepare and submit your BO declaration accurately, keeping your company compliant with the latest regulatory requirements.",
      icon: Users,
      link: "/products/beneficial-ownership-declaration",
    },
    {
      title: "CIPC Registration Packages",
      description: "Explore our comprehensive CIPC registration packages that bundle company registration, tax registrations, and compliance setup into a single affordable offering — perfect for entrepreneurs starting a new venture.",
      icon: Landmark,
      link: "/cipc-company-registration-online",
    },
  ];

  const faqs = companyRegistrationFaqs;

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(companyRegistrationSchema) }}
      />
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Company Registration & Secretarial Services
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From CIPC company registration to beneficial ownership filings and reinstatements — we handle every step of setting up and maintaining your South African business entity.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Register Your Company</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Our Company Registration & Secretarial Services</h2>
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
          <h3 className="text-3xl font-bold">Ready to Register Your Company?</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Get your Pty Ltd registered with CIPC in as little as 3 business days. Our team handles the paperwork, tax registrations, and compliance setup so you can start trading sooner.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Register Your Company <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Company Registration FAQs</h2>
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
