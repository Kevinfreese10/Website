import { Metadata } from 'next';
import { FileCheck, Search, ShieldAlert, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Tax Return Status & Verification Tracker | SARS Online Query",
  description: "Track the submission, audit selection, verification, and refund status of your SARS tax return online.",
  alternates: {
    canonical: `${SITE_URL}/sars-tax-return-status-dashboard`,
  },
  openGraph: {
    title: "Tax Return Status & Verification Tracker",
    description: "Track your SARS return audit and refund progress online.",
    url: `${SITE_URL}/sars-tax-return-status-dashboard`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Return Status Tracker" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and select 'Tax Return Status Tracker'." },
  { step: "Step 2", title: "Input Tax Reference & ID Details", detail: "Enter your tax reference number, SA ID number, and security verification details." },
  { step: "Step 3", title: "Select Assessment Year", detail: "Choose the relevant tax year (e.g. 2024, 2025, or 2026)." },
  { step: "Step 4", title: "View Status Dashboard", detail: "Review live status indicators: Return Submitted, Selected for Audit/Verification, Documents Required, Assessment Finalized, or Refund Paid." },
  { step: "Step 5", title: "Take Necessary Follow-up Action", detail: "If selected for audit, upload requested supporting documents promptly to avoid assessment delays." },
];

const faqs = [
  { question: "What does 'Selected for Verification' mean on SARS?", answer: "It means SARS automated risk engines selected your return to verify supporting documents (e.g., IRP5, medical aid certificate, logbook) against claimed numbers." },
  { question: "How long does a SARS audit verification take?", answer: "SARS turnaround time is 21 business days from the date all correct supporting documents are uploaded." },
  { question: "Can My Accountant assist with SARS audit submission?", answer: "Yes! Our tax team prepares audit packs, checks proof of expenditure, and submits official dispute responses or audit files directly to SARS." },
];

export default function SarsTaxReturnStatusDashboardPage() {
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
        badgeText="Tax Return Tracking & Verification"
        title={
          <>
            Tax Return Status &amp; <span className="text-gradient">Verification Tracker</span>
          </>
        }
        subtitle="Track your income tax return progress, audit status, verification requests, and refund payouts in real time."
        primaryCta={{ text: "Resolve SARS Audit", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/visualdashboard"
          guideUrl="https://www.sars.gov.za/types-of-tax/personal-income-tax/"
          title="Track Your Tax Return Status Directly"
          description="Check official SARS live updates on your tax return, verification status, and pending refund payments."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Tracking Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Track Your Return Status Online</h2>
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
