import { Metadata } from 'next';
import { Building2, FileText, HelpCircle, CheckCircle2, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Submit Large Business & International (LBI) Query | SARS SOQS",
  description: "Submit complex corporate and transfer pricing queries directly to the SARS Large Business & International (LBI) division online.",
  alternates: {
    canonical: `${SITE_URL}/sars-large-business-lbi-query`,
  },
  openGraph: {
    title: "Submit Large Business & International LBI Query",
    description: "Escalate complex corporate tax queries to SARS Large Business & International.",
    url: `${SITE_URL}/sars-large-business-lbi-query`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Large Business LBI Query" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query Portal", detail: "Go to tools.sars.gov.za/soqs and choose 'Large Business & International (LBI) Query'." },
  { step: "Step 2", title: "Identify Taxpayer Segment", detail: "Confirm corporate qualification (Turnover > R100 million or multinational enterprise group)." },
  { step: "Step 3", title: "Select Technical Query Category", detail: "Choose area: Corporate Income Tax, Transfer Pricing, Controlled Foreign Companies (CFC), Financial Sector, or International Tax." },
  { step: "Step 4", title: "Attach Technical Opinion & Documentation", detail: "Upload detailed background statements, transfer pricing documentation, or advance tax ruling requests." },
  { step: "Step 5", title: "Assign to LBI Relationship Manager", detail: "SARS LBI division will log the case and assign a specialized senior tax officer." },
];

const faqs = [
  { question: "What is SARS Large Business & International (LBI)?", answer: "LBI is a dedicated SARS division catering to corporate groups, listed entities, high-net-worth individuals, and multinational companies operating in South Africa." },
  { question: "What turnover qualifies a business for SARS LBI management?", answer: "Companies with annual turnover exceeding R100 million or those forming part of multinational groups fall under LBI jurisdiction." },
  { question: "Can My Accountant manage LBI corporate tax audits and transfer pricing?", answer: "Yes! Our corporate tax advisory team handles LBI audit responses, transfer pricing compliance, double taxation agreements (DTA), and corporate tax returns." },
];

export default function SarsLargeBusinessLbiQueryPage() {
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
        badgeText="Corporate Tax & Multinational Advisory"
        title={
          <>
            Submit Large Business <span className="text-gradient">&amp; International (LBI) Query</span>
          </>
        }
        subtitle="Escalate complex corporate income tax, transfer pricing, and international tax queries directly to the specialized SARS LBI division."
        primaryCta={{ text: "Consult LBI Tax Advisor", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/LBCQuery"
          guideUrl="https://www.sars.gov.za/client-segments/large-business/"
          title="Submit a SARS LBI Query Online"
          description="Access official SARS digital channels to lodge technical corporate and international tax inquiries."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            LBI Query Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Submit an LBI Query to SARS</h2>
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
