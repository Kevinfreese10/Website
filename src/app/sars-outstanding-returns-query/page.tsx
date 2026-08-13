import { Metadata } from 'next';
import { FileText, AlertTriangle, HelpCircle, CheckCircle2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Check Outstanding SARS Tax Returns | SARS Online Query",
  description: "Check unfiled or outstanding SARS tax returns online for Income Tax (ITR12/IT14), VAT, PAYE (EMP201), and Provisional Tax (IRP6).",
  alternates: {
    canonical: `${SITE_URL}/sars-outstanding-returns-query`,
  },
  openGraph: {
    title: "Check Outstanding SARS Tax Returns",
    description: "Identify unfiled returns and avoid SARS administrative non-compliance penalties.",
    url: `${SITE_URL}/sars-outstanding-returns-query`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Check Outstanding Tax Returns" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and select 'Outstanding Tax Returns Query'." },
  { step: "Step 2", title: "Enter Tax Reference Number", detail: "Input your 10-digit SARS reference number and personal identification details." },
  { step: "Step 3", title: "Authenticate Identity", detail: "Complete OTP verification via your registered cell phone or email." },
  { step: "Step 4", title: "View Non-Compliance Listing", detail: "Review all unfiled tax years and periods across Income Tax, VAT, PAYE, and Provisional Tax." },
  { step: "Step 5", title: "Prepare and File Missing Returns", detail: "Compile financial statements or income records for overdue tax years and submit to SARS." },
];

const faqs = [
  { question: "What are administrative non-compliance penalties?", answer: "SARS levies recurring monthly penalties (R250 to R16,000 per month per unfiled return) for outstanding tax returns." },
  { question: "Can SARS auto-estimate returns if I fail to file?", answer: "Yes. SARS can issue estimated assessments (Section 95) which are legally binding until replaced by valid actual returns." },
  { question: "Can My Accountant file backdated outstanding tax returns?", answer: "Yes! We specialize in clearing backlogs, filing backdated individual and company tax returns, and requesting penalty remissions." },
];

export default function SarsOutstandingReturnsQueryPage() {
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
        badgeText="SARS Compliance Check"
        title={
          <>
            Check Outstanding <span className="text-gradient">SARS Tax Returns</span>
          </>
        }
        subtitle="Identify unfiled returns across Income Tax, VAT, PAYE, and Provisional tax to avoid recurring monthly penalties."
        primaryCta={{ text: "Catch Up Outstanding Returns", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/visualdashboard"
          guideUrl="https://www.sars.gov.za/types-of-tax/personal-income-tax/"
          title="Check Your Outstanding Returns Directly with SARS"
          description="Access official SARS digital query tools to view unfiled tax returns and penalty statuses."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Outstanding Returns Check
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Check Outstanding Returns Online</h2>
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
