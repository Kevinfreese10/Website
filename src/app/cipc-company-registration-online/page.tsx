import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowRight,
  HelpCircle,
  Building,
  Check,
  X,
  FileText,
  BadgeCheck,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: 'CIPC Company Registration Online South Africa | Pty Ltd from R950',
    description: 'Fast online CIPC company registration in 24–48 hours. Official COR14.3 certificate, SARS income tax number, share certificates, and B-BBEE affidavit included.',
  };
  return getStaticPageMetadata('cipc-company-registration-online', defaults);
}

const cipcSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': 'https://www.myacc.co.za/cipc-company-registration-online#service',
      name: 'CIPC Company Registration Online South Africa',
      serviceType: 'Company Registration Service',
      description: 'Full online company registration with CIPC including name reservation, COR14.3 certificate, SARS tax registration, and share certificates.',
      provider: {
        '@type': 'Organization',
        name: 'My Accountant',
        url: 'https://www.myacc.co.za',
        telephone: '+27101091625',
        founder: {
          '@type': 'Person',
          name: 'Kevin Freese',
          jobTitle: 'Managing Director & Registered Tax Practitioner',
          identifier: 'SARS PR-0098553',
        },
      },
      areaServed: {
        '@type': 'Country',
        name: 'South Africa',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Company Registration Packages',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Private Company (Pty Ltd) Registration',
            price: '950',
            priceCurrency: 'ZAR',
            url: 'https://www.myacc.co.za/products/private-company-registration',
          },
          {
            '@type': 'Offer',
            name: 'Tender Ready Company Registration Package',
            price: '1600',
            priceCurrency: 'ZAR',
            url: 'https://www.myacc.co.za/products/tender-ready-company-registration-package',
          },
        ],
      },
    },
    {
      '@type': 'HowTo',
      name: 'How to Register a Company in South Africa Online',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Submit Desired Names & Director Info',
          text: 'Complete our simple 5-minute online form with 1–4 name preferences and director details.',
        },
        {
          '@type': 'HowToStep',
          name: 'CIPC Name Reservation',
          text: 'We lodge your proposed company names with CIPC for official electronic reservation within 1 business day.',
        },
        {
          '@type': 'HowToStep',
          name: 'Identity Verification & MOI Drafting',
          text: 'Upload director ID copies or smartcards. We compile the standard Memorandum of Incorporation (MOI) and statutory consent forms.',
        },
        {
          '@type': 'HowToStep',
          name: 'Receive Official CIPC Documents & Tax Number',
          text: 'Within 24–48 hours, receive your COR14.3 certificate, SARS tax number, and share certificates.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How long does CIPC company registration take online in South Africa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CIPC name reservation typically takes 1 business day, and the formal company registration is completed within 24 to 48 hours once the name is approved. The entire process is 100% online.',
          },
        },
        {
          '@type': 'Question',
          name: 'What documents are required to register a Pty Ltd company?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You only need a clear copy of a valid South African ID or smartcard (or passport for foreign nationals) and proof of address for all directors. We generate all standard MOIs, resolutions, and CIPC forms for you.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is a SARS income tax number automatically issued upon registration?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. When we register your company with CIPC, an official 10-digit SARS Income Tax number is automatically generated and included on your company documents.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is included in the R950 CIPC registration package?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our R950 fixed package includes CIPC filing fees, name reservation (up to 4 choices), official COR14.3 certificate of incorporation, standard MOI, official SARS tax number, approved share certificates for shareholders, B-BBEE affidavit, and a bank account opening confirmation letter.',
          },
        },
      ],
    },
  ],
};

