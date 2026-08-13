import { Metadata } from 'next';
import { Lock, ShieldAlert, HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Report Digital Fraud & Profile Compromise | SARS SOQS",
  description: "Report unauthorized eFiling profile changes, identity theft, or tampered banking details directly to SARS anti-fraud units.",
  alternates: {
    canonical: `${SITE_URL}/sars-report-digital-fraud`,
  },
  openGraph: {
    title: "Report Digital Fraud & Profile Compromise",
    description: "Report eFiling profile compromise, identity theft, and fraudulent refund tampering online.",
    url: `${SITE_URL}/sars-report-digital-fraud`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Report SARS Digital Fraud" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access SARS Fraud Reporting Portal", detail: "Go to online.sars.gov.za and choose 'Report Digital Fraud / Profile Compromise'." },
  { step: "Step 2", title: "Specify Fraud Incident Type", detail: "Select category: Unauthorized eFiling Profile Transfer, Fraudulent Banking Detail Changes, Phishing Scam, or Unauthorized Refund Redirection." },
  { step: "Step 3", title: "Enter Taxpayer & Incident Information", detail: "Provide 10-digit tax reference number, SA ID number, and details of suspicious activity observed." },
  { step: "Step 4", title: "Attach Evidence Files", detail: "Upload bank statements, SAPS affidavit, fraudulent email headers, or screenshot evidence." },
  { step: "Step 5", title: "Freeze Compromised Profile", detail: "SARS Fraud Unit will suspend online banking profile changes and initiate forensic account recovery." },
];

const faqs = [
  { question: "What should I do immediately if my SARS eFiling profile is hacked?", answer: "Lodge a fraud report on SOQS immediately, change your password, notify your bank, and file an affidavit at your nearest SAPS station." },
  { question: "How do fraudsters target SARS tax refunds?", answer: "Scammers manipulate eFiling profiles or register fake representative relationships to change banking details right before a refund is issued." },
  { question: "Can My Accountant help restore and secure a compromised SARS profile?", answer: "Yes! We work directly with SARS Fraud & Security units to verify your identity, restore profile control, and re-establish secure tax management." },
];

export default function SarsReportDigitalFraudPage() {
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
        badgeText="Cybersecurity & Fraud Prevention"
        title={
          <>
            Report Digital Fraud <span className="text-gradient">&amp; Profile Hijacking</span>
          </>
        }
        subtitle="Report unauthorized eFiling profile takeovers, suspicious banking detail changes, identity theft, or phishing scams directly to SARS."
        primaryCta={{ text: "Secure Compromised Account", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Lodge an Urgent Digital Fraud Report with SARS"
          description="Use official SARS digital security portals to freeze compromised profiles and report unauthorized access."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Fraud Reporting Steps
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Report Digital Tax Fraud</h2>
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
