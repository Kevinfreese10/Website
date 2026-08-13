import { Metadata } from 'next';
import { Search, FileText, HelpCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Track Tax Directive Status Online | SARS Online Query",
  description: "Check the status of your SARS tax directive application online. Track retirement lump sum, severance, or pension directives.",
  alternates: {
    canonical: `${SITE_URL}/sars-tax-directive-status`,
  },
  openGraph: {
    title: "Track SARS Tax Directive Status Online",
    description: "Step-by-step DIY guide to tracking retirement and severance tax directive applications.",
    url: `${SITE_URL}/sars-tax-directive-status`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Tax Directive Status" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Navigate to tools.sars.gov.za/soqs or access SARS eFiling." },
  { step: "Step 2", title: "Select 'Tax Directive Status Check'", detail: "Choose the directive inquiry service." },
  { step: "Step 3", title: "Provide Application Reference Number", detail: "Enter the directive application number or your SA ID number and tax reference number." },
  { step: "Step 4", title: "View Directive Processing Status", detail: "Check whether the tax directive has been Submitted, Approved, Rejected, or requires supporting documents." },
  { step: "Step 5", title: "Download Tax Directive Certificate (IRP3)", detail: "Once approved, download the official tax directive indicating the precise PAYE tax rate to be deducted by the fund administrator." },
];

const faqs = [
  { question: "What is a SARS tax directive?", answer: "A tax directive (IRP3) is an official instruction issued by SARS to a fund administrator or employer specifying the exact tax rate to withhold from a lump sum payout." },
  { question: "Why is my tax directive status shown as 'Decline' or 'Rejected'?", answer: "Directives are declined if the taxpayer has unfiled tax returns, unpaid tax debt, or mismatched personal identification details." },
  { question: "Can My Accountant resolve declined tax directives?", answer: "Yes! We investigate the non-compliance reason, clear outstanding returns or debt, and resubmit tax directive requests to SARS." },
];

export default function SarsTaxDirectiveStatusPage() {
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
        badgeText="SARS Tax Directive Tracking"
        title={
          <>
            Track Tax Directive <span className="text-gradient">Status Online</span>
          </>
        }
        subtitle="Track the processing status of your retirement, pension, provident fund, or severance lump sum tax directive with SARS."
        primaryCta={{ text: "Resolve Tax Directive Issue", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Track Your SARS Tax Directive Status Directly"
          description="Access official SARS digital channels to view live status updates for lump sum tax directives."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Tracking Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Check Tax Directive Status</h2>
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
