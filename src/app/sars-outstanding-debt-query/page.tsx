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
  title: 'Enquire on Outstanding Debt & Payment Arrangements | SARS SOQS',
  description:
    'Enquire on outstanding SARS tax debt and apply for Section 167 deferred instalment payment arrangements or Section 200 compromise agreements on eFiling.',
  alternates: {
    canonical: `${SITE_URL}/sars-outstanding-debt-query`,
  },
  openGraph: {
    title: 'Enquire on SARS Outstanding Debt & Payment Arrangements | My Accountant',
    description: 'Check SARS debt balances and request Section 167 instalment payment agreements online.',
    url: `${SITE_URL}/sars-outstanding-debt-query`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Outstanding Debt Query' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Pull Your Official Statements of Account (ITSA, VASA, EMPSA)',
    detail:
      'Log into SARS eFiling or visit tools.sars.gov.za/sarsonlinequery/accountquery to download your latest Statement of Account across Income Tax, VAT, and PAYE.',
  },
  {
    step: 'Step 2',
    title: 'Ensure Zero Unfiled Tax Returns Exist Before Applying',
    detail:
      'Under Section 168(c) of the Tax Administration Act, SARS automatically rejects any payment arrangement or compromise request if even a single tax return is outstanding.',
  },
  {
    step: 'Step 3',
    title: 'Navigate to eFiling Debt Management (Payment Arrangement)',
    detail:
      'On SARS eFiling, click "SARS Home > Debt Management > New Payment Arrangement" (or submit via SOQS if you do not have eFiling access).',
  },
  {
    step: 'Step 4',
    title: 'Select Instalment Period & Upload CIS Financial Disclosure',
    detail:
      'Propose a monthly repayment term (typically 6 to 36 months) and upload 3 months of bank statements, an updated Statement of Assets & Liabilities, debtors/creditors age analysis, and cash-flow forecast.',
  },
  {
    step: 'Step 5',
    title: 'Sign the Deferred Payment Agreement & Activate TCS PIN',
    detail:
      'Once SARS approves your Section 167 arrangement (7–21 business days), your Debt pillar on My Compliance Profile (MCP) turns green, halting Section 179 bank attachments and restoring your TCS PIN.',
  },
];

const rejectionCases = [
  {
    title: 'Section 179 Third-Party Bank Appointments (IT88 Garnishees)',
    desc: 'If a Final Letter of Demand expires after 10 business days without a formal Section 167 payment arrangement or Section 164 suspension of payment, SARS instructs your bank electronically to sweep funds from your account.',
  },
  {
    title: 'Applying for a Payment Plan While Returns Are Outstanding',
    desc: 'SARS systems block deferred payment requests if any ITR14, ITR12, VAT201, EMP201, or EMP501 return is unfiled—all overdue returns must be lodged first.',
  },
  {
    title: 'Defaulting on a Current Tax Obligation During an Active Plan',
    desc: 'If SARS grants a 24-month instalment plan on historic debt and you pay a subsequent month’s current VAT201 or EMP201 late, SARS immediately cancels the payment arrangement.',
  },
  {
    title: 'Choosing an Instalment Plan When You Qualify for Compromise or RFR',
    desc: 'Many taxpayers agree to pay 100% of administrative penalties and interest that could legally be waived via a Request for Remission (RFR01) or permanently written off under a Section 200 Compromise of Debt.',
  },
];

const faqs = [
  {
    question: 'Can SARS take money directly from my business or personal bank account?',
    answer:
      'Yes. Under Section 179 of the Tax Administration Act, after issuing a Final Letter of Demand giving 10 business days’ notice, SARS can issue an electronic Third-Party Appointment (IT88) instructing your bank or employer to pay funds directly to SARS unless you lodge a payment arrangement, compromise, or Section 164 suspension of payment.',
  },
  {
    question: 'Does an approved SARS Payment Arrangement make my Tax Clearance (TCS PIN) compliant?',
    answer:
      'Yes! Once SARS formally approves a Section 167 deferred payment arrangement on eFiling and you honour the monthly instalments, your Debt pillar on My Compliance Profile (MCP) turns green—allowing you to generate a compliant Good Standing or Tender TCS PIN.',
  },
  {
    question: 'How long does SARS take to approve a Payment Arrangement on eFiling?',
    answer:
      'Standard payment arrangements under R100,000 for 6–12 months are often approved within 3 to 7 business days on eFiling. Larger commercial debt arrangements requiring Collection Information Statement (CIS) verification take 10 to 21 business days.',
  },
  {
    question: 'What is the difference between a Payment Arrangement (s167) and a Compromise of Debt (s200)?',
    answer:
      'A Section 167 Payment Arrangement lets you pay off 100% of the tax debt plus ongoing interest in monthly instalments. A Section 200 Compromise of Debt permanently writes off a large portion of the capital tax, penalties, and interest when full recovery is impossible.',
  },
  {
    question: 'Can My Accountant stop a Final Demand and negotiate our SARS payment plan?',
    answer:
      'Yes! Our tax dispute team immediately files any outstanding returns, lodges a Request for Remission of penalties, and negotiates an affordable Section 167 instalment plan or Section 200 Compromise of Debt.',
  },
];

export default function SarsOutstandingDebtQueryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Outstanding Debt & Payment Arrangements', item: `${SITE_URL}/sars-outstanding-debt-query` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Enquire on SARS Debt and Request a Payment Arrangement',
        description: 'Step-by-step instructions to check your SARS debt balance and apply for a Section 167 deferred payment arrangement.',
        totalTime: 'PT25M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Debt Management, Payment Arrangements & Section 200 Compromise Service',
        description: 'Registered Tax Practitioner negotiation of SARS Section 167 payment arrangements, penalty remissions, and debt compromises.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-outstanding-debt-query`,
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
        badgeText="SARS Debt & Payment Management (Section 167)"
        title={
          <>
            Enquire on Outstanding <span className="text-gradient">Debt &amp; Payment Plans</span>
          </>
        }
        subtitle="Check outstanding SARS tax balances, halt Section 179 bank attachments, and structure an approved monthly instalment arrangement to restore your Tax Clearance PIN."
        primaryCta={{ text: 'Negotiate SARS Debt Plan', href: '/sars-compromise' }}
        secondaryCta={{ text: 'Waive SARS Penalties', href: '/remission-of-fines' }}
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
                SARS Debt Management Path &amp; Approval SLA
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Approval Turnaround: 3–21 Business Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              SARS Home &rarr; Debt Management &rarr; New Payment Arrangement (Section 167)
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/accountquery"
          title="Submit a SARS Debt Query or Instalment Request"
          description="Use official SARS digital channels to enquire on debt and submit formal payment deferral requests."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Debt Inquiry Steps
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Enquire on Debt &amp; Request Payment Terms</h2>
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
            Enforcement &amp; Rejection Risks
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Why SARS Rejects Payment Plans or Attaches Bank Accounts
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Debt Relief Guides &amp; Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/sars-compromise" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>SARS Compromise of Debt (s200)</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/remission-of-fines" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Remission of SARS Penalties</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-statement-of-account-request" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Request Statement of Account</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-outstanding-returns-query" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Check Outstanding Tax Returns</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-payment-allocation-query" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Reallocate Suspense Payments</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-compliance-status-pin" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Request &amp; Verify SARS TCS PIN</span>
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
