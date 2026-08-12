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
  Briefcase,
  HelpCircle,
  FileText,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Script from 'next/script';

export const revalidate = 3600;

export const dynamicParams = false;

interface CityData {
  id: string;
  name: string;
  region: string;
  lat: string;
  lon: string;
  suburbs: string[];
  intro: string;
  whyLocal: string;
}

const cities: CityData[] = [
  {
    id: 'johannesburg',
    name: 'Johannesburg',
    region: 'Gauteng',
    lat: '-26.2041',
    lon: '28.0473',
    suburbs: ['Sandton', 'Randburg', 'Rosebank', 'Midrand', 'Roodepoort', 'Fourways', 'Johannesburg CBD', 'Bedfordview', 'Bryanston', 'Rivonia'],
    intro: 'As South Africa\'s economic powerhouse, Johannesburg is home to thousands of SMEs, startups, and established enterprises. Whether you run a consulting firm in Sandton, a retail store in Rosebank, or a construction company in Roodepoort, staying on top of your tax compliance and bookkeeping is critical to avoiding SARS penalties and growing sustainably.',
    whyLocal: 'Johannesburg\'s fast-paced business environment demands an accountant who understands Gauteng\'s unique regulatory landscape, from municipal licensing to sector-specific BEE requirements. Our team serves businesses across all major Johannesburg suburbs with cloud-based accounting that eliminates the need for expensive on-site visits.',
  },
  {
    id: 'pretoria',
    name: 'Pretoria',
    region: 'Gauteng',
    lat: '-25.7479',
    lon: '28.2293',
    suburbs: ['Centurion', 'Brooklyn', 'Hatfield', 'Menlyn', 'Montana', 'Lynnwood', 'Waterkloof', 'Arcadia', 'Silverton', 'Garsfontein'],
    intro: 'As the administrative capital of South Africa, Pretoria has a thriving business sector supported by government contracts, tenders, and a growing private economy. Whether you\'re a contractor supplying government departments, an NGO in Hatfield, or a tech startup in Centurion, proper financial management is essential for securing tenders and maintaining CIPC compliance.',
    whyLocal: 'Pretoria-based businesses often need specialised support with tender documentation, CSD registration, and government compliance. Our accountants have deep experience helping businesses in the Tshwane metropolitan area navigate these requirements while keeping their books clean and SARS-compliant.',
  },
  {
    id: 'cape-town',
    name: 'Cape Town',
    region: 'Western Cape',
    lat: '-33.9249',
    lon: '18.4241',
    suburbs: ['Century City', 'Claremont', 'Stellenbosch', 'Bellville', 'Paarl', 'Somerset West', 'Woodstock', 'Sea Point', 'Green Point', 'Tyger Valley'],
    intro: 'Cape Town\'s diverse economy spans tourism, tech, film production, wine, and creative industries. The Mother City is also home to a booming freelancer and remote-worker community. Whether you\'re running a guesthouse in Sea Point, a digital agency in Woodstock, or an export business in Bellville, keeping your financials organised is essential for growth and compliance.',
    whyLocal: 'Cape Town businesses face unique considerations including seasonal cash-flow management for tourism-linked sectors, foreign-currency accounting for export businesses, and the growing need for film production accounting. Our team understands these nuances and provides tailored solutions for Western Cape entrepreneurs.',
  },
  {
    id: 'durban',
    name: 'Durban',
    region: 'KwaZulu-Natal',
    lat: '-29.8587',
    lon: '31.0218',
    suburbs: ['Umhlanga', 'Ballito', 'Pinetown', 'Westville', 'Berea', 'Morningside', 'La Lucia', 'Hillcrest', 'Amanzimtoti', 'Durban North'],
    intro: 'Durban is a major port city and industrial hub, with a thriving economy in manufacturing, logistics, sugar, and tourism. KwaZulu-Natal businesses, from shipping companies in the harbour area to hospitality operators along the coast, need reliable accounting support to manage complex VAT requirements, import/export documentation, and payroll for seasonal staff.',
    whyLocal: 'Durban\'s port-driven economy creates unique accounting challenges including customs and excise documentation, multi-branch payroll management, and seasonal revenue fluctuations. Our cloud-first model means we can serve businesses from Umhlanga to Amanzimtoti without the overhead of a physical office, passing those savings directly to you.',
  },
  {
    id: 'randburg',
    name: 'Randburg',
    region: 'Gauteng',
    lat: '-26.0936',
    lon: '27.9950',
    suburbs: ['Ferndale', 'Northcliff', 'Linden', 'Fairlands', 'Blairgowrie', 'Cresta', 'Kya Sand', 'Strijdom Park', 'Northgate', 'Honeydew'],
    intro: 'Randburg sits at the heart of Johannesburg\'s northern suburbs and is a bustling commercial hub for small and medium businesses. From light-industrial operations in Kya Sand and Strijdom Park to professional services firms in Ferndale and retail businesses in Cresta, Randburg businesses need affordable, professional accounting to stay compliant and competitive.',
    whyLocal: 'As a major commercial node in Gauteng, Randburg businesses benefit from our deep understanding of the local SME landscape. Many of our clients operate in the light-industrial and services sectors that dominate this area, and we provide tailored bookkeeping, payroll, and tax solutions that fit their specific operational needs.',
  },
  {
    id: 'sandton',
    name: 'Sandton',
    region: 'Gauteng',
    lat: '-26.1076',
    lon: '28.0567',
    suburbs: ['Bryanston', 'Morningside', 'Rivonia', 'Hyde Park', 'Illovo', 'Woodmead', 'Parkmore', 'Sunninghill'],
    intro: 'Sandton is Africa\'s richest square mile and a major financial district. From corporate headquarters to boutique consulting firms and tech startups, businesses in Sandton require sophisticated, reliable accounting and tax services.',
    whyLocal: 'Operating in Sandton means dealing with high-volume transactions and complex tax structures. Our cloud-based accounting services provide Sandton businesses with real-time financial insights, ensuring compliance while you focus on scaling your enterprise.',
  },
  {
    id: 'fourways',
    name: 'Fourways',
    region: 'Gauteng',
    lat: '-26.0153',
    lon: '28.0069',
    suburbs: ['Broadacres', 'Lonehill', 'Craigavon', 'Pineslopes', 'Dainfern', 'Witkoppen', 'Paulshof', 'Magaliessig'],
    intro: 'Fourways is one of the fastest-developing commercial and residential hubs in Johannesburg. Home to retail centers, entertainment venues, and a booming SME sector, businesses here need agile accounting solutions.',
    whyLocal: 'The rapid growth in Fourways presents unique opportunities and challenges. We help local businesses manage cash flow, handle payroll for growing teams, and ensure full SARS compliance without the need for expensive in-house financial departments.',
  },
  {
    id: 'bryanston',
    name: 'Bryanston',
    region: 'Gauteng',
    lat: '-26.0664',
    lon: '28.0253',
    suburbs: ['River Club', 'Petervale', 'Douglasdale', 'Hobart', 'Epsom Downs', 'Cramerview', 'Mill Hill', 'Vandia Grove'],
    intro: 'Bryanston bridges the gap between corporate Sandton and suburban Johannesburg, hosting numerous agencies, private practices, and medium-sized enterprises. Keeping your financials organized is essential for thriving in this competitive area.',
    whyLocal: 'Many Bryanston businesses are professional services, agencies, or independent consultants. We understand the specific tax deductions, invoicing cycles, and financial reporting needed for these business models to maximize profitability.',
  },
  {
    id: 'centurion',
    name: 'Centurion',
    region: 'Gauteng',
    lat: '-25.8603',
    lon: '28.1894',
    suburbs: ['Irene', 'Zwartkop', 'Highveld', 'Lyttelton', 'Doringkloof', 'Rooihuiskraal', 'Wierdapark', 'Clubview'],
    intro: 'Strategically located between Pretoria and Johannesburg, Centurion is a prime location for logistics, tech, and defense businesses. Proper financial management is key to maintaining growth in this dynamic industrial and commercial node.',
    whyLocal: 'Centurion’s diverse economy requires versatile accounting support. Whether you need assistance with complex payrolls, VAT submissions for large supply chains, or CSD compliance, our team has the expertise to keep your Centurion business compliant.',
  },
  {
    id: 'port-elizabeth-gqeberha',
    name: 'Port Elizabeth (Gqeberha)',
    region: 'Eastern Cape',
    lat: '-33.9608',
    lon: '25.6022',
    suburbs: ['Summerstrand', 'Newton Park', 'Walmer', 'Mount Croix', 'Mill Park', 'Central', 'Korsten', 'Lorraine'],
    intro: 'As a major seaport and manufacturing hub, Port Elizabeth (Gqeberha) is vital to the Eastern Cape economy. From automotive suppliers to coastal tourism operators, businesses here need robust financial tracking and tax strategies.',
    whyLocal: 'Eastern Cape businesses often deal with manufacturing cycles, export/import taxes, and seasonal fluctuations. We provide tailored accounting and advisory services to help Gqeberha enterprises optimize their operations and remain SARS compliant.',
  },
  {
    id: 'bloemfontein',
    name: 'Bloemfontein',
    region: 'Free State',
    lat: '-29.1146',
    lon: '26.2214',
    suburbs: ['Langenhoven Park', 'Dan Pienaar', 'Westdene', 'Universitas', 'Fichardt Park', 'Bayswater', 'Pellissier', 'Waverley'],
    intro: 'The judicial capital of South Africa, Bloemfontein has a stable economy driven by government, education, and agriculture. Reliable bookkeeping and tax compliance are essential for businesses serving these foundational sectors.',
    whyLocal: 'Doing business in the Free State requires a solid understanding of local commerce, agricultural supply chains, and service industries. Our cloud accounting services bring modern, efficient financial management to Bloemfontein entrepreneurs.',
  },
  {
    id: 'east-london',
    name: 'East London',
    region: 'Eastern Cape',
    lat: '-32.9975',
    lon: '27.8967',
    suburbs: ['Berea', 'Vincent', 'Beacon Bay', 'Nahoon', 'Gonubie', 'Cambridge', 'Quigney', 'Amalinda'],
    intro: 'East London is a key industrial and automotive center on the Sunshine Coast. Managing cash flow, inventory accounting, and payroll is critical for businesses operating in this vibrant coastal city.',
    whyLocal: 'With a mix of large-scale manufacturing and local SMEs, East London businesses face varied regulatory requirements. Our team offers fixed-fee, comprehensive accounting packages that scale alongside your Eastern Cape business.',
  },
  {
    id: 'nelspruit',
    name: 'Nelspruit (Mbombela)',
    region: 'Mpumalanga',
    lat: '-25.4753',
    lon: '30.9806',
    suburbs: ['West Acres', 'Sonheuwel', 'Steiltes', 'Riverside Park', 'Valencia', 'Nelsville', 'Kamagugu', 'Drum Rock'],
    intro: 'Serving as the gateway to the Kruger National Park, Nelspruit (Mbombela) boasts a strong economy based on agriculture, tourism, and retail. Staying on top of seasonal revenues and specialized tax laws is vital for local success.',
    whyLocal: 'Nelspruit businesses often experience seasonal tourism peaks and agricultural cycles. We help you manage your cash flow proactively and ensure that your payroll and tax obligations are met accurately year-round in Mpumalanga.',
  },
  {
    id: 'stellenbosch',
    name: 'Stellenbosch',
    region: 'Western Cape',
    lat: '-33.9321',
    lon: '18.8602',
    suburbs: ['Technopark', 'Die Boord', 'Welgevonden', 'Kayamandi', 'Cloetesville', 'Jamestown', 'Rozendal', 'Paradyskloof'],
    intro: 'Known for its world-class university, winelands, and booming tech startup scene in Technopark, Stellenbosch is a hub of innovation and agriculture. Cutting-edge businesses here need modern, cloud-first accounting.',
    whyLocal: 'Whether you are running a wine estate, a software startup, or a boutique guesthouse, Stellenbosch requires specialized financial management. We offer streamlined, paperless accounting that matches the innovative spirit of the Winelands.',
  },
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
      title: `Accountant in ${cityData.name} | Tax, Bookkeeping & Payroll | My Accountant`,
      description: `Professional accountant in ${cityData.name}, ${cityData.region}. SARS-compliant tax returns, monthly bookkeeping, payroll, company registration & financial statements. Serving ${cityData.suburbs.slice(0, 4).join(', ')} and surrounds.`,
  };
  return getStaticPageMetadata(`accountant-${resolvedParams.city}`, defaults);
}

