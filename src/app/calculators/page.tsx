import { Metadata } from 'next';
import Link from 'next/link';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { SITE_URL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calculator,
  ArrowRight,
  Coins,
  Building2,
  Percent,
  Users,
  ShieldCheck,
  Briefcase,
  Scale,
  FileSpreadsheet,
  TrendingUp,
  Award,
  Landmark,
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata('calculators', {
    title: 'Free South African Tax, Payroll & Statutory Fee Calculators (2026)',
    description:
      'Calculate 2026/2027 SARS PAYE salary tax, Small Business Corporation (SBC) tax, 15% VAT, Provisional Tax, CGT, CIPC annual return fees, CIDB grades, and TCOE.',
  });
}

const calculatorsList = [
  {
    slug: 'salary-tax',
    title: 'SARS PAYE Salary Tax Calculator (2026/2027)',
    category: 'SARS & Income Tax',
    description:
      'Calculate monthly take-home pay, PAYE withholding, UIF contributions, medical aid tax credits (Section 6A), and retirement fund deductions under the 2026/2027 SARS tax tables.',
    icon: Coins,
    relatedService: { label: 'Individual Tax Returns (ITR12)', href: '/individual-tax-returns' },
  },
  {
    slug: 'sbc-tax-estimator',
    title: 'Small Business Corporation (SBC) Tax Estimator',
    category: 'Corporate Tax',
    description:
      'Estimate progressive corporate income tax under Section 12E of the Income Tax Act and compare your savings against the standard 27% corporate tax rate.',
    icon: Building2,
    relatedService: { label: 'Company Tax Returns (ITR14)', href: '/tax-returns' },
  },
  {
    slug: 'vat-calculator',
    title: 'South African 15% VAT Calculator',
    category: 'SARS & VAT',
    description:
      'Add or remove 15% South African Value-Added Tax (VAT) instantly, verify net vs gross invoice totals, and check mandatory R1 million VAT registration thresholds.',
    icon: Percent,
    relatedService: { label: 'VAT Registration SA', href: '/vat-registration-south-africa' },
  },
  {
    slug: 'provisional-tax-estimator',
    title: 'SARS Provisional Tax (IRP6) Estimator',
    category: 'SARS & Income Tax',
    description:
      'Calculate first (P1), second (P2), and third (P3) IRP6 provisional tax payments and check Section 89quat interest and underestimation penalty safe harbours.',
    icon: FileSpreadsheet,
    relatedService: { label: 'Provisional Tax Filing', href: '/provisional-tax' },
  },
  {
    slug: 'capital-gains-tax-calculator',
    title: 'Capital Gains Tax (CGT) Calculator South Africa',
    category: 'SARS & Income Tax',
    description:
      'Calculate CGT on property, shares, and business assets for individuals (40% inclusion rate, R40,000 exclusion), companies (80% inclusion), and trusts.',
    icon: TrendingUp,
    relatedService: { label: 'Strategic Tax Planning', href: '/tax-planning' },
  },
  {
    slug: 'turnover-tax-calculator',
    title: 'SARS Micro Business Turnover Tax Calculator',
    category: 'Corporate Tax',
    description:
      'Estimate progressive SARS Turnover Tax for qualifying micro businesses with annual turnover under R1 million and compare against SBC and standard tax.',
    icon: Scale,
    relatedService: { label: 'SME Accounting Packages', href: '/sme-accounting' },
  },
  {
    slug: 'total-cost-to-employer',
    title: 'Total Cost to Employer (TCOE) Calculator',
    category: 'Payroll & HR',
    description:
      'Break down gross salary, employer UIF (1%), Skills Development Levy (SDL 1%), COIDA assessment tariffs, and fringe benefits to see true employment cost.',
    icon: Users,
    relatedService: { label: 'Monthly Payroll Services', href: '/monthly-payroll' },
  },
  {
    slug: 'payroll-cost',
    title: 'Outsourced Payroll Fee & ROI Calculator',
    category: 'Payroll & HR',
    description:
      'Calculate your exact monthly outsourced payroll fee based on employee headcount and compare against in-house payroll software and admin costs.',
    icon: Calculator,
    relatedService: { label: 'Outsourced Payroll Fees SA', href: '/outsourced-payroll-fees-sa' },
  },
  {
    slug: 'uif-coida-calculator',
    title: 'UIF & COIDA Return of Earnings Calculator',
    category: 'Payroll & HR',
    description:
      'Calculate monthly employee/employer UIF contributions (capped at R177.12) and annual Compensation Fund (ROE) assessment fees by industry class.',
    icon: ShieldCheck,
    relatedService: { label: 'COIDA Letter of Good Standing', href: '/coida-letter-of-good-standing' },
  },
  {
    slug: 'cipc-annual-return-fee',
    title: 'CIPC Annual Return Fee & Penalty Calculator',
    category: 'CIPC & Statutory',
    description:
      'Calculate statutory CIPC annual return filing fees based on annual turnover, check late filing penalty tiers, and determine whether FAS or AFS is required.',
    icon: Landmark,
    relatedService: { label: 'Company Secretarial Services', href: '/company-secretarial-services-south-africa' },
  },
  {
    slug: 'cidb-fee-and-grade',
    title: 'CIDB Grading & Registration Fee Calculator',
    category: 'Construction & Tenders',
    description:
      'Determine your maximum CIDB contractor grading designation (Grades 1 to 9) from turnover, largest contract, and net asset value, plus statutory CIDB fees.',
    icon: Briefcase,
    relatedService: { label: 'Construction Accounting', href: '/industries/construction' },
  },
  {
    slug: 'ncr-registration-fee',
    title: 'NCR Credit Provider Registration Fee Calculator',
    category: 'Statutory Licensing',
    description:
      'Calculate National Credit Regulator (NCR) initial application fees, branch fees, and annual registration renewal fees by credit book size.',
    icon: Scale,
    relatedService: { label: 'Annual Financial Statements', href: '/annual-financial-statements' },
  },
  {
    slug: 'bee-scorecard-estimator',
    title: 'B-BBEE Level & EME/QSE Scorecard Estimator',
    category: 'Statutory Compliance',
    description:
      'Instantly determine whether your business qualifies for an automatic B-BBEE EME (<R10m) or QSE (<R50m) sworn affidavit or Generic scorecard verification.',
    icon: Award,
    relatedService: { label: 'Monthly Accounting & CFO', href: '/monthly-accounting' },
  },
];

