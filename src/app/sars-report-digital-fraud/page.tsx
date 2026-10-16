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
  title: 'Report Digital Fraud & Profile Compromise | SARS SOQS',
  description:
    'Report unauthorized SARS eFiling profile hijacking, identity theft, or fraudulent banking detail changes directly to the SARS Digital Fraud unit via SOQS.',
  alternates: {
    canonical: `${SITE_URL}/sars-report-digital-fraud`,
  },
  openGraph: {
    title: 'Report Digital Fraud & Profile Compromise | My Accountant',
    description: 'Report eFiling profile hijacking, identity theft, and fraudulent refund tampering online.',
    url: `${SITE_URL}/sars-report-digital-fraud`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Report SARS Digital Fraud' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Open the SARS Report Digital Fraud Portal on SOQS Immediately',
    detail:
      'Navigate to tools.sars.gov.za/sarsonlinequery/ReportDigitalFraud as soon as you receive an unexpected SARS SMS/email about a login, password reset, representative transfer, or RAV01 bank account change.',
  },
  {
    step: 'Step 2',
    title: 'Select the Compromise Category & Enter Your SA ID + Tax Number',
    detail:
      'Select "Unauthorized eFiling Profile Access", "Fraudulent Banking Detail Change", or "Identity Theft / Fake Return Submitted" and provide your 13-digit SA ID number and 10-digit tax reference number.',
  },
  {
    step: 'Step 3',
    title: 'Depose a Sworn SAPS Affidavit & Gather Bank Proof',
    detail:
      'Visit your nearest South African Police Service (SAPS) station to obtain a sworn affidavit or CAS case number confirming unauthorized access to your SARS profile, plus a stamped bank confirmation letter (< 3 months old).',
  },
  {
    step: 'Step 4',
    title: 'Upload Verification Selfie, ID, Bank Letter & SAPS Affidavit',
    detail:
      'Upload: (1) Certified SA ID copy, (2) Photo of yourself holding your ID ("selfie with ID") with a handwritten note reading "Update my details", (3) Official bank confirmation letter, and (4) SAPS affidavit.',
  },
  {
    step: 'Step 5',
    title: 'SARS Fraud Unit Freezes Refunds & Restores Profile Ownership',
    detail:
      'SARS Digital Fraud places an immediate protective stop on outgoing refund payouts (within 24–48 hours) and restores your verified login and RAV01 contact details after forensic review (7–21 business days).',
  },
];

const rejectionCases = [
  {
    title: 'Tax Season Refund Hijacking via Cloned SIM / Phishing OTPs',
    desc: 'Syndicates use phishing emails ("SARS Refund Available – Click to Verify") or SIM-swap attacks to hijack eFiling profiles during July–October, submit inflated fictitious ITR12/VAT201 refunds, and divert payouts to mule accounts.',
  },
  {
    title: 'Unauthorized Tax Practitioner / Representative Transfer Requests',
    desc: 'If you receive an eFiling email asking to approve a profile transfer to an unknown practitioner, NEVER click approve—lodge a Digital Fraud report immediately to block the shared access request.',
  },
  {
    title: 'Missing "Selfie Holding ID" on Profile Recovery Submissions',
    desc: 'SARS Digital Security will not reset compromised login credentials or RAV01 email/mobile numbers unless the submission includes a clear photo of the taxpayer holding their original green barcoded ID or Smart ID card.',
  },
  {
    title: 'FraudulentIRP5s or Fake Medical Credits Submitted Under Your Name',
    desc: 'If a hijacker submitted a falsified ITR12 or VAT201 before you regained control, a formal Section 104 objection and forensic reversal request must be lodged so you are not held liable for the clawback debt.',
  },
];

