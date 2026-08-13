import { Metadata } from 'next';
import { FileText, Download, HelpCircle, CheckCircle2, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Request IT150 Notice of Registration | SARS Online Query",
  description: "Request an official SARS IT150 Notice of Registration document online. Essential proof of tax registration for banks, employers, and legal entities.",
  alternates: {
    canonical: `${SITE_URL}/sars-notice-of-registration-it150`,
  },
  openGraph: {
    title: "Request SARS IT150 Notice of Registration",
    description: "Download your official SARS IT150 registration certificate online.",
    url: `${SITE_URL}/sars-notice-of-registration-it150`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS IT150 Request" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Open SARS Online Query Portal", detail: "Navigate to tools.sars.gov.za/soqs or access via SARS Digital Channels." },
  { step: "Step 2", title: "Select 'Request Notice of Registration (IT150)'", detail: "Click on the IT150 document request option." },
  { step: "Step 3", title: "Provide Tax & Personal Identification Details", detail: "Enter your 10-digit income tax number and 13-digit SA ID or passport/company registration number." },
  { step: "Step 4", title: "Authenticate via OTP", detail: "Enter the OTP sent to your registered cellphone number or email address." },
  { step: "Step 5", title: "Receive & Download IT150 Document", detail: "SARS will issue your official IT150 document containing your tax details, registered address, and tax office." },
];

const faqs = [
  { question: "What is a SARS IT150 document?", answer: "An IT150 (Notice of Registration) is an official SARS confirmation letter proving that an individual, trust, or company is registered for income tax in South Africa." },
  { question: "Why do banks or employers require an IT150?", answer: "Financial institutions require an IT150 for FICA compliance, home loan applications, and opening business accounts to verify tax registration." },
  { question: "Can My Accountant obtain an IT150 if my details are outdated?", answer: "Yes. If your registered email or phone number has changed, we can update your SARS RAV01 registration details and issue your IT150 directly." },
];

export default function SarsNoticeOfRegistrationIt150Page() {
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
        badgeText="SARS Official Documentation"
        title={
          <>
            Request SARS <span className="text-gradient">IT150 Registration Notice</span>
          </>
        }
        subtitle="Obtain an official SARS Notice of Registration (IT150) document for bank accounts, loan applications, and employment verification."
        primaryCta={{ text: "Get IT150 Document", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
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
