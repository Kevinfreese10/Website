import { Metadata } from 'next';
import { CheckCircle2, ShieldCheck, Search, HelpCircle, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Verify SARS Tax Compliance Status PIN | SARS Online Query",
  description: "Verify a third-party SARS Tax Compliance Status (TCS) PIN and Tax Reference Number online to validate tax clearance for tenders, contracts, or vendors.",
  alternates: {
    canonical: `${SITE_URL}/sars-verify-tax-compliance-status`,
  },
  openGraph: {
    title: "Verify SARS Tax Compliance Status PIN",
    description: "Instantly verify a vendor or individual SARS TCS PIN online.",
    url: `${SITE_URL}/sars-verify-tax-compliance-status`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Verify SARS TCS PIN" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and click 'Verify Tax Compliance Status'." },
  { step: "Step 2", title: "Enter Tax Reference Number", detail: "Provide the 10-digit SARS income tax or company reference number of the entity or individual." },
  { step: "Step 3", title: "Enter the TCS PIN", detail: "Input the unique 6-character TCS PIN provided by the taxpayer." },
  { step: "Step 4", title: "Submit Verification Query", detail: "Click search to retrieve real-time compliance results from the SARS database." },
  { step: "Step 5", title: "Review Compliance Certificate", detail: "View the real-time compliance status (Compliant vs Non-Compliant) and download official confirmation for audit records." },
];

const faqs = [
  { question: "Who can verify a SARS TCS PIN?", answer: "Any third party, including employers, government institutions, banks, or tender boards, can verify a TCS PIN if provided with the tax reference number and PIN." },
  { question: "What does 'Non-Compliant' status mean?", answer: "Non-compliant indicates that the taxpayer has outstanding tax returns, overdue SARS debt, or unverified administrative details." },
  { question: "How often should vendors' TCS PINs be verified?", answer: "Because TCS status is checked in real-time, it is recommended to verify before awarding contracts or processing payments." },
];

export default function SarsVerifyTaxComplianceStatusPage() {
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
        badgeText="Third-Party TCS PIN Verification"
        title={
          <>
            Verify SARS <span className="text-gradient">Tax Compliance Status</span>
          </>
        }
        subtitle="Validate the real-time tax compliance status of vendors, suppliers, employees, or contractors using their SARS TCS PIN."
        primaryCta={{ text: "Verify Tax Compliance", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Verify a SARS TCS PIN Directly"
          description="Use the official SARS online portal to check real-time tax clearance and compliance status."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Verification Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Verify a TCS PIN Online</h2>
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
