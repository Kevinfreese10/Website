import { Metadata } from 'next';
import Link from 'next/link';
import { Receipt, FileText, HelpCircle, DollarSign, Calendar, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Request SARS Statement of Account | SARS Online Query",
  description: "Request an official SARS Statement of Account (EMSA/ITSA) online for Income Tax, VAT, PAYE, or Provisional Tax balances.",
  alternates: {
    canonical: `${SITE_URL}/sars-statement-of-account-request`,
  },
  openGraph: {
    title: "Request SARS Statement of Account",
    description: "Step-by-step DIY guide to requesting official SARS tax statements of account online.",
    url: `${SITE_URL}/sars-statement-of-account-request`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Statement of Account Request" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Navigate to SOQS Account Query or SARS eFiling", detail: "Open tools.sars.gov.za/sarsonlinequery/accountquery or log in to SARS eFiling → Returns → SARS Correspondence → Request Historic IT Notices / Statement of Account." },
  { step: "Step 2", title: "Choose the Specific Tax Ledger Type", detail: "Select Income Tax (ITSA), Value-Added Tax (VTSA), Employer PAYE/UIF/SDL (EMSA), or Administrative Penalty Statement (APSA) depending on the balance you need to reconcile." },
  { step: "Step 3", title: "Define the Statement Accounting Window", detail: "Select '6 Months to Date' for current payment verification or 'Custom Date Range' when performing multi-year historical audit reconciliations." },
  { step: "Step 4", title: "Verify Identity via Registered OTP", detail: "Input your 10-digit tax reference number and Registered Representative ID/Passport number, then enter the OTP delivered to your RAV01 security contact." },
  { step: "Step 5", title: "Inspect Unallocated Credits & PRN Line Items", detail: "Download the PDF Statement of Account, verify the closing balance, and extract the exact 19-digit Payment Reference Number (PRN) at the bottom before making any EFT payment." },
];

const rejectionCases = [
  {
    title: "Requesting Only ITSA While Administrative Penalties Sit on APSA",
    detail: "SARS maintains a separate Administrative Penalty Statement of Account (APSA) for late-filing penalties under Section 210. Having a R0.00 balance on your main ITSA statement does not mean your APSA penalty ledger is clear."
  },
  {
    title: "Unallocated Payments Sitting in Suspense",
    detail: "When an EFT payment is made with a truncated or expired PRN, the cash sits in SARS Unallocated Credits while your assessed tax debt continues compounding monthly Section 89quat interest."
  },
  {
    title: "EMSA Statement Mismatches Against EMP501 Reconciliations",
    detail: "If monthly EMP201 declarations do not match your bi-annual EMP501 ETI and PAYE totals, the EMSA Statement of Account will trigger an automatic compliance hold on your Tax Compliance Status (TCS) PIN."
  }
];

const faqs = [
  { question: "What is the difference between an ITSA, VTSA, and EMSA Statement of Account?", answer: "ITSA is the Income Tax Statement of Account (individuals, companies, trusts), VTSA is the Value-Added Tax ledger, and EMSA is the Employer Monthly Statement of Account covering PAYE, SDL, UIF, and Employment Tax Incentive (ETI) balances." },
  { question: "What details appear on a SARS Statement of Account?", answer: "It lists every original and additional assessment (ITA34/VAT201), EFT payments processed, unallocated credits, Section 89quat interest charges, understatement penalties, and the net debit or credit balance." },
  { question: "Why does my SARS Statement of Account show an unallocated payment?", answer: "If an incorrect or outdated 19-digit Payment Reference Number (PRN) was used during bank payment, SARS places the funds into an unallocated suspense account until a formal payment reallocation query is lodged." },
  { question: "How quickly does an eFiling payment reflect on my Statement of Account?", answer: "Standard eFiling 'Credit Push' payments reflect on your SARS Statement of Account within 24 to 48 business hours once authorized inside your banking portal." },
  { question: "Can My Accountant audit and reconcile my SARS statements of account?", answer: "Yes. We perform full line-by-line reconciliations across ITSA, VTSA, EMSA, and APSA ledgers against your general ledger and bank statements to recover unallocated credits and reverse unlawful interest." },
];

export default function SarsStatementOfAccountRequestPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guide', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'SARS Statement of Account Request', item: `${SITE_URL}/sars-statement-of-account-request` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Request an Official SARS Statement of Account Online',
        description: 'Step-by-step instructions to download ITSA, VTSA, EMSA, and APSA Statements of Account from SARS.',
        step: diySteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Ledger Reconciliation & Account Audit',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: 'ZA',
        serviceType: 'Tax Accounting & Reconciliation',
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
        badgeText="SARS Account Statements"
        title={
          <>
            Request SARS <span className="text-gradient">Statement of Account</span>
          </>
        }
        subtitle="Obtain an official SARS Statement of Account (ITSA, VTSA, EMSA, or APSA) for Income Tax, VAT, PAYE, or Corporate tax balances online."
        primaryCta={{ text: "Request Account Statement", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/accountquery"
          title="Obtain Your SARS Statement of Account Online"
          description="Request real-time official tax balance statements directly from SARS without visiting a branch."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Statement Request Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Request a SARS Statement of Account</h2>
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
                Generation &amp; Posting Timelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong>SOQS / eFiling Statement Delivery:</strong> Generated within 5 to 15 minutes and delivered to your eFiling inbox and registered email.</p>
              <p><strong>Payment Reflection (Credit Push):</strong> 1 to 2 business days after bank release.</p>
              <p><strong>Manual Payment Reallocation:</strong> 21 business days once proof of payment is submitted via SOQS.</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Common Ledger Reconciliation Traps
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Ledger &amp; Payment Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/sars-outstanding-debt-query" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Query SARS Outstanding Tax Debt</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-payment-allocation-query" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Resolve Unallocated SARS Payments</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-payment-reference-number-prn" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Generate a 19-Digit SARS PRN</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-compromise" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>SARS Tax Debt Compromise &amp; Deferral</span>
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
