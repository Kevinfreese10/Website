import { Metadata } from 'next';
import { Search, Anchor, HelpCircle, CheckCircle2, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Check Customs RLA Status & Documents | SARS SOQS",
  description: "Track the processing status of your SARS Customs Registration, Licensing, and Accreditation (RLA) application online.",
  alternates: {
    canonical: `${SITE_URL}/sars-customs-rla-status`,
  },
  openGraph: {
    title: "Check Customs RLA Status & Documents",
    description: "Track SARS Customs RLA licensing and importer/exporter application progress online.",
    url: `${SITE_URL}/sars-customs-rla-status`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Customs RLA Status" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access SARS Online Query Portal or eFiling", detail: "Go to tools.sars.gov.za/soqs and choose 'Customs RLA Status Inquiry'." },
  { step: "Step 2", title: "Provide Case or Trader Reference Number", detail: "Input your RLA case reference number, tax reference number, or CIPC registration number." },
  { step: "Step 3", title: "View Application Status Dashboard", detail: "Check processing stage: Submitted, Selected for Site Inspection, Documents Requested, or Approved." },
  { step: "Step 4", title: "Review Outstanding RLA Requirements", detail: "Identify if SARS Customs requested additional warehouse diagrams, bond agreements, or tax clearance." },
  { step: "Step 5", title: "Download Customs RLA License Certificate", detail: "Once approved, download your official Customs RLA license or registration certificate." },
];

const faqs = [
  { question: "What is SARS Customs RLA?", answer: "RLA (Registration, Licensing and Accreditation) is the official SARS online system for managing custom trader registrations, bonded warehouses, rebate users, and accredited exporters." },
  { question: "How long does a SARS Customs RLA application take?", answer: "Standard RLA importer/exporter registrations take 10 to 21 business days. Bonded warehouse licensing requiring site inspections may take up to 60 days." },
  { question: "Can My Accountant assist with delayed Customs RLA applications?", answer: "Yes! We communicate directly with SARS Customs Relationship Managers to resolve licensing queries, site inspection delays, and document queries." },
];

export default function SarsCustomsRlaStatusPage() {
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
        badgeText="Customs RLA Tracking"
        title={
          <>
            Check Customs <span className="text-gradient">RLA Application Status</span>
          </>
        }
        subtitle="Track the processing status of your SARS Customs Registration, Licensing, and Accreditation (RLA) application in real time."
        primaryCta={{ text: "Check RLA License Status", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/requestrlastatus"
          guideUrl="https://www.sars.gov.za/customs-and-excise/registration-licensing-and-accreditation/"
          title="Track Your Customs RLA Status Directly"
          description="Access official SARS Customs online channels to view live processing status and license approvals."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            RLA Status Tracking
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Check Customs RLA Status</h2>
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
