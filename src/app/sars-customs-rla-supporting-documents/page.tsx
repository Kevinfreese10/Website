import { Metadata } from 'next';
import { Upload, Anchor, HelpCircle, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Submit Customs RLA Supporting Documents | SARS SOQS",
  description: "Submit required verification documents for SARS Customs Registration, Licensing, and Accreditation (RLA) online via SOQS.",
  alternates: {
    canonical: `${SITE_URL}/sars-customs-rla-supporting-documents`,
  },
  openGraph: {
    title: "Submit Customs RLA Supporting Documents",
    description: "Upload Customs RLA supporting files and verification documents online.",
    url: `${SITE_URL}/sars-customs-rla-supporting-documents`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Customs RLA Supporting Docs Upload" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Navigate to online.sars.gov.za and select 'Submit Customs RLA Supporting Documents'." },
  { step: "Step 2", title: "Provide RLA Case Reference Number", detail: "Input the unique Customs RLA application case number received from SARS." },
  { step: "Step 3", title: "Select Document Category", detail: "Choose document type: Proof of Business Address, Bank Letter, Resolution of Authority, Bond Security, or Lease Agreement." },
  { step: "Step 4", title: "Upload High-Resolution PDF Files", detail: "Attach unencrypted PDF documents (under 5MB per file) matching SARS Customs requirements." },
  { step: "Step 5", title: "Confirm Upload & Save Receipt", detail: "Submit files and download official SARS submission acknowledgement receipt." },
];

const faqs = [
  { question: "What documents are required for a SARS Customs RLA Importer Registration?", answer: "CIPC registration document (CoR14.3), certified Public Officer ID, bank account confirmation letter, municipal utility bill, and TCS PIN." },
  { question: "Why are my Customs RLA documents rejected?", answer: "Common reasons include utility bills older than 3 months, blurry ID copies, mismatched company addresses, or missing Public Officer resolutions." },
  { question: "Can My Accountant audit and upload our Customs RLA files?", answer: "Yes! We pre-audit all customs licensing files to ensure 100% compliance before uploading to SARS." },
];

export default function SarsCustomsRlaSupportingDocumentsPage() {
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
        badgeText="Customs Document Upload"
        title={
          <>
            Submit Customs RLA <span className="text-gradient">Supporting Documents</span>
          </>
        }
        subtitle="Upload required verification files, bank letters, and legal resolutions for open SARS Customs RLA licensing applications."
        primaryCta={{ text: "Upload RLA Documents", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Upload Customs RLA Files Directly to SARS"
          description="Use official SARS online query channels to upload supporting documentation for customs trader applications."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Document Upload Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Upload Customs RLA Supporting Documents</h2>
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
