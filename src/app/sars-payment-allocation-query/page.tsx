import { Metadata } from 'next';
import { DollarSign, FileText, HelpCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Request SARS Payment Allocation & Reallocation | SOQS",
  description: "Request SARS payment allocation or reallocation online for misallocated EFT payments, incorrect PRNs, or suspense account funds.",
  alternates: {
    canonical: `${SITE_URL}/sars-payment-allocation-query`,
  },
  openGraph: {
    title: "Request SARS Payment Allocation & Reallocation",
    description: "Correct unallocated or misallocated SARS bank payments online.",
    url: `${SITE_URL}/sars-payment-allocation-query`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Payment Allocation Query" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and select 'Payment Allocation Query'." },
  { step: "Step 2", title: "Enter Tax & Payment Details", detail: "Input tax reference number, date of EFT payment, payment amount, and bank reference used." },
  { step: "Step 3", title: "Specify Destination Tax Account", detail: "Indicate which tax type and period the payment should be reallocated to (e.g. Income Tax 2025 or VAT period 2025/08)." },
  { step: "Step 4", title: "Upload Proof of Payment", detail: "Attach bank-stamped proof of payment (EFT receipt) showing bank date and beneficiary details." },
  { step: "Step 5", title: "Track Reallocation Status", detail: "Save your SARS query case number and track payment allocation progress." },
];

const faqs = [
  { question: "Why is my tax payment sitting in SARS unallocated suspense?", answer: "Payments end up in suspense when an incorrect or outdated Payment Reference Number (PRN) is used during bank payment." },
  { question: "How long does SARS take to reallocate a payment?", answer: "Payment reallocations typically take 10 to 21 business days upon receipt of valid proof of payment." },
  { question: "Can My Accountant correct misallocated payments on my behalf?", answer: "Yes! We submit formal payment allocation queries, trace missing bank transfers, and stop incorrect SARS debt collection actions." },
];

export default function SarsPaymentAllocationQueryPage() {
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
        badgeText="SARS Payment Resolution"
        title={
          <>
            Request SARS Payment <span className="text-gradient">Allocation &amp; Reallocation</span>
          </>
        }
        subtitle="Correct misallocated tax payments, trace missing EFT transfers, and move funds from suspense to your active tax balance."
        primaryCta={{ text: "Reallocate Tax Payment", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Submit a SARS Payment Allocation Query Online"
          description="Access official SARS query portals to trace missing payments and request reallocation of funds."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Reallocation Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Reallocate a SARS Payment</h2>
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
