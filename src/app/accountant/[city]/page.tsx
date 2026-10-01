import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { CITIES_DATA } from '@/lib/cities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import {
  Building2,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  Calculator,
  FileText,
  BadgeCheck,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react';

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return Object.keys(CITIES_DATA).map((city) => ({
    city,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const cityData = CITIES_DATA[city.toLowerCase()];

  if (!cityData) {
    return {
      title: { absolute: 'City Accountant Not Found | My Accountant' },
    };
  }

  const canonicalUrl = `https://www.myacc.co.za/accountant-${cityData.slug}`;

  return {
    title: { absolute: cityData.metaTitle },
    description: cityData.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: cityData.metaTitle,
      description: cityData.metaDescription,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_ZA',
      siteName: 'My Accountant',
    },
    twitter: {
      card: 'summary_large_image',
      title: cityData.metaTitle,
      description: cityData.metaDescription,
    },
  };
}

export default async function CityAccountantPage({ params }: PageProps) {
  const { city } = await params;
  const cityData = CITIES_DATA[city.toLowerCase()];

  if (!cityData) {
    notFound();
  }

  const coreServices = [
    {
      title: 'Monthly Bookkeeping & Accounting',
      description: 'Automated bank reconciliations, expense categorisation, and monthly profit & loss reporting.',
      link: '/monthly-accounting',
      icon: Calculator,
      price: 'From R950/pm',
    },
    {
      title: 'SARS Tax Compliance & eFiling',
      description: 'Accurate submissions for VAT201, EMP201, Corporate Income Tax (ITR14), and Provisional Tax (IRP6).',
      link: '/products#tax',
      icon: ShieldCheck,
      price: 'Fixed Per Filing',
    },
    {
      title: 'Annual Financial Statements (AFS)',
      description: 'Audit-ready financial statements compiled in strict compliance with IFRS for SMEs and Companies Act.',
      link: '/annual-financial-statements',
      icon: FileText,
      price: 'Fast 5-Day Delivery',
    },
    {
      title: 'Monthly Payroll Administration',
      description: 'BCEA-compliant digital payslips, monthly EMP201 submissions, UIF uFiling, and bi-annual EMP501 recons.',
      link: '/monthly-payroll',
      icon: Building2,
      price: 'From R550/pm',
    },
  ];

  const isHeadquarters = cityData.slug === 'johannesburg' || cityData.slug === 'randburg';

  const cityServiceSchema: any = {
    '@type': isHeadquarters ? ['AccountingService', 'LocalBusiness'] : ['AccountingService', 'ProfessionalService'],
    '@id': `https://www.myacc.co.za/accountant-${cityData.slug}#${isHeadquarters ? 'localbusiness' : 'service'}`,
    name: `My Accountant - ${cityData.name}`,
    url: `https://www.myacc.co.za/accountant-${cityData.slug}`,
    description: cityData.metaDescription,
    telephone: '+27101091625',
    email: 'info@myacc.co.za',
    priceRange: 'R250 - R4500',
    image: 'https://www.myacc.co.za/logo.png',
    areaServed: {
      '@type': 'AdministrativeArea',
      name: `${cityData.name}, ${cityData.province}, South Africa`,
    },
    provider: {
      '@type': 'Organization',
      name: 'My Accountant',
      url: 'https://www.myacc.co.za',
      telephone: '+27101091625',
      email: 'info@myacc.co.za',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood',
        addressLocality: 'Johannesburg',
        addressRegion: 'Gauteng',
        postalCode: '2195',
        addressCountry: 'ZA',
      },
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    founder: {
      '@type': 'Person',
      name: 'Kevin Freese',
      jobTitle: 'Managing Director & Registered Tax Practitioner',
      identifier: 'SARS PR-0098553',
    },
  };

  // Only attach physical address and geo coordinates for actual physical headquarters
  if (isHeadquarters) {
    cityServiceSchema.address = {
      '@type': 'PostalAddress',
      streetAddress: 'Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood',
      addressLocality: 'Johannesburg',
      addressRegion: 'Gauteng',
      postalCode: '2195',
      addressCountry: 'ZA',
    };
    cityServiceSchema.geo = {
      '@type': 'GeoCoordinates',
      latitude: cityData.latitude,
      longitude: cityData.longitude,
    };
  }

  // Schema & FAQPage JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      cityServiceSchema,
      {
        '@type': 'FAQPage',
        mainEntity: cityData.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
        {/* Hero Section */}
        <section className="text-foreground py-20 lg:py-28 bg-background relative overflow-hidden border-b border-border/40">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div
            className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift"
            style={{ animationDelay: '-5s' }}
          />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
              <MapPin className="h-4 w-4" />
              <span>Serving {cityData.name} & {cityData.province}</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
              {cityData.heroHeadline}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {cityData.heroSubheadline}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="font-bold px-8 h-12">
                <Link href="/products">
                  Explore Fixed Services <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8 h-12">
                <Link href="/contact">Book Free Consultation</Link>
              </Button>
            </div>

            {/* Quick Proof Pills */}
            <div className="pt-6 flex flex-wrap justify-center items-center gap-4 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <BadgeCheck className="h-4 w-4 text-primary" /> CIBA & SAIT Accredited
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> SARS PR-0098553
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-4 w-4 text-primary" /> 100% Online & Rapid Turnaround
              </span>
            </div>
          </div>
        </section>

        {/* Localized Suburb Coverage */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 space-y-4 shadow-sm">
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Key Suburbs & Business Districts Covered in {cityData.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              We provide fully digital, secure accounting and SARS tax representation throughout the {cityData.region} and surrounding areas:
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {cityData.suburbs.map((suburb) => (
                <span
                  key={suburb}
                  className="px-3 py-1 bg-muted rounded-md text-xs md:text-sm font-medium text-foreground/80 border border-border/40"
                >
                  {suburb}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Core Services Grid */}
        <section className="container mx-auto px-4 max-w-6xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Fixed-Price Accounting & Tax Services for {cityData.name} Businesses
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transparent pricing, zero hidden hourly fees, and guaranteed turnaround times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreServices.map((svc) => (
              <Card key={svc.title} className="hover:shadow-md transition-shadow border-border/60">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <svc.icon className="h-6 w-6" />
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">
                      {svc.price}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{svc.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {svc.description}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button asChild variant="outline" className="w-full font-semibold">
                      <Link href={svc.link}>
                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Choose My Accountant */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 space-y-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl md:text-3xl font-extrabold">
                Why {cityData.name} Businesses Choose My Accountant
              </h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                We combine automated AI precision with the deep regulatory expertise of registered Chartered Business Accountants and SARS practitioners.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <h4 className="font-bold text-white">Fixed Monthly Pricing</h4>
                <p className="text-xs text-slate-300">Budget with 100% confidence. No surprise hourly billing.</p>
              </div>
              <div className="space-y-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <h4 className="font-bold text-white">Direct Practitioner Access</h4>
                <p className="text-xs text-slate-300">Dedicated phone and WhatsApp support from certified tax experts.</p>
              </div>
              <div className="space-y-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <h4 className="font-bold text-white">Zero Travel or Paperwork</h4>
                <p className="text-xs text-slate-300">Secure digital uploads and online portal. Focus on running your business.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="container mx-auto px-4 max-w-5xl space-y-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Trusted by Hundreds of South African Business Owners
          </h2>
          <TrustIndexWidget />
        </section>

        {/* FAQs */}
        <section className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-foreground">
              Frequently Asked Questions for {cityData.name}
            </h2>
            <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
          </div>

          <div className="space-y-6">
            {cityData.faqs.map((faq, i) => (
              <div key={i} className="border-b border-border pb-6 last:border-0">
                <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <div className="text-muted-foreground leading-relaxed pl-7 text-sm md:text-base">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 max-w-4xl text-center space-y-6 pt-8">
          <h2 className="text-3xl font-bold text-foreground">
            Ready to Streamline Your {cityData.name} Business Accounting?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Get registered, file your overdue returns, or switch to seamless monthly accounting today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-8 h-12">
              <Link href="/products">Get Started Online</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold px-8 h-12">
              <a href="tel:+27101091625" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Call 010 109 1625
              </a>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
