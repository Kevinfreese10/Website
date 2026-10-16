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
  title: 'Request SARS Payment Allocation & Reallocation | SOQS',
  description:
    'Request SARS payment allocation or reallocation online via SOQS or eFiling for misallocated EFT payments, wrong 19-digit PRNs, or unallocated suspense funds.',
  alternates: {
    canonical: `${SITE_URL}/sars-payment-allocation-query`,
  },
  openGraph: {
    title: 'Request SARS Payment Allocation & Reallocation | My Accountant',
    description: 'Correct unallocated or misallocated SARS bank payments and suspense balances online.',
    url: `${SITE_URL}/sars-payment-allocation-query`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Payment Allocation Query' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Download Your Statement of Account to Locate the Unallocated Credit',
    detail:
      'Log into SARS eFiling and pull your Statement of Account (ITSA, VASA, or EMPSA) to identify whether the EFT sits under "Unallocated Payments" or was credited to the wrong tax period.',
  },
  {
    step: 'Step 2',
    title: 'Open the SARS Account & Payment Query Portal on SOQS',
    detail:
      'Navigate to tools.sars.gov.za/sarsonlinequery/accountquery and select "Payment Allocation / Reallocation Request".',
  },
  {
    step: 'Step 3',
    title: 'Specify Source Reference & Target 19-Digit PRN',
    detail:
      'Enter the exact EFT payment date, Rand amount, bank reference used by mistake, and the exact 19-digit Payment Reference Number (PRN) or tax period (e.g., EMP201 2026/02) where the funds must be moved.',
  },
  {
    step: 'Step 4',
    title: 'Upload Bank-Stamped Proof of Payment & Bank Statement',
    detail:
      'Attach BOTH the official bank EFT confirmation receipt AND the full bank statement page showing the debit leaving your account to SARS, plus a signed letter of instruction.',
  },
  {
    step: 'Step 5',
    title: 'Track SARS Finance Reallocation & Interest Reversal',
    detail:
      'SARS Finance reallocates the payment effective from the original date the money hit SARS’s bank account (turnaround: 10–21 business days), reversing any late-payment interest triggered after that date.',
  },
];

const rejectionCases = [
  {
    title: 'Uploading Only an EFT Notification Instead of the Bank Statement',
    desc: 'SARS Finance rejects payment trace and reallocation requests that only attach an email/SMS payment notification—you must attach the bank statement line proving the funds cleared and were never reversed.',
  },
  {
    title: 'Paying via Manual EFT Using a 10-Digit Tax Number Instead of 19-Digit PRN',
    desc: 'If you enter only your 10-digit tax reference number as the beneficiary reference without the period-specific 19-digit PRN, SARS’s automated matching engine drops the cash into an unallocated suspense account.',
  },
  {
    title: 'Cross-Tax-Type Reallocations (e.g. VAT Paid into PAYE Account)',
    desc: 'Moving a payment from one tax type to another (such as a VAT201 payment accidentally paid using an EMP201 PRN) requires a formal cross-tax journal signed by the Public Officer.',
  },
  {
    title: '10% Late Payment Penalties Triggered While Funds Sit in Suspense',
    desc: 'Because VAT201 and EMP201 systems impose an automatic 10% late payment penalty on the 1st of the next month if the period balance isn’t cleared, an RFR01 penalty remission must be filed once the reallocation is processed.',
  },
];

const faqs = [
  {
    question: 'Why is my SARS payment showing as unallocated when the money left my bank account?',
    answer:
      'SARS’s automated bank-clearing system matches payments strictly by the 19-digit alphanumeric Payment Reference Number (PRN). If a single digit is mistyped, an old month’s PRN is reused from a saved bank beneficiary, or only the 10-digit tax number is used, the payment lands in SARS Unallocated Suspense.',
  },
  {
    question: 'Will SARS waive the 10% late payment penalty if I paid on time using the wrong PRN?',
    answer:
      'Yes! Once SARS Finance reallocates the payment using the original value date on which SARS received your funds, the late-payment interest reverses automatically, and a Request for Remission (RFR01) can be lodged to waive the 10% penalty.',
  },
  {
    question: 'How long does SARS take to reallocate a misallocated payment?',
    answer:
      'Same-tax-type period reallocations typically take 7 to 15 business days. Cross-tax-type reallocations (e.g., moving funds from Income Tax to PAYE or VAT) or missing-payment traces take 15 to 21 business days.',
  },
  {
    question: 'How can I prevent misallocated SARS payments in future?',
    answer:
      'Instead of making manual EFT payments to a saved bank beneficiary, always use the "Credit Push" payment button inside SARS eFiling ("Returns > Payments > Create Payment"), which sends the exact amount and 19-digit PRN directly to your online banking app for authorisation.',
  },
  {
    question: 'Can My Accountant trace and reallocate stuck SARS suspense payments for us?',
    answer:
      'Yes! We audit your ITSA, VASA, and EMPSA statements of account, trace every unallocated credit, lodge the formal SARS Finance reallocation pack, and file RFR01 applications to reverse resulting penalties.',
  },
];

export default function SarsPaymentAllocationQueryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Request Payment Allocation & Reallocation', item: `${SITE_URL}/sars-payment-allocation-query` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Request a SARS Payment Allocation or Reallocation Online',
        description: 'Step-by-step instructions to move unallocated or misallocated EFT payments to the correct SARS tax period.',
        totalTime: 'PT15M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Payment Reallocation, Account Reconciliation & Penalty Reversal Service',
        description: 'Professional tracing and reallocation of misallocated SARS EFT payments across Income Tax, VAT, and PAYE.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-payment-allocation-query`,
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
        badgeText="SARS Payment Resolution & Suspense Clearing"
        title={
          <>
            Request SARS Payment <span className="text-gradient">Allocation &amp; Reallocation</span>
          </>
        }
        subtitle="Correct misallocated EFT tax payments, trace missing bank transfers, move funds out of SARS suspense, and reverse unfair 10% late-payment penalties."
        primaryCta={{ text: 'Resolve Payment & Penalties', href: '/remission-of-fines' }}
        secondaryCta={{ text: 'Find Correct 19-Digit PRN', href: '/sars-payment-reference-number-prn' }}
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
                Suspense Check Path &amp; SARS Finance SLA
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Reallocation SLA: 7–21 Business Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Returns &rarr; SARS Correspondence / Statement of Account (Inspect Unallocated Credits)
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/accountquery"
          title="Submit a SARS Payment Allocation Query Online"
          description="Access official SARS query portals to trace missing payments and request reallocation of funds."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Reallocation Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Reallocate a SARS Payment</h2>
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
            Common Reallocation Rejections
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Why SARS Rejects Payment Reallocation Requests
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Payment &amp; Statement Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/remission-of-fines" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Reverse 10% Late Payment Penalties</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-payment-reference-number-prn" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Find 19-Digit SARS PRN</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-statement-of-account-request" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Request Statement of Account</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-outstanding-debt-query" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>SARS Debt &amp; Payment Plans</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-compliance-status-pin" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Request &amp; Verify SARS TCS PIN</span>
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
