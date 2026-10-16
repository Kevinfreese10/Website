import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Check Outstanding SARS Tax Returns | SARS Online Query',
  description:
    'Check unfiled or outstanding SARS tax returns online for Income Tax (ITR12/ITR14), VAT201, PAYE (EMP201/EMP501), and Provisional Tax (IRP6) to stop monthly penalties.',
  alternates: {
    canonical: `${SITE_URL}/sars-outstanding-returns-query`,
  },
  openGraph: {
    title: 'Check Outstanding SARS Tax Returns | My Accountant',
    description: 'Identify unfiled returns on My Compliance Profile (MCP) and stop SARS Section 210 administrative penalties.',
    url: `${SITE_URL}/sars-outstanding-returns-query`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Check Outstanding Tax Returns' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Open My Compliance Profile (MCP) on eFiling or SOQS Dashboard',
    detail:
      'Log into SARS eFiling and click "Tax Status > My Compliance Profile (MCP) > Filing of Returns", or visit tools.sars.gov.za/sarsonlinequery/visualdashboard.',
  },
  {
    step: 'Step 2',
    title: 'Expand Each Tax Type to Identify Red "Non-Compliant" Periods',
    detail:
      'Click on Income Tax (ITR12/ITR14), Provisional Tax (IRP6), Value-Added Tax (VAT201), and PAYE (EMP201 & bi-annual EMP501) to view every exact tax year or period marked as "Outstanding".',
  },
  {
    step: 'Step 3',
    title: 'Check Your Administrative Penalty Statement of Account (APSA)',
    detail:
      'Navigate to "Returns > Penalty > Request Administrative Penalty SOA" to check if SARS is billing recurring monthly penalties (R250 to R16,000/month) for up to 35 months per unfiled return.',
  },
  {
    step: 'Step 4',
    title: 'Request & Submit All Overdue Returns (Including Nil Returns)',
    detail:
      'Even if your company did not trade, you must submit dormant/nil ITR14 and VAT201 returns to clear the outstanding status.',
  },
  {
    step: 'Step 5',
    title: 'Lodge a Request for Remission (RFR01) Once All Returns Are Filed',
    detail:
      'Once the Filing of Returns pillar turns green (within 24–48 hours of filing), submit a formal RFR01 on eFiling to request a waiver of the administrative non-compliance penalties.',
  },
];

const rejectionCases = [
  {
    title: 'Recurring Monthly Penalties Under Section 210–211 of the TAA',
    desc: 'SARS levies fixed-amount administrative penalties ranging from R250/month to R16,000/month (based on prior-year taxable income) for every month a return remains unfiled, recurring for up to 35 months.',
  },
  {
    title: 'Dormant Companies Failing to File Nil ITR14 & IRP6 Returns',
    desc: 'Registering a company with CIPC automatically activates a SARS Income Tax number. Until deregistered, dormant companies must file annual nil ITR14 returns or face administrative penalties and blocked TCS PINs.',
  },
  {
    title: 'Missing Bi-Annual EMP501 Reconciliations Despite Paying Monthly EMP201s',
    desc: 'Many employers file all 12 monthly EMP201 returns on time but forget the May (interim) or October (final) EMP501 EasyFile reconciliation—turning their Filing pillar red and incurring a 10% PAYE penalty.',
  },
  {
    title: 'Section 95 Estimated Assessments Issued by SARS',
    desc: 'Where a taxpayer fails to submit an overdue return after notice, SARS issues a unilateral Section 95 Estimated Assessment which cannot be objected to until the complete actual return is submitted.',
  },
];

