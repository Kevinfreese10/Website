import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  Receipt, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Landmark, 
  Percent, 
  AlertCircle 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';
import { getStaticPageMetadata } from '@/lib/seo-utils';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: 'VAT Registration South Africa | Fast SARS VAT Number | My Accountant',
    description: 'Register for VAT with SARS online. Mandatory (R1M threshold) and voluntary (R50k+) VAT registration handled by registered tax practitioners. Guaranteed compliant submission.',
  };
  return getStaticPageMetadata('vat-registration-south-africa', defaults);
}

const vatFaqs = [
  {
    q: 'When is VAT registration mandatory in South Africa?',
    a: 'Under the Value-Added Tax Act 89 of 1991, VAT registration is compulsory if your business turnover has exceeded R1,000,000 in the past consecutive 12 months, or if you have entered into a binding written contractual obligation to exceed R1,000,000 in the next 12 months. You must apply within 21 business days of exceeding this threshold.'
  },
  {
    q: 'Can I register for VAT voluntarily below R1,000,000?',
    a: 'Yes. A business may register voluntarily if taxable supplies (sales) have exceeded R50,000 in the preceding 12-month period, or if you have incurred qualifying commercial capital expenditure. Voluntary registration allows you to claim back 15% input VAT on business purchases and equipment.'
  },
  {
    q: 'What documents does SARS require for VAT registration?',
    a: 'SARS strictly scrutinises VAT applications to prevent fraud. Requirements include certified copies of director IDs, official business bank statement (with original bank stamp), proof of registered business address (municipal account or lease agreement), proof of turnover (issued tax invoices matching bank deposits), and a completed VAT101 application via eFiling.'
  },
  {
    q: 'How long does SARS take to issue a VAT number?',
    a: 'When all verification documents and proof of turnover are prepared cleanly, SARS typically issues the VAT Notice of Registration (VAT103) within 5 to 15 business days. If SARS requests a virtual branch interview, our registered tax practitioners guide and represent you through the interview process.'
  },
  {
    q: 'What are my ongoing obligations once registered for VAT?',
    a: 'Once registered, you must issue valid tax invoices containing your VAT number, charge 15% standard-rate VAT on taxable sales, keep strict double-entry accounting records, and submit bi-monthly or monthly VAT201 declarations and payments to SARS by the last business day of the subsequent month.'
  }
];

const vatSchema = generateServicePillarSchema({
  title: 'SARS VAT Registration Services South Africa',
  description: 'Fast, professional SARS VAT registration for South African businesses. Voluntary and mandatory VAT applications handled by registered tax practitioners.',
  slug: '/vat-registration-south-africa',
  serviceType: 'TaxConsultant',
  priceRange: 'From R2,250',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Tax Services', url: '/products#tax-returns' },
    { name: 'VAT Registration', url: '/vat-registration-south-africa' }
  ],
  faqs: vatFaqs
});

export default function VatRegistrationPage() {
  const comparison = [
    {
      type: 'Mandatory VAT Registration',
      threshold: 'Turnover > R1,000,000 in 12 months',
      desc: 'Compulsory by law. Failure to apply within 21 business days results in severe backdated penalties and interest on uncollected output VAT.',
      idealFor: 'Growing SMEs, retail companies, high-volume trading entities, government contractors.',
      badge: 'Legal Requirement'
    },
    {
      type: 'Voluntary VAT Registration',
      threshold: 'Turnover > R50,000 in 12 months',
      desc: 'Strategic commercial choice. Enables claiming back 15% input VAT on inventory, machinery, vehicles, and operational expenses.',
      idealFor: 'B2B service businesses whose corporate clients demand VAT invoices, capital-intensive startups.',
      badge: 'Strategic Advantage'
    }
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vatSchema) }}
      />

      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-bold uppercase tracking-wider">
            <Percent className="h-4 w-4" /> SARS Value-Added Tax Compliance
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            VAT Registration <span className="text-gradient">South Africa</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Get your SARS VAT number without the administrative headache. Our registered tax practitioners review your proof of trade, prepare your VAT101 application, and liaise directly with SARS until your VAT103 certificate is issued.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12 shadow-xl">
              <Link href="/products/vat-registration">Register for VAT Online</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/contact">Book a VAT Consultation</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Threshold Comparison */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Mandatory vs. Voluntary VAT Registration</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Understand where your business stands under the South African VAT Act.</p>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {comparison.map((item, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card p-6 flex flex-col justify-between">
              <CardHeader className="p-0 pb-4 space-y-2">
                <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary w-fit">
                  {item.badge}
                </span>
                <CardTitle className="text-2xl font-bold">{item.type}</CardTitle>
                <div className="text-sm font-semibold text-primary">{item.threshold}</div>
              </CardHeader>
              <CardContent className="p-0 space-y-4 text-sm text-muted-foreground">
                <p className="leading-relaxed">{item.desc}</p>
                <div className="pt-2 border-t border-border">
                  <strong className="text-foreground block mb-1">Recommended for:</strong>
                  {item.idealFor}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Use My Accountant */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="bg-secondary/40 border border-border/60 rounded-2xl p-8 lg:p-12 shadow-sm space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">Why 95% of DIY VAT Applications Get Rejected by SARS</h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            SARS is notoriously vigilant with VAT registrations due to fraudulent refund schemes. Applications submitted with mismatched addresses, unverified bank accounts, or insufficient invoice proof are rejected immediately, delaying your business operations by months.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-foreground font-medium pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              Pre-audit of all proof-of-trade invoices
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              Direct liaison by registered tax practitioners
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              Assistance with SARS branch interview preparation
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              Seamless ongoing monthly VAT201 return submissions
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">VAT Registration FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {vatFaqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
              </h3>
              <div className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-primary text-white p-8 lg:p-12 rounded-2xl text-center space-y-6 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-bold">Ready to Get Your SARS VAT Number?</h3>
          <p className="text-white/90 max-w-xl mx-auto text-sm sm:text-base">
            Apply online today and let certified tax practitioners handle your submission from start to finish.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/products/vat-registration">Register for VAT Online <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
