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
  title: 'Submit Customs RLA Supporting Documents | SARS SOQS',
  description:
    'Submit required verification documents for SARS Customs Registration, Licensing, and Accreditation (RLA) online via SOQS or eFiling.',
  alternates: {
    canonical: `${SITE_URL}/sars-customs-rla-supporting-documents`,
  },
  openGraph: {
    title: 'Submit Customs RLA Supporting Documents | My Accountant',
    description: 'Upload Customs RLA supporting files and verification documents online.',
    url: `${SITE_URL}/sars-customs-rla-supporting-documents`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Customs RLA Supporting Docs Upload' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Open the SOQS RLA Document Upload Portal or eFiling',
    detail:
      'Navigate to tools.sars.gov.za/sarsonlinequery/SubmitRLADocuments or log into SARS eFiling and open "Organisations > Registration, Licensing and Accreditation (RLA) > Supporting Documents".',
  },
  {
    step: 'Step 2',
    title: 'Enter Your RLA Case Number & Upload Token',
    detail:
      'Input the exact RLA Case Reference Number printed on your SARS Customs "Request for Additional Information" letter.',
  },
  {
    step: 'Step 3',
    title: 'Compile the 5 Mandatory FICA & Customs Exhibits',
    detail:
      'Prepare: (1) CIPC CoR14.3, (2) Stamped bank confirmation letter (< 90 days old), (3) Municipal utility bill or signed lease agreement for physical premises, (4) Certified ID of Public Officer, and (5) Signed Company Resolution.',
  },
  {
    step: 'Step 4',
    title: 'Upload Unencrypted PDFs Under 5MB Per File',
    detail:
      'Attach each PDF to its matching document category slot. Ensure no PDF is password-protected or exceeds the 5MB file size limit (50MB total upload cap).',
  },
  {
    step: 'Step 5',
    title: 'Submit & Save Official SARS Receipt Confirmation',
    detail:
      'Click "Submit to SARS" to release your pended RLA case back into the Customs Officer review queue (reviewed within 3–7 business days).',
  },
];

const rejectionCases = [
  {
    title: 'Utility Bill Not in the Company’s Registered Legal Name',
    desc: 'If your business rents premises or operates from a director’s residential property, uploading a utility bill in the landlord’s or director’s name without a signed Lease Agreement or SARS CRA01 Address Confirmation form triggers immediate rejection.',
  },
  {
    title: 'Password-Protected Bank Statements or >5MB Scans',
    desc: 'Automated bank statements with PDF open-passwords cannot be opened by SARS Customs workflow viewers, causing the officer to reject the upload as unreadable.',
  },
  {
    title: 'Missing Board Resolution Authorizing the Applicant',
    desc: 'Every corporate RLA application must include a signed Board Resolution on company letterhead explicitly authorizing the Public Officer or representative to apply for Customs registration.',
  },
  {
    title: 'Expired 21-Business-Day Upload Link',
    desc: 'Once an RLA case passes 21 business days in "Pended" status without a complete upload, the SOQS upload token expires and a fresh RLA application must be lodged.',
  },
];

const faqs = [
  {
    question: 'What documents are required for a SARS Customs RLA Importer or Exporter registration?',
    answer:
      'You must upload: (1) CIPC CoR14.3 registration certificate, (2) Bank account confirmation letter (< 3 months old), (3) Proof of physical business address (utility bill or lease + CRA01), (4) Certified ID of the Public Officer and directors, and (5) a signed Board Resolution.',
  },
  {
    question: 'How long after uploading RLA supporting documents does SARS approve the Customs Code?',
    answer:
      'Once all required supporting documents are uploaded against an open RLA case number, SARS Customs typically reviews and approves the registration within 3 to 7 business days.',
  },
  {
    question: 'What if my business operates from home or a shared co-working office?',
    answer:
      'If the municipal rates/electricity account is in the homeowner’s or landlord’s name, you must upload BOTH the utility bill (< 3 months old) AND either a signed Lease Agreement or a completed SARS CRA01 (Confirmation of Residential/Business Address) form.',
  },
  {
    question: 'What file formats and sizes are accepted on the RLA upload portal?',
    answer:
      'SARS accepts unencrypted PDF, JPG, PNG, and DOC/DOCX files up to 5MB per individual document and up to 50MB in total per submission.',
  },
  {
    question: 'Can My Accountant prepare the Board Resolution and upload the RLA pack for us?',
    answer:
      'Yes! We draft your Customs Board Resolution, verify your CRA01 address proof, strip PDF encryption, and upload the complete RLA verification pack directly to SARS.',
  },
];

export default function SarsCustomsRlaSupportingDocumentsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Submit Customs RLA Supporting Documents', item: `${SITE_URL}/sars-customs-rla-supporting-documents` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Submit SARS Customs RLA Supporting Documents Online',
        description: 'Step-by-step instructions to upload verification files for a pended SARS Customs RLA application.',
        totalTime: 'PT15M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Customs RLA Document Audit & Upload Service',
        description: 'Professional pre-audit and submission of SARS Customs RLA supporting documents, CRA01 forms, and corporate resolutions.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-customs-rla-supporting-documents`,
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
        badgeText="Customs RLA Document Upload"
        title={
          <>
            Submit Customs RLA <span className="text-gradient">Supporting Documents</span>
          </>
        }
        subtitle="Upload required verification files, bank confirmation letters, CRA01 address proofs, and board resolutions for open SARS Customs RLA applications."
        primaryCta={{ text: 'Get RLA Licensing Help', href: '/products/import-export-license' }}
        secondaryCta={{ text: 'Check RLA Status', href: '/sars-customs-rla-status' }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider">
                eFiling Navigation &amp; Turnaround
              </Badge>
              <h2 className="text-xl md:text-2xl font-black text-foreground">
                RLA Upload Path &amp; Review SLA
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Post-Upload Review: 3–7 Business Days (21-Day Expiry Window)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Organisations &rarr; RLA &rarr; Existing Applications &rarr; Supporting Documents Upload
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/SubmitRLADocuments"
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
              <CardContent className="text-sm text-muted-foreground pl-14">{s.detail}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-4">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-amber-500/40 text-amber-700 font-bold">
            Document Rejection Triggers
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Why SARS Customs Rejects Uploaded RLA Documents
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Customs Guides &amp; Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/import-export-license" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Import / Export License Package</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-customs-code-request" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Request Customs Trader Code</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-customs-rla-status" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Track Customs RLA Status</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-supporting-documents-upload-guide" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>General SOQS Document Upload</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-representative-appointment" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Appoint Public Officer (RAV01)</span>
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
