import { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  FileCheck,
  HelpCircle,
  CheckCircle2,
  Building2,
  Search,
  Clock,
  AlertTriangle,
  ArrowRight,
  Compass
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Request & Verify SARS Tax Compliance Status (TCS) PIN | 2026 Guide',
  description:
    'Request or verify a SARS Tax Compliance Status (TCS) PIN online for Good Standing, Tenders, or Approval International Transfer (AIT). Includes third-party verification steps.',
  alternates: {
    canonical: `${SITE_URL}/sars-tax-compliance-status-pin`,
  },
  openGraph: {
    title: 'Request & Verify SARS Tax Compliance Status (TCS) PIN | My Accountant',
    description:
      'Step-by-step 2026 guide to requesting a SARS TCS clearance PIN on eFiling/SOQS and verifying third-party vendor TCS PINs online.',
    url: `${SITE_URL}/sars-tax-compliance-status-pin`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS TCS PIN Request & Verification' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Log into SARS eFiling or Open SOQS',
    detail:
      'Log into your SARS eFiling profile, click "Tax Status" in the top ribbon, and expand "Tax Compliance Status" in the left menu—or go to tools.sars.gov.za/soqs for once-off Good Standing PIN requests.',
  },
  {
    step: 'Step 2',
    title: 'Activate Your My Compliance Profile (MCP)',
    detail:
      'If requesting via eFiling for the first time, click "Activation", review the four compliance pillars (Registration, Filing of Returns, Debt, and Relevant Material), and enable TCS functionality.',
  },
  {
    step: 'Step 3',
    title: 'Select TCS Request Type & Complete Form',
    detail:
      'Navigate to "Tax Compliance Status Request", select your PIN purpose from the dropdown (Good Standing, Tender, or Approval International Transfer / AIT), and click "Continue".',
  },
  {
    step: 'Step 4',
    title: 'Upload Supporting Documents (Mandatory for AIT)',
    detail:
      'For Good Standing or Tender PINs, no upload is needed if all pillars are green. For AIT (offshore transfers > R1m), upload 3 years of Assets & Liabilities statements, bank statements, and source-of-funds proof.',
  },
  {
    step: 'Step 5',
    title: 'Download TCS Letter & 10-Character PIN',
    detail:
      'Open "Tax Compliance Status Requests" worklist, click "Print PIN", and save your official SARS TCS PIN letter displaying your Tax Reference Number and unique PIN.',
  },
];

const verifySteps = [
  {
    step: 'Verify 1',
    title: 'Access the SARS TCS Verification Portal',
    detail:
      'Go to tools.sars.gov.za/sarsonlinequery/tcsverify or on SARS eFiling navigate to "Tax Status > Tax Compliance Status > Verify Status".',
  },
  {
    step: 'Verify 2',
    title: 'Enter the Taxpayer’s 10-Digit Tax Reference Number',
    detail:
      'Input the 10-digit SARS Income Tax Reference Number of the vendor, contractor, or individual printed on their TCS letter.',
  },
  {
    step: 'Verify 3',
    title: 'Input the Unique TCS PIN',
    detail:
      'Enter the alphanumeric TCS PIN exactly as supplied by the taxpayer (case-sensitive) and click "Submit".',
  },
  {
    step: 'Verify 4',
    title: 'Inspect Live Pillar Compliance Results',
    detail:
      'SARS queries the taxpayer’s live account in real time and returns either "Compliant" (Green) or "Non-Compliant" (Red) along with the entity’s registered legal name.',
  },
  {
    step: 'Verify 5',
    title: 'Print Verification Confirmation for Audit Records',
    detail:
      'Download or print the timestamped SARS verification result page for your procurement, CSD tender, or bank audit file.',
  },
];

const rejectionCases = [
  {
    title: 'Unappointed Public Officer on RAV01',
    desc: 'Newly registered CIPC companies are blocked from generating a TCS PIN until a Public Officer is formally approved on the SARS RAV01 registration profile.',
  },
  {
    title: 'Small Unallocated Cent Balances or Interest',
    desc: 'Even R50 of unallocated interest on an old EMP201 or VAT201 period turns the Debt pillar red until paid with the exact 19-digit PRN or suspended via a formal payment arrangement.',
  },
  {
    title: 'AIT Source-of-Funds Mismatch',
    desc: 'Approval International Transfer (AIT) requests are rejected when the Statement of Assets & Liabilities at cost does not reconcile to historic ITR12 capital gains, loan accounts, or inheritance distributions.',
  },
  {
    title: 'Expired or Revoked Third-Party PINs',
    desc: 'Because SARS TCS PINs reflect live status, a supplier who was compliant last month will immediately show "Non-Compliant" during verification if they miss a single VAT201 or EMP201 deadline.',
  },
];

