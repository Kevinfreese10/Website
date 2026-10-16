import { Metadata } from 'next';
import Link from 'next/link';
import { UserCheck, Building2, HelpCircle, CheckCircle2, FileText, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: { absolute: "SARS Tax Representative Appointment Guide (2026)" },
  description: "Appoint or update a registered tax representative or Public Officer for a company, trust, or individual with SARS online via SOQS.",
  alternates: {
    canonical: `${SITE_URL}/sars-tax-representative-appointment`,
  },
  openGraph: {
    title: "SARS Tax Representative Appointment Guide (2026)",
    description: "Update official Public Officer and Tax Representative details with SARS online.",
    url: `${SITE_URL}/sars-tax-representative-appointment`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Appoint SARS Representative" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Open the SOQS Registered Representative Portal", detail: "Navigate to tools.sars.gov.za/sarsonlinequery/RegisteredRepresentative (or inside SARS eFiling → Organisations → Register New → Maintain SARS Registered Details / RAV01)." },
  { step: "Step 2", title: "Capture Entity & Proposed Public Officer Details", detail: "Enter the company CIPC registration number (or Trust Master's number), the entity's 10-digit Income Tax number, and the personal ID and tax reference number of the proposed Public Officer." },
  { step: "Step 3", title: "Select the Statutory Representative Capacity", detail: "Select 'Public Officer' for a Private/Public Company or Close Corporation, 'Main Trustee' for a Trust, or 'Executor' for a Deceased Estate." },
  { step: "Step 4", title: "Upload Mandatory FICA, CIPC & Resolution Pack", detail: "Attach the CIPC CoR14.3 / CoR39 certificate, signed Board Resolution appointing the Public Officer, acceptance of appointment letter, proof of residential address, and a high-resolution selfie of the representative holding their ID and a handwritten note reading 'Update my details' with the current date." },
  { step: "Step 5", title: "Activate Representative Rights on eFiling", detail: "Once SARS approves the case (within 21 business days) and updates the RAV01 container, log in to eFiling → Organisations → Request Tax Type Transfer to unlock full filing and banking maintenance rights." },
];

const rejectionCases = [
  {
    title: "Missing or Illegible 'Update My Details' ID Selfie",
    detail: "SARS strictly enforces biometric anti-fraud verification for all Registered Representative applications. Omitting the photo of the Public Officer holding their original ID next to their face and a dated handwritten note causes immediate rejection."
  },
  {
    title: "Appointing a Non-Resident Without a South African Residential Address",
    detail: "Under Section 246(2) of the Tax Administration Act, a company's Public Officer must be an individual residing in the Republic of South Africa."
  },
  {
    title: "Personal Tax Non-Compliance of the Proposed Public Officer",
    detail: "If the director being appointed as Public Officer does not have an active personal Income Tax number or has an unverified personal RAV01 profile, SARS cannot link them as the entity's Registered Representative."
  }
];

const faqs = [
  { question: "What is a SARS Public Officer and why is it mandatory?", answer: "Under Section 246 of the Tax Administration Act, every company carrying on business in South Africa must appoint a resident individual as its Public Officer within 1 month of incorporation. Without an active Public Officer linked on RAV01, you cannot activate VAT, PAYE, or update company bank details on eFiling." },
  { question: "How long does SARS take to approve a Registered Representative appointment?", answer: "SARS takes up to 21 business days to verify the CIPC CoR14.3 certificate, board resolution, and biometric ID selfie submitted via SOQS before activating the Public Officer on the RAV01 profile." },
  { question: "What documents are required to appoint a SARS Public Officer online?", answer: "You need the CIPC CoR14.3 or CoR39 disclosure certificate, a signed Directors' Resolution appointing the Public Officer, certified ID copy, a selfie holding the ID and a note stating 'Update my details' with today's date, and proof of residential address." },
  { question: "What is the difference between a Public Officer and a Tax Practitioner on eFiling?", answer: "The Public Officer is the statutory officer of the company (usually a resident director) who holds legal accountability, whereas a Registered Tax Practitioner (SAIT/SAICA) is appointed via shared eFiling access to prepare and submit returns on the company's behalf." },
  { question: "Can My Accountant handle our SARS Public Officer update or act as resident Public Officer?", answer: "Yes! We prepare and lodge complete SOQS Registered Representative packs to unlock blocked eFiling profiles, and we also provide dedicated Resident Public Officer services for foreign-owned South African subsidiaries." },
];

export default function SarsTaxRepresentativeAppointmentPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guide', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'SARS Tax Representative Appointment', item: `${SITE_URL}/sars-tax-representative-appointment` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Appoint a SARS Registered Representative or Public Officer Online',
        description: 'Step-by-step instructions to appoint a Public Officer or Main Trustee on SARS via SOQS and RAV01.',
        step: diySteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Public Officer & Registered Representative Appointment',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: 'ZA',
        serviceType: 'Corporate Tax Governance',
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
        badgeText="Corporate Tax Governance"
        title={
          <>
            Appoint Registered <span className="text-gradient">Tax Representative</span>
          </>
        }
        subtitle="Appoint or update a Public Officer, Representative Taxpayer, or accredited Tax Practitioner for your business or trust."
        primaryCta={{ text: "Appoint Tax Representative", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/RegisteredRepresentative"
          title="Appoint a Tax Representative / Public Officer Online"
          description="Use official SARS digital query portals to submit company resolutions, CIPC certificates, and representative appointments."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Appointment Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Appoint a SARS Representative</h2>
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
                Statutory Deadlines &amp; Turnaround
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong>Statutory Appointment Window:</strong> Within 1 month after company incorporation or commencing business under Section 246 of the TAA.</p>
              <p><strong>SARS SOQS Verification Time:</strong> 7 to 21 business days from receipt of complete FICA and resolution documents.</p>
              <p><strong>RAV01 Update Notification:</strong> Instant email confirmation once the case officer approves the link.</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Why SARS Rejects Public Officer Updates
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
        <h2 className="text-xl font-bold text-foreground">Related Corporate Tax &amp; Registration Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/products/appoint-public-officer" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Appoint SARS Public Officer Service</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/products/vat-registration" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>SARS VAT Registration (Requires Public Officer)</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-trust-registration-online" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Register a Trust &amp; Main Trustee with SARS</span>
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
