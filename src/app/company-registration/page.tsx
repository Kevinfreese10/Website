import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Users,
  Landmark,
  FileCheck2,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: 'CIPC Company Registration Online South Africa | Pty Ltd',
    description:
      'Register your Pty Ltd company with CIPC online from R950. Includes name reservation, CoR14.3 certificate, SARS tax number & Beneficial Ownership filing.',
  };
  return getStaticPageMetadata('company-registration', defaults);
}

const companyRegistrationFaqs = [
  {
    q: 'How long does CIPC company registration take in South Africa?',
    a: 'A standard CIPC company registration typically takes between 2 to 5 business days once all required director IDs and OTP verifications are completed. Name reservations (CoR 9.4) are usually approved within 24 to 48 hours. With My Accountant managing your application, we prevent common CIPC rejections and deliver your CoR 14.3 registration certificate and SARS Income Tax reference number together.',
  },
  {
    q: 'What documents are needed to register a company with CIPC?',
    a: 'To register a private company (Pty Ltd) with CIPC, you need: (1) a clear copy or smart card scan of the South African ID or passport for each director and incorporator, (2) residential and business physical addresses, (3) 1 to 4 proposed company names in order of preference, and (4) cell phone numbers and email addresses for each director to complete CIPC OTP verification.',
  },
  {
    q: 'How much does it cost to register a Pty Ltd company in South Africa?',
    a: 'Our Standard Pty Ltd Registration package is R950 all-inclusive (covering CIPC statutory filing fees, name reservation, CoR 14.3 registration certificate, MOI, SARS income tax number, and mandatory Beneficial Ownership declaration). For businesses applying for tenders or contracts, our R1,600 Tender-Ready Startup Pack adds a B-BBEE EME Share Affidavit, Formal Share Certificates, and SARS Tax Compliance Status (TCS) PIN.',
  },
  {
    q: 'Is Beneficial Ownership filing mandatory for newly registered companies?',
    a: 'Yes. Under the General Laws (Anti-Money Laundering and Combating Terrorism Financing) Amendment Act 22 of 2022, every new South African company must lodge a Beneficial Ownership (BO) register with CIPC within 10 business days of incorporation. CIPC blocks annual return filings and statutory amendments for entities without a verified BO certificate.',
  },
  {
    q: 'Do I automatically get a SARS tax number when I register with CIPC?',
    a: 'Yes. Once CIPC issues your CoR 14.3 Registration Certificate, SARS automatically generates a 10-digit Corporate Income Tax (ITR14) reference number. Our team links your new company on SARS eFiling, verifies the Public Officer appointment, and issues your Tax Compliance Status (TCS) Good Standing PIN if required.',
  },
];

const basePillarSchema = generateServicePillarSchema({
  title: 'CIPC Company Registration & Company Secretarial Services South Africa',
  description:
    'Online private company (Pty Ltd) registration with CIPC, name reservation, MOI, SARS tax number, Beneficial Ownership filing, and tender-ready compliance packs.',
  slug: '/company-registration',
  serviceType: 'ProfessionalService',
  priceRange: 'R950 - R1,600',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Company Secretarial', url: '/company-secretarial-services-south-africa' },
    { name: 'Company Registration', url: '/company-registration' },
  ],
  faqs: companyRegistrationFaqs,
});

const offerCatalogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE_URL}/company-registration#offers`,
  name: 'CIPC Pty Ltd Company Registration Packages',
  provider: { '@id': `${SITE_URL}/#organization` },
  areaServed: { '@type': 'Country', name: 'South Africa' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Pty Ltd Registration Packages',
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Standard Pty Ltd Company Registration',
        description:
          'Includes CIPC name reservation (CoR9.4), CoR14.3 registration certificate, standard MOI, automatic SARS Income Tax number, and Beneficial Ownership register filing.',
        price: '950.00',
        priceCurrency: 'ZAR',
        url: `${SITE_URL}/products/private-company-registration`,
      },
      {
        '@type': 'Offer',
        name: 'Tender-Ready Startup Compliance Pack',
        description:
          'Includes full Pty Ltd registration, Beneficial Ownership certificate, Formal Share Register & Share Certificates, B-BBEE EME Affidavit, and SARS Tax Clearance PIN.',
        price: '1600.00',
        priceCurrency: 'ZAR',
        url: `${SITE_URL}/products/private-company-registration`,
      },
    ],
  },
};

