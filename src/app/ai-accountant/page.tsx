import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Calculator,
  FileSpreadsheet,
  Lock,
  BadgeCheck,
  HelpCircle,
  Building,
  Check,
  X,
  Phone,
  BarChart3,
  Layers,
  Database
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Autonomous AI Accountant South Africa | Automated SARS Tax Filing & Bookkeeping',
  description: 'South Africa’s premier AI Accountant platform. Automated bank reconciliation, smart match allocation, instant VAT201/EMP201 preparation, and AFS compilation signed off by registered SARS tax practitioners.',
  alternates: {
    canonical: 'https://www.myacc.co.za/ai-accountant',
  },
  openGraph: {
    title: 'Autonomous AI Accountant South Africa | Automated SARS Filing',
    description: 'Instant bank reconciliation, smart match allocation, and automated SARS tax preparation backed by registered Chartered Business Accountants.',
    url: 'https://www.myacc.co.za/ai-accountant',
    type: 'website',
    locale: 'en_ZA',
    siteName: 'My Accountant',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autonomous AI Accountant South Africa | My Accountant',
    description: 'Automated bank reconciliations, VAT201 preparation, and financial statements signed off by SARS tax practitioners.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['SoftwareApplication', 'AccountingService'],
      '@id': 'https://www.myacc.co.za/ai-accountant#software',
      name: 'My Accountant AI Engine',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Cloud',
      url: 'https://www.myacc.co.za/ai-accountant',
      description: 'Autonomous cloud accounting and automated SARS tax filing platform for South African businesses.',
      offers: {
        '@type': 'Offer',
        price: '950',
        priceCurrency: 'ZAR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '950',
          priceCurrency: 'ZAR',
          unitText: 'MONTH',
        },
      },
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
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the My Accountant AI engine?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The My Accountant AI engine is a proprietary South African financial automation platform that ingests bank statement CSVs and PDFs, runs an interactive 9-clue smart match reconciliation against SARS statutory rules and your chart of accounts, and automatically drafts VAT201, EMP201, and Annual Financial Statements (AFS) for human practitioner sign-off.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does AI Accountant differ from software like Sage, Xero, or QuickBooks?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Accounting software like Sage or Xero is a tool that still requires you or an expensive bookkeeper to manually code transactions, calculate VAT adjustments, and submit tax returns. My Accountant AI is a managed autonomous service: our AI completes the heavy bookkeeping and statutory computations, and our registered SARS tax practitioners verify and file everything on SARS eFiling for you.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are tax submissions verified and signed off by a human accountant?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. 100% of tax submissions, Section 104 objections, and Annual Financial Statements are personally reviewed and signed off by licensed CIBA / SAIT members and SARS Registered Tax Practitioner Kevin Freese (PR-0098553).',
          },
        },
        {
          '@type': 'Question',
          name: 'Which South African banks are supported for automated ingestion?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We support automated CSV and PDF statement ingestion for all major South African financial institutions, including ABSA, FNB, Standard Bank, Nedbank, Capitec, TymeBank, Investec, and Discovery Bank.',
          },
        },
      ],
    },
  ],
};

