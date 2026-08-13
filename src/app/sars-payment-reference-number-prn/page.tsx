import { Metadata } from 'next';
import { DollarSign, Search, Receipt, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Find Payment Reference Number (PRN) | SARS Online Query",
  description: "Find or generate your 19-digit SARS Payment Reference Number (PRN) online for accurate EFT, eFiling, and bank branch tax payments.",
  alternates: {
    canonical: `${SITE_URL}/sars-payment-reference-number-prn`,
  },
  openGraph: {
    title: "Find SARS Payment Reference Number (PRN)",
    description: "Generate and verify 19-digit SARS payment reference numbers for error-free tax payments.",
    url: `${SITE_URL}/sars-payment-reference-number-prn`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS PRN Lookup" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query Portal", detail: "Go to tools.sars.gov.za/soqs or log into SARS eFiling." },
  { step: "Step 2", title: "Select 'Payment Reference Number (PRN) Inquiry'", detail: "Choose the tax type: Income Tax (IT), VAT, PAYE, Provisional Tax (IRP6), or Administrative Penalties." },
  { step: "Step 3", title: "Enter Tax Reference Number", detail: "Input your 10-digit SARS reference number and period code." },
  { step: "Step 4", title: "Retrieve 19-Digit PRN", detail: "View the official 19-character alphanumeric Payment Reference Number generated for your return or notice of assessment (ITA34)." },
  { step: "Step 5", title: "Make EFT Payment with Correct PRN", detail: "Copy the exact PRN into your internet banking beneficiary reference field when transferring funds to SARS." },
];

const faqs = [
  { question: "What is a 19-digit SARS PRN?", answer: "A Payment Reference Number (PRN) is a unique 19-digit code that tells SARS exactly which tax account and period your bank payment should be credited to." },
  { question: "What happens if I use an incorrect reference number for a SARS payment?", answer: "Using an incorrect reference causes funds to become unallocated in a SARS suspense account, resulting in automated interest charges and penalty notices." },
  { question: "Can My Accountant resolve unallocated payments?", answer: "Yes! If you paid SARS with an incorrect PRN, we can submit a formal payment reallocation request to SARS to transfer funds to the correct account." },
];

export default function SarsPaymentReferenceNumberPrnPage() {
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
        badgeText="SARS Payment Reference Lookup"
        title={
          <>
            Find Payment Reference <span className="text-gradient">Number (PRN)</span>
          </>
        }
        subtitle="Retrieve or generate your exact 19-digit SARS Payment Reference Number to ensure your EFT payments are credited without delay."
        primaryCta={{ text: "Resolve Payment Allocation", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/wmprn"
          title="Retrieve Your 19-Digit SARS PRN Online"
          description="Access the SARS digital query system to find the exact payment reference number for your tax account."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            PRN Lookup Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Retrieve Your SARS PRN</h2>
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
