import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  Building2, 
  ArrowRight, 
  FileCheck2, 
  RotateCcw, 
  Users, 
  FileSpreadsheet, 
  ShieldCheck, 
  Scale, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';
import { getStaticPageMetadata } from '@/lib/seo-utils';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: 'Company Secretarial Services South Africa | CIPC Compliance & Governance',
    description: 'Outsourced corporate secretarial services for South African companies. CIPC annual returns, director amendments (CoR39), beneficial ownership registers, share registers & governance compliance.',
  };
  return getStaticPageMetadata('company-secretarial-services-south-africa', defaults);
}

const secretarialFaqs = [
  {
    q: 'What do company secretarial services include in South Africa?',
    a: 'Company secretarial services encompass the statutory administration and governance maintenance required under the South African Companies Act 71 of 2008. This includes filing CIPC Annual Returns, maintaining share registers, drafting shareholder resolutions, updating directors via CoR39, filing Beneficial Ownership registers, and changing company registered addresses (CoR21.1).'
  },
  {
    q: 'Why must companies file CIPC Annual Returns each year?',
    a: 'Under Section 33 of the Companies Act, all registered companies and close corporations must file an annual return with CIPC within 30 business days following the anniversary of incorporation. Failure to file triggers administrative penalties and eventually leads to final deregistration, freezing company bank accounts and forfeiting company assets to the State.'
  },
  {
    q: 'What is the penalty for late CIPC Annual Returns?',
    a: 'CIPC charges late filing penalty fees ranging from R50 to R150+ per return depending on turnover and months overdue. If an entity remains non-compliant across consecutive filing periods, CIPC places the company into deregistration process.'
  },
  {
    q: 'How do you update company directors (CoR39) on CIPC?',
    a: 'To appoint or resign a director, we draft compliant director and shareholder resolutions, verify identity documents, and submit form CoR39 to CIPC electronically. CIPC processing typically takes 3 to 5 business days.'
  },
  {
    q: 'What is the difference between a Company Secretary and an outsourced secretarial service?',
    a: 'Public companies and state-owned entities are legally mandated to appoint a full-time resident Company Secretary. For private companies (Pty Ltd), appointing an outsourced corporate secretarial firm like My Accountant provides professional governance and CIPC compliance at a fraction of full-time employment cost.'
  }
];

const secretarialSchema = generateServicePillarSchema({
  title: 'Company Secretarial Services South Africa',
  description: 'Full-service outsourced CIPC company secretarial, statutory compliance, director amendments, beneficial ownership, and share registry administration.',
  slug: '/company-secretarial-services-south-africa',
  serviceType: 'ProfessionalService',
  priceRange: 'From R550',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Company Secretarial', url: '/products#company-secretarial' },
    { name: 'Company Secretarial Services', url: '/company-secretarial-services-south-africa' }
  ],
  faqs: secretarialFaqs
});

export default function CompanySecretarialPillarPage() {
  const coreServices = [
    {
      title: 'CIPC Annual Returns & FAS',
      description: 'Never miss an anniversary deadline. We calculate turnover fees, file Financial Accountability Supplements (FAS), and submit your returns accurately to keep your status active.',
      icon: Clock,
      link: '/products/annual-returns'
    },
    {
      title: 'Beneficial Ownership Register',
      description: 'Mandatory filing under General Laws Amendment Act. We compile your shareholding hierarchy, extract natural person ultimate owners, and submit your BO register to CIPC.',
      icon: Users,
      link: '/cipc-beneficial-ownership-register-south-africa'
    },
    {
      title: 'Director Amendments (CoR39)',
      description: 'Appoint new directors, resign outgoing directors, and update residential and contact details with formal CIPC CoR39 certificates and supporting resolutions.',
      icon: FileCheck2,
      link: '/products/director-amendment'
    },
    {
      title: 'Company Reinstatements',
      description: 'Restore deregistered companies back to "In Business" status with CIPC. We draft certified letters, clear outstanding annual returns, and liaise with CIPC.',
      icon: RotateCcw,
      link: '/products/company-reinstatement'
    },
    {
      title: 'Share Registers & Share Certificates',
      description: 'Maintain clean, legally valid securities registers, allotment records, share transfer deeds, and issue signed share certificates for all shareholders.',
      icon: FileSpreadsheet,
      link: '/products/share-register'
    },
    {
      title: 'Registered Office Change (CoR21.1)',
      description: 'Update your official registered office and postal address with CIPC to ensure all statutory notices, court notices, and government communications reach you reliably.',
      icon: Building2,
      link: '/products/registered-office-change'
    }
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(secretarialSchema) }}
      />

      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> CIPC Statutory Governance & Compliance
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Company Secretarial Services <span className="text-gradient">South Africa</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Eliminate compliance risks and CIPC deregistration. We manage your company registers, annual return filings, director changes, and beneficial ownership compliance with fixed, transparent pricing.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12 shadow-xl">
              <Link href="/contact">Speak to a Secretarial Specialist</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products#company-secretarial">View Secretarial Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Services Grid */}
      <section className="container mx-auto px-4 max-w-6xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Complete Corporate Secretarial Solutions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything your South African company needs to maintain immaculate governance and satisfy CIPC, banks, and auditors.
          </p>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coreServices.map((service, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-relaxed space-y-4">
                <p>{service.description}</p>
                <Button asChild variant="link" className="px-0 text-primary font-semibold">
                  <Link href={service.link}>Learn more & pricing <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Value Proposition Callout */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="bg-secondary/40 border border-border/60 rounded-2xl p-8 lg:p-12 shadow-sm space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">Why Outsource Company Secretarial to My Accountant?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">Zero Risk of Inadvertent Deregistration</strong>
                We track anniversary dates across our automated compliance calendar so no CIPC return is ever missed.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">Bank & Tender Ready Documentation</strong>
                South African commercial banks regularly freeze business accounts when company registers or BO filings fall out of date.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">Experienced Corporate Governance Specialists</strong>
                Managed by Kevin Freese (CIBA CBA(SA), SAIT Registered Tax Practitioner) ensuring strict alignment between CIPC and SARS.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">Transparent, Fixed Pricing in ZAR</strong>
                Clear pricing published online with no surprise hourly retainer rates or hidden disbursements.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {secretarialFaqs.map((faq, i) => (
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
          <h3 className="text-2xl sm:text-3xl font-bold">Keep Your CIPC Company Status Fully Protected</h3>
          <p className="text-white/90 max-w-xl mx-auto text-sm sm:text-base">
            Get your annual returns, beneficial ownership register, and director records updated with CIPC today.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get Started Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
