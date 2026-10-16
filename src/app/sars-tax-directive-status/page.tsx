import { Metadata } from 'next';
import Link from 'next/link';
import { Search, FileText, HelpCircle, CheckCircle2, DollarSign, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Track Tax Directive Status Online | SARS Online Query",
  description: "Check the status of your SARS tax directive application online. Track Two-Pot savings withdrawals, retirement lump sum, severance, or pension directives.",
  alternates: {
    canonical: `${SITE_URL}/sars-tax-directive-status`,
  },
  openGraph: {
    title: "Track SARS Tax Directive Status Online",
    description: "Step-by-step DIY guide to tracking retirement and severance tax directive applications.",
    url: `${SITE_URL}/sars-tax-directive-status`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Tax Directive Status" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Open the SOQS Directive Status Portal or eFiling", detail: "Navigate to tools.sars.gov.za/sarsonlinequery/directivestatus or log in to SARS eFiling → Services → Tax Directives → Request Tax Directive Status." },
  { step: "Step 2", title: "Select Directive Form Type (Form A&D, B, C, or E)", detail: "Identify whether your fund administrator or employer submitted a Two-Pot Savings Withdrawal, Retirement Lump Sum (Form B/C), Severance Benefit (Form A&D), or Fixed Percentage Commission directive (IRP3a)." },
  { step: "Step 3", title: "Input Tax Reference & Directive Case Number", detail: "Enter your 10-digit Income Tax Reference Number, South African ID or Passport number, and the Directive Application Reference provided by your retirement fund." },
  { step: "Step 4", title: "Inspect Live Directive Status & IT88 Deductions", detail: "Check whether the directive is 'Approved (IRP3 Issued)', 'Declined', or subject to a third-party IT88 garnish deduction for outstanding SARS tax debt." },
  { step: "Step 5", title: "Clear Compliance Blockers Before Fund Resubmission", detail: "If declined due to unfiled ITR12 returns or mismatched ID/tax numbers, resolve the underlying eFiling issue first—fund administrators cannot override a SARS system decline." },
];

const rejectionCases = [
  {
    title: "Unfiled Historical ITR12 Returns Blocking Directive Approval",
    detail: "Even a single outstanding ITR12 return from 5 years ago will cause SARS to automatically decline a retirement or severance lump sum directive (Form B/C)."
  },
  {
    title: "Unexpected IT88 Tax Debt Deductions on Two-Pot Withdrawals",
    detail: "When you apply for a Two-Pot Savings Component withdrawal, SARS automatically attaches an IT88 third-party directive for any unpaid assessed tax debt or administrative penalties before the fund pays you out."
  },
  {
    title: "Employer or Fund Submitting Incorrect Source Codes",
    detail: "Using the wrong accrual date, reason code (e.g., resignation vs involuntary retrenchment under Section 10(1)(x)), or fund registration number forces a formal directive cancellation before a corrected application can be lodged."
  }
];

const faqs = [
  { question: "What is a SARS tax directive (IRP3)?", answer: "A tax directive (IRP3) is an official instruction issued by SARS to a retirement fund administrator or employer specifying the exact PAYE tax amount (plus any IT88 tax debt recovery) to withhold from a lump sum payout or commission stream." },
  { question: "How long does SARS take to approve a tax directive?", answer: "Automated retirement fund and Two-Pot savings withdrawal directives submitted via ISV interfaces are processed within 24 to 48 business hours, whereas manual eFiling directives requiring supporting documents (such as retrenchment or share options) take up to 21 business days." },
  { question: "Why was my tax directive declined by SARS?", answer: "Directives are most commonly declined because the taxpayer is not registered for Income Tax, has outstanding ITR12 tax returns, has an active demographic mismatch between their ID number and RAV01 profile, or the employer duplicated a prior directive request." },
  { question: "How is a Two-Pot Retirement System savings withdrawal taxed?", answer: "Two-Pot savings withdrawals are taxed at your marginal personal income tax rate (not the retirement lump sum tax tables), and SARS also deducts any outstanding assessed tax debt directly from the payout." },
  { question: "Can My Accountant resolve declined SARS tax directives urgently?", answer: "Yes. We diagnose the exact decline code on your SARS profile, file any overdue ITR12 returns, resolve IT88 debt attachments, and coordinate directive resubmission with your employer or pension fund." },
];

export default function SarsTaxDirectiveStatusPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guide', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Track SARS Tax Directive Status', item: `${SITE_URL}/sars-tax-directive-status` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Check Your SARS Tax Directive Status Online',
        description: 'Step-by-step instructions to track retirement, Two-Pot savings withdrawal, and severance tax directives.',
        step: diySteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Tax Directive Resolution & Compliance Clearance',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: 'ZA',
        serviceType: 'Personal & Retirement Tax Advisory',
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
        badgeText="SARS Tax Directive Tracking"
        title={
          <>
            Track Tax Directive <span className="text-gradient">Status Online</span>
          </>
        }
        subtitle="Track the processing status of your Two-Pot savings withdrawal, retirement, pension, provident fund, or severance lump sum tax directive with SARS."
        primaryCta={{ text: "Resolve Tax Directive Issue", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/directivestatus"
          title="Track Your SARS Tax Directive Status Directly"
          description="Access official SARS digital channels to view live status updates for lump sum tax directives."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Tracking Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Check Tax Directive Status</h2>
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
                Directive Turnaround Times
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong>Two-Pot &amp; Fund Interface Directives:</strong> 24 to 48 business hours when tax compliance is clean.</p>
              <p><strong>Severance &amp; Commission Directives (IRP3a):</strong> 5 to 21 business days depending on supporting document review.</p>
              <p><strong>Directive Cancellation &amp; Re-Issue:</strong> 3 to 5 business days after the employer or fund submits the cancellation request.</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Common Directive Decline Triggers
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
        <h2 className="text-xl font-bold text-foreground">Related Personal Tax &amp; Compliance Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/sars-outstanding-returns-query" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Check Outstanding SARS Tax Returns</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-outstanding-debt-query" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Check SARS Tax Debt &amp; IT88 Holds</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/products/personal-income-tax-return" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>File Overdue Personal Income Tax (ITR12)</span>
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