const faqs = [
  {
    question: 'How do I check which tax returns are outstanding on SARS eFiling?',
    answer:
      'Log into SARS eFiling -> click "Tax Status" in the top menu -> click "My Compliance Profile (MCP)" -> expand the "Filing of Returns" pillar. Every unfiled tax year or bi-monthly/monthly period across ITR12/ITR14, IRP6, VAT201, EMP201, and EMP501 will be listed in red.',
  },
  {
    question: 'How quickly does SARS update my compliance status after I submit an overdue return?',
    answer:
      'Once an overdue ITR12, ITR14, VAT201, or EMP201 return is submitted on eFiling, the "Filing of Returns" pillar on My Compliance Profile typically updates from Red (Non-Compliant) to Green (Compliant) within 24 to 48 hours.',
  },
  {
    question: 'What are SARS administrative non-compliance penalties?',
    answer:
      'Under Sections 210 and 211 of the Tax Administration Act, SARS automatically charges a fixed monthly penalty (starting at R250/month and scaling up to R16,000/month depending on taxable income) for every single month a required tax return remains unsubmitted.',
  },
  {
    question: 'Can administrative penalties be waived once I file my outstanding returns?',
    answer:
      'Yes! Once 100% of your outstanding tax returns have been submitted, our registered tax practitioners can lodge a formal Request for Remission (RFR01) under Sections 215–218 of the TAA to have first-incidence or exceptional-circumstance penalties remitted.',
  },
  {
    question: 'Can My Accountant clear multi-year backlogs of unfiled company or personal returns?',
    answer:
      'Yes! We specialize in rapid backlog clean-ups—reconciling historical bank statements, compiling backdated Annual Financial Statements, filing all overdue ITR14, ITR12, VAT201, and EMP501 returns within 48–72 hours, and applying for penalty remission.',
  },
];

export default function SarsOutstandingReturnsQueryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Check Outstanding SARS Tax Returns', item: `${SITE_URL}/sars-outstanding-returns-query` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Check and Clear Outstanding SARS Tax Returns Online',
        description: 'Step-by-step instructions to identify unfiled SARS tax returns on My Compliance Profile (MCP) and SOQS.',
        totalTime: 'PT10M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Backlog Tax Return Filing & Penalty Remission Service',
        description: 'Rapid compilation and eFiling of overdue ITR14, ITR12, Dormant Company, VAT201, and EMP501 returns plus RFR01 penalty waivers.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-outstanding-returns-query`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  };

  return (
    <div className="space-y-12 pb-16 bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        badgeText="SARS Compliance Check (MCP)"
        title={
          <>
            Check Outstanding <span className="text-gradient">SARS Tax Returns</span>
          </>
        }
        subtitle="Identify unfiled returns across Income Tax (ITR12/ITR14), Dormant Companies, VAT201, PAYE (EMP201/EMP501), and Provisional Tax to stop recurring monthly penalties."
        primaryCta={{ text: 'File Company Return (ITR14)', href: '/products/company-tax-returns' }}
        secondaryCta={{ text: 'File Individual Return (ITR12)', href: '/products/individual-tax-returns' }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider">
                eFiling Navigation &amp; Turnaround
              </Badge>
              <h2 className="text-xl md:text-2xl font-black text-foreground">
                My Compliance Profile (MCP) Path &amp; Update Speed
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>MCP Status Update After Filing: 24–48 Hours</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Tax Status &rarr; My Compliance Profile (MCP) &rarr; Filing of Returns
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/visualdashboard"
          title="Check Your Outstanding Returns Directly with SARS"
          description="Access official SARS digital query tools to view unfiled tax returns and penalty statuses."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Outstanding Returns Check
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Check &amp; Clear Outstanding Returns Online</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {diySteps.map((s, i) => (
            <Card key={i} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    0{i + 1}
                  </span>
                  <CardTitle className="text-lg font-bold">{s.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground pl-14">{s.detail}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-4">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-amber-500/40 text-amber-700 font-bold">
            Non-Compliance Penalties
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common Traps That Trigger SARS Administrative Penalties
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rejectionCases.map((rc, i) => (
            <Card key={i} className="border border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  {rc.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">{rc.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-6">
        <h2 className="text-2xl font-bold text-foreground text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((f, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  {f.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{f.answer}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-4 pt-4">
        <h2 className="text-xl font-bold text-foreground">Related SARS Tax Filing Packages &amp; Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/company-tax-returns" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Company Tax Return (ITR14)</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/products/dormant-company-tax-returns" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Dormant Company Nil ITR14</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/products/individual-tax-returns" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Individual Tax Return (ITR12)</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/remission-of-fines" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Waive SARS Admin Penalties (RFR01)</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-compliance-status-pin" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Request &amp; Verify SARS TCS PIN</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-outstanding-debt-query" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>SARS Debt &amp; Payment Plans</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <SarsExpertCta />
      </section>
    </div>
  );
}