export default function CompanyRegistrationPage() {
  const services = [
    {
      title: 'Private Company Registration (Pty Ltd)',
      description:
        'Register a new Pty Ltd company with CIPC quickly and affordably. We handle name reservation (CoR 9.4), MOI filing, CoR 14.3 registration certificate, and SARS tax number activation.',
      icon: Building2,
      link: '/products/private-company-registration',
    },
    {
      title: 'Beneficial Ownership Declaration',
      description:
        'Mandatory CIPC Beneficial Ownership register compilation, share register drafting, and official BO filing certificate within 10 days of incorporation.',
      icon: Users,
      link: '/cipc-beneficial-ownership-register-south-africa',
    },
    {
      title: 'Company Reinstatement (CoR 40.5)',
      description:
        'Has your company been deregistered by CIPC due to outstanding annual returns? We restore your entity to active legal standing so you can trade and access bank accounts.',
      icon: RotateCcw,
      link: '/products/company-reinstatement',
    },
    {
      title: 'Director Amendments & Share Registers',
      description:
        'Add or resign directors (CoR 39), update registered office addresses (CoR 21.1), and issue compliant share certificates signed by an Accounting Officer.',
      icon: Landmark,
      link: '/company-secretarial-services-south-africa',
    },
  ];

  const steps = [
    {
      step: 'Step 1',
      title: 'Submit Company Names & Director Details',
      description:
        'Provide up to 4 proposed company names and basic director details via our online form or WhatsApp. We screen names against the CIPC trademark and entity database.',
    },
    {
      step: 'Step 2',
      title: 'CIPC Name Reservation (CoR 9.4)',
      description:
        'We lodge your name application with CIPC and issue your official CoR 9.4 Name Reservation Certificate, normally approved within 24–48 business hours.',
    },
    {
      step: 'Step 3',
      title: 'MOI Lodging & Director OTP Verification',
      description:
        'We prepare your Memorandum of Incorporation (MOI) and CoR 14.1 annexures. Directors simply confirm the SMS/email OTP sent by CIPC.',
    },
    {
      step: 'Step 4',
      title: 'CoR 14.3 Certificate, SARS Tax No & BO Filing',
      description:
        'Receive your CoR 14.3 Registration Certificate, SARS Income Tax number, Share Certificates, and mandatory Beneficial Ownership confirmation ready for business banking.',
    },
  ];

  return (
    <div className="space-y-20 pb-24 bg-background relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(basePillarSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }}
      />

      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-28 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4" /> Fast 2–5 Day Turnaround • CIBA &amp; SARS Accredited
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            CIPC Company Registration Online &amp; Secretarial Services
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Register your South African Private Company (Pty Ltd) online from <strong>R950 all-inclusive</strong>. We handle your CIPC name reservation, CoR 14.3 certificate, SARS tax number, share certificates, and mandatory Beneficial Ownership declaration.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/products/private-company-registration">Register Your Pty Ltd Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/contact">Speak to a Company Secretary</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Pricing Packages */}
      <section className="container mx-auto px-4 max-w-5xl space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Transparent Pty Ltd Registration Packages</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            All CIPC statutory filing fees are included. No hidden disbursements or surprise add-ons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-2 border-border bg-card flex flex-col justify-between p-2">
            <CardHeader className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Essential Incorporation</span>
              <CardTitle className="text-2xl font-black">Standard Pty Ltd Registration</CardTitle>
              <div className="pt-2">
                <span className="text-4xl font-black text-foreground">R950</span>
                <span className="text-sm text-muted-foreground ml-2">once-off (incl. CIPC fees)</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2.5 text-sm text-foreground">
                {[
                  'CIPC Name Search & Name Reservation (CoR 9.4)',
                  'CIPC Company Incorporation Certificate (CoR 14.3)',
                  'Standard Memorandum of Incorporation (MOI)',
                  'Automatic SARS Corporate Income Tax Number',
                  'Mandatory CIPC Beneficial Ownership Filing',
                  'Ready to open FNB, Standard Bank, Nedbank or ABSA account',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full font-bold h-11">
                <Link href="/products/private-company-registration">Order Standard Pty Ltd (R950)</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-primary/[0.03] flex flex-col justify-between p-2 shadow-lg">
            <CardHeader className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Most Popular for Tenders &amp; Contracts</span>
              <CardTitle className="text-2xl font-black">Tender-Ready Startup Pack</CardTitle>
              <div className="pt-2">
                <span className="text-4xl font-black text-foreground">R1,600</span>
                <span className="text-sm text-muted-foreground ml-2">once-off (incl. CIPC fees)</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2.5 text-sm text-foreground">
                {[
                  'Everything in Standard Pty Ltd Registration (CoR 9.4 & CoR 14.3)',
                  'Mandatory CIPC Beneficial Ownership Certificate',
                  'Formal Share Register & Numbered Share Certificates',
                  'Commissioner of Oaths B-BBEE EME Affidavit (Level 1 / 2 / 4)',
                  'SARS eFiling Profile Activation & Public Officer Link',
                  'Official SARS Tax Compliance Status (TCS Good Standing PIN)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full font-bold h-11">
                <Link href="/products/private-company-registration">Order Tender-Ready Pack (R1,600)</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="bg-muted/30 py-16 border-y border-border/60">
        <div className="container mx-auto px-4 max-w-5xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-foreground">How Online CIPC Company Registration Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Four simple steps from name reservation to receiving your complete statutory company pack.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <Card key={s.step} className="border bg-card">
                <CardHeader className="space-y-2 pb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {s.step}
                  </span>
                  <CardTitle className="text-base font-bold">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table & Required Documents */}
      <section className="container mx-auto px-4 max-w-5xl space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Why Register Through My Accountant vs DIY?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            DIY CIPC portals leave out Share Registers, Beneficial Ownership securities registers, and SARS Public Officer appointments—often freezing bank accounts later.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/70 text-foreground font-bold border-b border-border">
              <tr>
                <th className="p-4">Deliverable / Compliance Step</th>
                <th className="p-4 text-primary">My Accountant</th>
                <th className="p-4">DIY CIPC / BizPortal</th>
                <th className="p-4">Traditional Law Firm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr>
                <td className="p-4 font-medium text-foreground">CoR 9.4 Name Reservation &amp; CoR 14.3 Certificate</td>
                <td className="p-4 text-foreground font-semibold">Included</td>
                <td className="p-4">Self-service queue</td>
                <td className="p-4">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-foreground">Mandatory Beneficial Ownership (BO) Register Filing</td>
                <td className="p-4 text-foreground font-semibold">Included &amp; Verified</td>
                <td className="p-4">Not drafted for you</td>
                <td className="p-4">Billed extra (R1,500+)</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-foreground">Numbered Share Certificates &amp; Share Register</td>
                <td className="p-4 text-foreground font-semibold">Included</td>
                <td className="p-4">Not provided</td>
                <td className="p-4">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-foreground">SARS eFiling Public Officer &amp; Tax Clearance Support</td>
                <td className="p-4 text-foreground font-semibold">Handled by Registered Tax Practitioner</td>
                <td className="p-4">None</td>
                <td className="p-4">Referred out</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-foreground">Typical Total Cost</td>
                <td className="p-4 text-primary font-bold">R950 – R1,600 Fixed</td>
                <td className="p-4">R175 + DIY time/rejections</td>
                <td className="p-4">R3,500 – R6,500+</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Card className="border-primary/20 bg-primary/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <FileCheck2 className="h-4 w-4" /> Checklist Before You Apply
              </div>
              <h3 className="text-xl font-bold text-foreground">What You Need to Have Ready</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                1. Clear copy of South African ID or passport for each director • 2. Physical home and business addresses • 3. Four proposed company names • 4. Active cell number and email address per director for CIPC OTP confirmation.
              </p>
            </div>
            <Button asChild size="lg" className="font-bold shrink-0">
              <Link href="/products/private-company-registration">Start Online Application</Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Complete CIPC &amp; Company Secretarial Services</h2>
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
                  <Link href={service.link}>
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-primary text-white p-8 lg:p-12 rounded-xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Ready to Register Your Pty Ltd Company?</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Get your Pty Ltd registered with CIPC in 2 to 5 business days. Our team handles the paperwork, Beneficial Ownership register, and SARS compliance setup so you can start trading sooner.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/products/private-company-registration">
              Register Your Company <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">CIPC Company Registration FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {companyRegistrationFaqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">{faq.q}</h3>
              <div className="text-slate-600 leading-relaxed">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
