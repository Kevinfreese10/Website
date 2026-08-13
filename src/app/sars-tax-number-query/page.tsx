import { Metadata } from 'next';
import { Search, CheckCircle2, FileText, UserCheck, ShieldCheck, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "What's My SARS Tax Reference Number? | SARS Online Query Guide",
  description: "Find or retrieve your lost SARS tax reference number online. Step-by-step DIY guide using the SARS Online Query System (SOQS) for individuals and companies.",
  alternates: {
    canonical: `${SITE_URL}/sars-tax-number-query`,
  },
  openGraph: {
    title: "What's My SARS Tax Reference Number? | SOQS Guide",
    description: "Learn how to look up your 10-digit South African tax number online without visiting a SARS branch.",
    url: `${SITE_URL}/sars-tax-number-query`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Tax Number Query" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Visit the Official SARS Online Query System", detail: "Go to online.sars.gov.za or access via the official SARS Digital Channels portal." },
  { step: "Step 2", title: "Select 'What's My Tax Number?'", detail: "Choose the individual or entity option from the main query menu." },
  { step: "Step 3", title: "Enter Your ID / Passport / Company Reg Number", detail: "Input your 13-digit South African ID number, passport number, or CIPC company registration number along with your full legal name." },
  { step: "Step 4", title: "Complete Security Verification", detail: "Provide your registered mobile number or email address to receive a one-time PIN (OTP)." },
  { step: "Step 5", title: "Receive Tax Number via SMS/Email", detail: "Once verified, SARS will immediately send your 10-digit tax reference number to your verified contact details." },
];

const faqs = [
  { question: "How many digits is a SARS tax reference number?", answer: "A SARS individual or company tax reference number consists of 10 digits starting with 0, 1, 2, 3, or 9." },
  { question: "Can I get my tax number if my contact details changed?", answer: "If your mobile number or email address on SARS record is outdated, the OTP will fail. You can request My Accountant to update your RAV01 profile and retrieve your tax number on your behalf." },
  { question: "Is a tax number automatically issued when starting employment?", answer: "Yes, employers usually register employees auto-registered via SARS eFiling, but you can confirm your registration number using SOQS." },
];

export default function SarsTaxNumberQueryPage() {
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
        badgeText="SARS Tax Reference Number Lookup"
        title={
          <>
            What's My <span className="text-gradient">SARS Tax Number?</span>
          </>
        }
        subtitle="Quickly retrieve your lost or forgotten 10-digit SARS income tax reference number online using the official SARS Query System."
        primaryCta={{ text: "Get Accountant Assistance", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Query Your SARS Tax Reference Number Directly"
          description="Use the official SARS online portal to request your individual or company tax number via SMS or email."
        />
      </section>

      {/* DIY Steps */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Step-by-Step Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Retrieve Your SARS Tax Number DIY</h2>
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

      {/* FAQs */}
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
