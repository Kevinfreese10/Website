import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  Building2, 
  Calculator, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Script from 'next/script';

export const revalidate = 3600;

export const dynamicParams = false;

const cities = [
  { id: 'johannesburg', name: 'Johannesburg', region: 'Gauteng', lat: '-26.2041', lon: '28.0473' },
  { id: 'pretoria', name: 'Pretoria', region: 'Gauteng', lat: '-25.7479', lon: '28.2293' },
  { id: 'cape-town', name: 'Cape Town', region: 'Western Cape', lat: '-33.9249', lon: '18.4241' },
  { id: 'durban', name: 'Durban', region: 'KwaZulu-Natal', lat: '-29.8587', lon: '31.0218' },
  { id: 'randburg', name: 'Randburg', region: 'Gauteng', lat: '-26.0936', lon: '27.9950' },
];

export async function generateStaticParams() {
  return cities.map((city) => ({
    city: city.id,
  }));
}

type Props = {
  params: Promise<{ city: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const cityData = cities.find(c => c.id === resolvedParams.city);
  if (!cityData) return {};
  
  const defaults: Metadata = {
      title: `Accountant ${cityData.name} | Local Tax & Accounting Services`,
      description: `Looking for a professional accountant in ${cityData.name}? My Accountant offers local bookkeeping, tax compliance, and advisory services for businesses in ${cityData.name}, ${cityData.region}.`,
  };
  return getStaticPageMetadata(`accountant-${resolvedParams.city}`, defaults);
}

export default async function CityAccountantPage({ params }: Props) {
  const resolvedParams = await params;
  const cityData = cities.find(c => c.id === resolvedParams.city);
  if (!cityData) return null;

  // LocalBusiness Structured Data specific to the city
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": ["AccountingService", "LocalBusiness"],
    "name": `My Accountant ${cityData.name}`,
    "url": `https://www.myacc.co.za/accountant-${cityData.id}`,
    "telephone": "+27-10-109-1625",
    "email": "info@myacc.co.za",
    "image": "https://www.myacc.co.za/logo.png",
    "areaServed": {
      "@type": "City",
      "name": cityData.name
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": cityData.lat,
      "longitude": cityData.lon
    },
    "provider": {
      "@type": "Organization",
      "name": "My Accountant",
      "url": "https://www.myacc.co.za"
    }
  };

  const services = [
    {
      title: "Business Accounting",
      description: `Monthly bookkeeping and financial statements tailored for small to medium businesses across ${cityData.name}.`,
      icon: Briefcase,
    },
    {
      title: "Tax Compliance",
      description: "SARS ITR14, VAT201, and EMP201 submissions to keep your business 100% compliant and penalty-free.",
      icon: ShieldCheck,
    },
    {
      title: "Company Registrations",
      description: "New CIPC company registrations, director changes, and annual returns managed by our certified professionals.",
      icon: Building2,
    }
  ];

  const faqs = [
    {
      q: `Do you offer on-site accounting services in ${cityData.name}?`,
      a: `We operate as a modern, cloud-first accounting firm. This means we can service businesses anywhere in ${cityData.name} and across ${cityData.region} without the overhead costs of on-site visits, saving you money.`
    },
    {
      q: "Are your accountants registered professionals?",
      a: "Yes, our team consists of fully qualified accountants registered with CIBA (Chartered Institute for Business Accountants) and SAIT (South African Institute of Taxation). We are also registered SARS Tax Practitioners."
    },
    {
      q: "What accounting software do you support?",
      a: "We are certified partners for both Xero and Sage Business Cloud Accounting. We can migrate your existing records or set up a brand new profile for your business."
    }
  ];

  return (
    <>
      <Script
        id={`local-business-schema-${cityData.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
        {/* Hero Section */}
        <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
              Professional Accountant in {cityData.name}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Local expertise meeting national standards. Let our registered accountants handle your monthly books, SARS tax compliance, and payroll in {cityData.name}.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="font-bold px-10 h-12">
                <Link href="/contact">Book a Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold h-12">
                <Link href="/products">Explore Packages</Link>
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
            <h2 className="text-3xl font-bold text-foreground">Our Accounting Solutions in {cityData.name}</h2>
            <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <Card key={i} className="border shadow-sm border-border bg-card flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 text-sm leading-relaxed space-y-4">
                  <p>{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Box */}
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="bg-primary text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
            <h3 className="text-3xl font-bold">Simplify Your Business Finances</h3>
            <p className="text-white/80 max-w-xl mx-auto text-base">
              Focus on growing your company in {cityData.name} while our certified accountants take care of the paperwork, payroll, and SARS tax submissions.
            </p>
            <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
              <Link href="/contact">Get a Free Compliance Assessment <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
    </>
  );
}
