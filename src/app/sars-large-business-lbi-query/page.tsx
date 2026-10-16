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
  title: 'Submit Large Business & International (LBI) Query | SARS SOQS',
  description:
    'Submit complex corporate, transfer pricing, CFC, and international tax queries directly to the SARS Large Business & International (LBI) division online.',
  alternates: {
    canonical: `${SITE_URL}/sars-large-business-lbi-query`,
  },
  openGraph: {
    title: 'Submit Large Business & International LBI Query | My Accountant',
    description: 'Escalate complex corporate tax queries to SARS Large Business & International.',
    url: `${SITE_URL}/sars-large-business-lbi-query`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Large Business LBI Query' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Access the SARS LBI Online Query Portal on SOQS',
    detail:
      'Navigate to tools.sars.gov.za/sarsonlinequery/LBCQuery or log into your corporate SARS eFiling portfolio.',
  },
  {
    step: 'Step 2',
    title: 'Confirm LBI Taxpayer Segmentation Criteria',
    detail:
      'Verify that your group meets SARS LBI segmentation rules: gross turnover exceeding R300 million per annum, net asset value > R100 million, JSE-listed entity, financial institution, or multinational enterprise (MNE) group.',
  },
  {
    step: 'Step 3',
    title: 'Select Technical Tax Stream & Assigned Relationship Manager',
    detail:
      'Select your specialist stream: Corporate Income Tax (ITR14), Section 31 Transfer Pricing / CbCR, Section 9D Controlled Foreign Companies (CFC), Section 23M/23N Interest Limitation, or DTA Withholding Relief.',
  },
  {
    step: 'Step 4',
    title: 'Attach Technical Position Paper & Supporting Schedules',
    detail:
      'Upload your signed Power of Attorney, group organogram, Master File / Local File transfer pricing documentation, or Section 42/45/47 corporate reorganisation schedules.',
  },
  {
    step: 'Step 5',
    title: 'Track LBI Case Reference & Specialist Escalation',
    detail:
      'SARS LBI logs a dedicated case number and routes the submission to your assigned LBI Relationship Manager (initial acknowledgement within 48 hours; technical review 10–21 business days).',
  },
];

const rejectionCases = [
  {
    title: 'Non-LBI Entities Routed Back to Standard Contact Centre',
    desc: 'If an SME that does not meet the LBI turnover, asset, or multinational group thresholds submits a query on the LBCQuery portal, SARS rejects the ticket and redirects it to the standard SMME queue.',
  },
  {
    title: 'Late Master File / Local File Transfer Pricing Uploads',
    desc: 'Cross-border connected-party transactions exceeding R100 million require mandatory Transfer Pricing Master File and Local File uploads on eFiling within 12 months of financial year-end.',
  },
  {
    title: 'Using LBI Queries for Formal Advance Tax Rulings (ATR)',
    desc: 'Binding Private Rulings (BPR) and Binding Class Rulings (BCR) under Chapter 7 of the Tax Administration Act cannot be issued via SOQS LBCQuery—they must be lodged on the dedicated SARS eFiling ATR module.',
  },
  {
    title: 'Missing IT10B Controlled Foreign Company (CFC) Schedules',
    desc: 'Corporate ITR14 returns for South African holding companies with >50% foreign subsidiary participation rights are flagged for LBI audit if Form IT10B and foreignAFS are omitted.',
  },
];

const faqs = [
  {
    question: 'What is the SARS Large Business & International (LBI) division?',
    answer:
      'SARS Large Business & International (LBI) is the specialist enforcement and relationship centre servicing JSE-listed groups, multinational enterprises, state-owned entities, financial institutions, and large corporate groups.',
  },
  {
    question: 'What is the turnaround time for a SARS LBI query on SOQS?',
    answer:
      'SARS LBI acknowledges receipt with a case reference number within 2 business days and typically assigns a Relationship Manager or technical specialist to respond within 10 to 21 business days depending on issue complexity.',
  },
  {
    question: 'When must Transfer Pricing Master and Local Files be submitted on SARS eFiling?',
    answer:
      'Where aggregate cross-border potentially affected transactions with connected persons exceed (or are reasonably expected to exceed) R100 million in a year of assessment, the Master File and Local File must be uploaded via eFiling ("Returns > Transfer Pricing") within 12 months of the financial year-end.',
  },
  {
    question: 'Can LBI queries be used to resolve Section 42–47 corporate restructuring disclosures?',
    answer:
      'Yes. Reportable arrangement notifications and corporate rollover relief disclosures under Sections 42, 44, 45, and 47 of the Income Tax Act can be coordinated directly with your LBI Relationship Manager.',
  },
  {
    question: 'Does My Accountant provide corporate tax and Fractional CFO support for mid-market and group entities?',
    answer:
      'Yes! Our Chartered Accountants and registered tax practitioners advise corporate groups on multi-entity consolidations, Section 42/45 restructurings, international withholding taxes, and SARS LBI audit responses.',
  },
];

export default function SarsLargeBusinessLbiQueryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Submit Large Business (LBI) Query', item: `${SITE_URL}/sars-large-business-lbi-query` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Submit a SARS Large Business & International (LBI) Query',
        description: 'Step-by-step instructions to escalate corporate and international tax queries to the SARS LBI division.',
        totalTime: 'PT20M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'Corporate Tax Advisory, Transfer Pricing & SARS LBI Representation',
        description: 'Specialist corporate income tax, cross-border withholding, and SARS LBI audit advisory.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-large-business-lbi-query`,
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
        badgeText="Corporate Tax & Multinational Advisory"
        title={
          <>
            Submit Large Business <span className="text-gradient">&amp; International (LBI) Query</span>
          </>
        }
        subtitle="Escalate complex corporate income tax (ITR14), Section 31 transfer pricing, Controlled Foreign Company (CFC), and international tax queries directly to the specialized SARS LBI division."
        primaryCta={{ text: 'Corporate Tax & CFO Advisory', href: '/fractional-cfo-services-south-africa' }}
        secondaryCta={{ text: 'File Company ITR14 Return', href: '/products/company-tax-returns' }}
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
                LBI Portal Path &amp; Specialist SLA
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Acknowledgement: 48 Hours | Technical Resolution: 10–21 Business Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Returns &rarr; Income Tax (ITR14) / Transfer Pricing (CbCR, Master &amp; Local File)
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/LBCQuery"
          title="Submit a SARS LBI Query Online"
          description="Access official SARS digital channels to lodge technical corporate and international tax inquiries."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            LBI Query Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Submit an LBI Query to SARS</h2>
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
            Corporate Compliance Risks
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common LBI Segmentation &amp; International Filing Pitfalls
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
        <h2 className="text-xl font-bold text-foreground">Related Corporate Tax Guides &amp; Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/company-tax-returns" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Corporate ITR14 Tax Return</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/annual-financial-statements" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>IFRS Annual Financial Statements</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-withholding-tax-royalties-wtr01" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Withholding Tax on Royalties (WTR01)</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-disputes" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>SARS Objections &amp; Tax Court ADR</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-compliance-status-pin" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>AIT International Transfer TCS PIN</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-online-query-system-guide" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>All SARS Online Queries (SOQS)</span>
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
