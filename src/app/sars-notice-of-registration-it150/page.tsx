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
  title: 'Request IT150 Notice of Registration | SARS Online Query',
  description:
    'Download your official SARS IT150 Notice of Registration PDF online via eFiling, MobiApp, or SOQS. Essential proof of tax number for banks and employers.',
  alternates: {
    canonical: `${SITE_URL}/sars-notice-of-registration-it150`,
  },
  openGraph: {
    title: 'Request SARS IT150 Notice of Registration | My Accountant',
    description: 'Download your official SARS IT150 registration certificate PDF online in minutes.',
    url: `${SITE_URL}/sars-notice-of-registration-it150`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS IT150 Request' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Open SARS eFiling, SARS MobiApp, or SOQS Historic Notices',
    detail:
      'Log into SARS eFiling and click "SARS Registered Details > Notice of Registration" in the left menu—or visit tools.sars.gov.za/sarsonlinequery/historicnotices without logging in.',
  },
  {
    step: 'Step 2',
    title: 'Select Notice Type: Notice of Registration (IT150)',
    detail:
      'Choose Income Tax (IT150), Value-Added Tax (VAT103), or PAYE (EMP103) Notice of Registration depending on what your bank or HR department requested.',
  },
  {
    step: 'Step 3',
    title: 'Input Your 13-Digit SA ID / CIPC Reg Number & Tax Number',
    detail:
      'On SOQS, enter your South African ID number, passport number, or CIPC company registration number along with your registered contact details.',
  },
  {
    step: 'Step 4',
    title: 'Complete One-Time PIN (OTP) Security Verification',
    detail:
      'Enter the 6-digit OTP sent to the cellphone number or email address recorded on your SARS RAV01 profile.',
  },
  {
    step: 'Step 5',
    title: 'Download Stamped PDF IT150 Certificate',
    detail:
      'Click "Request New" or open the latest entry in the Notice of Registration worklist to download the official SARS-watermarked PDF showing your legal name, ID/registration number, address, and 10-digit tax reference number.',
  },
];

const rejectionCases = [
  {
    title: 'OTP Sent to Old Cellphone Number or Defunct Email',
    desc: 'SOQS cannot email or display your IT150 if your cell number or email changed. You must update your RAV01 contact details via a Registered Tax Practitioner or eBooking biometric verification.',
  },
  {
    title: 'Company Registered at CIPC But Public Officer Not Activated',
    desc: 'While CIPC automatically assigns a 10-digit income tax number upon incorporation, SARS blocks the company IT150 PDF download until a Public Officer is formally linked on RAV01.',
  },
  {
    title: 'Requesting IT150 When the Bank Actually Requires VAT103 or TCS PIN',
    desc: 'Note that IT150 proves Income Tax registration only. Proof of VAT registration is a VAT103 notice, and proof of good standing is a Tax Compliance Status (TCS) PIN letter.',
  },
  {
    title: 'Merged / Duplicate Income Tax Reference Numbers',
    desc: 'If two tax numbers were historically issued against your ID number, SARS suspends the IT150 generator until a duplicate tax number merge is completed on RAV01.',
  },
];

const faqs = [
  {
    question: 'What is a SARS IT150 Notice of Registration?',
    answer:
      'An IT150 is the official SARS confirmation certificate proving that an individual, company (Pty Ltd), or trust is registered for Income Tax in South Africa. It displays your full legal name, ID or CIPC registration number, physical address, and 10-digit tax reference number.',
  },
  {
    question: 'How fast is an IT150 Notice of Registration generated?',
    answer:
      'On SARS eFiling, the SARS MobiApp, or SOQS (when your OTP contact details are up to date), your IT150 PDF is generated instantly (within 60 seconds). If your RAV01 contact details or Public Officer must be updated first, our team delivers the IT150 within 24 hours.',
  },
  {
    question: 'What is the exact SARS eFiling path to download an IT150?',
    answer:
      'Log into SARS eFiling -> look at the left-hand sidebar under "SARS Registered Details" -> click "Notice of Registration" -> click "Request New" -> open the generated PDF.',
  },
  {
    question: 'Can I get my IT150 on WhatsApp?',
    answer:
      'Yes! Save the official SARS WhatsApp number (0800 11 7277), send "Hi", select option "Request Notice of Registration", and verify with your ID number and OTP from your registered cellphone number.',
  },
  {
    question: 'Can My Accountant pull my company or personal IT150 if I am locked out of eFiling?',
    answer:
      'Yes! When you appoint us via our R250 SARS Registered Representative service, we update your RAV01 contact details, activate your company Public Officer, and email your official PDF IT150 Notice of Registration within 24 hours.',
  },
];

export default function SarsNoticeOfRegistrationIt150Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Request IT150 Notice of Registration', item: `${SITE_URL}/sars-notice-of-registration-it150` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Download Your SARS IT150 Notice of Registration Online',
        description: 'Step-by-step instructions to request and download an official SARS IT150 Notice of Registration PDF via eFiling or SOQS.',
        totalTime: 'PT5M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS IT150 Notice of Registration & RAV01 Profile Update Service',
        description: 'Rapid retrieval of official SARS IT150 Notices of Registration for individuals and companies, including RAV01 contact and Public Officer updates.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-notice-of-registration-it150`,
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
        badgeText="SARS Official Documentation (IT150)"
        title={
          <>
            Request SARS <span className="text-gradient">IT150 Registration Notice</span>
          </>
        }
        subtitle="Download your official stamped SARS Notice of Registration (IT150) PDF for FICA bank verification, new employment onboarding, and company account opening."
        primaryCta={{ text: 'Get IT150 & Activate Rep (R250)', href: '/products/sars-registered-representative-appointment' }}
        secondaryCta={{ text: 'Find My Tax Number', href: '/sars-tax-number-query' }}
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
                Exact eFiling Download Path &amp; Turnaround
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>eFiling / SOQS: Instant (60s) | RAV01 Recovery: 24 Hours</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              SARS Registered Details &rarr; Notice of Registration &rarr; Request New &rarr; View PDF
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/historicnotices/"
          title="Download Your SARS IT150 Notice of Registration"
          description="Use the official SARS online query system to issue your official tax registration document directly."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            IT150 Request Steps
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Request Your IT150 Document</h2>
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
            Troubleshooting IT150 Errors
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Common Reasons You Can’t Download Your SARS IT150
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Registration Guides &amp; Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/sars-registered-representative-appointment" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Appoint Public Officer / Get IT150</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/products/new-company-registration" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>New Pty Ltd Registration (R650)</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-tax-number-query" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>What’s My SARS Tax Number?</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-representative-appointment" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Appoint Tax Representative Guide</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-tax-compliance-status-pin" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Request &amp; Verify SARS TCS PIN</span>
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
