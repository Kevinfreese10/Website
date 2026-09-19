import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  FileCheck, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  Building2, 
  HardHat 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';
import { getStaticPageMetadata } from '@/lib/seo-utils';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: 'COIDA Letter of Good Standing South Africa | Fast Compensation Fund Renewal',
    description: 'Get your COIDA Letter of Good Standing from the Compensation Fund. We handle employer registration, annual Return of Earnings (ROE) submissions, and fast assessment clearances.',
  };
  return getStaticPageMetadata('coida-letter-of-good-standing', defaults);
}

const coidaFaqs = [
  {
    q: 'What is a COIDA Letter of Good Standing?',
    a: 'A COIDA Letter of Good Standing is an official statutory certificate issued by the Compensation Commissioner (Department of Employment and Labour) confirming that an employer is registered under the Compensation for Occupational Injuries and Diseases Act (COIDA), has submitted all annual Returns of Earnings (W.As.8), and has paid all outstanding assessments.'
  },
  {
    q: 'Why do clients, main contractors, and tenders require a Letter of Good Standing?',
    a: 'Under South African occupational health and safety regulations, a principal contractor or client can be held liable for workplace injuries sustained by a subcontractor\'s employees if that subcontractor is not registered in good standing with the Compensation Fund. It is mandatory for tender submissions, construction sites, and corporate supplier vendor listings.'
  },
  {
    q: 'How long is a COIDA Letter of Good Standing valid?',
    a: 'Letters of Good Standing are generally valid for one year (or until the end of April of the following filing year). Once the new Return of Earnings season opens, employers must submit their actual earnings for the past year and estimated earnings for the coming year to renew their letter.'
  },
  {
    q: 'What is required to renew a COIDA Letter of Good Standing?',
    a: 'To renew, you must submit your annual Return of Earnings (ROE / W.As.8) declaring total employee remuneration, receive your Notice of Assessment (W.As.51), pay the calculated assessment fee directly to the Compensation Commissioner, and download the renewed certificate.'
  },
  {
    q: 'How quickly can My Accountant obtain our Letter of Good Standing?',
    a: 'If your company is already registered and assessments are paid up, we can generate and issue your Letter of Good Standing within 24 to 48 hours. If there are outstanding ROE backlog years or overdue assessments, our team reconciles and clears the account with the Department of Labour swiftly.'
  }
];

const coidaSchema = generateServicePillarSchema({
  title: 'COIDA Letter of Good Standing & Compensation Fund Services',
  description: 'Fast-track COIDA employer registration, annual Return of Earnings (ROE) filing, assessment settlement, and Letter of Good Standing renewals in South Africa.',
  slug: '/coida-letter-of-good-standing',
  serviceType: 'ProfessionalService',
  priceRange: 'From R950',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Payroll & Labour', url: '/products#payroll' },
    { name: 'COIDA Letter of Good Standing', url: '/coida-letter-of-good-standing' }
  ],
  faqs: coidaFaqs
});

export default function CoidaLetterOfGoodStandingPage() {
  const requirements = [
    {
      title: 'Tenders & RFQs',
      desc: 'Government and private procurement portals (CSD) require a valid Letter of Good Standing before shortlisting any bidder.'
    },
    {
      title: 'Construction & Mining Sites',
      desc: 'Site safety access strictly prohibits any contractor or subcontractor without verified Compensation Fund coverage.'
    },
    {
      title: 'Corporate Vendor Onboarding',
      desc: 'Tier-1 corporations mandate an active Letter of Good Standing to protect against workplace liability claims.'
    }
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coidaSchema) }}
      />

      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-bold uppercase tracking-wider">
            <HardHat className="h-4 w-4" /> Department of Employment and Labour
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            COIDA Letter of Good Standing <span className="text-gradient">South Africa</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Need your Compensation Fund Letter of Good Standing urgently for a tender, contract, or site inspection? We register employers, submit Return of Earnings (ROE), and secure your valid certificate fast.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12 shadow-xl">
              <Link href="/products/coida-letter-of-good-standing">Get Your Letter of Good Standing</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/contact">Speak to a Labour Consultant</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Why You Need It */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Where a Letter of Good Standing Is Compulsory</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Every registered South African employer with one or more employees must remain in good standing.</p>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {requirements.map((item, i) => (
            <Card key={i} className="border border-border bg-card shadow-sm p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
              <CardContent className="p-0 text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Our Full Labour Services */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="bg-secondary/40 border border-border/60 rounded-2xl p-8 lg:p-12 shadow-sm space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">Complete Compensation Fund Compliance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-foreground font-medium pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              New COIDA Employer Registrations
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              Annual Return of Earnings (ROE / W.As.8) Filing
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              Notice of Assessment (W.As.51) Dispute & Queries
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              Backlog Clearance & Penalty Remission
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">COIDA & Letter of Good Standing FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {coidaFaqs.map((faq, i) => (
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
          <h3 className="text-2xl sm:text-3xl font-bold">Fast-Track Your Letter of Good Standing</h3>
          <p className="text-white/90 max-w-xl mx-auto text-sm sm:text-base">
            Do not let non-compliance stall your tenders or contracts. Get in touch with our team today.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/products/coida-letter-of-good-standing">Order Certificate Renewal <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
