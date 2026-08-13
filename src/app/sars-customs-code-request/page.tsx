import { Metadata } from 'next';
import { Anchor, Search, HelpCircle, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Request Customs Trader Identification / Code | SARS SOQS",
  description: "Request or look up an importer/exporter SARS Customs Trader Identification Code online via the SARS Online Query System.",
  alternates: {
    canonical: `${SITE_URL}/sars-customs-code-request`,
  },
  openGraph: {
    title: "Request Customs Trader Identification / Code",
    description: "Look up or register for a SARS Customs Importer/Exporter Code online.",
    url: `${SITE_URL}/sars-customs-code-request`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Customs Trader Code Request" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and choose 'Customs Trader Code Query'." },
  { step: "Step 2", title: "Select Inquiry Type", detail: "Choose between looking up an existing Customs Code or applying for a new Importer/Exporter Trader ID." },
  { step: "Step 3", title: "Enter Company & Income Tax Details", detail: "Provide 10-digit SARS income tax reference number and CIPC registration number." },
  { step: "Step 4", title: "Upload Verification Documentation", detail: "Attach company registration documents, bank statement proof, and Public Officer ID copy." },
  { step: "Step 5", title: "Receive Customs Code Confirmation", detail: "SARS will issue or confirm your 8-digit Customs Code required for clearing goods through South African ports." },
];

const faqs = [
  { question: "What is a SARS Customs Code?", answer: "A Customs Code (Customs Client Number) is an 8-digit identification number issued by SARS to individuals or companies importing or exporting goods exceeding R50,000 per year." },
  { question: "Can an individual import goods without a Customs Code?", answer: "Individuals are allowed up to 3 non-commercial import transactions per year (under R50,000 total value) using generic code 70707070. Commercial shipments require a dedicated Customs Code." },
  { question: "Can My Accountant handle SARS Customs registration?", answer: "Yes! We handle full Customs Registration, Licensing and Accreditation (RLA), duty deferments, and VAT import clearance." },
];

export default function SarsCustomsCodeRequestPage() {
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
        badgeText="Customs & International Trade"
        title={
          <>
            Request Customs <span className="text-gradient">Trader Code (RLA)</span>
          </>
        }
        subtitle="Retrieve or register an official SARS Customs Importer/Exporter Code to clear international shipments through South African ports."
        primaryCta={{ text: "Register Customs Code", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/requestcustomscode/"
          title="Query Your SARS Customs Code Online"
          description="Access official SARS digital channels to request or verify importer/exporter customs registration codes."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Customs Request Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Request a Customs Trader Code</h2>
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
