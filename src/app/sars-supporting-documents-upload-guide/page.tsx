import { Metadata } from 'next';
import Link from 'next/link';
import { Upload, FileCheck, HelpCircle, ShieldCheck, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
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
  { step: "Step 1", title: "Locate Your Exact SARS Case Number", detail: "Open your SARS Verification or Audit Notification letter to extract the specific Case Number (or open SARS eFiling → Returns → Returns History → Supporting Documents)." },
  { step: "Step 2", title: "Access the SOQS Supporting Documents Portal", detail: "Navigate to tools.sars.gov.za/sarsonlinequery/suppdocs when uploading files in response to a case letter without logging into eFiling." },
  { step: "Step 3", title: "Prepare Unencrypted, Indexed PDF Schedules", detail: "Consolidate related vouchers (e.g., Section 18A certificates, medical out-of-pocket receipts, SARS travel logbook, or VAT201 top-5 tax invoices) into clear PDFs under 5MB per file." },
  { step: "Step 4", title: "Upload & Verify Every File Status", detail: "Attach each PDF and verify that its status changes to 'Uploaded' before clicking the final 'Submit to SARS' button. Leaving files in 'Saved' state does not close the verification request." },
  { step: "Step 5", title: "Retain the Official Upload Acknowledgement", detail: "Download the SARS confirmation receipt showing the exact date and timestamp of submission—this proves compliance with the 21-business-day deadline under Section 46 of the Tax Administration Act." },
];

const rejectionCases = [
  {
    title: "Uploading Password-Protected Bank Statements or IRP5s",
    detail: "SARS document scanners cannot open encrypted PDFs. Uploading a password-protected bank statement results in an automatic 'Invalid Document' rejection and an upward additional assessment."
  },
  {
    title: "Submitting Accounting Ledgers Without Underlying Tax Invoices",
    detail: "For VAT201 and ITR14 verifications, uploading a Xero or Sage general ledger dump without the corresponding Section 20 valid tax invoices (showing both supplier and recipient VAT numbers) leads to immediate input VAT disallowance."
  },
  {
    title: "Clicking 'Upload' Without Clicking 'Submit to SARS'",
    detail: "On both eFiling and SOQS, uploading files into the document group only stages them. If you do not click the final 'Submit to SARS' button, the audit timer expires after 21 business days as a non-response."
  }
];

const faqs = [
  { question: "What file formats and size limits apply to SARS document uploads?", answer: "SARS accepts PDF, PNG, JPG, JPEG, DOC, and DOCX files up to 5MB per individual file and a maximum of 20 files per submission group. All files must be unencrypted." },
  { question: "How many days do I have to upload supporting documents after a SARS verification letter?", answer: "You have 21 business days from the date of the SARS verification demand letter to upload all requested supporting documents, failing which SARS will issue a revised assessment disallowing your claims." },
  { question: "What happens if my supporting documents link on eFiling has expired or closed?", answer: "If the 21-business-day window expires and SARS issues an Additional Assessment (ITA34/VAT217), you can no longer use the standard supporting documents link—you must lodge a formal Request for Correction (RFC) or Notice of Objection (NOO1)." },
  { question: "What specific documents are required for a SARS VAT201 refund verification?", answer: "SARS typically requires the VAT201 computation schedule, the 5 largest tax invoices for Output Tax and Input Tax meeting Section 20 requirements, 3 months of bank statements, and a signed confirmation of business activity." },
  { question: "Can My Accountant compile and upload SARS audit packs for me?", answer: "Yes. Our tax practitioners pre-audit every invoice, travel logbook, and reconciliation schedule for strict statutory compliance before uploading to ensure first-time acceptance by SARS auditors." },
];

export default function SarsSupportingDocumentsUploadGuidePage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guide', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Upload Supporting Documents via SOQS', item: `${SITE_URL}/sars-supporting-documents-upload-guide` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Upload Audit Supporting Documents to SARS via SOQS',
        description: 'Step-by-step instructions to prepare and submit verification and audit files to SARS online.',
        step: diySteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Verification & Audit Pack Compilation',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: 'ZA',
        serviceType: 'Tax Audit Representation',
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
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/suppdocs"
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

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                SARS Audit Review Turnaround Times
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong>Taxpayer Submission Window:</strong> 21 business days from the date of the SARS verification letter.</p>
              <p><strong>SARS Verification Completion:</strong> 21 business days from the date all complete supporting documents are submitted.</p>
              <p><strong>In-Depth Field/Desk Audit:</strong> Up to 90 business days (with mandatory progress reports every 90 days under Section 42).</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Common Document Rejection Triggers
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Verification &amp; Dispute Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/sars-tax-return-status-dashboard" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Track SARS Return &amp; Verification Status</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-tax-refund" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Unblock Delayed SARS Tax Refunds</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/products/sars-objection-and-appeal" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Lodge a Formal SARS Objection (NOO1)</span>
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
