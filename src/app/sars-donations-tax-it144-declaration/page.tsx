import { Metadata } from 'next';
import { FileText, DollarSign, HelpCircle, CheckCircle2, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Submit Donations Tax Declaration IT144 | SARS SOQS",
  description: "Submit your SARS Donations Tax Declaration (IT144) online via SOQS. Calculate 20% donations tax, exemptions, and 3-month filing deadlines.",
  alternates: {
    canonical: `${SITE_URL}/sars-donations-tax-it144-declaration`,
  },
  openGraph: {
    title: "Submit Donations Tax Declaration IT144",
    description: "Step-by-step DIY guide to filing SARS IT144 donations tax declarations online.",
    url: `${SITE_URL}/sars-donations-tax-it144-declaration`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Donations Tax IT144" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and choose 'Donations Tax Declaration (IT144)'." },
  { step: "Step 2", title: "Enter Donor & Donee Tax Details", detail: "Input the donor's tax reference number and donee's ID or registration details." },
  { step: "Step 3", title: "Specify Donation Valuation & Date", detail: "State property description, market value of donation, and date donation took effect." },
  { step: "Step 4", title: "Calculate Tax Liability & Exemptions", detail: "Apply annual R100,000 individual exemption or spouse exemption. Calculate 20% tax on net taxable donations." },
  { step: "Step 5", title: "Submit IT144 & Pay Tax within 3 Months", detail: "Submit declaration and pay calculated donations tax to SARS using generated PRN within 3 months of donation." },
];

const faqs = [
  { question: "What is the annual donations tax exemption in South Africa?", answer: "Natural persons enjoy an annual donations tax exemption of up to R100,000 per tax year. Donations to spouses or approved Section 18A PBOs are 100% exempt." },
  { question: "What is the rate of Donations Tax in South Africa?", answer: "Donations tax is levied at a flat rate of 20% on cumulative taxable donations up to R30 million, and 25% on donations exceeding R30 million." },
  { question: "Can My Accountant file IT144 declarations and structure asset transfers?", answer: "Yes! We advise on tax-efficient estate planning, trust loan accounts, Section 18A PBO deductions, and file IT144 declarations with SARS." },
];

export default function SarsDonationsTaxIt144DeclarationPage() {
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
        badgeText="Donations & Estate Tax Compliance"
        title={
          <>
            Submit Donations Tax <span className="text-gradient">Declaration (IT144)</span>
          </>
        }
        subtitle="Declare taxable property or cash donations to SARS, apply allowable exemptions, and pay donations tax within 3 months."
        primaryCta={{ text: "File Donations Tax IT144", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

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
