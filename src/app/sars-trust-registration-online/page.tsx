import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, FileText, HelpCircle, CheckCircle2, ShieldCheck, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Register a New Trust with SARS via SOQS | Online Guide",
  description: "Register a family, testamentary, or trading trust with SARS online via SOQS. Submit IT77T registration, Letters of Authority, and beneficial ownership documents.",
  alternates: {
    canonical: `${SITE_URL}/sars-trust-registration-online`,
  },
  openGraph: {
    title: "Register a New Trust with SARS via SOQS",
    description: "Step-by-step DIY guide to registering a trust for income tax with SARS online.",
    url: `${SITE_URL}/sars-trust-registration-online`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Trust Registration Online" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Open the SOQS Trust Registration Portal", detail: "Navigate to tools.sars.gov.za/sarsonlinequery/trustregistration/ once the Master of the High Court has issued your official Letters of Authority." },
  { step: "Step 2", title: "Capture Trust & Master's Reference Details", detail: "Input the exact Trust Name as registered on the Trust Deed, the Master's Office Reference Number (e.g., IT1234/2026), Trust classification (Inter Vivos, Testamentary, Bewind, or Special Trust), and physical address." },
  { step: "Step 3", title: "Nominate the Representative Taxpayer (Main Trustee)", detail: "Enter the ID number and personal 10-digit SARS tax reference number of the Main Trustee appointed by a unanimous Trustee Resolution to act as the trust's Representative Taxpayer." },
  { step: "Step 4", title: "Upload Mandatory Trust & Beneficial Ownership Pack", detail: "Attach the Master's Letters of Authority, executed Trust Deed (or Last Will & Testament for a Testamentary Trust), signed Trustee Resolution appointing the Main Trustee, FICA IDs and proof of address for all trustees/founders/beneficiaries, and the Main Trustee's biometric ID selfie." },
  { step: "Step 5", title: "Receive 10-Digit Trust Tax Number & Link ITR12T", detail: "Once SARS verifies the submission (within 21 business days), download your IT150 Notice of Registration and activate the Trust on eFiling for annual ITR12T and IT3(t) third-party distribution reporting." },
];

const rejectionCases = [
  {
    title: "Submitting a Trust Deed Without Master's Letters of Authority",
    detail: "A signed inter vivos Trust Deed has no legal standing with SARS until the Master of the High Court issues stamped Letters of Authority (J170)."
  },
  {
    title: "Missing Unanimous Trustee Resolution Appointing the Main Trustee",
    detail: "Unless the Trust Deed explicitly authorizes a single trustee to represent the trust unilaterally, SARS rejects registrations that lack a resolution signed by every trustee listed on the Letters of Authority."
  },
  {
    title: "Incomplete Beneficial Ownership Disclosures (Founder, Trustees & Beneficiaries)",
    detail: "Under strict FATF and SARS anti-money-laundering rules, you must capture the full identity and tax reference numbers of the Founder/Donor, all Trustees, and all named Beneficiaries—or the registration will stall."
  }
];

const faqs = [
  { question: "Is SARS tax registration mandatory for dormant or passive family trusts?", answer: "Yes. Every trust registered with the Master of the High Court in South Africa must register for Income Tax with SARS and submit annual ITR12T returns, even if the trust holds only a primary residence or is completely dormant." },
  { question: "What documents are required to register a trust with SARS via SOQS?", answer: "You need the Master's Letters of Authority, the registered Trust Deed (or Will), a Trustee Resolution appointing the Main Trustee, certified ID copies and proof of address for all trustees, founders, and named beneficiaries, trust bank confirmation (if open), and the Main Trustee's ID selfie." },
  { question: "How long does SARS take to issue a Trust Income Tax reference number?", answer: "SARS takes between 7 and 21 business days to verify the Master's Letters of Authority and trustee beneficial ownership pack before issuing the 10-digit Trust Income Tax reference number." },
  { question: "What are the new SARS IT3(t) reporting rules for South African trusts?", answer: "Trustees are legally required to submit electronic IT3(t) third-party data declarations to SARS by 30 September each year detailing all amounts vested in or distributed to beneficiaries during the tax year, in addition to the annual ITR12T trust tax return." },
  { question: "Can My Accountant register our trust with SARS and handle annual ITR12T / IT3(t) filings?", answer: "Yes! We manage end-to-end SARS trust registrations, Main Trustee appointments, Master's Beneficial Ownership registers, IT3(t) third-party submissions, and annual ITR12T trust tax returns." },
];

export default function SarsTrustRegistrationOnlinePage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guide', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Register a New Trust with SARS Online', item: `${SITE_URL}/sars-trust-registration-online` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Register a Trust for Income Tax with SARS Online via SOQS',
        description: 'Step-by-step instructions to submit Master of the High Court Letters of Authority, Trust Deeds, and Main Trustee resolutions to SARS.',
        step: diySteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Trust Tax Registration & ITR12T / IT3(t) Compliance',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: 'ZA',
        serviceType: 'Trust Tax & Fiduciary Compliance',
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
        badgeText="Trust Tax Compliance"
        title={
          <>
            Register a New Trust <span className="text-gradient">with SARS Online</span>
          </>
        }
        subtitle="Submit trust income tax registration, Letters of Authority, and trustee beneficial ownership documentation online via the SARS query system."
        primaryCta={{ text: "Register Trust Tax Account", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/trustregistration/"
          title="Submit a SARS Trust Registration Query"
          description="Use official SARS digital channels to register your trust for tax and submit required Master's court documentation."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Trust Registration Steps
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Register a Trust with SARS Online</h2>
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
                Trust Registration &amp; Filing Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong>SOQS Trust Tax Number Turnaround:</strong> 7 to 21 business days after uploading Letters of Authority and trustee FICA.</p>
              <p><strong>Annual IT3(t) Distribution Submission:</strong> Due by 30 September each year.</p>
              <p><strong>Annual ITR12T Trust Tax Return:</strong> Due by mid-January following the end of the assessment year.</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Common Trust Registration Rejections
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
        <h2 className="text-xl font-bold text-foreground">Related Fiduciary &amp; Representative Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/sars-tax-representative-appointment" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Appoint Main Trustee / Tax Representative</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-deceased-estate-reporting" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Report a Deceased Estate &amp; Testamentary Trust</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-donations-tax-it144-declaration" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Donations Tax (IT144) &amp; Section 7C Trust Loans</span>
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