const faqs = [
  {
    question: 'What is a SARS TCS PIN used for?',
    answer:
      'A Tax Compliance Status (TCS) PIN replaced the old paper Tax Clearance Certificate. It enables third parties—such as government tender boards (CSD), corporate procurement teams, banks, and authorised forex dealers—to verify your real-time SARS compliance status online.',
  },
  {
    question: 'How can I verify a vendor or contractor’s SARS TCS PIN online?',
    answer:
      'Anyone can verify a third-party TCS PIN free of charge at tools.sars.gov.za/sarsonlinequery/tcsverify or under "Tax Compliance Status > Verify Status" on eFiling by entering the taxpayer’s 10-digit Tax Reference Number and their unique TCS PIN.',
  },
  {
    question: 'What are the realistic SARS turnaround times for a TCS PIN?',
    answer:
      'Good Standing and Tender TCS PINs are issued instantly (within 5–15 minutes) if all four compliance pillars are green. Approval International Transfer (AIT) PINs for offshore transfers take 5 to 21 business days due to manual SARS audit verification of source of funds.',
  },
  {
    question: 'How long does a SARS TCS PIN remain valid?',
    answer:
      'Good Standing and Tender PINs are valid for 12 months from issue, but their status updates dynamically in real time—if a return becomes overdue tomorrow, third parties verifying the PIN will immediately see "Non-Compliant". AIT PINs are valid for 12 months for the specific approved offshore amount.',
  },
  {
    question: 'What should I do if my My Compliance Profile (MCP) shows Non-Compliant?',
    answer:
      'If SARS flags unfiled returns (ITR14/ITR12/VAT201/EMP501) or overdue debt, My Accountant can audit your profile, submit outstanding returns, lodge a Section 167 deferred payment arrangement or Section 164 suspension of payment, and restore your TCS status to Compliant within 24–72 hours.',
  },
];

export default function SarsTaxComplianceStatusPinPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Request & Verify SARS TCS PIN', item: `${SITE_URL}/sars-tax-compliance-status-pin` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Request and Verify a SARS Tax Compliance Status (TCS) PIN',
        description: 'Step-by-step instructions to request a SARS TCS PIN on eFiling/SOQS and verify a third-party TCS PIN online.',
        totalTime: 'PT15M',
        step: [...diySteps, ...verifySteps].map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Tax Clearance (TCS PIN) & Compliance Remediation Service',
        description: 'Professional SARS Tax Compliance Status (TCS) PIN issuance, non-compliance resolution, and AIT offshore clearance.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-tax-compliance-status-pin`,
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
        badgeText="SARS Tax Compliance Status (TCS) & Verification"
        title={
          <>
            Request &amp; Verify SARS <span className="text-gradient">Tax Compliance Status PIN</span>
          </>
        }
        subtitle="Obtain an official SARS TCS PIN for Good Standing, Tenders, or Approval International Transfer (AIT)—or verify a third-party vendor’s TCS PIN in real time."
        primaryCta={{ text: 'Get Tax Clearance PIN (R550)', href: '/products/tax-clearance-certificate' }}
        secondaryCta={{ text: 'Verify a Third-Party PIN', href: '#verify-tcs-pin' }}
      />

      <TrustIndexWidget />

      {/* Turnaround & eFiling Navigation Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider">
                eFiling Navigation &amp; Turnaround
              </Badge>
              <h2 className="text-xl md:text-2xl font-black text-foreground">
                Exact SARS eFiling Path &amp; Processing Times
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Good Standing: Instant | AIT: 5–21 Business Days</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div className="bg-background/80 rounded-xl p-4 border border-border/60 space-y-1.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-primary" /> Request Path on eFiling
              </div>
              <p className="font-mono text-[11px] text-foreground bg-muted px-2.5 py-1.5 rounded">
                Tax Status &rarr; Tax Compliance Status &rarr; Activation &rarr; Tax Compliance Status Request
              </p>
              <p>Requires all 4 My Compliance Profile (MCP) pillars—Registration, Filing, Debt, and Relevant Material—to be green.</p>
            </div>
            <div className="bg-background/80 rounded-xl p-4 border border-border/60 space-y-1.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Search className="h-4 w-4 text-primary" /> Verification Path (Third-Party)
              </div>
              <p className="font-mono text-[11px] text-foreground bg-muted px-2.5 py-1.5 rounded">
                SOQS &rarr; Verify Tax Compliance Status (or eFiling: Tax Status &rarr; Verify Status)
              </p>
              <p>Requires the supplier or contractor’s 10-digit Tax Reference Number and their active TCS PIN.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-4">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/tcsrequest"
          title="Request Your SARS TCS PIN Online"
          description="Access the official SARS digital portal to request your real-time Tax Compliance Status PIN."
        />
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/tcsverify"
          title="Verify a Third-Party SARS TCS PIN Directly"
          description="Use the official SARS online verification portal to check a vendor, contractor, or individual’s real-time tax clearance."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Part 1: TCS Request Workflow
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Request a SARS TCS PIN</h2>
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

      {/* Part 2: Verify TCS PIN (Consolidated from /sars-verify-tax-compliance-status) */}
      <section id="verify-tcs-pin" className="container mx-auto px-4 max-w-4xl space-y-6 pt-4 scroll-mt-24">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Part 2: Third-Party TCS PIN Verification
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Verify a Third-Party TCS PIN Online</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Validate the real-time tax compliance status of vendors, suppliers, contractors, or employees before awarding tenders or releasing payments.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {verifySteps.map((s, i) => (
            <Card key={i} className="border-l-4 border-l-emerald-600 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
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

      {/* Common Rejection & Non-Compliance Edge Cases */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-4">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-amber-500/40 text-amber-700 font-bold">
            Troubleshooting &amp; Edge Cases
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common Reasons SARS Blocks or Rejects a TCS PIN
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

      {/* Related Guides & Service Packages */}
      <section className="container mx-auto px-4 max-w-4xl space-y-4 pt-4">
        <h2 className="text-xl font-bold text-foreground">Related SARS Guides &amp; Fixed-Fee Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/tax-clearance-certificate" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Tax Clearance Certificate (TCS PIN)</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/products/sars-registered-representative-appointment" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Appoint SARS Public Officer</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-outstanding-returns-query" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Check Outstanding SARS Returns</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-outstanding-debt-query" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>SARS Debt &amp; Payment Plans</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-vat-vendor-search-verification" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>SARS VAT Vendor Verification</span>
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
