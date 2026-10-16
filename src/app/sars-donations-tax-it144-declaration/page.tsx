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
  title: 'Submit Donations Tax Declaration IT144 | SARS SOQS',
  description:
    'Submit your SARS Donations Tax Declaration (IT144) online via eFiling or SOQS. Calculate 20%/25% donations tax, R100,000 exemptions, Section 7C deemed donations, and deadlines.',
  alternates: {
    canonical: `${SITE_URL}/sars-donations-tax-it144-declaration`,
  },
  openGraph: {
    title: 'Submit Donations Tax Declaration IT144 | My Accountant',
    description: 'Step-by-step DIY guide to filing SARS IT144 donations tax declarations online.',
    url: `${SITE_URL}/sars-donations-tax-it144-declaration`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Donations Tax IT144' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Access SARS eFiling IT144 or the SOQS Donations Tax Portal',
    detail:
      'Log into SARS eFiling -> click "Returns > Request Return > Donations Tax (IT144)" or navigate to tools.sars.gov.za/sarsonlinequery/DonationsTax to upload a signed IT144 declaration.',
  },
  {
    step: 'Step 2',
    title: 'Capture Donor & Donee Tax Identification Details',
    detail:
      'Input the donor’s 10-digit Income Tax Reference Number and SA ID/CIPC registration number, together with the donee’s (recipient’s) full legal details and tax number.',
  },
  {
    step: 'Step 3',
    title: 'Declare Fair Market Value & Effective Date of Donation',
    detail:
      'Specify the nature of the property (cash, unlisted shares, immovable property, or Section 7C interest-free trust loan foregone interest), its fair market value under Section 62, and the date the donation took effect.',
  },
  {
    step: 'Step 4',
    title: 'Apply Section 56 Exemptions & Compute 20% / 25% Tax',
    detail:
      'Deduct the R100,000 annual natural-person casual exemption (or R10,000 casual gifts exemption for companies) or Section 56(1)(b) spousal exemption. Multiply net taxable donations by 20% (or 25% where cumulative taxable donations since 1 March 2018 exceed R30 million).',
  },
  {
    step: 'Step 5',
    title: 'Submit IT144 & Pay via PRN Before End of the Following Month',
    detail:
      'Under Section 60(1) of the Income Tax Act, the IT144 declaration and Donations Tax payment must be submitted to SARS by the end of the month following the month in which the donation took effect.',
  },
];

const rejectionCases = [
  {
    title: 'Confusing the Old 3-Month Rule with the Current End-of-Next-Month Deadline',
    desc: 'Section 60(1) of the Income Tax Act requires Donations Tax to be paid by the end of the month following the month during which a donation takes effect (and on 28/29 February for Section 7C deemed donations)—late payment immediately attracts Section 89quat interest.',
  },
  {
    title: 'Omitted Section 7C Low-Interest / Interest-Free Trust Loans',
    desc: 'Where a natural person or connected company lends money to a trust at an interest rate below the SARS Official Rate of Interest (repo rate + 1%), the interest foregone on the last day of February is a deemed annual donation requiring an IT144.',
  },
  {
    title: 'Selling Assets Below Market Value to Connected Persons (Section 58)',
    desc: 'Transferring property, vehicles, or shares to family members or a trust for "nominal consideration" (below fair market value) triggers both Donations Tax under Section 58 and Capital Gains Tax under Paragraph 38 on the market-value gap.',
  },
  {
    title: 'Joint Liability of Donor and Donee (Section 59)',
    desc: 'If the donor fails to file the IT144 and pay the 20% Donations Tax within the statutory period, SARS holds the donor and the donee (recipient) jointly and severally liable for the unpaid tax.',
  },
];

const faqs = [
  {
    question: 'What is the annual Donations Tax exemption in South Africa for 2026?',
    answer:
      'Under Section 56(2)(b) of the Income Tax Act, natural persons (individuals) may make cumulative non-exempt donations of up to R100,000 per tax year completely free of Donations Tax. Companies and trusts are limited to R10,000 per year for casual gifts. Bona fide donations between spouses and to approved Section 18A Public Benefit Organisations are 100% exempt.',
  },
  {
    question: 'What is the SARS Donations Tax rate and when is it due?',
    answer:
      'Donations Tax is levied at 20% on cumulative taxable donations up to R30 million, and 25% on the portion exceeding R30 million. Both the IT144 declaration and payment must reach SARS by the end of the month following the month in which the donation took effect.',
  },
  {
    question: 'How does Section 7C affect interest-free loans to family trusts?',
    answer:
      'Under Section 7C, if you advance an interest-free or low-interest loan to a family trust, the difference between interest charged and the SARS Official Rate of Interest is deemed to be a ongoing donation made on the last day of February each year. You can offset your R100,000 annual individual exemption against this deemed donation, and any excess is taxed at 20% via an IT144 due by 31 March.',
  },
  {
    question: 'How long does SARS take to process an IT144 and issue a PRN?',
    answer:
      'When submitted on SARS eFiling, the IT144 assessment and 19-digit Payment Reference Number (PRN) are generated immediately. When uploaded via SOQS with supporting valuation documents, processing takes 5 to 10 business days.',
  },
  {
    question: 'Can My Accountant calculate Section 7C trust interest and file IT144 returns?',
    answer:
      'Yes! We compute annual Section 7C interest-foregone schedules for family trusts, verify Section 56 exemptions, value unlisted shares, and lodge IT144 declarations on eFiling.',
  },
];

export default function SarsDonationsTaxIt144DeclarationPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Submit Donations Tax IT144', item: `${SITE_URL}/sars-donations-tax-it144-declaration` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Submit a SARS Donations Tax Declaration (IT144)',
        description: 'Step-by-step instructions to calculate and submit Form IT144 for Donations Tax via SARS eFiling or SOQS.',
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
        name: 'SARS Donations Tax (IT144) & Section 7C Trust Loan Compliance Service',
        description: 'Professional IT144 Donations Tax filing, Section 7C trust loan calculations, and asset transfer structuring.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-donations-tax-it144-declaration`,
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
        badgeText="Donations & Section 7C Trust Tax Compliance"
        title={
          <>
            Submit Donations Tax <span className="text-gradient">Declaration (IT144)</span>
          </>
        }
        subtitle="Declare taxable property, cash donations, or Section 7C interest-free trust loan deemed donations to SARS, apply your R100,000 annual exemption, and file Form IT144 on time."
        primaryCta={{ text: 'File IT144 / Trust Tax', href: '/trust-services' }}
        secondaryCta={{ text: 'Book Tax Consultation', href: '/contact' }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider">
                eFiling Navigation &amp; Statutory Deadline
              </Badge>
              <h2 className="text-xl md:text-2xl font-black text-foreground">
                IT144 eFiling Path &amp; Section 60 Payment Rule
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Due: End of Month Following Donation (31 March for s7C)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Returns &rarr; Request Return &rarr; Donations Tax (IT144) &rarr; Generate PRN
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/DonationsTax"
          title="Submit Your SARS IT144 Declaration Online"
          description="Use official SARS digital query portals to submit donations tax returns and calculate payment reference numbers."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            IT144 Filing Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Submit an IT144 Declaration</h2>
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
            Audit &amp; Valuation Risks
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common Donations Tax &amp; Section 7C Compliance Pitfalls
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Trust, CGT &amp; Payment Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/trust-services" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Trust Accounting &amp; Tax Services</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/products/individual-tax-returns" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Individual Tax Return (ITR12)</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-trust-registration-online" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Register a Trust with SARS</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-payment-reference-number-prn" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Find 19-Digit SARS PRN</span>
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
