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
  title: 'Register for Diesel Refund Scheme | SARS SOQS Guide',
  description:
    'Register for the SARS Diesel Refund Scheme (Agriculture, Forestry, Fishing & Mining) on eFiling RAV01 and claim fuel levy & RAF rebates on your VAT201 return.',
  alternates: {
    canonical: `${SITE_URL}/sars-diesel-refund-scheme-registration`,
  },
  openGraph: {
    title: 'Register for SARS Diesel Refund Scheme | My Accountant',
    description: 'Step-by-step guide to registering for SARS diesel refund claims and logbook compliance.',
    url: `${SITE_URL}/sars-diesel-refund-scheme-registration`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Diesel Refund Registration' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Verify Active SARS VAT Registration Status',
    detail:
      'Because Diesel Refunds are claimed directly on the bi-monthly VAT201 return, your entity must first hold an active 10-digit SARS VAT registration number (starting with 4).',
  },
  {
    step: 'Step 2',
    title: 'Open RAV01 on SARS eFiling or Submit via SOQS',
    detail:
      'Log into SARS eFiling -> click "SARS Registered Details (RAV01)" -> "Maintain SARS Registered Details" -> expand "Value Added Tax" -> tick "Diesel Refund" registration (or submit via tools.sars.gov.za/sarsonlinequery/DieselRefundsRegistration).',
  },
  {
    step: 'Step 3',
    title: 'Select Qualifying Primary Production Category (Part 3 of Schedule 6)',
    detail:
      'Indicate your qualifying sector under Schedule 6 Part 3 of the Customs and Excise Act: Agriculture, Forestry, Commercial Fishing/Marine, or Mining (on-land primary production).',
  },
  {
    step: 'Step 4',
    title: 'Upload Proof of Primary Production & Bulk Storage Tank Details',
    detail:
      'Attach title deeds or farm/mining lease agreements, mining permits/water-use licenses, bulk bowser/storage tank photos and calibration certificates, and wholesale diesel supplier tax invoices.',
  },
  {
    step: 'Step 5',
    title: 'Maintain Usage Logbooks & Claim on VAT201 Return (Fields 24–29)',
    detail:
      'Once SARS activates the Diesel Refund fields on your VAT201 (typically 10–21 business days), record every bulk receipt and per-equipment dispensing entry in a SARS-compliant logbook and claim the General Fuel Levy + RAF rebate on your VAT201.',
  },
];

const rejectionCases = [
  {
    title: 'Missing "Storage-to-Usage" Dispensing Logbooks',
    desc: 'SARS disallows 100% of a Diesel Refund claim if you only keep supplier purchase invoices. You must keep a contemporaneous dispensing logbook recording date, litres dispensed from the bowser, specific tractor/harvester/generator asset ID, and qualifying primary activity.',
  },
  {
    title: 'Claiming Road-Haulage or Sub-Contractor Dry-Hire Litres',
    desc: 'Diesel used in highway trucks transporting produce after harvest or diesel supplied under "dry-hire" contractor arrangements does not qualify for the primary production rebate and triggers severe audit clawbacks.',
  },
  {
    title: 'Retail Forecourt Slips vs Bulk Wholesale Tax Invoices',
    desc: 'Diesel must generally be purchased in bulk and delivered to registered storage facilities with full Section 20 tax invoices showing distillate fuel volumes in litres.',
  },
  {
    title: 'Expired Food Manufacturing Load-Shedding Sunset Window',
    desc: 'Note that the temporary two-year Food Manufacturing electricity-generation diesel refund scheme ran from 1 April 2023 to 31 March 2025; ongoing claims apply strictly to Schedule 6 primary producers (Agriculture, Forestry, Fishing, Mining) unless retrospective within the prescription window.',
  },
];

