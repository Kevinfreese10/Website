import { Metadata } from 'next';
import { Receipt, FileText, HelpCircle, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Request SARS Statement of Account | SARS Online Query",
  description: "Request an official SARS Statement of Account (EMSA/ITA34) online for Income Tax, VAT, PAYE, or Provisional Tax balances.",
  alternates: {
    canonical: `${SITE_URL}/sars-statement-of-account-request`,
  },
  openGraph: {
    title: "Request SARS Statement of Account",
    description: "Step-by-step DIY guide to requesting official SARS tax statements of account online.",
    url: `${SITE_URL}/sars-statement-of-account-request`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Statement of Account Request" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs or access via eFiling." },
  { step: "Step 2", title: "Select 'Statement of Account Request'", detail: "Choose the tax type required: Income Tax (IT), Value Added Tax (VAT), PAYE, or Provisional Tax." },
  { step: "Step 3", title: "Specify Statement Period", detail: "Select the date range (e.g. six months, six years, or custom financial year-end range)." },
  { step: "Step 4", title: "Authenticate Identity", detail: "Provide tax reference number and verify using OTP sent to registered mobile/email." },
  { step: "Step 5", title: "Download PDF Statement", detail: "Receive your official SARS Statement of Account showing transactions, payments, interest, and net balance." },
];

const faqs = [
  { question: "What details appear on a SARS Statement of Account?", answer: "It lists all assessed tax debts, payments processed, interest accrued, administrative penalties, and net refund or debit balances." },
  { question: "Why does my statement show an unallocated payment?", answer: "If an incorrect Payment Reference Number (PRN) was used during EFT payment, SARS places funds into an suspense account until a payment reallocation query is filed." },
  { question: "Can My Accountant audit my SARS statement of account?", answer: "Yes! We reconcile SARS statements of account against bank statements and filed returns to resolve discrepancies, interest errors, and penalty charges." },
];

export default function SarsStatementOfAccountRequestPage() {
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
        badgeText="SARS Account Statements"
        title={
          <>
            Request SARS <span className="text-gradient">Statement of Account</span>
          </>
        }
        subtitle="Obtain an official SARS Statement of Account (EMSA) for Income Tax, VAT, PAYE, or Corporate tax balances online."
        primaryCta={{ text: "Request Account Statement", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/accountquery"
          guideUrl="https://www.sars.gov.za/client-segments/individuals/my-tax-matters/statement-of-account/"
          title="Obtain Your SARS Statement of Account Online"
          description="Request real-time official tax balance statements directly from SARS without visiting a branch."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Statement Request Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Request a SARS Statement of Account</h2>
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
