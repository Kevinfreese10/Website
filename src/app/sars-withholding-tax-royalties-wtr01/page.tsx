import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, DollarSign, HelpCircle, CheckCircle2, Globe, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Submit Withholding Tax on Royalties WTR01 | SARS SOQS",
  description: "Submit SARS Withholding Tax on Royalties (WTR01) declarations online via SOQS. Calculate 15% royalty withholding tax and DTA relief for non-residents.",
  alternates: {
    canonical: `${SITE_URL}/sars-withholding-tax-royalties-wtr01`,
  },
  openGraph: {
    title: "Submit Withholding Tax on Royalties WTR01",
    description: "Step-by-step DIY guide to filing SARS WTR01 royalty tax declarations.",
    url: `${SITE_URL}/sars-withholding-tax-royalties-wtr01`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Royalty Withholding Tax WTR01" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Obtain the Signed Non-Resident WTRD Declaration First", detail: "Before remitting any cross-border IP or licensing fee, obtain a signed SARS WTRD declaration and undertaking from the foreign recipient if you intend to apply a reduced Double Taxation Agreement (DTA) rate instead of the statutory 15% rate." },
  { step: "Step 2", title: "Complete the Official WTR01 Return Schedule", detail: "Download and complete the SARS WTR01 (Withholding Tax on Royalties) return specifying the South African payer's Income Tax number, the foreign recipient's tax residence country, gross Rand royalty amount, and tax withheld." },
  { step: "Step 3", title: "Open the SOQS Withholding Tax Submission Channel", detail: "Navigate to tools.sars.gov.za/sarsonlinequery/DonationsTax (which hosts SARS SOQS declarations for IT144 Donations Tax and WTR01 Withholding Tax on Royalties)." },
  { step: "Step 4", title: "Upload WTR01, License Agreement & Proof of Payment", detail: "Attach the signed WTR01 declaration, foreign IP/software license agreement, signed WTRD treaty declaration (if applicable), and proof of payment." },
  { step: "Step 5", title: "Remit Tax by the Last Business Day of the Next Month", detail: "Under Section 49F of the Income Tax Act, both the WTR01 declaration and payment must reach SARS by the last business day of the month following the month in which the royalty was paid or became due and payable." },
];

const rejectionCases = [
  {
    title: "Applying a Reduced DTA Rate Without a Signed Prior Declaration",
    detail: "Under Section 49E(2) of the Income Tax Act, a South African payer may not withhold at a reduced DTA treaty rate unless the foreign royalty recipient has provided a signed written declaration and undertaking BEFORE the royalty is paid."
  },
  {
    title: "Authorized Dealer (SARB / Bank) Blocking Cross-Border Swift Transfers",
    detail: "South African commercial banks (Authorized Dealers) require a submitted WTR01, SARS Tax Compliance Status (TCS) PIN, and valid license agreement before releasing outward cross-border royalty payments under Exchange Control rules."
  },
  {
    title: "Missing the End-of-Following-Month Statutory Deadline",
    detail: "Royalties are deemed paid on the earlier of the date of actual payment or the date the royalty becomes due and payable. Late WTR01 payment triggers an immediate 10% late payment penalty plus Section 89bis interest."
  }
];

const faqs = [
  { question: "What is the statutory Withholding Tax on Royalties rate in South Africa?", answer: "Under Section 49B of the Income Tax Act, a final withholding tax of 15% is levied on the gross amount of any royalty paid by a South African resident to or for the benefit of any foreign person from a South African source." },
  { question: "When are WTR01 returns and payments due to SARS?", answer: "Both the WTR01 return and the withheld tax payment must be submitted to SARS by the last business day of the month following the month in which the royalty was paid or became due and payable." },
  { question: "Can a Double Taxation Agreement (DTA) reduce the 15% royalty withholding tax?", answer: "Yes. Depending on the DTA between South Africa and the foreign recipient's country of tax residence, the royalty withholding rate can be reduced to 10%, 5%, or 0%, provided a valid WTRD declaration and tax residency certificate are in place prior to payment." },
  { question: "Do standard off-the-shelf SaaS subscriptions trigger WTR01 royalty withholding tax?", answer: "Generally, payments for the mere use of standard off-the-shelf software or SaaS without the right to commercially exploit, reproduce, or modify the underlying copyright do not constitute a 'royalty' under Section 49A, though custom IP licensing and white-label distribution rights do." },
  { question: "Can My Accountant manage our WTR01 filings and SARB cross-border approvals?", answer: "Yes! Our international tax specialists review your licensing contracts, verify DTA reduced-rate eligibility, submit WTR01 declarations via SOQS, and issue the SARS TCS PINs required by your bank's exchange control desk." },
];

export default function SarsWithholdingTaxRoyaltiesWtr01Page() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guide', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Submit Withholding Tax on Royalties (WTR01)', item: `${SITE_URL}/sars-withholding-tax-royalties-wtr01` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Submit a SARS WTR01 Withholding Tax on Royalties Declaration',
        description: 'Step-by-step instructions to calculate 15% or DTA-reduced royalty withholding tax and submit the WTR01 return via SOQS.',
        step: diySteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'International Royalty Withholding Tax (WTR01) & DTA Compliance',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: 'ZA',
        serviceType: 'International & Corporate Tax Compliance',
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
        badgeText="International Tax Compliance"
        title={
          <>
            Submit Withholding Tax <span className="text-gradient">on Royalties (WTR01)</span>
          </>
        }
        subtitle="File monthly WTR01 returns for royalty payments made to foreign non-residents and apply Double Taxation Agreement (DTA) relief."
        primaryCta={{ text: "File WTR01 Return", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/DonationsTax"
          title="Submit a SARS WTR01 Royalty Declaration Online"
          description="Use official SARS digital query portals to submit royalty withholding tax returns and calculate payment references."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            WTR01 Filing Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Submit WTR01 Royalty Tax Declarations</h2>
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
                Statutory Filing &amp; Payment Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong>WTR01 Declaration &amp; Payment Due Date:</strong> Last business day of the month following the month in which the royalty was paid or accrued.</p>
              <p><strong>SOQS Processing Turnaround:</strong> 5 to 15 business days to process the manual WTR01 upload and allocate the payment.</p>
              <p><strong>Overpaid WTR01 Refund Window:</strong> Must be claimed within 3 years after the royalty payment date under Section 49G.</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Common Cross-Border Royalty Traps
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
        <h2 className="text-xl font-bold text-foreground">Related International &amp; Corporate Tax Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/sars-tax-compliance-status-pin" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Request FIA / Good Standing TCS PIN</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-donations-tax-it144-declaration" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Submit SARS Donations Tax (IT144)</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-payment-reference-number-prn" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Generate SARS 19-Digit Payment Reference (PRN)</span>
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