const faqs = [
  {
    question: 'Who qualifies for the ongoing SARS Diesel Refund Scheme?',
    answer:
      'Registered VAT vendors engaged in qualifying primary production activities under Note 6 of Schedule 6 Part 3 to the Customs and Excise Act—specifically commercial farming/agriculture, forestry, commercial fishing, coastal shipping, offshore mining, and onshore mining—can claim back a significant portion of the General Fuel Levy and Road Accident Fund (RAF) levy.',
  },
  {
    question: 'How much is the SARS Diesel Refund per litre?',
    answer:
      'For Agriculture, Forestry, and Mining, SARS refunds 80% of the eligible volume (40% of the General Fuel Levy plus 100% of the Road Accident Fund levy on that 80% qualifying volume), amounting to roughly R3.00+ per eligible litre of diesel consumed in primary production.',
  },
  {
    question: 'How long does SARS take to approve a Diesel Refund registration?',
    answer:
      'Once the RAV01 / VAT101D amendment and supporting farm/mining proof are uploaded via eFiling or SOQS, SARS typically takes 10 to 21 business days to verify the storage facilities and unlock the Diesel Refund fields on your VAT201 return.',
  },
  {
    question: 'What records are mandatory to survive a SARS Diesel Refund audit?',
    answer:
      'You must keep for 5 years: (1) valid wholesale diesel tax invoices and delivery notes, (2) opening and closing bulk tank dip readings, and (3) a detailed usage logbook per machine/vehicle showing exact litres dispensed, meter/hour readings, and the specific qualifying activity performed.',
  },
  {
    question: 'Can My Accountant register our farming or mining entity and manage VAT201 diesel claims?',
    answer:
      'Yes! We register agricultural, forestry, and mining clients for the SARS Diesel Refund Scheme, implement audit-proof digital diesel logbooks, and submit bi-monthly VAT201 returns and audit verification packs.',
  },
];

export default function SarsDieselRefundSchemeRegistrationPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Register for Diesel Refund Scheme', item: `${SITE_URL}/sars-diesel-refund-scheme-registration` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Register for the SARS Diesel Refund Scheme Online',
        description: 'Step-by-step instructions to register a VAT-registered agricultural, forestry, fishing, or mining business for the SARS Diesel Refund Scheme.',
        totalTime: 'PT25M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Diesel Refund Registration, Logbook Audit & VAT201 Claim Service',
        description: 'Specialist SARS Diesel Refund registration, Schedule 6 logbook setup, and VAT201 diesel rebate audit representation.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-diesel-refund-scheme-registration`,
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
        badgeText="Primary Production & Industrial Tax Rebates"
        title={
          <>
            Register for SARS <span className="text-gradient">Diesel Refund Scheme</span>
          </>
        }
        subtitle="Register your VAT-registered agricultural, forestry, fishing, or mining enterprise on SARS eFiling (RAV01) to claim Fuel Levy and RAF rebates on your VAT201 return."
        primaryCta={{ text: 'File VAT201 & Diesel Claim (R650)', href: '/products/vat201-vat-return-submission-filing' }}
        secondaryCta={{ text: 'Apply for VAT Registration', href: '/products/vat-registration' }}
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
                RAV01 Diesel Activation Path &amp; Turnaround
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Registration Approval: 10–21 Business Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              SARS Registered Details (RAV01) &rarr; Value Added Tax &rarr; Diesel Refund &rarr; Submit Supporting Docs
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/DieselRefundsRegistration"
          title="Submit a SARS Diesel Refund Registration Query"
          description="Access official SARS digital query portals to register for primary production and diesel rebate schemes."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Registration Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Register for the SARS Diesel Refund Scheme</h2>
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
            Audit Clawback Risks
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common Reasons SARS Disallows Diesel Refund Claims
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
        <h2 className="text-xl font-bold text-foreground">Related SARS VAT &amp; Rebate Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/vat201-vat-return-submission-filing" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>File VAT201 Return (R650)</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/products/vat-registration" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>SARS VAT Registration</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-vat-vendor-search-verification" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Verify Supplier VAT Numbers</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-supporting-documents-upload-guide" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Upload VAT Audit Supporting Docs</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-customs-code-request" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Customs &amp; Excise Registration</span>
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