export default function CalculatorsHubPage() {
  const hubSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/calculators#webpage`,
        url: `${SITE_URL}/calculators`,
        name: 'Free South African Tax, Payroll & Statutory Fee Calculators (2026)',
        description:
          'Calculate 2026/2027 SARS PAYE salary tax, Small Business Corporation (SBC) tax, 15% VAT, Provisional Tax, CGT, CIPC annual return fees, CIDB grades, and TCOE.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: calculatorsList.map((calc, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: calc.title,
            url: `${SITE_URL}/calculators/${calc.slug}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Calculators',
            item: `${SITE_URL}/calculators`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubSchema) }}
      />

      <div className="space-y-16 pb-20 bg-background relative overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-16 text-center bg-background">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container relative z-10 mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
              <Calculator className="h-4 w-4" /> 2026/2027 SARS &amp; Statutory Tables
            </div>
            <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
              Free South African <span className="text-gradient">Tax, Payroll &amp; Fee Calculators</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Built and maintained by our Chartered Business Accountants (CBAP(SA)) and General Tax Practitioners (SA). Estimate your SARS tax liability, payroll costs, and CIPC, CIDB, or NCR statutory fees in seconds.
            </p>
          </div>
        </section>

        {/* CALCULATORS GRID */}
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculatorsList.map((calc) => {
              const Icon = calc.icon;
              return (
                <Card
                  key={calc.slug}
                  className="glass-card border hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        {calc.category}
                      </span>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      <Link href={`/calculators/${calc.slug}`} className="hover:text-primary transition-colors">
                        {calc.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {calc.description}
                    </p>
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <Link
                        href={`/calculators/${calc.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                      >
                        Open Calculator <ArrowRight className="h-4 w-4" />
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        Related service:{' '}
                        <Link href={calc.relatedService.href} className="underline hover:text-primary">
                          {calc.relatedService.label}
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="container mx-auto px-4 max-w-4xl">
          <Card className="border-primary/20 bg-primary/5 p-8 md:p-10 text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-foreground">
              Need Formal Sign-Off or SARS Submission?
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Our online calculators provide instant estimates based on the 2026/2027 statutory tables. For formal tax structuring, SARS eFiling submissions, or Accounting Officer certificates, speak directly with our Randburg practice team.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Button asChild size="lg" className="font-bold px-8">
                <Link href="/contact">Speak to a Tax Practitioner</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold px-8">
                <Link href="/products">Browse Fixed-Fee Services</Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
