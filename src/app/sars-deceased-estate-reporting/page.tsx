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
  title: 'Report a Deceased Estate to SARS | SARS Online Query',
  description:
    'Report a deceased taxpayer to SARS online via SOQS or eFiling RAV01. Submit Death Certificates, Letters of Executorship, and obtain a Deceased Estate clearance (DEC).',
  alternates: {
    canonical: `${SITE_URL}/sars-deceased-estate-reporting`,
  },
  openGraph: {
    title: 'Report a Deceased Estate to SARS | My Accountant',
    description: 'Step-by-step DIY guide to notifying SARS of a deceased taxpayer, appointing an executor, and obtaining a DEC clearance.',
    url: `${SITE_URL}/sars-deceased-estate-reporting`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Deceased Estate Reporting' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Access the SARS Report New Estate Case Portal on SOQS',
    detail:
      'Navigate to tools.sars.gov.za/sarsonlinequery/ReportNewEstateCase or log into SARS eFiling and update the taxpayer’s RAV01 Registration Amendments and Verification form.',
  },
  {
    step: 'Step 2',
    title: 'Enter Deceased Taxpayer Identification & Date of Death',
    detail:
      'Input the deceased’s 13-digit SA ID number, 10-digit Income Tax Reference Number, and exact date of death per the Department of Home Affairs Death Certificate (DHA-1663 / BI-5).',
  },
  {
    step: 'Step 3',
    title: 'Link the Appointed Executor or Representative Taxpayer',
    detail:
      'Provide the ID number, tax reference number, and contact details of the Executor (or Section 18(3) Master’s Representative) or the appointed Tax Practitioner acting under Power of Attorney.',
  },
  {
    step: 'Step 4',
    title: 'Upload Master’s Letters of Executorship & Inventory',
    detail:
      'Attach: (1) Certified Death Certificate, (2) Master of the High Court Letters of Executorship (J238) or Section 18(3) Letters of Authority (J170), (3) Certified ID of Executor, (4) Liquidation & Distribution (L&D) Account or J243 Inventory, and (5) Last Will & Testament.',
  },
  {
    step: 'Step 5',
    title: 'File Pre- and Post-Date-of-Death Returns & Request DEC Certificate',
    detail:
      'Once coded as a Deceased Estate (7–21 business days), file the ITR12 up to Date of Death (including Section 9HA deemed CGT disposals), any post-death estate ITR12, and Estate Duty return (REV267) to obtain the SARS Deceased Estate Compliance (DEC) letter.',
  },
];

const rejectionCases = [
  {
    title: 'Dual Tax Number Rule (Deaths Before vs After 1 March 2016)',
    desc: 'For deaths on or after 1 March 2016 where the estate earns income (rent, interest, business) after the date of death, SARS requires a SECOND separate Estate Income Tax Reference Number to be registered on RAV01 for post-death income.',
  },
  {
    title: 'Section 9HA Deemed Capital Gains Tax (CGT) Omissions',
    desc: 'Upon death, a taxpayer is deemed to dispose of all worldwide assets at market value on the date of death (subject to the R300,000 death CGT exclusion and surviving spouse rollover). Omitting CGT schedules delays the DEC clearance.',
  },
  {
    title: 'Uploading Nomination Form Instead of Master’s Letter of Executorship',
    desc: 'SARS rejects deceased estate notifications that only attach a Will or Executor Nomination form—you must upload the stamped Letters of Executorship (J238) or Section 18(3) Letter (J170) issued by the Master of the High Court.',
  },
  {
    title: 'Unfiled VAT201 or EMP501 Returns for Sole Proprietor Estates',
    desc: 'The Master of the High Court cannot sign off the final Liquidation & Distribution (L&D) Account until all active tax types (including sole-prop VAT and PAYE) are deregistered and cleared on the SARS DEC letter.',
  },
];