export default function CipcCompanyRegistrationOnlinePage() {
  const steps = [
    {
      num: '01',
      title: 'Apply Online in 5 Minutes',
      desc: 'Fill in our streamlined online form with 1–4 desired company names, director details, and registered address.',
    },
    {
      num: '02',
      title: 'Fast CIPC Name Reservation',
      desc: 'We immediately submit your name choices to the CIPC registry for official approval, typically confirmed within 24 hours.',
    },
    {
      num: '03',
      title: 'MOI & Statutory Documentation',
      desc: 'Upload director ID copies. We prepare your standard Memorandum of Incorporation (MOI), director consents, and share registers.',
    },
    {
      num: '04',
      title: 'Receive Official Certificates',
      desc: 'Get your official COR14.3 registration certificate, SARS income tax number, share certificates, and B-BBEE affidavit.',
    },
  ];

  const packages = [
    {
      title: 'Standard Pty Ltd Registration',
      price: 'R950',
      subtitle: 'Complete Private Company Formation',
      features: [
        'CIPC Name Reservation (Up to 4 options)',
        'Official COR14.3 Certificate of Incorporation',
        'Standard Memorandum of Incorporation (MOI)',
        'SARS Income Tax Registration Number',
        'Official Share Certificates for Shareholders',
        'B-BBEE Exempt Micro Enterprise Affidavit',
        'Business Bank Account Confirmation Letter',
      ],
      href: '/products/private-company-registration',
      popular: false,
    },
    {
      title: 'Tender-Ready Registration Pack',
      price: 'R1,600',
      subtitle: 'Everything You Need to Bid for Contracts',
      features: [
        'Everything in Standard Pty Ltd Package',
        'SARS Tax Clearance Status (TCS PIN)',
        'Central Supplier Database (CSD) Registration',
        'Certified B-BBEE EME Affidavit',
        'Fast-Track 24–48 Hour Processing',
        'Dedicated SARS Tax Practitioner Support',
      ],
      href: '/products/tender-ready-company-registration-package',
      popular: true,
    },
  ];

  const comparisonRows = [
    {
      feature: 'Guaranteed 24–48h Turnaround',
      myacc: true,
      bizportal: '3–10 Days (Frequent Glitches)',
      cipc: '5–14 Days',
      lawyer: '1–3 Weeks',
    },
    {
      feature: 'Approved Share Certificates Included',
      myacc: true,
      bizportal: false,
      cipc: false,
      lawyer: 'Extra R1,500+',
    },
    {
      feature: 'SARS Income Tax Number Included',
      myacc: true,
      bizportal: true,
      cipc: true,
      lawyer: true,
    },
    {
      feature: 'B-BBEE EME Affidavit Included',
      myacc: true,
      bizportal: false,
      cipc: false,
      lawyer: 'Extra Cost',
    },
    {
      feature: 'SARS Registered Tax Practitioner Review',
      myacc: true,
      bizportal: false,
      cipc: false,
      lawyer: true,
    },
    {
      feature: 'Transparent Fixed Price',
      myacc: 'R950 All-Inclusive',
      bizportal: 'R175 (DIY / No Support)',
      cipc: 'R175 (DIY / No Support)',
      lawyer: 'R3,500 – R6,500',
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cipcSchema) }}
      />

      <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
        {/* Hero Section */}
        <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden border-b border-border/40">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div
            className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift"
            style={{ animationDelay: '-5s' }}
          />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-primary" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
              <BadgeCheck className="h-4 w-4" />
              <span>Official CIPC Registered Lodging Agent & SARS Tax Practice</span>
            </div>

            <h1 id="page-title" className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
              Online CIPC Company Registration in South Africa
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Register your private company (Pty Ltd) 100% online in 24–48 hours. Official COR14.3 registration certificate, SARS tax number, approved share certificates, and B-BBEE affidavit included.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="font-bold px-10 h-12">
                <Link href="#pricing">
                  Register Your Company Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8 h-12">
                <Link href="#comparison">Compare vs BizPortal / CIPC</Link>
              </Button>
            </div>

            {/* Badges */}
            <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-4 w-4 text-primary" /> 24–48 Hour Turnaround
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> SARS PR-0098553
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" /> 100% Guaranteed Acceptance
              </span>
            </div>
          </div>
        </section>

        {/* Trust Widget */}
        <div className="container mx-auto px-4">
          <TrustIndexWidget />
        </div>

        {/* 4-Step Process */}
        <section className="container mx-auto px-4 max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              How Online Company Registration Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our 4-step registration pipeline takes your new South African business from concept to fully compliant in 48 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div
                key={s.num}
                className="relative rounded-2xl border border-border/60 bg-card p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl font-black text-primary/30">{s.num}</div>
                <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Packages */}
        <section id="pricing" className="container mx-auto px-4 max-w-5xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Transparent Fixed-Price Company Registration
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              All government fees, name reservations, and share documentation included. No hidden extras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {packages.map((pkg) => (
              <Card
                key={pkg.title}
                className={`relative flex flex-col justify-between border-2 ${
                  pkg.popular ? 'border-primary shadow-lg' : 'border-border/60'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 bg-primary text-primary-foreground font-bold text-xs rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{pkg.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{pkg.subtitle}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-foreground">{pkg.price}</span>
                      <span className="text-xs text-muted-foreground font-medium">all-inclusive</span>
                    </div>
                  </div>

                  <Separator />

                  <ul className="space-y-3 text-sm">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-foreground/90 font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild size="lg" className="w-full font-bold h-12 mt-4">
                    <Link href={pkg.href}>
                      Register Online Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison Matrix */}
        <section id="comparison" className="container mx-auto px-4 max-w-5xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Why Register with My Accountant vs. BizPortal or CIPC Direct?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Compare our full-service professional offering with government self-service portals and traditional attorneys.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-foreground/80">
                <tr>
                  <th className="p-4 md:p-5">Feature</th>
                  <th className="p-4 md:p-5 text-primary font-extrabold bg-primary/5">
                    My Accountant
                  </th>
                  <th className="p-4 md:p-5">BizPortal / CIPC Direct</th>
                  <th className="p-4 md:p-5">Traditional Law Firm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 md:p-5 font-semibold text-foreground">
                      {row.feature}
                    </td>
                    <td className="p-4 md:p-5 bg-primary/5 font-bold text-primary">
                      {typeof row.myacc === 'boolean' && row.myacc ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                          <Check className="h-5 w-5" /> Included
                        </span>
                      ) : (
                        row.myacc
                      )}
                    </td>
                    <td className="p-4 md:p-5 text-muted-foreground">
                      {typeof row.bizportal === 'boolean' && !row.bizportal ? (
                        <span className="flex items-center gap-1 text-rose-500 font-medium">
                          <X className="h-4 w-4" /> No
                        </span>
                      ) : typeof row.bizportal === 'boolean' && row.bizportal ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Check className="h-4 w-4" /> Yes
                        </span>
                      ) : (
                        row.bizportal
                      )}
                    </td>
                    <td className="p-4 md:p-5 text-muted-foreground">
                      {typeof row.lawyer === 'boolean' && !row.lawyer ? (
                        <span className="flex items-center gap-1 text-rose-500 font-medium">
                          <X className="h-4 w-4" /> No
                        </span>
                      ) : typeof row.lawyer === 'boolean' && row.lawyer ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Check className="h-4 w-4" /> Yes
                        </span>
                      ) : (
                        row.lawyer
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Required Documents Callout */}
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <FileCheck2 className="h-7 w-7 text-primary" />
              What Documents Do You Need to Get Started?
            </h3>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              We make the paperwork completely painless. All you need to provide is:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <span className="font-bold text-white text-sm">1. Valid ID / Passport</span>
                <p className="text-xs text-slate-400">Clear photo or scan of green ID book, smartcard, or foreign passport.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <span className="font-bold text-white text-sm">2. Proof of Address</span>
                <p className="text-xs text-slate-400">Utility bill, bank statement, or lease agreement less than 3 months old.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <span className="font-bold text-white text-sm">3. Desired Company Names</span>
                <p className="text-xs text-slate-400">1 to 4 proposed business names listed in order of preference.</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              *All standard MOIs, director appointment resolutions, and CIPC declaration forms are generated automatically by our practice.
            </p>
          </div>
        </section>

        {/* FAQs */}
        <section className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
          </div>

          <div className="w-full space-y-6">
            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>How long does CIPC company registration take online?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7 text-sm md:text-base">
                Our online registration process is highly optimized. Name reservation typically takes 1 business day, and the registration itself is completed within 24 to 48 hours of name approval.
              </p>
            </div>

            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>What documents are required to register a company in SA?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7 text-sm md:text-base">
                You will need a valid South African ID document or smartcard (or passport for foreign nationals) for all directors, along with proof of address and signed consent forms which we generate for you.
              </p>
            </div>

            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Is a tax number automatically generated by SARS?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7 text-sm md:text-base">
                Yes, when we register your company with the CIPC, an official SARS Income Tax number is automatically generated and included in your company documentation.
              </p>
            </div>

            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Can foreign nationals register a company in South Africa?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7 text-sm md:text-base">
                Yes, foreign nationals can register a private company (Pty) Ltd. You will require a valid passport copy instead of a South African ID.
              </p>
            </div>

            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>What is the Beneficial Ownership register requirement?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7 text-sm md:text-base">
                Under the General Laws Amendment Act, all companies registered with CIPC must submit an official Beneficial Ownership register identifying natural persons holding 5% or more shares or voting rights. We file this for you to avoid administrative fines or frozen bank accounts.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 max-w-4xl text-center space-y-6 pt-8">
          <h2 className="text-3xl font-bold text-foreground">
            Start Your South African Business Journey Today
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Get your company registered in 24–48 hours with full SARS tax clearance and official share certificates.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/products/private-company-registration">
                Register Pty Ltd (R950) <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold px-8 h-12">
              <Link href="/products/tender-ready-company-registration-package">
                Tender-Ready Pack (R1,600)
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