export default async function CityAccountantPage({ params }: Props) {
  const resolvedParams = await params;
  const cityData = cities.find(c => c.id === resolvedParams.city);
  if (!cityData) return null;

  // LocalBusiness + AccountingService Structured Data
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
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `Accounting Services in ${cityData.name}`,
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Monthly Bookkeeping" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Tax Return Filing" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Payroll Services" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Company Registration" } },
      ]
    }
  };

  // FAQPage schema for rich snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Do you offer on-site accounting services in ${cityData.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `We operate as a modern, cloud-first accounting firm. This means we can service businesses anywhere in ${cityData.name} and across ${cityData.region} without the overhead costs of on-site visits, saving you money while maintaining a personal, responsive service.`
        }
      },
      {
        "@type": "Question",
        "name": "Are your accountants registered professionals?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our team consists of fully qualified accountants registered with CIBA (Chartered Institute for Business Accountants) and SAIT (South African Institute of Taxation). We are also registered SARS Tax Practitioners."
        }
      },
      {
        "@type": "Question",
        "name": "What accounting software do you support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We are certified partners for Xero, Sage Business Cloud Accounting, Zoho Books, and Pastel. We can migrate your existing records or set up a brand new profile for your business."
        }
      },
      {
        "@type": "Question",
        "name": `How much does an accountant cost in ${cityData.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Our accounting fees in ${cityData.name} start from as little as R350/month for basic bookkeeping. We offer transparent, fixed-fee packages with no hidden costs. Visit our products page for detailed pricing on all services.`
        }
      },
      {
        "@type": "Question",
        "name": "Can you help with SARS audits and disputes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. We handle SARS dispute resolution, audit support, objections, and appeals. Our tax practitioners have extensive experience dealing with SARS on behalf of businesses across South Africa."
        }
      }
    ]
  };

  const services = [
    {
      title: "Monthly Bookkeeping",
      description: `Accurate bank reconciliations, expense categorisation, and monthly management reports for your ${cityData.name} business. We use cloud software so you always have real-time visibility into your finances.`,
      icon: Briefcase,
      link: '/bookkeeping-services',
    },
    {
      title: "Tax Compliance & Returns",
      description: "ITR12 personal tax, ITR14 company tax, VAT201 submissions, and provisional tax — all filed on time to avoid SARS penalties and interest charges.",
      icon: ShieldCheck,
      link: '/tax-compliance',
    },
    {
      title: "Company Registration",
      description: "New CIPC company registrations, director changes, beneficial ownership declarations, and annual returns managed by our certified professionals.",
      icon: Building2,
      link: '/company-registration',
    },
    {
      title: "Payroll & PAYE",
      description: "Monthly payroll processing, IRP5 certificates, EMP201 submissions, UIF declarations, and SDL compliance. We handle seasonal and permanent staff.",
      icon: Users,
      link: '/payroll-services',
    },
    {
      title: "Financial Statements",
      description: "Annual financial statements, management accounts, and cash-flow reports prepared to IFRS for SMEs standards. Essential for loan applications and investor reporting.",
      icon: FileText,
      link: '/financial-statements',
    },
    {
      title: "Tax Planning & Advisory",
      description: `Strategic tax planning to legally minimise your tax burden. We help ${cityData.name} business owners structure their affairs for maximum efficiency.`,
      icon: Calculator,
      link: '/tax-planning',
    },
  ];

  const processSteps = [
    { step: '1', title: 'Free Consultation', description: 'We assess your business needs and recommend the right package for you.' },
    { step: '2', title: 'Onboarding', description: 'We set up your cloud accounting profile, connect your bank feeds, and migrate your data.' },
    { step: '3', title: 'Monthly Processing', description: 'Our team processes your transactions, reconciles your bank, and prepares management reports.' },
    { step: '4', title: 'Compliance Filing', description: 'We file all SARS returns, CIPC annual returns, and payroll submissions on your behalf.' },
  ];

  const faqs = [
    {
      q: `Do you offer on-site accounting services in ${cityData.name}?`,
      a: `We operate as a modern, cloud-first accounting firm. This means we can service businesses anywhere in ${cityData.name} and across ${cityData.region} without the overhead costs of on-site visits, saving you money while maintaining a personal, responsive service. You'll have a dedicated accountant you can reach via phone, email, or WhatsApp.`
    },
    {
      q: "Are your accountants registered professionals?",
      a: "Yes, our team consists of fully qualified accountants registered with CIBA (Chartered Institute for Business Accountants) and SAIT (South African Institute of Taxation). We are also registered SARS Tax Practitioners, meaning we can engage directly with SARS on your behalf."
    },
    {
      q: "What accounting software do you support?",
      a: "We are certified partners for Xero, Sage Business Cloud Accounting, Zoho Books, and Pastel. We can migrate your existing records or set up a brand new profile for your business — the choice of software depends on your business needs and budget."
    },
    {
      q: `How much does an accountant cost in ${cityData.name}?`,
      a: `Our accounting fees in ${cityData.name} start from as little as R350/month for basic bookkeeping. Complex services like annual financial statements and tax planning are quoted based on your company's size and transaction volume. All our pricing is transparent with no hidden costs — visit our products page for detailed pricing.`
    },
    {
      q: "Can you help with SARS audits and disputes?",
      a: "Absolutely. We handle SARS dispute resolution, audit support, objections, and appeals. Our tax practitioners have extensive experience dealing with SARS on behalf of businesses and individuals. Whether you've received a SARS verification letter, an audit notification, or a disputed assessment, we can assist."
    },
  ];

  return (
    <>
      <Script
        id={`local-business-schema-${cityData.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Script
        id={`faq-schema-${cityData.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
              Registered tax practitioners and bookkeepers serving businesses across {cityData.name}, {cityData.region}. SARS compliance, payroll, and financial reporting — all handled online.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="font-bold px-10 h-12">
                <Link href="/contact">Book a Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold h-12">
                <Link href="/products">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4">
          <TrustIndexWidget />
        </div>

        {/* Local Introduction */}
        <section className="container mx-auto px-4 max-w-4xl space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Why {cityData.name} Businesses Choose My Accountant</h2>
          <Separator className="w-16 border-b-2 border-primary/20" />
          <p className="text-slate-600 leading-relaxed text-base">{cityData.intro}</p>
          <p className="text-slate-600 leading-relaxed text-base">{cityData.whyLocal}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span className="font-semibold text-sm text-foreground">CIBA & SAIT Registered</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span className="font-semibold text-sm text-foreground">200+ Five-Star Reviews</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span className="font-semibold text-sm text-foreground">Fixed Monthly Fees</span>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="container mx-auto px-4 max-w-6xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Accounting Services in {cityData.name}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              From monthly bookkeeping to annual tax filings, we offer a full suite of accounting services tailored for {cityData.name} businesses.
            </p>
            <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <Link href={service.link} className="inline-flex items-center text-primary font-semibold text-sm hover:underline">
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-slate-50 dark:bg-slate-900/30">
          <div className="container mx-auto px-4 max-w-5xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
              <p className="text-slate-600 max-w-xl mx-auto">Getting started with a professional accountant in {cityData.name} is simple.</p>
              <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {processSteps.map((item, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center mx-auto text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Local Footprint / Suburbs */}
        <section className="container mx-auto px-4 max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Serving Businesses Across {cityData.name}</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Our cloud-first model allows us to service clients across all major areas in the greater {cityData.name} region, including:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
            {cityData.suburbs.map((suburb, i) => (
              <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-border justify-center font-semibold text-foreground/80 shadow-sm text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {suburb}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Box */}
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="bg-primary text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
            <h3 className="text-3xl font-bold">Ready to Simplify Your Business Finances?</h3>
            <p className="text-white/80 max-w-xl mx-auto text-base">
              Join hundreds of {cityData.name} businesses that trust My Accountant with their bookkeeping, tax compliance, and payroll. Get a free assessment today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
                <Link href="/contact">Get a Free Assessment <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold h-12 border-white text-white hover:bg-white/10">
                <Link href="/products">Browse Services</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Common questions from {cityData.name} business owners about our accounting services.</p>
            <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
          </div>

          <div className="w-full space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                  {faq.q}
                </div>
              </h3>
              <div className="text-slate-600 leading-relaxed pl-7">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
        </section>

        {/* Related Services Links */}
        <section className="container mx-auto px-4 max-w-4xl space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">Explore Our Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Bookkeeping', href: '/bookkeeping-services' },
              { label: 'Tax Returns', href: '/tax-returns' },
              { label: 'Payroll', href: '/payroll-services' },
              { label: 'Company Registration', href: '/company-registration' },
              { label: 'VAT Registration', href: '/products/vat-registration' },
              { label: 'Tax Clearance', href: '/products/tax-clearance-certificate' },
              { label: 'Annual Returns', href: '/products/annual-returns' },
              { label: 'Financial Statements', href: '/financial-statements' },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-white dark:bg-slate-800 hover:border-primary/30 hover:shadow-sm transition-all text-sm font-semibold text-foreground/80">
                <ArrowRight className="h-4 w-4 text-primary" />
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