const faqs = [
  {
    question: 'Why must a deceased estate be reported to SARS?',
    answer:
      'Under the Administration of Estates Act and Tax Administration Act, an Executor cannot distribute estate assets or close the Liquidation & Distribution (L&D) account with the Master of the High Court without an official SARS Deceased Estate Compliance (DEC) letter confirming all pre-death tax, post-death tax, and Estate Duty (REV267) are settled.',
  },
  {
    question: 'How long does SARS take to code a Deceased Estate and issue a DEC clearance?',
    answer:
      'Coding the profile as a Deceased Estate on RAV01 via SOQS takes 7 to 14 business days. Once all pre- and post-date-of-death ITR12 returns and the REV267 Estate Duty return are assessed, the Deceased Estate Compliance (DEC) audit takes 21 to 60 business days.',
  },
  {
    question: 'What is the Capital Gains Tax (CGT) exclusion in the year of death?',
    answer:
      'Under Section 9HA and the Eighth Schedule to the Income Tax Act, the annual CGT exclusion increases from R40,000 to R300,000 in the year of death, plus up to R2 million primary residence exclusion and 100% rollover relief on assets bequeathed to a resident surviving spouse.',
  },
  {
    question: 'When is a second SARS tax number required for a deceased estate?',
    answer:
      'A second income tax reference number is only required if the deceased passed away on or after 1 March 2016 AND the estate continues to earn taxable income (such as interest, rental income, or trading income) after the date of death before assets are distributed to heirs.',
  },
  {
    question: 'Can My Accountant handle deceased estate tax returns and DEC clearance for Executors?',
    answer:
      'Yes! We partner with family executors, attorneys, and fiduciary practitioners to register deceased estates on SOQS/RAV01, compute Section 9HA CGT valuations, file pre- and post-death ITR12 and REV267 returns, and obtain the final SARS DEC letter.',
  },
];

export default function SarsDeceasedEstateReportingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Report a Deceased Estate to SARS', item: `${SITE_URL}/sars-deceased-estate-reporting` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Report a Deceased Estate to SARS Online (SOQS & RAV01)',
        description: 'Step-by-step instructions to report a deceased taxpayer to SARS, link the Executor, and apply for Deceased Estate Compliance (DEC).',
        totalTime: 'PT30M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Deceased Estate Tax Compliance, CGT & DEC Clearance Service',
        description: 'End-to-end deceased estate SARS registration, Section 9HA CGT calculations, REV267 Estate Duty filings, and DEC certificate issuance.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-deceased-estate-reporting`,
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
        badgeText="Deceased Estate Tax Compliance (DEC)"
        title={
          <>
            Report a Deceased Estate <span className="text-gradient">to SARS Online</span>
          </>
        }
        subtitle="Notify SARS of a taxpayer’s passing, link the Master’s appointed Executor on RAV01, finalize Section 9HA CGT &amp; REV267 Estate Duty, and secure your Deceased Estate Compliance (DEC) letter."
        primaryCta={{ text: 'Appoint Estate Tax Practitioner', href: '/products/sars-registered-representative-appointment' }}
        secondaryCta={{ text: 'File Estate ITR12 Return', href: '/products/individual-tax-returns' }}
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
                Estate Coding &amp; DEC Clearance SLA
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Estate Coding: 7–14 Business Days | DEC Audit: 21–60 Business Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              SARS Registered Details (RAV01) &rarr; Maintain SARS Registered Details &rarr; Taxpayer Status: Deceased Estate
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/ReportNewEstateCase"
          title="Report a Deceased Estate Directly with SARS"
          description="Use official SARS digital query portals to register a deceased estate and submit Master's court documentation."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Reporting Workflow Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Report a Deceased Estate to SARS</h2>
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
            Deceased Estate Tax Pitfalls
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common Reasons SARS Delays Deceased Estate Clearance (DEC)
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Estate &amp; Trust Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/sars-registered-representative-appointment" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Appoint Executor Representative</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/products/individual-tax-returns" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Pre/Post-Death ITR12 Filing</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-trust-registration-online" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Register Testamentary Trust</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-directive-status" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Death Benefit Tax Directives</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/calculators/capital-gains-tax-calculator" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Capital Gains Tax Calculator</span>
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
