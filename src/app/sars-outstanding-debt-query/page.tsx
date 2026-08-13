import { Metadata } from 'next';
import { DollarSign, ShieldAlert, FileText, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Enquire on Outstanding Debt & Payment Arrangements | SARS SOQS",
  description: "Enquire on outstanding SARS tax debt and apply for deferred payment arrangements or compromise agreements online.",
  alternates: {
    canonical: `${SITE_URL}/sars-outstanding-debt-query`,
  },
  openGraph: {
    title: "Enquire on SARS Outstanding Debt & Payment Arrangements",
    description: "Check SARS debt balances and request instalment payment agreements online.",
    url: `${SITE_URL}/sars-outstanding-debt-query`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Outstanding Debt Query" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to online.sars.gov.za and choose 'Debt Management Query'." },
  { step: "Step 2", title: "Provide Tax & Personal Identification", detail: "Enter your 10-digit tax reference number and valid SA ID or company registration number." },
  { step: "Step 3", title: "View Outstanding Tax Balance", detail: "Review tax principal debt, interest charges, and administrative penalties accrued." },
  { step: "Step 4", title: "Request Payment Arrangement (Deferral)", detail: "Submit a proposed monthly instalment plan under Section 167 of the Tax Administration Act." },
  { step: "Step 5", title: "Upload Financial Evidence", detail: "Attach bank statements, cash flow projections, and proof of income to support your instalment arrangement." },
];

const faqs = [
  { question: "Can SARS issue a final demand or take money from my bank account?", answer: "Yes. Under Section 179 of the Tax Administration Act, SARS can issue a Third Party Appointment (Garnishee Order) to your bank if debt is left unmanaged." },
  { question: "What is a SARS Payment Arrangement?", answer: "A formal agreement allowing a taxpayer to pay overdue SARS debt in monthly instalments over 6 to 36 months based on financial capability." },
  { question: "Can My Accountant negotiate debt compromise or penalty remission?", answer: "Yes! We submit formal Remission of Penalties (RFR) and Debt Compromise applications under Sections 200–202 to reduce or write off SARS tax liabilities." },
];

export default function SarsOutstandingDebtQueryPage() {
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
        badgeText="SARS Debt & Payment Management"
        title={
          <>
            Enquire on Outstanding <span className="text-gradient">Debt &amp; Payment Plans</span>
          </>
        }
        subtitle="Check outstanding SARS tax balances, request payment deferrals, or structure a monthly instalment arrangement."
        primaryCta={{ text: "Negotiate SARS Debt Plan", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Submit a SARS Debt Query or Instalment Request"
          description="Use official SARS digital channels to enquire on debt and submit formal payment deferral requests."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Debt Inquiry Steps
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Enquire on Debt &amp; Request Payment Terms</h2>
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
