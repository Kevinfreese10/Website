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
  title: 'Request Customs Trader Identification / Code | SARS SOQS',
  description:
    'Request or look up an 8-digit importer/exporter SARS Customs Trader Identification Code online via eFiling RLA or the SARS Online Query System.',
  alternates: {
    canonical: `${SITE_URL}/sars-customs-code-request`,
  },
  openGraph: {
    title: 'Request Customs Trader Identification / Code | My Accountant',
    description: 'Look up or register for a SARS Customs Importer/Exporter Code (RLA) online.',
    url: `${SITE_URL}/sars-customs-code-request`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Customs Trader Code Request' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Access SOQS Customs Code Lookup or SARS eFiling RLA',
    detail:
      'To retrieve an existing code, open tools.sars.gov.za/sarsonlinequery/requestcustomscode. To register a new code, log into SARS eFiling and navigate to "Organisations > Registration, Licensing and Accreditation (RLA)".',
  },
  {
    step: 'Step 2',
    title: 'Confirm Active RAV01 & Public Officer Profile',
    detail:
      'Before RLA allows you to start a new Importer/Exporter application (replacing old paper Form DA 185), your company’s Registered Representative / Public Officer must be active on RAV01.',
  },
  {
    step: 'Step 3',
    title: 'Select Client Type (Importer, Exporter, or SADC/AfCFTA)',
    detail:
      'In the RLA wizard, select "New Application", choose Importer (4A1) and/or Exporter (4A2), and optionally tick SADC, SACU-EFTA, or EUR.1 Origin Trade Agreement annexures.',
  },
  {
    step: 'Step 4',
    title: 'Upload Mandatory Customs Verification Documents',
    detail:
      'Upload CIPC CoR14.3 certificate, certified director IDs, bank confirmation letter (< 3 months old), municipal utility bill / lease for physical business premises, and a signed Board Resolution.',
  },
  {
    step: 'Step 5',
    title: 'Receive Your 8-Digit SARS Customs Client Number',
    detail:
      'Once approved (3–10 business days), download your official SARS Customs Registration Letter containing your 8-digit Customs Code to give to your freight forwarder or clearing agent (DHL, FedEx, Ziegler, DSV).',
  },
];

const rejectionCases = [
  {
    title: 'Exceeding the 3-Shipment / R150,000 Casual Code Limit',
    desc: 'Generic casual code 70707070 may only be used for up to 3 non-commercial consignments per calendar year valued under R150,000. Any 4th shipment is detained at customs until a permanent 8-digit code is issued.',
  },
  {
    title: 'Physical Address Mismatch Between RAV01, CIPC & Utility Bill',
    desc: 'SARS Customs rejects RLA applications immediately if the physical trading address on your municipal bill or lease agreement differs from the address recorded on your SARS RAV01 profile.',
  },
  {
    title: 'Missing Telkom / Fixed-Line or Contact Verification',
    desc: 'Legacy DA 185 rules required a fixed landline; under RLA, SARS verifies your registered mobile and email via OTP, and rejects applications where the Public Officer’s personal tax is non-compliant.',
  },
  {
    title: 'Non-Resident Importer Without a Registered Local Agent',
    desc: 'Foreign entities importing into South Africa must appoint a South African resident financial representative on RLA before a customs code can be issued.',
  },
];

const faqs = [
  {
    question: 'What is a SARS Customs Code (Customs Client Number)?',
    answer:
      'A SARS Customs Code is an 8-digit identification number issued under the Customs and Excise Act 91 of 1964 to companies or individuals importing or exporting commercial goods through South African seaports, airports, or land border posts.',
  },
  {
    question: 'How long does it take SARS to issue a Customs Importer/Exporter Code?',
    answer:
      'Looking up an existing Customs Code via SOQS takes 5 minutes. Registering a brand-new Importer or Exporter code on SARS eFiling RLA typically takes 3 to 10 business days if all FICA, RAV01, and address documents match.',
  },
  {
    question: 'Can I claim the 15% Import VAT charged by customs on my VAT201 return?',
    answer:
      'Yes! Provided your company is a registered VAT vendor and holds an active SARS Customs Code in its own name, the 15% Import VAT reflected on the SAD500 Bill of Entry and EDI Customs Release Notification is fully deductible as input tax on your VAT201 return.',
  },
  {
    question: 'What is the difference between a standard Exporter Code and SADC / EUR.1 registration?',
    answer:
      'A standard Exporter Code allows you to clear goods out of South Africa. Adding SADC, AfCFTA, or EUR.1 origin registration on RLA allows your foreign buyers to import South African-origin goods at 0% or reduced customs duty.',
  },
  {
    question: 'Can My Accountant register our company for an Importer and Exporter Code?',
    answer:
      'Yes! We offer a fixed-fee SARS Import/Export License package where we update your RAV01 profile, compile the Board Resolution, submit the eFiling RLA application, and deliver your official 8-digit Customs Code.',
  },
];

export default function SarsCustomsCodeRequestPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Request Customs Trader Code', item: `${SITE_URL}/sars-customs-code-request` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Request or Register a SARS Customs Importer/Exporter Code',
        description: 'Step-by-step instructions to look up an existing SARS Customs Code on SOQS or register a new code via SARS eFiling RLA.',
        totalTime: 'PT20M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Import & Export Customs Code Registration (RLA)',
        description: 'End-to-end SARS Customs RLA registration for South African importers, exporters, and SADC/EUR.1 trade origin certificates.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-customs-code-request`,
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
        badgeText="Customs & International Trade (RLA)"
        title={
          <>
            Request Customs <span className="text-gradient">Trader Code (RLA)</span>
          </>
        }
        subtitle="Retrieve an existing 8-digit SARS Customs Client Number via SOQS or register a new Importer/Exporter license to release shipments held at South African ports."
        primaryCta={{ text: 'Register Import/Export Code', href: '/products/import-export-license' }}
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
                SARS eFiling RLA Path &amp; Turnaround Times
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Code Lookup: Instant | New RLA License: 3–10 Business Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Organisations &rarr; Registration, Licensing and Accreditation (RLA) &rarr; New Application
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/requestcustomscode/"
          title="Query Your SARS Customs Code Online"
          description="Access official SARS digital channels to look up or verify existing importer/exporter customs registration codes."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Customs Request Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Request or Register a Customs Trader Code</h2>
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
            Common Customs Delays
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Why SARS Customs Rejects or Holds Importer Applications
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
          <Link href="/products/vat-registration" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>SARS VAT Registration</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-customs-rla-status" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Check Customs RLA Status</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-customs-rla-supporting-documents" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Upload RLA Supporting Docs</span>
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
