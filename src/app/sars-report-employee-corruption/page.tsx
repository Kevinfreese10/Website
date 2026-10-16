import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ShieldAlert, HelpCircle, CheckCircle2, Lock, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Report SARS Employee Corruption & Misconduct | SOQS",
  description: "Anonymously report extortion, bribery, audit solicitation, or misconduct by SARS officials directly to SARS Anti-Corruption and Law Enforcement.",
  alternates: {
    canonical: `${SITE_URL}/sars-report-employee-corruption`,
  },
  openGraph: {
    title: "Report SARS Employee Corruption & Misconduct",
    description: "Submit confidential anti-corruption and misconduct reports to SARS online.",
    url: `${SITE_URL}/sars-report-employee-corruption`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Report SARS Corruption" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Anti-Corruption Portal or Hotline", detail: "Navigate to tools.sars.gov.za/sarsonlinequery/ACReporting or phone the independent toll-free SARS Anti-Corruption Hotline on 0800 00 2870. Do not respond directly to suspicious personal emails or WhatsApp messages from purported officials." },
  { step: "Step 2", title: "Select Anonymous Whistleblowing or Protected Disclosure", detail: "Elect whether to lodge a 100% anonymous disclosure or provide confidential contact details protected under the Protected Disclosures Act 26 of 2000." },
  { step: "Step 3", title: "Document Specific Official & Case Identifiers", detail: "Record the SARS official's full name, S-number (employee number), SARS branch office or customs port of entry, eFiling audit case reference number, and exact date/time of the improper solicitation." },
  { step: "Step 4", title: "Attach Unaltered Contemporaneous Evidence", detail: "Upload unedited email headers, WhatsApp chat exports, call logs, bank account details provided for bribes, or written demands to manipulate an ITA34/VAT201 assessment." },
  { step: "Step 5", title: "Escalate Concurrent Audit Disputes Formally", detail: "Obtain your SARS Internal Integrity Unit reference number and simultaneously appoint a registered tax practitioner to take over formal audit correspondence on eFiling so your legitimate tax position is protected." },
];

const rejectionCases = [
  {
    title: "Paying 'Informal Facilitation Fees' to Clear Debt",
    detail: "Any payment made outside of an official 19-digit SARS Payment Reference Number (PRN) into a personal or third-party bank account never clears your SARS ledger—leaving the full tax debt, interest, and criminal liability intact."
  },
  {
    title: "Confusing Aggressive Audit Verification with Corruption",
    detail: "Demanding strict Section 46 third-party verifications or disallowing unsubstantiated expenses is lawful SARS audit conduct; those grievances must be challenged via a formal NOO1 dispute or the Office of the Tax Ombud rather than the anti-corruption unit."
  },
  {
    title: "Retaliatory Audit Fear Blocking Valid Objections",
    detail: "Taxpayers often miss the strict 80-business-day objection deadline while waiting for an integrity investigation to conclude. Formal Chapter 9 dispute timelines run independently of internal misconduct probes."
  }
];

const faqs = [
  { question: "Is whistleblowing on SARS employee corruption completely anonymous?", answer: "Yes. SARS utilizes independent anti-corruption reporting channels and isolated Internal Integrity Unit queues ensuring your personal and corporate tax profiles are shielded from the reported official." },
  { question: "What constitutes SARS employee corruption or misconduct?", answer: "Soliciting bribes or kickbacks to erase tax debt, offering to expedite or cancel a VAT/Income Tax audit in exchange for money, unauthorized browsing or leaking of taxpayer records, and customs clearance extortion." },
  { question: "Does reporting a corrupt official pause my active SARS audit or tax debt?", answer: "No. Your statutory deadlines under the Tax Administration Act (21 business days for verification uploads or 80 business days for objections) remain legally binding unless formally extended or suspended under Section 164." },
  { question: "When should I escalate to the Office of the Tax Ombud (OTO) instead?", answer: "If a SARS official is not soliciting a bribe but is acting with extreme procedural unfairness, ignoring uploaded documents, or delaying a legitimate refund beyond systemic service standards, the Office of the Tax Ombud is the correct statutory channel." },
  { question: "Can My Accountant protect my tax compliance if an official acts improperly?", answer: "Yes. As SAIT-accredited tax practitioners, we step in as your legal representative on eFiling, demand reassignment of tainted audit cases, lodge formal Tax Ombud complaints, and defend your assessments strictly on the law." },
];

export default function SarsReportEmployeeCorruptionPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guide', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Report SARS Employee Corruption', item: `${SITE_URL}/sars-report-employee-corruption` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Report SARS Employee Corruption and Misconduct',
        description: 'Step-by-step instructions to report bribery, extortion, or audit tampering by SARS officials via SOQS.',
        step: diySteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Audit Defence & Tax Ombud Escalation',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: 'ZA',
        serviceType: 'Tax Dispute & Representation',
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
        badgeText="Anti-Corruption & Whistleblowing"
        title={
          <>
            Report SARS Employee <span className="text-gradient">Corruption &amp; Misconduct</span>
          </>
        }
        subtitle="Report extortion, bribery, unauthorized audit tampering, or illegal conduct by SARS officials through confidential and anonymous channels."
        primaryCta={{ text: "Protect Your Tax Rights", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/ACReporting"
          title="Lodge an Anonymous Corruption Report with SARS"
          description="Use official SARS anti-corruption digital channels to report bribery or official misconduct in confidence."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Reporting Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Report SARS Employee Corruption</h2>
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
                Investigation Turnaround &amp; Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p><strong>Case Reference Issuance:</strong> Immediate upon submitting the online ACReporting form or calling 0800 00 2870.</p>
              <p><strong>Internal Integrity Triage:</strong> 48 to 72 hours for active extortion or customs detention matters.</p>
              <p><strong>Statutory Audit Protection:</strong> Appointing a registered tax representative immediately routes all official audit queries through your practitioner.</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Critical Legal Pitfalls to Avoid
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
        <h2 className="text-xl font-bold text-foreground">Related SARS Guides &amp; Legal Remedies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Link href="/sars-report-digital-fraud" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Report SARS Digital Fraud &amp; Phishing</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/sars-disputes" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>SARS Objections, Appeals &amp; Audit Defence</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link href="/products/sars-objection-and-appeal" className="p-3 rounded-lg border hover:border-primary flex items-center justify-between">
            <span>Formal SARS Objection &amp; Appeal Package</span>
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
