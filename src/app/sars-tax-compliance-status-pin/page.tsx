import { Metadata } from 'next';
import { ShieldCheck, FileCheck, HelpCircle, CheckCircle2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Request Tax Compliance Status (TCS) PIN | SARS Online Query",
  description: "Request a SARS Tax Compliance Status (TCS) PIN for Good Standing, Tender, Foreign Investment, or Approval International Transfer (AIT).",
  alternates: {
    canonical: `${SITE_URL}/sars-tax-compliance-status-pin`,
  },
  openGraph: {
    title: "Request SARS Tax Compliance Status (TCS) PIN",
    description: "Step-by-step DIY guide to requesting a SARS TCS clearance PIN online.",
    url: `${SITE_URL}/sars-tax-compliance-status-pin`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS TCS PIN Request" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System or eFiling", detail: "Navigate to tools.sars.gov.za/soqs or log into your eFiling profile." },
  { step: "Step 2", title: "Select 'Tax Compliance Status Request'", detail: "Choose the purpose of your TCS PIN: Good Standing, Tender, Foreign Investment, or Approval International Transfer (AIT)." },
  { step: "Step 3", title: "Verify Your Compliance Overview", detail: "Ensure all tax returns (IT, VAT, PAYE) are filed and no outstanding debt exists." },
  { step: "Step 4", title: "Submit Supporting Documentation (If required)", detail: "For AIT or Foreign Investment, upload proof of funds, source of wealth, and bank statements." },
  { step: "Step 5", title: "Issue and View TCS PIN", detail: "Once approved, SARS will issue a unique 6-character TCS PIN and tax reference number." },
];

const faqs = [
  { question: "What is a SARS TCS PIN used for?", answer: "A Tax Compliance Status PIN replaces the old paper Tax Clearance Certificate. It allows third parties (employers, banks, tender boards, CIPC) to verify your real-time tax compliance status." },
  { question: "How long is a TCS PIN valid?", answer: "A TCS PIN remains active as long as your tax compliance status remains compliant, or until revoked by SARS." },
  { question: "What should I do if my TCS request is non-compliant?", answer: "If SARS marks you non-compliant due to unfiled returns or outstanding balances, My Accountant can audit your profile, submit unfiled returns, and negotiate payment arrangements." },
];

export default function SarsTaxComplianceStatusPinPage() {
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
        badgeText="SARS Tax Compliance Status (TCS)"
        title={
          <>
            Request Tax Compliance <span className="text-gradient">Status PIN</span>
          </>
        }
        subtitle="Obtain an official SARS TCS PIN for Good Standing, Government Tenders, Foreign Investment, or International Funds Transfer."
        primaryCta={{ text: "Get TCS PIN Assistance", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/tcsrequest"
          guideUrl="https://www.sars.gov.za/pay-tax/tax-compliance-status-system/"
          title="Request Your SARS TCS PIN Online"
          description="Access the SARS digital portal to request your real-time Tax Compliance Status PIN."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            TCS Request Workflow
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