const faqs = [
  {
    question: 'What should I do in the first hour if my SARS eFiling profile is hacked?',
    answer:
      'Immediately submit an urgent report at tools.sars.gov.za/sarsonlinequery/ReportDigitalFraud to trigger an emergency refund freeze, forward phishing emails to phishing@sars.gov.za, call 0800 00 7277 to place a security stop on your tax number, and obtain a SAPS affidavit.',
  },
  {
    question: 'How fast does SARS freeze a compromised profile after reporting Digital Fraud?',
    answer:
      'Filing a Digital Fraud report on SOQS places a high-priority security flag on your tax number within 24 to 48 hours to block unauthorized bank detail changes and refund payouts. Full profile credential recovery and forensic investigation typically take 7 to 21 business days.',
  },
  {
    question: 'What documents does SARS require to recover a hijacked eFiling profile?',
    answer:
      'You must upload: (1) a certified copy of your SA ID or passport, (2) a clear photograph of yourself holding your ID next to your face, (3) a bank-stamped confirmation letter (< 3 months old), (4) proof of residential address, and (5) a sworn SAPS affidavit detailing the unauthorized access.',
  },
  {
    question: 'What if the fraudster already filed a fake tax return and stole the refund?',
    answer:
      'Once SARS Forensic Investigation confirms the profile was hijacked and the refund was paid into a third-party fraudulent bank account without your negligence, SARS reverses the fraudulent assessment from your Statement of Account after completing its investigation.',
  },
  {
    question: 'Can My Accountant help recover our company or personal eFiling profile and secure it?',
    answer:
      'Yes! As accredited SARS Registered Tax Practitioners (PR-0098553), we assist clients with RAV01 identity verification, portfolio linking, and reversing unauthorized changes made on hijacked profiles.',
  },
];

export default function SarsReportDigitalFraudPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Report Digital Fraud & Profile Compromise', item: `${SITE_URL}/sars-report-digital-fraud` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Report SARS Digital Fraud and Recover a Hijacked eFiling Profile',
        description: 'Step-by-step instructions to report unauthorized eFiling access, freeze fraudulent refund payouts, and restore your SARS profile.',
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
        name: 'SARS eFiling Profile Recovery & Registered Representative Security Service',
        description: 'Professional assistance with compromised SARS eFiling profile recovery, RAV01 contact restoration, and disputed fraudulent assessments.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-report-digital-fraud`,
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
        badgeText="Cybersecurity & eFiling Profile Recovery"
        title={
          <>
            Report Digital Fraud <span className="text-gradient">&amp; Profile Hijacking</span>
          </>
        }
        subtitle="Report unauthorized SARS eFiling profile takeovers, suspicious RAV01 banking detail changes, identity theft, or phishing scams directly to SARS Digital Security."
        primaryCta={{ text: 'Restore SARS Profile Access (R250)', href: '/products/sars-registered-representative-appointment' }}
        secondaryCta={{ text: 'Dispute Fraudulent Assessment', href: '/sars-disputes' }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider">
                Emergency Action &amp; Turnaround
              </Badge>
              <h2 className="text-xl md:text-2xl font-black text-foreground">
                Emergency Freeze &amp; Profile Recovery SLA
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Refund Stop: 24–48 Hours | Forensic Recovery: 7–21 Business Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Security Path:</strong> Log into eFiling (if accessible) &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Home &rarr; User &rarr; Change Password &amp; Inspect SARS Registered Details (RAV01 Bank Account)
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/ReportDigitalFraud"
          title="Lodge an Urgent Digital Fraud Report with SARS"
          description="Use official SARS digital security portals to freeze compromised profiles and report unauthorized access."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Fraud Reporting Steps
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Report Digital Tax Fraud &amp; Recover Your Profile</h2>
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
            Hijacking Vectors &amp; Recovery Rules
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common eFiling Hijacking Scenarios &amp; Verification Requirements
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Security &amp; Recovery Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/sars-registered-representative-appointment" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Restore Representative Access</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-disputes" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Dispute Fraudulent Assessment</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-tax-representative-appointment" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Appoint Public Officer (RAV01)</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-report-employee-corruption" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Report SARS Employee Corruption</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-statement-of-account-request" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Inspect Statement of Account</span>
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
