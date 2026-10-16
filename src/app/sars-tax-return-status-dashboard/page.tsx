import { Metadata } from 'next';
import Link from 'next/link';
import { FileCheck, Search, ShieldAlert, HelpCircle, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Tax Return Status & Verification Tracker | SARS Online Query",
  description: "Track the submission, audit selection, verification, and refund status of your SARS tax return online via the SOQS Visual Dashboard.",
  alternates: {
    canonical: `${SITE_URL}/sars-tax-return-status-dashboard`,
  },
  openGraph: {
    title: "Tax Return Status & Verification Tracker",
    description: "Track your SARS return audit and refund progress online.",
    url: `${SITE_URL}/sars-tax-return-status-dashboard`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Return Status Tracker" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Open the SARS My Tax Status Visual Dashboard", detail: "Navigate to tools.sars.gov.za/sarsonlinequery/visualdashboard or inside SARS eFiling → Home → Income Tax Work Page → Query SARS Status." },
  { step: "Step 2", title: "Authenticate with ID/Passport & Tax Reference", detail: "Enter your 10-digit Income Tax Reference Number, South African ID or Passport number, and complete the two-factor OTP verification sent to your registered mobile number." },
  { step: "Step 3", title: "Select the Relevant Assessment Year", detail: "Choose the specific tax year (e.g., 2026, 2025, or prior years) to view the real-time workflow stage of your ITR12, ITR14, or VAT201 submission." },
  { step: "Step 4", title: "Inspect Audit, Verification & Banking Flags", detail: "Check whether your return is marked 'Assessment Issued', 'Selected for Verification (Documents Required)', 'Selected for Audit', or 'Refund Held – Banking Details Invalid'." },
  { step: "Step 5", title: "Action Open Document or Banking Requests Immediately", detail: "If the dashboard displays an active document request or RAV01 bank verification hold, upload the required files within 21 business days so your assessment and refund can be finalized." },
];

const rejectionCases = [
  {
    title: "Assuming 'Assessment Issued (ITA34)' Guarantees Immediate Refund Payout",
    detail: "Even after an ITA34 shows a credit (negative) balance, SARS automated risk engines can place a post-assessment verification stopper or banking detail verification hold that pauses EFT payout."
  },
  {
    title: "Prior-Year Unfiled Returns Freezing Current-Year Refunds",
    detail: "Under Section 191 of the Tax Administration Act, SARS legally withholds any current-year refund if the taxpayer has even a single outstanding return across any tax year or tax type."
  },
  {
    title: "Ignoring 'Completion Letter' vs 'Revision Letter' Outcomes",
    detail: "When a verification concludes, SARS issues either a Finalisation Letter (no changes made) or a Revised ITA34 Assessment. If a Revised ITA34 disallows your deductions, you have 80 business days to file a formal objection."
  }
];

const faqs = [
  { question: "What does 'Selected for Verification' mean on the SARS Status Dashboard?", answer: "It means SARS automated risk engines flagged your tax return to verify claimed deductions or credits (such as medical expenses, Section 18A donations, retirement annuity contributions, or travel logbooks) against independent third-party certificates and supporting documents." },
  { question: "How long does SARS take to finalize a verification or pay a refund?", answer: "If not selected for verification, SARS pays valid credit refunds within 72 business hours. If selected for verification, the turnaround time is 21 business days from the date all complete supporting documents are submitted." },
  { question: "Why is my SARS refund status stuck on 'In Progress' despite no open audit?", answer: "Refunds with no open audit are typically held due to unverified bank details on RAV01, an outstanding return from a previous tax year, or an unallocated debit balance on another tax ledger (such as an APSA administrative penalty)." },
  { question: "What is the difference between a SARS Verification and a SARS Audit?", answer: "A verification is a rapid 21-business-day desk check comparing your return against uploaded supporting documents, whereas a formal audit is an in-depth examination of your underlying financial records taking up to 90 business days." },
  { question: "Can My Accountant unlock delayed SARS assessments and refunds?", answer: "Yes. We inspect your eFiling and SOQS status logs, clear verification stoppers, update RAV01 banking verification, and escalate overdue assessments beyond 21 business days." },
];

export default function SarsTaxReturnStatusDashboardPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guide', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Tax Return Status & Verification Tracker', item: `${SITE_URL}/sars-tax-return-status-dashboard` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Track Your SARS Tax Return Status & Verification Progress Online',
        description: 'Step-by-step instructions to check your SARS tax return, verification, and refund status on the SOQS Visual Dashboard.',
        step: diySteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Return Verification & Refund Expediting Service',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: 'ZA',
        serviceType: 'Tax Compliance & Audit Resolution',
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <PageHero
        badgeText="Tax Return Tracking & Verification"
        title={
          <>
            Tax Return Status &amp; <span className="text-gradient">Verification Tracker</span>
          </>
        }
        subtitle="Track your income tax return progress, audit status, verification requests, and refund payouts in real time."
        primaryCta={{ text: "Resolve SARS Audit", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/visualdashboard"
          title="Track Your Tax Return Status Directly"
          description="Check official SARS live updates on your tax return, verification status, and pending refund payments."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Tracking Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Track Your Return Status Online</h2>
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
              <CardContent className="text-sm text-muted-foreground pl-14">
                {s.detail}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Official SARS Service Charter Timelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong>Unflagged Credit Refund Payout:</strong> 72 business hours from assessment issue date.</p>
              <p><strong>Verification Review (ITR12 / VAT201):</strong> 21 business days from complete document upload.</p>
              <p><strong>Banking Details Verification:</strong> 5 to 21 business days if manual FICA upload is triggered.</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Why Refunds &amp; Assessments Stall
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              {rejectionCases.map((rc, idx) => (
                <div key={idx}>
                  <p className="font-semibold text-foreground">{rc.title}</p>
                  <p>{rc.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
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
              <CardContent className="text-sm text-muted-foreground">
                {f.answer}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-4">
        <h2 className="text-xl font-bold text-foreground">Related SARS Verification &amp; Refund Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/sars-supporting-documents-upload-guide" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Upload Audit Supporting Documents via SOQS</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-auto-assessment-status-check" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Check SARS Auto-Assessment Status</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-tax-refund" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>SARS Tax Refund Expediting &amp; Audit Support</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-online-query-system-guide" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Complete SARS SOQS Directory</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <SarsExpertCta />
      </section>
    </div>
  );
}
