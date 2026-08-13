import { Metadata } from 'next';
import { Upload, FileCheck, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Upload Audit Supporting Documents via SOQS | SARS Guide",
  description: "Step-by-step guide to uploading supporting documents for SARS tax audits, verification, and compliance cases online via SOQS.",
  alternates: {
    canonical: `${SITE_URL}/sars-supporting-documents-upload-guide`,
  },
  openGraph: {
    title: "Upload Audit Supporting Documents via SOQS",
    description: "Submit tax audit files and verification documents directly to SARS online.",
    url: `${SITE_URL}/sars-supporting-documents-upload-guide`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Upload Supporting Documents SOQS" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Open the SARS Online Query System", detail: "Go to online.sars.gov.za and choose 'Submit Supporting Documents'." },
  { step: "Step 2", title: "Enter Case Number or Tax Reference", detail: "Input the specific SARS Case Number provided on your verification letter, or your 10-digit tax reference number." },
  { step: "Step 3", title: "Select Document Category", detail: "Choose the document type: IRP5 certificate, medical tax certificate, logbook, bank statements, or invoices." },
  { step: "Step 4", title: "Upload PDF / Image Files", detail: "Ensure files are unencrypted PDF/JPEG formats under 5MB per file." },
  { step: "Step 5", title: "Submit and Obtain Upload Receipt", detail: "Confirm upload and save your unique SARS case reference number for tracking." },
];

const faqs = [
  { question: "What file formats does SARS accept for document upload?", answer: "SARS accepts PDF, PNG, JPG, JPEG, DOC, and DOCX files. Files must not be password protected." },
  { question: "What happens if I submit incomplete audit documents?", answer: "Submitting incomplete documents may result in SARS disallowing claimed deductions, issuing an additional assessment, or levying understatement penalties." },
  { question: "Can My Accountant compile and upload audit packs for me?", answer: "Yes! Our tax team reviews and compiles complete audit evidence packs before uploading to ensure 100% acceptance by SARS audit officers." },
];

export default function SarsSupportingDocumentsUploadGuidePage() {
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
        badgeText="SARS Audit & Verification"
        title={
          <>
            Upload Supporting Documents <span className="text-gradient">via SOQS</span>
          </>
        }
        subtitle="Submit audit files, verification documents, and requested proof of expenditure directly to SARS online without eFiling."
        primaryCta={{ text: "Prepare Audit Pack", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Upload Audit Documents Directly to SARS"
          description="Use official SARS online channels to upload files for open verification cases or audit requests."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Upload Workflow Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Upload Audit Supporting Documents</h2>
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