export default function AiAccountantPage() {
  const steps = [
    {
      num: '01',
      title: 'Upload Bank Statements',
      desc: 'Drop in your official monthly bank statement PDFs or CSVs from ABSA, FNB, Standard Bank, Nedbank, Capitec, or TymeBank.',
    },
    {
      num: '02',
      title: '9-Clue Smart Match Reconciliation',
      desc: 'Our engine cleans merchant noise, strips branch suffixes, and applies 9 statutory heuristics (timing, amounts, PRNs, sweeps) to categorize transactions.',
    },
    {
      num: '03',
      title: 'Automated SARS Tax Computation',
      desc: 'Instant auto-calculation of VAT201 (15% input/output), EMP201 payroll liabilities, and Section 12E Small Business Corporation income tax.',
    },
    {
      num: '04',
      title: 'Registered Practitioner Sign-off',
      desc: 'A licensed SARS Registered Tax Practitioner verifies all balances, signs off your financial statements, and submits directly to SARS eFiling.',
    },
  ];

  const comparisonRows = [
    {
      feature: 'Automated Bank Cleaning & Channel Tagging',
      myacc: true,
      software: 'Partial (Rules only)',
      trad: false,
    },
    {
      feature: 'SARS PRN & Statutory Debt Detection',
      myacc: true,
      software: false,
      trad: 'Manual check',
    },
    {
      feature: 'Done-For-You SARS Filing (VAT201, EMP201, ITR14)',
      myacc: true,
      software: false,
      trad: true,
    },
    {
      feature: 'Registered Tax Practitioner Review (PR-0098553)',
      myacc: true,
      software: false,
      trad: true,
    },
    {
      feature: 'Transparent Fixed Monthly Pricing (Zero Hourly Rates)',
      myacc: true,
      software: 'Subscription only',
      trad: false,
    },
    {
      feature: 'Instant Audit-Ready AFS (IFRS for SMEs)',
      myacc: true,
      software: 'Requires accountant',
      trad: 'Weeks to complete',
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Next-Generation South African Financial Intelligence</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
              Autonomous AI Accountant & SARS Tax Automation
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience instant bank statement ingestion, 9-clue smart match reconciliation, automated VAT201 preparation, and one-click Annual Financial Statements — fully verified and signed off by licensed SARS tax practitioners.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="font-bold px-8 h-12">
                <Link href="/ai-accountant-signup">
                  Start with AI Accountant <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8 h-12">
                <Link href="/products/free-sars-and-cipc-assessment">
                  Free SARS & CIPC Assessment
                </Link>
              </Button>
            </div>

            {/* Proof Badges */}
            <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <BadgeCheck className="h-4 w-4 text-primary" /> CIBA & SAIT Accredited
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> SARS PR-0098553
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="h-4 w-4 text-primary" /> POPIA Compliant & 256-Bit SSL
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="h-4 w-4 text-primary" /> 60fps Instant Reconciliation
              </span>
            </div>
          </div>
        </section>

        {/* The 4-Step Autonomous Workflow */}
        <section className="container mx-auto px-4 max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              How the AI Accountant Engine Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From raw bank statements to signed statutory tax returns in four automated steps.
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

        {/* Deep Dive Pillars */}
        <section className="container mx-auto px-4 max-w-6xl space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/60 bg-card">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">9-Clue Detective Engine</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Decodes payroll timing (25th-last), debit orders (1st-7th), SARS PRNs, municipal accounts, inter-account contra sweeps, and VAT fractions with over 90% instant accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Automated SARS Tax Prep</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automatically aligns expenses with standard VAT types (standard-rated 15%, zero-rated, exempt, capital goods). Generates compliant VAT201, EMP201, and ITR14 workpapers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Chartered Human Sign-Off</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unlike software that leaves compliance on your shoulders, every ledger, tax calculation, and financial statement is audited and certified by Kevin Freese (SARS PR-0098553).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="container mx-auto px-4 max-w-5xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              How My Accountant AI Compares
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The speed and intelligence of modern AI combined with the regulatory protection of a licensed tax practice.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-foreground/80">
                <tr>
                  <th className="p-4 md:p-5">Feature</th>
                  <th className="p-4 md:p-5 text-primary font-extrabold bg-primary/5">
                    My Accountant AI
                  </th>
                  <th className="p-4 md:p-5">Software Only (Sage / Xero)</th>
                  <th className="p-4 md:p-5">Traditional Accounting Firm</th>
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
                      {typeof row.software === 'boolean' && !row.software ? (
                        <span className="flex items-center gap-1 text-rose-500 font-medium">
                          <X className="h-4 w-4" /> No
                        </span>
                      ) : (
                        row.software
                      )}
                    </td>
                    <td className="p-4 md:p-5 text-muted-foreground">
                      {typeof row.trad === 'boolean' && !row.trad ? (
                        <span className="flex items-center gap-1 text-rose-500 font-medium">
                          <X className="h-4 w-4" /> No
                        </span>
                      ) : (
                        row.trad
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reviews */}
        <section className="container mx-auto px-4 max-w-5xl space-y-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Backed by Hundreds of Verified Client Reviews
          </h2>
          <TrustIndexWidget />
        </section>

        {/* FAQs */}
        <section className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-foreground">
              Frequently Asked Questions about AI Accountant
            </h2>
            <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
          </div>

          <div className="space-y-6">
            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>How does the AI engine ensure SARS compliance and zero penalties?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7">
                Our engine incorporates South African statutory rules directly into its reconciliation logic: it validates 10-digit VAT vendor numbers, applies standard-rated VAT fractions, isolates non-deductible entertainment expenses, and calculates Section 12E Small Business Corporation tax breaks. Every drafted submission is reviewed by registered tax practitioner Kevin Freese (SARS PR-0098553) before electronic filing.
              </p>
            </div>

            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Is my financial data secure and POPIA compliant?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7">
                Yes. All data is hosted on enterprise Google Cloud Africa infrastructure in Johannesburg with 256-bit AES encryption at rest and in transit. We comply strictly with the Protection of Personal Information Act (POPIA). Your financial data is never shared with third parties or used to train external public models.
              </p>
            </div>

            <div className="border-b border-border pb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Can I switch from my current accountant or Xero/Sage subscription?</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7">
                Seamlessly. We handle the entire handover from your previous accountant, obtain your prior-year trial balance, and migrate your opening balances. There is zero disruption to your daily operations.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="container mx-auto px-4 max-w-4xl text-center space-y-6 pt-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 space-y-6">
            <h2 className="text-3xl font-extrabold">
              Ready to Put Your Accounting on Autopilot?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Join forward-thinking South African businesses who save 20+ hours a month and eliminate SARS tax penalties.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Button asChild size="lg" className="font-bold px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/ai-accountant-signup">
                  Get Started with AI Accountant <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8 h-12 bg-transparent text-white border-white/40 hover:bg-white/10">
                <Link href="/contact">Book a Live Demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
