import { Metadata } from 'next';
import { FileText, DollarSign, HelpCircle, CheckCircle2, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Submit Withholding Tax on Royalties WTR01 | SARS SOQS",
  description: "Submit SARS Withholding Tax on Royalties (WTR01) declarations online via SOQS. Calculate 15% royalty withholding tax for non-residents.",
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
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and select 'Withholding Tax on Royalties (WTR01)'." },
  { step: "Step 2", title: "Enter Payer & Non-Resident Payee Details", detail: "Input South African payer's tax reference number and offshore payee's international details." },
  { step: "Step 3", title: "Specify Royalty Payment & DTA Treaty Rate", detail: "State total gross royalty amount, date paid, and applicable Double Taxation Agreement (DTA) reduced tax rate if certified." },
  { step: "Step 4", title: "Calculate 15% Withholding Amount", detail: "Apply statutory 15% tax rate (or reduced DTA rate) to determine tax withheld." },
  { step: "Step 5", title: "Submit WTR01 & Pay Tax by End of Following Month", detail: "File WTR01 return and remit withheld funds to SARS before the end of the month following royalty payment." },
];

const faqs = [
  { question: "What is Withholding Tax on Royalties in South Africa?", answer: "A final tax of 15% levied on gross royalty payments made by South African residents to foreign non-residents for intellectual property, patents, trademarks, or copyrights." },
  { question: "Can Double Taxation Agreements (DTA) reduce the 15% royalty tax rate?", answer: "Yes. Many DTA treaties reduce withholding tax rates down to 5% or 0%, provided the non-resident payee completes a valid SARS declaration form." },
  { question: "Can My Accountant advise on international royalty structuring and WTR01 compliance?", answer: "Yes! We manage international tax treaties, verify DTA eligibility, and file monthly WTR01 declarations with SARS." },
];

export default function SarsWithholdingTaxRoyaltiesWtr01Page() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className="space-y-12 pb-16 bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

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
          guideUrl="https://www.sars.gov.za/types-of-tax/withholding-tax-on-royalties/"
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

      <section className="container mx-auto px-4 max-w-5xl">
        <SarsExpertCta />
      </section>
    </div>
  );
}
