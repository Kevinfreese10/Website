import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  Users, 
  ArrowRight, 
  ShieldAlert, 
  FileCheck, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  HelpCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';
import { getStaticPageMetadata } from '@/lib/seo-utils';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: 'CIPC Beneficial Ownership Register South Africa | Mandatory Filing & Compliance',
    description: 'Ensure full CIPC Beneficial Ownership (BO) register compliance under the General Laws Amendment Act. Fast filing for companies, trusts, and complex shareholding structures.',
  };
  return getStaticPageMetadata('cipc-beneficial-ownership-register-south-africa', defaults);
}

const boFaqs = [
  {
    q: 'What is a Beneficial Owner under South African law?',
    a: 'A Beneficial Owner is an individual (a natural person, not another company or trust) who ultimately owns or exercises effective control over 5% or more of the shares or voting rights of a company, or exercises effective control through other means.'
  },
  {
    q: 'Is Beneficial Ownership filing mandatory for all South African companies?',
    a: 'Yes. Following the enactment of the General Laws (Anti-Money Laundering and Combating Terrorism Financing) Amendment Act 22 of 2022, every private company (Pty Ltd), close corporation, and non-profit company (NPC) must file its Beneficial Ownership register with CIPC.'
  },
  {
    q: 'What happens if a company fails to file its Beneficial Ownership register?',
    a: 'Non-compliance is an offence under the Companies Act. CIPC issues compliance notices and administrative fines of up to R1,000,000 or 10% of turnover. Furthermore, South African commercial banks and tender boards now verify BO compliance before renewing facilities or awarding contracts.'
  },
  {
    q: 'When must the Beneficial Ownership register be updated?',
    a: 'Companies must file their BO register annually alongside their CIPC Annual Return, and within 10 business days of any change in shareholding, directors, or natural person ownership.'
  },
  {
    q: 'What documents are required to file Beneficial Ownership with CIPC?',
    a: 'Requirements include certified copies of ID/passports for all beneficial owners and directors (not older than 3 months), the company securities register (share register), written mandate authorising My Accountant to file, and a group organogram if shares are held via trusts or holding companies.'
  }
];

const boSchema = generateServicePillarSchema({
  title: 'CIPC Beneficial Ownership Register Filing South Africa',
  description: 'Mandatory CIPC Beneficial Ownership declaration and securities register filing for South African companies and trusts under the General Laws Amendment Act.',
  slug: '/cipc-beneficial-ownership-register-south-africa',
  serviceType: 'ProfessionalService',
  priceRange: 'From R750',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Company Secretarial', url: '/products#company-secretarial' },
    { name: 'Beneficial Ownership Register', url: '/cipc-beneficial-ownership-register-south-africa' }
  ],
  faqs: boFaqs
});

export default function BeneficialOwnershipPage() {
  const complianceSteps = [
    {
      step: '01',
      title: 'Shareholding Analysis',
      desc: 'We inspect your MOI and share register to trace all shareholders down to the ultimate natural person owners.'
    },
    {
      step: '02',
      title: 'Verification & Mandate',
      desc: 'We verify certified identity documents and prepare the required statutory CIPC Beneficial Ownership Mandate.'
    },
    {
      step: '03',
      title: 'CIPC Portal Submission',
      desc: 'Our certified secretarial team captures and lodges the register directly onto the CIPC Beneficial Ownership system.'
    },
    {
      step: '04',
      title: 'Confirmation Certificate',
      desc: 'You receive the official CIPC Beneficial Ownership confirmation certificate, ready for your bank and auditors.'
    }
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(boSchema) }}
      />

      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" /> Mandatory CIPC Compliance Deadline
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            CIPC Beneficial Ownership Register <span className="text-gradient">South Africa</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Ensure your company avoids severe administrative penalties and frozen bank accounts. We prepare, verify, and file your statutory Beneficial Ownership register with CIPC swiftly and accurately.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12 shadow-xl">
              <Link href="/products/beneficial-ownership-declaration">File Beneficial Ownership Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/contact">Ask an Expert</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Why It Matters Callout */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-8 lg:p-12 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Why You Must File Immediately</h2>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Following South Africa&apos;s FATF greylisting, the Companies and Intellectual Property Commission (CIPC) mandated that all registered legal entities disclose natural persons holding 5% or more beneficial interest.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="bg-background/80 p-6 rounded-xl border border-border">
              <h4 className="font-bold text-foreground mb-1">CIPC Enforcement</h4>
              <p className="text-xs text-muted-foreground">Failure to file blocks your CIPC Annual Returns and triggers deregistration notices.</p>
            </div>
            <div className="bg-background/80 p-6 rounded-xl border border-border">
              <h4 className="font-bold text-foreground mb-1">Bank Account Freezes</h4>
              <p className="text-xs text-muted-foreground">Banks under FICA now demand proof of CIPC BO certificate before unlocking or maintaining accounts.</p>
            </div>
            <div className="bg-background/80 p-6 rounded-xl border border-border">
              <h4 className="font-bold text-foreground mb-1">Tender Disqualification</h4>
              <p className="text-xs text-muted-foreground">Public and private procurement requires full CSD and CIPC verified beneficial ownership transparency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Our 4-Step Filing Process</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Fast, seamless, and completely handled online by certified company secretarial experts.</p>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {complianceSteps.map((item, i) => (
            <Card key={i} className="border border-border bg-card shadow-sm flex flex-col justify-between">
              <CardHeader>
                <div className="font-mono text-2xl font-black text-primary/60 mb-2">{item.step}</div>
                <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQs Section */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Beneficial Ownership FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {boFaqs.map((faq, i) => (
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
          <h3 className="text-2xl sm:text-3xl font-bold">Secure Your CIPC Beneficial Ownership Certificate Today</h3>
          <p className="text-white/90 max-w-xl mx-auto text-sm sm:text-base">
            Fixed transparent pricing. Fast turnaround. Full statutory compliance guaranteed.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/products/beneficial-ownership-declaration">Order BO Filing Online <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
