import { Metadata } from 'next';
import { TrendingUp, CheckCircle2, AlertCircle, HelpCircle, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Check SARS Auto-Assessment Status | SARS Online Query Guide",
  description: "Check if SARS auto-assessed your personal income tax return. Learn how to review, accept, or edit auto-assessments before deadlines.",
  alternates: {
    canonical: `${SITE_URL}/sars-auto-assessment-status-check`,
  },
  openGraph: {
    title: "Check SARS Auto-Assessment Status Online",
    description: "Step-by-step DIY guide to reviewing SARS auto-assessments.",
    url: `${SITE_URL}/sars-auto-assessment-status-check`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Auto Assessment Check" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access SARS Online Query Portal or Mobile App", detail: "Go to tools.sars.gov.za/soqs or open the SARS Mobile App." },
  { step: "Step 2", title: "Select 'Auto-Assessment Status'", detail: "Click on the auto-assessment lookup utility." },
  { step: "Step 3", title: "Enter ID & Tax Reference Number", detail: "Provide your 13-digit SA ID number and 10-digit tax reference number." },
  { step: "Step 4", title: "View Auto-Assessment Results", detail: "Check whether SARS generated an auto-assessment (ITA34) based on third-party data (IRP5, medical aid, bank interest)." },
  { step: "Step 5", title: "Accept or Edit Return", detail: "If correct, accept the auto-assessment. If you have uncaptured deductions (home office, travel logbook, donations), edit and file a revised return." },
];

const faqs = [
  { question: "What happens if I disagree with a SARS auto-assessment?", answer: "If SARS auto-assessed you with missing deductions, you can edit and submit your return via eFiling within the stipulated tax season deadline." },
  { question: "How long does a SARS auto-assessment refund take?", answer: "Refunds for accepted auto-assessments are typically paid out within 72 hours, provided your banking details are verified and no audit verification is raised." },
  { question: "Can My Accountant review my auto-assessment before I accept it?", answer: "Yes! We recommend having a tax practitioner review your auto-assessment to ensure all allowable expenses and deductions are claimed to maximize your refund." },
];

export default function SarsAutoAssessmentStatusCheckPage() {
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
        badgeText="Personal Income Tax Season"
        title={
          <>
            Check SARS <span className="text-gradient">Auto-Assessment Status</span>
          </>
        }
        subtitle="Verify if SARS generated an automatic tax assessment for your return and ensure all valid tax deductions are correctly claimed."
        primaryCta={{ text: "Review My Auto-Assessment", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/assessmentlookup"
          title="Check Your Auto-Assessment Status Directly with SARS"
          description="Use official SARS digital channels to check auto-assessment notifications, refund status, and tax calculations."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Auto-Assessment Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Check Your Auto-Assessment Status</h2>
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
