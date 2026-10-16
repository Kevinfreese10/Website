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
  title: 'Check Customs RLA Status & Documents | SARS SOQS',
  description:
    'Track the processing status of your SARS Customs Registration, Licensing, and Accreditation (RLA) application online via eFiling or SOQS.',
  alternates: {
    canonical: `${SITE_URL}/sars-customs-rla-status`,
  },
  openGraph: {
    title: 'Check Customs RLA Status & Documents | My Accountant',
    description: 'Track SARS Customs RLA licensing and importer/exporter application progress online.',
    url: `${SITE_URL}/sars-customs-rla-status`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Customs RLA Status' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Access SOQS RLA Status Portal or Log into SARS eFiling',
    detail:
      'Visit tools.sars.gov.za/sarsonlinequery/requestrlastatus or log into SARS eFiling and click "Organisations > Registration, Licensing and Accreditation (RLA) > Existing Applications".',
  },
  {
    step: 'Step 2',
    title: 'Enter Your RLA Case Number & Entity Identification',
    detail:
      'Input the unique RLA Case Reference Number issued upon submission along with your 10-digit Income Tax Reference Number or CIPC Registration Number.',
  },
  {
    step: 'Step 3',
    title: 'Review Your RLA Application Workflow Stage',
    detail:
      'Check the live status badge: "Submitted", "Assigned to Officer", "Pended – Supporting Documents Required", "Referred for Physical Site Inspection", or "Approved".',
  },
  {
    step: 'Step 4',
    title: 'Inspect RLA Inbox Letters for Deficiency Notices',
    detail:
      'Open the "Letters" tab inside the RLA dashboard to read any formal SARS query requesting updated proof of address, clearing agent mandates, or surety bonds.',
  },
  {
    step: 'Step 5',
    title: 'Download Approved Customs Registration Certificate',
    detail:
      'Once status changes to "Approved", download the official PDF Customs Client Number certificate and forward it to your clearing agent to clear detained cargo.',
  },
];

const rejectionCases = [
  {
    title: '21-Business-Day Auto-Cancellation on Pended Cases',
    desc: 'When SARS places an RLA case in "Pended – Additional Information Required", the application is automatically cancelled if the requested documents are not uploaded within 21 business days.',
  },
  {
    title: 'Bonded Warehouse & Rebate Store Site Inspections',
    desc: 'Applications for Customs Controlled Areas, Bonded Warehouses (OS/SOS), or Industrial Rebates (Schedule 3/4) remain pended until a physical SARS Customs inspection of the premises is completed.',
  },
  {
    title: 'Financial Surety / Bank Guarantee Delays',
    desc: 'Clearing agents, road hauliers (Remover of Goods in Bond), and deferment account applicants cannot move from "Conditionally Approved" to "Active" until the original bank surety is lodged.',
  },
  {
    title: 'Unresolved Income Tax or VAT Debt on Applicant Entity',
    desc: 'SARS RLA conducts an automated tax compliance check before issuing customs licenses; overdue VAT201 or ITR14 balances halt license activation.',
  },
];

const faqs = [
  {
    question: 'What is SARS Customs RLA?',
    answer:
      'RLA (Registration, Licensing and Accreditation) is the electronic SARS eFiling module that replaced manual DA 185 forms for registering importers, exporters, clearing agents, bonded warehouses, rebate manufacturers, and trade agreement exporters.',
  },
  {
    question: 'How long does a SARS Customs RLA application take to be approved?',
    answer:
      'Standard importer and exporter registrations take 3 to 10 business days when documents are compliant. Licensing applications requiring surety bonds or physical site inspections (such as bonded warehouses or rebate stores) take 21 to 60 business days.',
  },
  {
    question: 'What does "Pended for Supporting Documents" mean on RLA?',
    answer:
      'It means a SARS Customs licensing officer reviewed your application and found a discrepancy or missing document (such as an uncertified ID, expired municipal bill, or missing resolution). You must upload the corrected files via RLA or SOQS within 21 business days.',
  },
  {
    question: 'Where do I download my approved Customs Code letter on eFiling?',
    answer:
      'Log into SARS eFiling -> click "Organisations" -> "Registration, Licensing and Accreditation (RLA)" -> "Letters / Certificates" -> download the PDF notice containing your 8-digit Customs Client Number.',
  },
  {
    question: 'Can My Accountant expedite or fix a stuck Customs RLA application?',
    answer:
      'Yes! When shipments are incurring port demurrage and storage fees at Durban, Cape Town, or OR Tambo, our customs compliance team audits the RLA rejection reasons, uploads compliant verification packs, and tracks approval daily.',
  },
];

export default function SarsCustomsRlaStatusPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Check Customs RLA Status', item: `${SITE_URL}/sars-customs-rla-status` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Check SARS Customs RLA Application Status Online',
        description: 'Step-by-step instructions to track your SARS Customs RLA registration or licensing status via SOQS and eFiling.',
        totalTime: 'PT10M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Customs RLA Application Tracking & Remediation Service',
        description: 'Professional resolution of pended or delayed SARS Customs RLA importer, exporter, and trade agreement applications.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-customs-rla-status`,
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
        badgeText="Customs RLA Application Tracking"
        title={
          <>
            Check Customs <span className="text-gradient">RLA Application Status</span>
          </>
        }
        subtitle="Track the live processing stage of your SARS Customs Registration, Licensing, and Accreditation (RLA) application and download approved Customs Client Number certificates."
        primaryCta={{ text: 'Resolve Stuck RLA Application', href: '/products/import-export-license' }}
        secondaryCta={{ text: 'Upload RLA Documents', href: '/sars-customs-rla-supporting-documents' }}
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
                RLA Worklist Path &amp; SARS SLA Times
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Standard RLA: 3–10 Business Days | Bonded/Inspection: 21–60 Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Organisations &rarr; Registration, Licensing and Accreditation (RLA) &rarr; Existing Applications / Letters
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/requestrlastatus"
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
              <CardContent className="text-sm text-muted-foreground pl-14">{s.detail}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-4">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-amber-500/40 text-amber-700 font-bold">
            Troubleshooting RLA Holds
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common Reasons RLA Applications Get Pended or Cancelled
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
          <Link href="/sars-customs-rla-supporting-documents" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Upload RLA Supporting Documents</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-customs-code-request" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Request Customs Trader Code</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-compliance-status-pin" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Request &amp; Verify SARS TCS PIN</span>
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
